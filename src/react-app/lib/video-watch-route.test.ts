import { describe, expect, it } from "vitest";
import type { PublicVideoRecord } from "@/lib/api";
import {
	buildPublicVideoWatchHref,
	normalizeStreamVideoId,
	readStreamVideoIdFromPathname,
	readStreamVideoIdFromSearch,
	resolveActivePublicVideo,
	shouldReplaceWatchRouteQuery,
} from "./video-watch-route";

const makeVideo = (
	streamVideoId: string,
	overrides: Partial<PublicVideoRecord> = {},
): PublicVideoRecord => ({
	id: `video-${streamVideoId}`,
	streamVideoId,
	title: `Video ${streamVideoId}`,
	posterUrl: null,
	durationSeconds: null,
	publishedAt: "2026-04-01T00:00:00.000Z",
	...overrides,
});

describe("video-watch-route", () => {
	it("normalizes empty stream ids", () => {
		expect(normalizeStreamVideoId(undefined)).toBeNull();
		expect(normalizeStreamVideoId(null)).toBeNull();
		expect(normalizeStreamVideoId("")).toBeNull();
		expect(normalizeStreamVideoId("  ")).toBeNull();
		expect(normalizeStreamVideoId(" stream-1 ")).toBe("stream-1");
	});

	it("reads stream id from search params", () => {
		expect(readStreamVideoIdFromSearch("?v=stream-1")).toBe("stream-1");
		expect(readStreamVideoIdFromSearch("?v=%20stream-2%20")).toBe("stream-2");
		expect(readStreamVideoIdFromSearch("?foo=1")).toBeNull();
	});

	it("reads stream id from pathname", () => {
		expect(readStreamVideoIdFromPathname("/video/stream-1")).toBe("stream-1");
		expect(readStreamVideoIdFromPathname("/video/%20stream-2%20")).toBe("stream-2");
		expect(readStreamVideoIdFromPathname("/video/")).toBeNull();
		expect(readStreamVideoIdFromPathname("/videos/stream-1")).toBeNull();
	});

	it("builds shareable watch href", () => {
		expect(buildPublicVideoWatchHref("stream-1")).toBe("/video/stream-1");
	});

	it("resolves active video by requested stream id", () => {
		const videos = [makeVideo("stream-a"), makeVideo("stream-b")];
		expect(resolveActivePublicVideo(videos, "stream-b")?.streamVideoId).toBe(
			"stream-b",
		);
	});

	it("falls back to first video when requested id is invalid", () => {
		const videos = [makeVideo("stream-a"), makeVideo("stream-b")];
		expect(resolveActivePublicVideo(videos, "stream-missing")?.streamVideoId).toBe(
			"stream-a",
		);
	});

	it("returns null when no videos are available", () => {
		expect(resolveActivePublicVideo([], "stream-a")).toBeNull();
	});

	it("decides when watch route query should be replaced", () => {
		const videos = [makeVideo("stream-a"), makeVideo("stream-b")];
		expect(shouldReplaceWatchRouteQuery(videos, "stream-a", "stream-a")).toBe(false);
		expect(shouldReplaceWatchRouteQuery(videos, null, "stream-a")).toBe(true);
		expect(shouldReplaceWatchRouteQuery(videos, "stream-missing", "stream-a")).toBe(
			true,
		);
		expect(shouldReplaceWatchRouteQuery([], "stream-a", null)).toBe(true);
		expect(shouldReplaceWatchRouteQuery([], null, null)).toBe(false);
	});
});
