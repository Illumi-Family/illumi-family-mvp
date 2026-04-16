import { AppError } from "../../shared/http/errors";
import {
	deleteCacheKey,
	readCacheJson,
	writeCacheJson,
} from "../../shared/storage/kv";
import {
	createStreamDirectUpload,
	deleteStreamVideoById,
	getStreamVideoById,
} from "../../shared/integrations/stream/stream-client";
import {
	parseStreamWebhookEvent,
	verifyStreamWebhookSignature,
} from "../../shared/integrations/stream/stream-webhook";
import type { AppBindings } from "../../types";
import {
	resolveVideoProcessingStatus,
	type AdminVideoUpdateBody,
	type AdminVideoUploadUrlBody,
	type VideoProcessingStatus,
} from "./video.schema";
import type { VideoRepository } from "./video.repository";

const PUBLIC_VIDEO_CACHE_KEY = "videos:public:v1";
const PUBLIC_VIDEO_CACHE_TTL_SECONDS = 120;

export type AdminVideoRecord = {
	id: string;
	streamVideoId: string;
	processingStatus: VideoProcessingStatus;
	publishStatus: "draft" | "published";
	title: string;
	posterUrl: string | null;
	durationSeconds: number | null;
	createdByAuthUserId: string | null;
	updatedByAuthUserId: string | null;
	createdAt: string;
	updatedAt: string;
	publishedAt: string | null;
};

export type PublicVideoRecord = {
	id: string;
	streamVideoId: string;
	title: string;
	posterUrl: string | null;
	durationSeconds: number | null;
	publishedAt: string;
};

const toIsoString = (value: Date | null | undefined) =>
	value instanceof Date ? value.toISOString() : null;

const toAdminRecord = (
	row: Awaited<ReturnType<VideoRepository["listAdminVideos"]>>[number],
): AdminVideoRecord => ({
	id: row.id,
	streamVideoId: row.streamVideoId,
	processingStatus: row.processingStatus as VideoProcessingStatus,
	publishStatus: row.publishStatus as "draft" | "published",
	title: row.title,
	posterUrl: row.posterUrl,
	durationSeconds: row.durationSeconds,
	createdByAuthUserId: row.createdByAuthUserId,
	updatedByAuthUserId: row.updatedByAuthUserId,
	createdAt: row.createdAt.toISOString(),
	updatedAt: row.updatedAt.toISOString(),
	publishedAt: toIsoString(row.publishedAt),
});

const toPublicRecord = (
	row: Awaited<ReturnType<VideoRepository["listPublicReadyVideos"]>>[number],
): PublicVideoRecord => ({
	id: row.id,
	streamVideoId: row.streamVideoId,
	title: row.title,
	posterUrl: row.posterUrl,
	durationSeconds: row.durationSeconds,
	publishedAt: row.publishedAt instanceof Date ? row.publishedAt.toISOString() : "",
});

export class VideoService {
	constructor(private readonly repository: VideoRepository) {}

	private isStreamNotFound(error: unknown) {
		if (!(error instanceof AppError)) return false;
		if (error.code !== "STREAM_API_ERROR") return false;
		if (!error.details || typeof error.details !== "object") return false;
		const details = error.details as { status?: unknown };
		return details.status === 404;
	}

	static getPublicCacheKey() {
		return PUBLIC_VIDEO_CACHE_KEY;
	}

	static getPublicCacheTtlSeconds() {
		return PUBLIC_VIDEO_CACHE_TTL_SECONDS;
	}

	async issueUploadUrl(env: AppBindings, input: {
		authUserId: string;
		body: AdminVideoUploadUrlBody;
	}) {
		const upload = await createStreamDirectUpload(env, {
			maxDurationSeconds: input.body.maxDurationSeconds,
		});

		const video = await this.repository.createDraft({
			streamVideoId: upload.streamVideoId,
			title: input.body.title,
			authUserId: input.authUserId,
		});

		return {
			videoId: video.id,
			uploadUrl: upload.uploadUrl,
			expiresAt: upload.expiresAt,
		};
	}

	async listAdminVideos() {
		const videos = await this.repository.listAdminVideos();
		return videos.map(toAdminRecord);
	}

	async updateVideoMetadata(input: {
		videoId: string;
		authUserId: string;
		body: AdminVideoUpdateBody;
	}) {
		const updated = await this.repository.updateById(input.videoId, {
			title: input.body.title,
			posterUrl: input.body.posterUrl,
			updatedByAuthUserId: input.authUserId,
		});
		if (!updated) {
			throw new AppError("NOT_FOUND", "Video not found", 404);
		}
		return toAdminRecord(updated);
	}

	async publishVideo(env: AppBindings, input: { videoId: string; authUserId: string }) {
		const result = await this.repository.publishReadyDraft(
			input.videoId,
			input.authUserId,
		);
		if (!result.changed) {
			if (result.reason === "VIDEO_NOT_FOUND") {
				throw new AppError("NOT_FOUND", "Video not found", 404);
			}
			if (result.reason === "NOT_READY") {
				throw new AppError("CONFLICT", "Video is not ready for publish", 409);
			}
			return {
				changed: false,
				video: result.video ? toAdminRecord(result.video) : null,
			};
		}

		await this.invalidatePublicCache(env);
		return {
			changed: true,
			video: result.video ? toAdminRecord(result.video) : null,
		};
	}

