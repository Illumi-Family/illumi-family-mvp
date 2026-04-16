import { beforeEach, describe, expect, it, vi } from "vitest";
import * as streamClient from "../../shared/integrations/stream/stream-client";
import * as streamWebhook from "../../shared/integrations/stream/stream-webhook";
import { AppError } from "../../shared/http/errors";
import * as kv from "../../shared/storage/kv";
import { VideoService } from "./video.service";

const buildVideoRow = (overrides?: Record<string, unknown>) => ({
	id: "video-1",
	streamVideoId: "stream-1",
	processingStatus: "ready",
	publishStatus: "draft",
	title: "Video 1",
	posterUrl: "https://example.com/poster.jpg",
	durationSeconds: 10,
	createdByAuthUserId: "auth-1",
	updatedByAuthUserId: "auth-1",
	createdAt: new Date("2026-04-15T00:00:00.000Z"),
	updatedAt: new Date("2026-04-15T00:00:00.000Z"),
	publishedAt: null,
	...overrides,
});

describe("video service", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("issues upload url and creates local draft", async () => {
		const createDirectUploadSpy = vi
			.spyOn(streamClient, "createStreamDirectUpload")
			.mockResolvedValue({
				streamVideoId: "stream-123",
				uploadUrl: "https://upload.example.com",
				expiresAt: "2026-04-16T00:00:00.000Z",
			});
		const repository = {
			createDraft: vi.fn().mockResolvedValue(
				buildVideoRow({
					id: "video-123",
					streamVideoId: "stream-123",
				}),
			),
		};
		const service = new VideoService(repository as never);

		const result = await service.issueUploadUrl({} as never, {
			authUserId: "auth-123",
			body: {
				title: "My video",
				maxDurationSeconds: 600,
			},
		});

		expect(createDirectUploadSpy).toHaveBeenCalledWith({}, {
			maxDurationSeconds: 600,
		});
		expect(repository.createDraft).toHaveBeenCalledWith({
			streamVideoId: "stream-123",
			title: "My video",
			authUserId: "auth-123",
		});
		expect(result.videoId).toBe("video-123");
		expect(result.uploadUrl).toBe("https://upload.example.com");
	});

	it("rejects publish when video is not ready", async () => {
		const repository = {
			publishReadyDraft: vi.fn().mockResolvedValue({
				changed: false,
				reason: "NOT_READY",
				video: buildVideoRow({ processingStatus: "processing" }),
			}),
		};
		const service = new VideoService(repository as never);

		await expect(
			service.publishVideo({ CACHE: {} } as never, {
				videoId: "video-1",
				authUserId: "auth-1",
			}),
		).rejects.toThrow("Video is not ready for publish");
	});

	it("invalidates public cache after successful publish", async () => {
		const deleteCacheSpy = vi.spyOn(kv, "deleteCacheKey").mockResolvedValue();
		const repository = {
			publishReadyDraft: vi.fn().mockResolvedValue({
				changed: true,
				video: buildVideoRow({
					publishStatus: "published",
					publishedAt: new Date("2026-04-16T00:00:00.000Z"),
				}),
			}),
		};
		const service = new VideoService(repository as never);

		const result = await service.publishVideo({ CACHE: {} } as never, {
			videoId: "video-1",
			authUserId: "auth-1",
		});

		expect(deleteCacheSpy).toHaveBeenCalledWith({}, "videos:public:v1");
		expect(result.changed).toBe(true);
		expect(result.video?.publishStatus).toBe("published");
	});

	it("returns cached public videos when cache hit", async () => {
		const readCacheSpy = vi.spyOn(kv, "readCacheJson").mockResolvedValue([
			{
				id: "video-1",
				streamVideoId: "stream-1",
				title: "Cached",
				posterUrl: null,
				durationSeconds: null,
				publishedAt: "2026-04-16T00:00:00.000Z",
			},
		]);
		const writeCacheSpy = vi.spyOn(kv, "writeCacheJson").mockResolvedValue();
		const repository = {
			listPublicReadyVideos: vi.fn(),
		};
		const service = new VideoService(repository as never);

		const result = await service.listPublicVideos({ CACHE: {} } as never);

		expect(result).toHaveLength(1);
		expect(repository.listPublicReadyVideos).not.toHaveBeenCalled();
		expect(readCacheSpy).toHaveBeenCalledTimes(1);
		expect(writeCacheSpy).not.toHaveBeenCalled();
	});

	it("syncs video status from Stream API", async () => {
		const getVideoSpy = vi.spyOn(streamClient, "getStreamVideoById").mockResolvedValue({
			uid: "stream-1",
			readyToStream: true,
			duration: 17.2,
			thumbnail: "https://example.com/thumb.jpg",
		} as never);
		const repository = {
			getById: vi.fn().mockResolvedValue(buildVideoRow()),
			updateById: vi.fn().mockResolvedValue(
				buildVideoRow({
					processingStatus: "ready",
					durationSeconds: 17,
					posterUrl: "https://example.com/thumb.jpg",
				}),
			),
		};
		const service = new VideoService(repository as never);

		const result = await service.syncVideoStatus({} as never, {
			videoId: "video-1",
			authUserId: "auth-1",
		});

		expect(getVideoSpy).toHaveBeenCalledWith({}, "stream-1");
		expect(repository.updateById).toHaveBeenCalledWith("video-1", {
			processingStatus: "ready",
			durationSeconds: 17,
			posterUrl: "https://example.com/poster.jpg",
			updatedByAuthUserId: "auth-1",
		});
		expect(result.processingStatus).toBe("ready");
	});

	it("rejects webhook with invalid signature", async () => {
		const verifySpy = vi
			.spyOn(streamWebhook, "verifyStreamWebhookSignature")
			.mockResolvedValue(false);
		const repository = {
			updateByStreamVideoId: vi.fn(),
		};
		const service = new VideoService(repository as never);

		await expect(
			service.ingestStreamWebhook(
				{ STREAM_WEBHOOK_SECRET: "secret" } as never,
				{
					rawBody: "{}",
					signature: "bad-signature",
					payload: {},
				},
			),
		).rejects.toThrow("Invalid stream webhook signature");
		expect(verifySpy).toHaveBeenCalledTimes(1);
		expect(repository.updateByStreamVideoId).not.toHaveBeenCalled();
	});

	it("updates video state when webhook is valid", async () => {
		vi.spyOn(streamWebhook, "verifyStreamWebhookSignature").mockResolvedValue(true);
		vi.spyOn(streamWebhook, "parseStreamWebhookEvent").mockReturnValue({
			streamVideoId: "stream-1",
			processingStatus: "ready",
			durationSeconds: 12,
			posterUrl: "https://example.com/poster.jpg",
		});
		const repository = {
			getByStreamVideoId: vi
				.fn()
				.mockResolvedValue(buildVideoRow({ posterUrl: null })),
			updateByStreamVideoId: vi.fn().mockResolvedValue(buildVideoRow()),
		};
		const service = new VideoService(repository as never);

		const result = await service.ingestStreamWebhook(
			{ STREAM_WEBHOOK_SECRET: "secret", CACHE: {} } as never,
			{
				rawBody: '{"uid":"stream-1"}',
				signature: "good-signature",
				payload: { uid: "stream-1" },
			},
		);

		expect(repository.updateByStreamVideoId).toHaveBeenCalledWith("stream-1", {
			processingStatus: "ready",
			durationSeconds: 12,
			posterUrl: "https://example.com/poster.jpg",
		});
		expect(result.updated).toBe(true);
	});

	it("cleans up draft video and deletes remote stream placeholder", async () => {
		const deleteStreamSpy = vi
			.spyOn(streamClient, "deleteStreamVideoById")
			.mockResolvedValue(undefined);
		const repository = {
			getById: vi.fn().mockResolvedValue(buildVideoRow({ publishStatus: "draft" })),
			deleteById: vi.fn().mockResolvedValue(buildVideoRow({ publishStatus: "draft" })),
		};
		const service = new VideoService(repository as never);

		const result = await service.cleanupDraftVideo({} as never, {
			videoId: "video-1",
			authUserId: "auth-1",
		});

		expect(deleteStreamSpy).toHaveBeenCalledWith({}, "stream-1");
		expect(repository.deleteById).toHaveBeenCalledWith("video-1");
		expect(result.deleted).toBe(true);
		expect(result.remoteDeleted).toBe(true);
	});

	it("cleanup treats missing stream video as already deleted", async () => {
		vi.spyOn(streamClient, "deleteStreamVideoById").mockRejectedValue(
			new AppError("STREAM_API_ERROR", "not found", 502, { status: 404 }),
		);
		const repository = {
			getById: vi.fn().mockResolvedValue(buildVideoRow({ publishStatus: "draft" })),
			deleteById: vi.fn().mockResolvedValue(buildVideoRow({ publishStatus: "draft" })),
		};
		const service = new VideoService(repository as never);

		const result = await service.cleanupDraftVideo({} as never, {
			videoId: "video-1",
			authUserId: "auth-1",
		});

		expect(result.deleted).toBe(true);
		expect(result.remoteDeleted).toBe(true);
	});

	it("cleanup rejects published videos", async () => {
		const repository = {
			getById: vi.fn().mockResolvedValue(
				buildVideoRow({
					publishStatus: "published",
					publishedAt: new Date("2026-04-16T00:00:00.000Z"),
				}),
			),
		};
		const service = new VideoService(repository as never);

		await expect(
			service.cleanupDraftVideo({} as never, {
				videoId: "video-1",
				authUserId: "auth-1",
			}),
		).rejects.toThrow("Published video cannot be cleaned up as draft");
	});
});
