import { describe, expect, it } from "vitest";
import type { HomeContentPayload, PublicVideoRecord } from "@/lib/api";
import { resolveVideoWatchCollections } from "./video-watch-collections";

const createVideo = (streamVideoId: string, title: string): PublicVideoRecord => ({
	id: `video-${streamVideoId}`,
	streamVideoId,
	title,
	posterUrl: null,
	durationSeconds: 120,
	publishedAt: "2026-05-01T00:00:00.000Z",
});

const createFeaturedVideos = (
	overrides?: Partial<HomeContentPayload["featuredVideos"]>,
): HomeContentPayload["featuredVideos"] => ({
	main: {
		streamVideoId: overrides?.main?.streamVideoId ?? "",
	},
	characters: {
		items:
			overrides?.characters?.items ?? [
				{ streamVideoId: "stream-char-1" },
				{ streamVideoId: "stream-char-2" },
			],
	},
	familyStories: {
		items:
			overrides?.familyStories?.items ?? [
				{ streamVideoId: "stream-family-1" },
				{ streamVideoId: "stream-family-2" },
			],
	},
});

describe("video-watch-collections", () => {
	it("resolves collections in fixed order and keeps public remainder", () => {
		const videos = [
			createVideo("stream-family-1", "家庭故事 1"),
			createVideo("stream-char-2", "角色 2"),
			createVideo("stream-public-1", "全家福"),
			createVideo("stream-char-1", "角色 1"),
		];
		const collections = resolveVideoWatchCollections({
			videos,
			featuredVideos: createFeaturedVideos(),
			locale: "zh-CN",
		});

		expect(collections.map((item) => item.key)).toEqual([
			"characters",
			"familyStories",
			"public",
		]);
		expect(collections[0]?.videos.map((item) => item.streamVideoId)).toEqual([
			"stream-char-1",
			"stream-char-2",
		]);
		expect(collections[1]?.videos.map((item) => item.streamVideoId)).toEqual([
			"stream-family-1",
		]);
		expect(collections[2]?.videos.map((item) => item.streamVideoId)).toEqual([
			"stream-public-1",
		]);
	});

	it("keeps duplicates across character and family collections", () => {
		const videos = [
			createVideo("stream-shared", "共享视频"),
			createVideo("stream-public-1", "全家福"),
		];
		const collections = resolveVideoWatchCollections({
			videos,
			featuredVideos: createFeaturedVideos({
				characters: { items: [{ streamVideoId: "stream-shared" }] },
				familyStories: { items: [{ streamVideoId: "stream-shared" }] },
			}),
			locale: "zh-CN",
		});

		expect(collections[0]?.videos.map((item) => item.streamVideoId)).toEqual([
			"stream-shared",
		]);
		expect(collections[1]?.videos.map((item) => item.streamVideoId)).toEqual([
			"stream-shared",
		]);
	});

	it("hides empty collections", () => {
		const videos = [createVideo("stream-public-1", "全家福")];
		const collections = resolveVideoWatchCollections({
			videos,
			featuredVideos: createFeaturedVideos({
				characters: { items: [] },
				familyStories: { items: [] },
			}),
			locale: "zh-CN",
		});

		expect(collections).toHaveLength(1);
		expect(collections[0]?.key).toBe("public");
	});

	it("ignores invalid configured ids safely", () => {
		const videos = [createVideo("stream-char-1", "角色 1")];
		const collections = resolveVideoWatchCollections({
			videos,
			featuredVideos: createFeaturedVideos({
				characters: {
					items: [
						{ streamVideoId: "" },
						{ streamVideoId: " " },
						{ streamVideoId: "stream-char-1" },
					],
				},
				familyStories: {
					items: [{ streamVideoId: "stream-missing" }],
				},
			}),
			locale: "zh-CN",
		});

		expect(collections).toHaveLength(1);
		expect(collections[0]?.key).toBe("characters");
		expect(collections[0]?.videos.map((item) => item.streamVideoId)).toEqual([
			"stream-char-1",
		]);
	});
});
