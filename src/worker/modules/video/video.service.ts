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
	listStreamVideos,
	type StreamVideoCatalogResponse,
} from "../../shared/integrations/stream/stream-client";
import {
	parseStreamWebhookEvent,
	verifyStreamWebhookSignature,
} from "../../shared/integrations/stream/stream-webhook";
import type { AppBindings } from "../../types";
import {
	type AdminVideoImportBody,
	resolveVideoProcessingStatus,
	type AdminVideoUpdateBody,
	type AdminVideoUploadUrlBody,
	type VideoProcessingStatus,
} from "./video.schema";
import type { VideoRepository } from "./video.repository";

const PUBLIC_VIDEO_CACHE_KEY = "videos:public:v1";
const PUBLIC_VIDEO_CACHE_TTL_SECONDS = 120;
const STREAM_CATALOG_SYNC_LOCK_KEY = "videos:sync:catalog:lock:v1";
const STREAM_CATALOG_SYNC_LOCK_TTL_SECONDS = 120;
const STREAM_CATALOG_PAGE_LIMIT = 1_000;
const STREAM_MISSING_STREAK_THRESHOLD = 2;
type VideoActionType = "upload_create" | "import_reuse";

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

export type AdminVideoCatalogSyncSummary = {
	created: number;
	updated: number;
	downgraded: number;
	failed: number;
	partial: boolean;
	totalRemote: number | null;
	processedRemote: number;
};

type StreamCatalogVideo = StreamVideoCatalogResponse;

const toIsoString = (value: Date | null | undefined) =>
	value instanceof Date ? value.toISOString() : null;

const normalizeDurationSeconds = (value: number | null | undefined) => {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		return null;
	}
	return Math.max(0, Math.round(value));
};

const normalizeReadyToStream = (value: unknown) => value === true;

const normalizeStreamStatus = (value: unknown) => {
	if (typeof value === "string") {
		return value;
	}
	if (!value || typeof value !== "object") {
		return undefined;
	}
	const state = (value as { state?: unknown }).state;
	if (typeof state === "string") {
		return { state };
	}
	return undefined;
};

const normalizeStreamTitleFromMeta = (meta: unknown) => {
	if (!meta || typeof meta !== "object") {
		return null;
	}
	if (!("name" in meta)) {
		return null;
	}
	const rawName = (meta as { name?: unknown }).name;
	if (typeof rawName !== "string") {
		return null;
	}
	const title = rawName.trim();
	return title.length > 0 ? title : null;
};

const resolvePosterFromStreamCatalog = (video: StreamCatalogVideo) =>
	video.thumbnail?.trim() || video.preview?.trim() || null;

