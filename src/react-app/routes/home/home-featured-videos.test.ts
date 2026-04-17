import { describe, expect, it } from "vitest";
import type { PublicVideoRecord } from "@/lib/api";
import {
	HOME_CHARACTER_VIDEO_SLOT_COUNT,
	HOME_CHARACTER_VIDEO_STREAM_IDS,
	HOME_MAIN_VIDEO_STREAM_ID,
	collectDuplicateFeaturedVideoIds,
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

describe("home featured videos", () => {
	it("resolves configured main and character videos in deterministic order", () => {
		const videos: PublicVideoRecord[] = [
			createVideo({ streamVideoId: HOME_MAIN_VIDEO_STREAM_ID, title: "全家福主片" }),
			...HOME_CHARACTER_VIDEO_STREAM_IDS.map((streamVideoId, index) =>
				createVideo({
					streamVideoId,
					title: `角色视频 ${index + 1}`,
				}),
			),
		];

		const resolved = resolveHomeFeaturedVideos(videos, "zh-CN");

		expect(resolved.main.status).toBe("ready");
		expect(resolved.main.video?.streamVideoId).toBe(HOME_MAIN_VIDEO_STREAM_ID);
		expect(resolved.characters).toHaveLength(HOME_CHARACTER_VIDEO_SLOT_COUNT);
		expect(resolved.characters.every((item) => item.status === "ready")).toBe(true);
		expect(resolved.characters.map((item) => item.video?.streamVideoId)).toEqual([
			...HOME_CHARACTER_VIDEO_STREAM_IDS,
		]);
	});

	it("falls back to localized placeholders when configured slots are missing", () => {
		const resolved = resolveHomeFeaturedVideos([], "en-US");

		expect(resolved.main.status).toBe("missing");
		expect(resolved.main.title).toContain("Family Portrait");
		expect(resolved.characters).toHaveLength(HOME_CHARACTER_VIDEO_SLOT_COUNT);
		expect(resolved.characters.every((item) => item.status === "missing")).toBe(true);
		expect(resolved.characters[0]?.title).toContain("Grandparent Story");
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
});
