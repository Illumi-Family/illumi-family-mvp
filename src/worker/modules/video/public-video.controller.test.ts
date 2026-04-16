import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { AppContext } from "../../types";
import { handleAppError } from "../../shared/http/middleware/error-handler";

const listPublicVideos = vi.fn();

vi.mock("../../shared/db/client", () => ({
	getDb: vi.fn(() => ({})),
}));

vi.mock("./video.repository", () => ({
	VideoRepository: vi.fn(),
}));

vi.mock("./video.service", () => ({
	VideoService: vi.fn().mockImplementation(function VideoServiceMock() {
		return {
			listPublicVideos,
		};
	}),
}));

import { publicVideoRouter } from "./public-video.router";

const createTestApp = () => {
	const app = new Hono<AppContext>();
	app.route("/api/content", publicVideoRouter);
	app.onError((error, c) => handleAppError(error, c));
	return app;
};

describe("public video controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns public videos list", async () => {
		listPublicVideos.mockResolvedValue([
			{
				id: "video-1",
				streamVideoId: "stream-1",
				title: "Video 1",
				posterUrl: null,
				durationSeconds: 12,
				publishedAt: "2026-04-16T00:00:00.000Z",
			},
		]);
		const app = createTestApp();

		const response = await app.request(
			"/api/content/videos",
			{ method: "GET" },
			{} as never,
		);

		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			success: boolean;
			data: { videos: Array<{ id: string }> };
		};
		expect(body.success).toBe(true);
		expect(body.data.videos[0]?.id).toBe("video-1");
		expect(listPublicVideos).toHaveBeenCalledWith({});
	});
});