const resolveBeforeCursor = (videos: StreamCatalogVideo[]) => {
	let oldestTimestampMs: number | null = null;
	for (const video of videos) {
		if (!video.created) continue;
		const parsed = Date.parse(video.created);
		if (!Number.isFinite(parsed)) continue;
		if (oldestTimestampMs === null || parsed < oldestTimestampMs) {
			oldestTimestampMs = parsed;
		}
	}
	if (oldestTimestampMs === null) {
		return null;
	}
	const cursorMs = Math.max(0, oldestTimestampMs - 1);
	return new Date(cursorMs).toISOString();
};

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

	private logVideoAction(input: {
		env: AppBindings;
		actionType: VideoActionType;
		streamVideoId: string;
		operator: string;
		videoId?: string | null;
		reused?: boolean;
	}) {
		console.info("video_action", {
			actionType: input.actionType,
			streamVideoId: input.streamVideoId,
			operator: input.operator,
			env: input.env.APP_ENV ?? "unknown",
			videoId: input.videoId ?? null,
			reused: input.reused ?? false,
		});
	}

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
		this.logVideoAction({
			env,
			actionType: "upload_create",
			streamVideoId: upload.streamVideoId,
			operator: input.authUserId,
			videoId: video.id,
		});

		return {
			videoId: video.id,
			uploadUrl: upload.uploadUrl,
			expiresAt: upload.expiresAt,
		};
	}

	async importExistingVideo(env: AppBindings, input: {
		authUserId: string;
		body: AdminVideoImportBody;
	}) {
		const streamVideoIdInput = input.body.streamVideoId.trim();
		const streamVideo = await getStreamVideoById(env, streamVideoIdInput);
		const streamVideoId = streamVideo.uid?.trim() || streamVideoIdInput;
		const processingStatus = resolveVideoProcessingStatus({
			status: streamVideo.status,
			readyToStream: streamVideo.readyToStream,
		});
		const imported = await this.repository.findOrCreateImportedDraft({
			streamVideoId,
			title: input.body.title,
			posterUrl:
				input.body.posterUrl ??
				streamVideo.thumbnail ??
				streamVideo.preview ??
				null,
			durationSeconds:
				typeof streamVideo.duration === "number"
					? Math.max(0, Math.round(streamVideo.duration))
					: null,
			processingStatus,
			authUserId: input.authUserId,
		});
		this.logVideoAction({
			env,
			actionType: "import_reuse",
			streamVideoId,
			operator: input.authUserId,
			videoId: imported.video.id,
			reused: imported.reused,
		});

		return {
			reused: imported.reused,
			video: toAdminRecord(imported.video),
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

	async syncCatalogFromStream(
		env: AppBindings,
		input: {
			authUserId: string;
		},
	): Promise<AdminVideoCatalogSyncSummary> {
		const lockToken = await this.acquireCatalogSyncLock(env);
		if (!lockToken) {
			throw new AppError(
				"CONFLICT",
				"Video catalog sync is already in progress",
				409,
			);
		}

		let created = 0;
		let updated = 0;
		let downgraded = 0;
		let failed = 0;
		let partial = false;
		let totalRemote: number | null = null;
		const seenStreamVideoIds = new Set<string>();
		let beforeCursor: string | undefined;

		try {
			while (true) {
				let page: Awaited<ReturnType<typeof listStreamVideos>>;
				try {
					page = await listStreamVideos(env, {
						limit: STREAM_CATALOG_PAGE_LIMIT,
						before: beforeCursor,
						includeCounts: beforeCursor === undefined,
					});
				} catch (error) {
					console.warn("stream_catalog_sync_page_failed", {
						env: env.APP_ENV ?? "unknown",
						beforeCursor: beforeCursor ?? null,
						error,
					});
					partial = true;
					failed += 1;
					break;
				}

				if (beforeCursor === undefined && typeof page.total === "number") {
					totalRemote = page.total;
				}

				const pageVideos = page.videos;
				if (pageVideos.length === 0) {
					break;
				}

				let foundFreshVideoInPage = false;
				for (const streamVideo of pageVideos) {
					const streamVideoId = streamVideo.uid?.trim();
					if (!streamVideoId || seenStreamVideoIds.has(streamVideoId)) {
						continue;
					}
					seenStreamVideoIds.add(streamVideoId);
					foundFreshVideoInPage = true;

					const processingStatus = resolveVideoProcessingStatus({
						status: normalizeStreamStatus(streamVideo.status),
						readyToStream: normalizeReadyToStream(streamVideo.readyToStream),
					});
					const durationSeconds = normalizeDurationSeconds(streamVideo.duration);
					const streamTitle = normalizeStreamTitleFromMeta(streamVideo.meta);
					const posterUrl = resolvePosterFromStreamCatalog(streamVideo);
					const seenAt = new Date();

					try {
						const existing = await this.repository.getByStreamVideoId(streamVideoId);
						if (!existing) {
							await this.repository.createSyncedDraft({
								streamVideoId,
								title: streamTitle ?? "",
								posterUrl,
								durationSeconds,
								processingStatus,
								authUserId: input.authUserId,
								seenAt,
							});
							created += 1;
							continue;
						}

						await this.repository.updateByStreamVideoId(streamVideoId, {
							title: streamTitle ?? existing.title,
							posterUrl: posterUrl ?? existing.posterUrl,
							durationSeconds: durationSeconds ?? existing.durationSeconds,
							processingStatus,
							missingFromStreamStreak: 0,
							lastSeenInStreamAt: seenAt,
							updatedByAuthUserId: input.authUserId,
						});
						updated += 1;
					} catch (error) {
						failed += 1;
						console.warn("stream_catalog_sync_video_upsert_failed", {
							env: env.APP_ENV ?? "unknown",
							streamVideoId,
							error,
						});
					}
				}

				if (pageVideos.length < STREAM_CATALOG_PAGE_LIMIT) {
					break;
				}

				const nextBeforeCursor = resolveBeforeCursor(pageVideos);
				if (
					!nextBeforeCursor ||
					nextBeforeCursor === beforeCursor ||
					!foundFreshVideoInPage
				) {
					break;
				}
				beforeCursor = nextBeforeCursor;
			}

			if (!partial) {
				const localStates = await this.repository.listSyncStates();
				let shouldInvalidatePublicCache = false;
				for (const localVideo of localStates) {
					const streamVideoId = localVideo.streamVideoId.trim();
					if (!streamVideoId || seenStreamVideoIds.has(streamVideoId)) {
						continue;
					}

					const nextMissingStreak =
						Math.max(0, localVideo.missingFromStreamStreak ?? 0) + 1;
					const shouldDowngrade =
						nextMissingStreak >= STREAM_MISSING_STREAK_THRESHOLD;

					try {
						await this.repository.updateByStreamVideoId(streamVideoId, {
							missingFromStreamStreak: nextMissingStreak,
							updatedByAuthUserId: input.authUserId,
							...(shouldDowngrade
								? {
										publishStatus: "draft",
										processingStatus: "failed" as const,
										publishedAt: null,
									}
								: {}),
						});
						if (!shouldDowngrade) {
							continue;
						}

						downgraded += 1;
						if (localVideo.publishStatus === "published") {
							shouldInvalidatePublicCache = true;
						}
					} catch (error) {
						failed += 1;
						console.warn("stream_catalog_sync_missing_update_failed", {
							env: env.APP_ENV ?? "unknown",
							streamVideoId,
							error,
						});
					}
				}

				if (shouldInvalidatePublicCache) {
					await this.invalidatePublicCache(env);
				}
			}

			return {
				created,
				updated,
				downgraded,
				failed,
				partial,
				totalRemote,
				processedRemote: seenStreamVideoIds.size,
			};
		} finally {
			await this.releaseCatalogSyncLock(env, lockToken);
		}
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

	private async acquireCatalogSyncLock(env: AppBindings) {
		const existing = await env.CACHE.get(STREAM_CATALOG_SYNC_LOCK_KEY);
		if (existing) {
			return null;
		}

		const token = `${Date.now()}:${crypto.randomUUID()}`;
		await env.CACHE.put(STREAM_CATALOG_SYNC_LOCK_KEY, token, {
			expirationTtl: STREAM_CATALOG_SYNC_LOCK_TTL_SECONDS,
		});
		const confirmed = await env.CACHE.get(STREAM_CATALOG_SYNC_LOCK_KEY);
		return confirmed === token ? token : null;
	}

	private async releaseCatalogSyncLock(env: AppBindings, token: string | null) {
		if (!token) {
			return;
		}
		const current = await env.CACHE.get(STREAM_CATALOG_SYNC_LOCK_KEY);
		if (current === token) {
			await env.CACHE.delete(STREAM_CATALOG_SYNC_LOCK_KEY);
		}
	}
}
