import { describe, expect, it } from "vitest";
import type { AdminVideoRecord } from "./api";
import {
	pickProcessingVideoIds,
	summarizeProcessingVideoSync,
} from "./video-sync";

const makeVideo = (
	overrides?: Partial<AdminVideoRecord>,
): AdminVideoRecord => ({
	id: "video-1",
	streamVideoId: "stream-1",
	processingStatus: "processing",
	publishStatus: "draft",
	title: "Video",
	posterUrl: null,
	durationSeconds: null,
	createdByAuthUserId: "auth-1",
	updatedByAuthUserId: "auth-1",
	createdAt: "2026-04-17T00:00:00.000Z",
	updatedAt: "2026-04-17T00:00:00.000Z",
	publishedAt: null,
	...overrides,
});

describe("video sync helpers", () => {
	it("picks processing video ids with limit", () => {
		const ids = pickProcessingVideoIds(
			[
				makeVideo({ id: "video-1", processingStatus: "processing" }),
				makeVideo({ id: "video-2", processingStatus: "ready" }),
				makeVideo({ id: "video-3", processingStatus: "processing" }),
			],
			1,
		);

		expect(ids).toEqual(["video-1"]);
	});

	it("returns empty list when limit is non-positive", () => {
		const ids = pickProcessingVideoIds(
			[makeVideo({ id: "video-1", processingStatus: "processing" })],
			0,
		);

		expect(ids).toEqual([]);
	});

	it("summarizes fulfilled and rejected results", () => {
		const summary = summarizeProcessingVideoSync([
			{ status: "fulfilled", value: undefined },
			{ status: "rejected", reason: new Error("boom") },
			{ status: "fulfilled", value: undefined },
		]);

		expect(summary).toEqual({
			total: 3,
			synced: 2,
			failed: 1,
		});
	});
});
