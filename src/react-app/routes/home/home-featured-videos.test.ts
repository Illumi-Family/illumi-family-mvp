import { describe, expect, it } from "vitest";
import type { HomeContentPayload, PublicVideoRecord } from "@/lib/api";
import {
	collectDuplicateFeaturedVideoIds,
	resolveConfiguredVideoList,
	resolveHomeFeaturedVideos,
} from "./home-featured-videos";

const createVideo = (
	overrides: Partial<PublicVideoRecord> & {
		streamVideoId: string;
		title?: string;
	},
): PublicVideoRecord => ({
	id: overrides.id ?? `video-${overrides.streamVideoId}`,
	streamVideoId: overrides.streamVideoId,
	title: overrides.title ?? `标题 ${overrides.streamVideoId}`,
	posterUrl: overrides.posterUrl ?? null,
	durationSeconds: overrides.durationSeconds ?? 120,
	publishedAt: overrides.publishedAt ?? "2026-04-01T00:00:00.000Z",
});

const createConfig = (
	overrides?: Partial<HomeContentPayload["featuredVideos"]>,
): HomeContentPayload["featuredVideos"] => ({
	main: {
		streamVideoId: overrides?.main?.streamVideoId ?? "stream-main-1",
	},
	characters: {
		items:
			overrides?.characters?.items ?? [
				{ streamVideoId: "stream-char-1" },
				{ streamVideoId: "stream-char-2" },
			],
	},
	familyStories: {
		items: overrides?.familyStories?.items ?? [],
	},
});

describe("home featured videos", () => {
	it("resolves configured main and character videos in configured order", () => {
		const videos: PublicVideoRecord[] = [
			createVideo({ streamVideoId: "stream-main-1", title: "全家福主片" }),
			createVideo({ streamVideoId: "stream-char-1", title: "角色视频 1" }),
			createVideo({ streamVideoId: "stream-char-2", title: "角色视频 2" }),
		];

		const resolved = resolveHomeFeaturedVideos(
			videos,
			createConfig(),
			"zh-CN",
		);

		expect(resolved.main.status).toBe("ready");
		expect(resolved.main.video?.streamVideoId).toBe("stream-main-1");
		expect(resolved.characters).toHaveLength(2);
		expect(resolved.characters.map((item) => item.video?.streamVideoId)).toEqual([
			"stream-char-1",
			"stream-char-2",
		]);
	});

	it("uses dynamic length and no fixed placeholders when character config is empty", () => {
		const resolved = resolveHomeFeaturedVideos(
			[],
			createConfig({
				main: { streamVideoId: "stream-main-1" },
				characters: { items: [] },
			}),
			"en-US",
		);

		expect(resolved.main.status).toBe("missing");
		expect(resolved.main.title).toContain("Homepage Main Video");
		expect(resolved.characters).toHaveLength(0);
	});

	it("collects duplicate configured ids predictably", () => {
		const duplicates = collectDuplicateFeaturedVideoIds([
			"stream-1",
			"stream-1",
			"stream-2",
			"",
			"stream-2",
			"stream-3",
		]);

		expect(duplicates).toEqual(["stream-1", "stream-2"]);
	});

	it("resolves configured family story list in configured order", () => {
		const videos: PublicVideoRecord[] = [
			createVideo({ streamVideoId: "story-2", title: "故事 2" }),
			createVideo({ streamVideoId: "story-1", title: "故事 1" }),
		];

		const resolved = resolveConfiguredVideoList(videos, ["story-1", "story-2"], {
			locale: "zh-CN",
			keyPrefix: "family-story",
			roleLabelPrefixZh: "家庭故事",
			roleLabelPrefixEn: "Family Story",
			titlePrefixZh: "家庭故事视频",
			titlePrefixEn: "Family Story Video",
		});

		expect(resolved).toHaveLength(2);
		expect(resolved.map((item) => item.video?.streamVideoId)).toEqual([
			"story-1",
			"story-2",
		]);
	});
});