	async unpublishVideo(env: AppBindings, input: {
		videoId: string;
		authUserId: string;
	}) {
		const result = await this.repository.unpublish(input.videoId, input.authUserId);
		if (!result.changed) {
			if (result.reason === "VIDEO_NOT_FOUND") {
				throw new AppError("NOT_FOUND", "Video not found", 404);
			}
			return {
				changed: false,
				video: result.video ? toAdminRecord(result.video) : null,
			};
		}

		await this.invalidatePublicCache(env);
		return {
			changed: true,
			video: result.video ? toAdminRecord(result.video) : null,
		};
	}

	async syncVideoStatus(env: AppBindings, input: {
		videoId: string;
		authUserId: string;
	}) {
		const currentVideo = await this.repository.getById(input.videoId);
		if (!currentVideo) {
			throw new AppError("NOT_FOUND", "Video not found", 404);
		}

		const streamVideo = await getStreamVideoById(env, currentVideo.streamVideoId);
		const processingStatus = resolveVideoProcessingStatus({
			status: streamVideo.status,
			readyToStream: streamVideo.readyToStream,
		});
		const synced = await this.repository.updateById(input.videoId, {
			processingStatus,
			durationSeconds:
				typeof streamVideo.duration === "number"
					? Math.max(0, Math.round(streamVideo.duration))
					: currentVideo.durationSeconds,
			posterUrl:
				currentVideo.posterUrl ??
				streamVideo.thumbnail ??
				streamVideo.preview ??
				null,
			updatedByAuthUserId: input.authUserId,
		});

		if (!synced) {
			throw new AppError("NOT_FOUND", "Video not found", 404);
		}
		return toAdminRecord(synced);
	}

	async cleanupDraftVideo(env: AppBindings, input: {
		videoId: string;
		authUserId: string;
	}) {
		const currentVideo = await this.repository.getById(input.videoId);
		if (!currentVideo) {
			throw new AppError("NOT_FOUND", "Video not found", 404);
		}

		if (currentVideo.publishStatus === "published") {
			throw new AppError(
				"CONFLICT",
				"Published video cannot be cleaned up as draft",
				409,
			);
		}

		let remoteDeleted = false;
		try {
			await deleteStreamVideoById(env, currentVideo.streamVideoId);
			remoteDeleted = true;
		} catch (error) {
			if (this.isStreamNotFound(error)) {
				remoteDeleted = true;
			} else {
				console.warn("Failed to cleanup Stream video", {
					requestedByAuthUserId: input.authUserId,
					videoId: currentVideo.id,
					streamVideoId: currentVideo.streamVideoId,
					error,
				});
			}
		}

		const deletedVideo = await this.repository.deleteById(input.videoId);
		if (!deletedVideo) {
			throw new AppError("NOT_FOUND", "Video not found", 404);
		}

		return {
			deleted: true,
			videoId: deletedVideo.id,
			remoteDeleted,
		};
	}

	async ingestStreamWebhook(env: AppBindings, input: {
		rawBody: string;
		signature: string | null | undefined;
		payload: unknown;
	}) {
		const secret = env.STREAM_WEBHOOK_SECRET?.trim();
		if (!secret) {
			throw new AppError(
				"CONFIG_ERROR",
				"Stream webhook secret is not configured",
				500,
			);
		}

		const valid = await verifyStreamWebhookSignature(
			secret,
			input.rawBody,
			input.signature,
		);
		if (!valid) {
			throw new AppError("FORBIDDEN", "Invalid stream webhook signature", 403);
		}

		const parsedEvent = parseStreamWebhookEvent(input.payload);
		const currentVideo = await this.repository.getByStreamVideoId(
			parsedEvent.streamVideoId,
		);
		if (!currentVideo) {
			return {
				updated: false,
				reason: "VIDEO_NOT_FOUND",
			};
		}

		const updated = await this.repository.updateByStreamVideoId(
			parsedEvent.streamVideoId,
			{
				processingStatus: parsedEvent.processingStatus,
				durationSeconds: parsedEvent.durationSeconds,
				posterUrl: currentVideo.posterUrl ?? parsedEvent.posterUrl,
			},
		);

		if (!updated) {
			return {
				updated: false,
				reason: "VIDEO_NOT_FOUND",
			};
		}

		if (updated.publishStatus === "published") {
			await this.invalidatePublicCache(env);
		}

		return {
			updated: true,
			video: toAdminRecord(updated),
		};
	}

	async listPublicVideos(env: AppBindings) {
		const cached = await readCacheJson<PublicVideoRecord[]>(
			env.CACHE,
			VideoService.getPublicCacheKey(),
		);
		if (cached) {
			return cached;
		}

		const rows = await this.repository.listPublicReadyVideos();
		const videos: PublicVideoRecord[] = [];
		for (const row of rows) {
			if (!row.streamVideoId.trim() || !(row.publishedAt instanceof Date)) {
				console.warn("Skipping invalid public video row", {
					videoId: row.id,
					streamVideoId: row.streamVideoId,
					publishedAt: row.publishedAt,
				});
				continue;
			}
			videos.push(toPublicRecord(row));
		}
		await writeCacheJson(
			env.CACHE,
			VideoService.getPublicCacheKey(),
			videos,
			VideoService.getPublicCacheTtlSeconds(),
		);
		return videos;
	}

	private async invalidatePublicCache(env: AppBindings) {
		await deleteCacheKey(env.CACHE, VideoService.getPublicCacheKey());
	}
}
