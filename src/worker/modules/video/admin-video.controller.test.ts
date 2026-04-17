import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { AppContext } from "../../types";
import { handleAppError } from "../../shared/http/middleware/error-handler";

const issueUploadUrl = vi.fn();
const importExistingVideo = vi.fn();
const listAdminVideos = vi.fn();
const updateVideoMetadata = vi.fn();
const publishVideo = vi.fn();
const unpublishVideo = vi.fn();
const syncVideoStatus = vi.fn();
const cleanupDraftVideo = vi.fn();

vi.mock("../../shared/auth/session", () => ({
	requireAdminSession: async (
		c: { set: (key: "authUserId", value: string) => void },
		next: () => Promise<void>,
	) => {
		c.set("authUserId", "auth-test");
		await next();
	},
}));

vi.mock("../../shared/db/client", () => ({
	getDb: vi.fn(() => ({})),
}));

vi.mock("./video.repository", () => ({
	VideoRepository: vi.fn(),
}));

vi.mock("./video.service", () => ({
	VideoService: vi.fn().mockImplementation(function VideoServiceMock() {
		return {
			issueUploadUrl,
			importExistingVideo,
			listAdminVideos,
			updateVideoMetadata,
			publishVideo,
			unpublishVideo,
			syncVideoStatus,
			cleanupDraftVideo,
		};
	}),
}));

import { adminVideoRouter } from "./admin-video.router";

const createTestApp = () => {
	const app = new Hono<AppContext>();
	app.route("/api/admin/videos", adminVideoRouter);
	app.onError((error, c) => handleAppError(error, c));
	return app;
};

describe("admin video controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates upload url via service", async () => {
		issueUploadUrl.mockResolvedValue({
			videoId: "video-1",
			uploadUrl: "https://upload.example.com",
			expiresAt: null,
		});
		const app = createTestApp();

		const response = await app.request(
			"/api/admin/videos/upload-url",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ title: "A video", maxDurationSeconds: 600 }),
			},
			{} as never,
		);

		expect(response.status).toBe(201);
		expect(issueUploadUrl).toHaveBeenCalledWith(
			{},
			{
				authUserId: "auth-test",
				body: { title: "A video", maxDurationSeconds: 600 },
			},
		);
	});

	it("validates JSON body for upload-url", async () => {
		const app = createTestApp();
		const response = await app.request(
			"/api/admin/videos/upload-url",
			{ method: "POST", body: "{}" },
			{} as never,
		);

		expect(response.status).toBe(415);
		expect(issueUploadUrl).not.toHaveBeenCalled();
	});

	it("imports existing stream video via service", async () => {
		importExistingVideo.mockResolvedValue({
			reused: false,
			video: {
				id: "video-1",
				streamVideoId: "stream-1",
			},
		});
		const app = createTestApp();

		const response = await app.request(
			"/api/admin/videos/import",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					streamVideoId: "stream-1",
					title: "Imported title",
				}),
			},
			{} as never,
		);

		expect(response.status).toBe(201);
		expect(importExistingVideo).toHaveBeenCalledWith(
			{},
			{
				authUserId: "auth-test",
				body: {
					streamVideoId: "stream-1",
					title: "Imported title",
				},
			},
		);
	});

	it("validates import request body", async () => {
		const app = createTestApp();
		const response = await app.request(
			"/api/admin/videos/import",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ streamVideoId: "" }),
			},
			{} as never,
		);

		expect(response.status).toBe(400);
		expect(importExistingVideo).not.toHaveBeenCalled();
	});

	it("lists admin videos", async () => {
		listAdminVideos.mockResolvedValue([]);
		const app = createTestApp();
		const response = await app.request(
			"/api/admin/videos",
			{ method: "GET" },
			{} as never,
		);

		expect(response.status).toBe(200);
		expect(listAdminVideos).toHaveBeenCalledTimes(1);
	});

	it("cleans up draft video by id", async () => {
		cleanupDraftVideo.mockResolvedValue({
			deleted: true,
			videoId: "video-1",
			remoteDeleted: true,
		});
		const app = createTestApp();
		const response = await app.request(
			"/api/admin/videos/video-1",
			{ method: "DELETE" },
			{} as never,
		);

		expect(response.status).toBe(200);
		expect(cleanupDraftVideo).toHaveBeenCalledWith(
			{},
			{ videoId: "video-1", authUserId: "auth-test" },
		);
	});
});
