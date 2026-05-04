import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { AppContext } from "../../types";
import { handleAppError } from "../../shared/http/middleware/error-handler";

const listPublicVideos = vi.fn();

vi.mock("../../shared/db/client", () => ({
	getDb: vi.fn(() => ({})),
}));

vi.mock("../video/video.repository", () => ({
	VideoRepository: vi.fn(),
}));

vi.mock("../video/video.service", () => ({
	VideoService: vi.fn().mockImplementation(function VideoServiceMock() {
		return {
			listPublicVideos,
		};
	}),
}));

import { seoRouter } from "./seo.router";

const createTestApp = () => {
	const app = new Hono<AppContext>();
	app.route("/", seoRouter);
	app.onError((error, c) => handleAppError(error, c));
	return app;
};

const createAssetResponse = () =>
	new Response(
		`<!doctype html><html><head><meta name="description" content="old" /><title>old</title></head><body></body></html>`,
		{
			status: 200,
			headers: {
				"content-type": "text/html; charset=UTF-8",
			},
		},
	);

describe("seo controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders dynamic seo tags for home page", async () => {
		const app = createTestApp();
		const response = await app.request(
			"/",
			{ method: "GET" },
			{
				ASSETS: {
					fetch: vi.fn(async () => createAssetResponse()),
				},
			} as never,
		);

		expect(response.status).toBe(200);
		const text = await response.text();
		expect(text).toContain("童蒙家塾｜传播传统文化｜家庭教育系统");
		expect(text).toContain('property="og:title"');
		expect(text).toContain('name="twitter:card" content="summary_large_image"');
	});

	it("renders dynamic seo tags for video detail page", async () => {
		listPublicVideos.mockResolvedValue([
			{
				id: "video-1",
				streamVideoId: "stream-1",
				title: "家庭故事第一集",
				posterUrl: "https://cdn.example.com/poster.jpg",
				durationSeconds: 120,
				publishedAt: "2026-05-04T00:00:00.000Z",
			},
		]);
		const app = createTestApp();
		const response = await app.request(
			"/video/stream-1",
			{ method: "GET" },
			{
				ASSETS: {
					fetch: vi.fn(async () => createAssetResponse()),
				},
				CACHE: {},
			} as never,
		);

		expect(response.status).toBe(200);
		const text = await response.text();
		expect(text).toContain("家庭故事第一集");
		expect(text).toContain("家庭故事视频");
		expect(text).toContain("https://cdn.example.com/poster.jpg");
	});

	it("returns 404 when video detail does not exist", async () => {
		listPublicVideos.mockResolvedValue([]);
		const app = createTestApp();
		const response = await app.request(
			"/video/stream-missing",
			{ method: "GET" },
			{
				ASSETS: {
					fetch: vi.fn(async () => createAssetResponse()),
				},
				CACHE: {},
			} as never,
		);

		expect(response.status).toBe(404);
		const body = (await response.json()) as {
			success: boolean;
			error: { code: string };
		};
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("NOT_FOUND");
	});
});
