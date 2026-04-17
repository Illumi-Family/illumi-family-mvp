import { and, desc, eq } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db/client";
import { videoAssets, type VideoAssetRow } from "../../shared/db/schema";
import type { VideoProcessingStatus } from "./video.schema";

type VideoUpdatePatch = Partial<
	Pick<
		VideoAssetRow,
		| "processingStatus"
		| "publishStatus"
		| "title"
		| "posterUrl"
		| "durationSeconds"
		| "publishedAt"
		| "updatedByAuthUserId"
	>
> & {
	updatedAt?: Date;
};

export class VideoRepository {
	constructor(private readonly db: AppDatabase) {}

	private isStreamVideoIdUniqueConflict(error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: typeof error === "object" && error !== null && "message" in error
					? String((error as { message?: unknown }).message ?? "")
					: "";
		const normalized = message.toLowerCase();
		return normalized.includes("unique") && normalized.includes("stream_video_id");
	}

	async createDraft(input: {
		streamVideoId: string;
		title?: string;
		authUserId: string;
	}) {
		const now = new Date();
		const record = {
			id: crypto.randomUUID(),
			streamVideoId: input.streamVideoId,
			processingStatus: "processing",
			publishStatus: "draft",
			title: input.title?.trim() || "",
			posterUrl: null,
			durationSeconds: null,
			createdByAuthUserId: input.authUserId,
			updatedByAuthUserId: input.authUserId,
			createdAt: now,
			updatedAt: now,
			publishedAt: null,
		} as const;
		await this.db.insert(videoAssets).values(record);
		return record;
	}

	async findOrCreateImportedDraft(input: {
		streamVideoId: string;
		title?: string;
		posterUrl?: string | null;
		durationSeconds?: number | null;
		processingStatus: VideoProcessingStatus;
		authUserId: string;
	}) {
		const existing = await this.getByStreamVideoId(input.streamVideoId);
		if (existing) {
			return {
				video: existing,
				reused: true as const,
			};
		}

		const now = new Date();
		const record = {
			id: crypto.randomUUID(),
			streamVideoId: input.streamVideoId,
			processingStatus: input.processingStatus,
			publishStatus: "draft",
			title: input.title?.trim() || "",
			posterUrl: input.posterUrl ?? null,
			durationSeconds: input.durationSeconds ?? null,
			createdByAuthUserId: input.authUserId,
			updatedByAuthUserId: input.authUserId,
			createdAt: now,
			updatedAt: now,
			publishedAt: null,
		} as const;

		try {
			await this.db.insert(videoAssets).values(record);
		} catch (error) {
			if (!this.isStreamVideoIdUniqueConflict(error)) {
				throw error;
			}
			const duplicated = await this.getByStreamVideoId(input.streamVideoId);
			if (duplicated) {
				return {
					video: duplicated,
					reused: true as const,
				};
			}
			throw error;
		}

		return {
			video: record,
			reused: false as const,
		};
	}

	async listAdminVideos() {
		return this.db.select().from(videoAssets).orderBy(desc(videoAssets.createdAt));
	}

	async listPublicReadyVideos() {
		return this.db
			.select()
			.from(videoAssets)
			.where(
				and(
					eq(videoAssets.publishStatus, "published"),
					eq(videoAssets.processingStatus, "ready"),
				),
			)
			.orderBy(desc(videoAssets.publishedAt));
	}

	async getById(videoId: string) {
		const rows = await this.db
			.select()
			.from(videoAssets)
			.where(eq(videoAssets.id, videoId))
			.limit(1);
		return rows[0] ?? null;
	}

	async getByStreamVideoId(streamVideoId: string) {
		const rows = await this.db
			.select()
			.from(videoAssets)
			.where(eq(videoAssets.streamVideoId, streamVideoId))
			.limit(1);
		return rows[0] ?? null;
	}

	async deleteById(videoId: string) {
		const existing = await this.getById(videoId);
		if (!existing) return null;
		await this.db.delete(videoAssets).where(eq(videoAssets.id, videoId));
		return existing;
	}

	async updateById(videoId: string, patch: VideoUpdatePatch) {
		const existing = await this.getById(videoId);
		if (!existing) return null;

		const setPayload = {
			...patch,
			updatedAt: patch.updatedAt ?? new Date(),
		} as const;
		await this.db
			.update(videoAssets)
			.set(setPayload)
			.where(eq(videoAssets.id, videoId));
		return this.getById(videoId);
	}

	async updateByStreamVideoId(streamVideoId: string, patch: VideoUpdatePatch) {
		const existing = await this.getByStreamVideoId(streamVideoId);
		if (!existing) return null;

		const setPayload = {
			...patch,
			updatedAt: patch.updatedAt ?? new Date(),
		} as const;
		await this.db
			.update(videoAssets)
			.set(setPayload)
			.where(eq(videoAssets.streamVideoId, streamVideoId));
		return this.getByStreamVideoId(streamVideoId);
	}

	async publishReadyDraft(videoId: string, authUserId: string) {
		const existing = await this.getById(videoId);
		if (!existing) {
			return {
				changed: false as const,
				reason: "VIDEO_NOT_FOUND" as const,
			};
		}

		if (existing.publishStatus === "published") {
			return {
				changed: false as const,
				reason: "ALREADY_PUBLISHED" as const,
				video: existing,
			};
		}

		if (existing.processingStatus !== "ready") {
			return {
				changed: false as const,
				reason: "NOT_READY" as const,
				video: existing,
			};
		}

		const now = new Date();
		await this.db
			.update(videoAssets)
			.set({
				publishStatus: "published",
				publishedAt: now,
				updatedByAuthUserId: authUserId,
				updatedAt: now,
			})
			.where(eq(videoAssets.id, videoId));

		return {
			changed: true as const,
			video: await this.getById(videoId),
		};
	}

	async unpublish(videoId: string, authUserId: string) {
		const existing = await this.getById(videoId);
		if (!existing) {
			return {
				changed: false as const,
				reason: "VIDEO_NOT_FOUND" as const,
			};
		}

		if (existing.publishStatus === "draft") {
			return {
				changed: false as const,
				reason: "ALREADY_DRAFT" as const,
				video: existing,
			};
		}

		const now = new Date();
		await this.db
			.update(videoAssets)
			.set({
				publishStatus: "draft",
				publishedAt: null,
				updatedByAuthUserId: authUserId,
				updatedAt: now,
			})
			.where(eq(videoAssets.id, videoId));

		return {
			changed: true as const,
			video: await this.getById(videoId),
		};
	}
}
