import { describe, expect, it } from "vitest";
import {
	buildVideoListRows,
	getProcessingStatusLabel,
	getPublishStatusLabel,
	getVideoActionState,
	getVideoDateTimeLabel,
	getVideoDisplayTitle,
	getVideoDurationLabel,
} from "./video-state";

const makeVideo = (
	overrides: Partial<{
		id: string;
		processingStatus: "processing" | "ready" | "failed";
		publishStatus: "draft" | "published";
		updatedAt: string;
		title: string;
		durationSeconds: number | null;
	}> = {},
) => ({
	id: overrides.id ?? "v-1",
	streamVideoId: "stream-1",
	processingStatus: overrides.processingStatus ?? "processing",
	publishStatus: overrides.publishStatus ?? "draft",
	title: overrides.title ?? "Video",
	posterUrl: null,
	durationSeconds: overrides.durationSeconds ?? 15,
	createdByAuthUserId: "auth-1",
	updatedByAuthUserId: "auth-1",
	createdAt: "2026-04-16T00:00:00.000Z",
	updatedAt: overrides.updatedAt ?? "2026-04-16T00:00:00.000Z",
	publishedAt: null,
});

describe("video-state", () => {
	it("sorts list by updatedAt desc", () => {
		const rows = buildVideoListRows([
			makeVideo({ id: "old", updatedAt: "2026-04-16T00:00:00.000Z" }),
			makeVideo({ id: "new", updatedAt: "2026-04-16T00:00:05.000Z" }),
		]);

		expect(rows.map((item) => item.id)).toEqual(["new", "old"]);
	});

	it("returns action availability by processing/publish status", () => {
		expect(
			getVideoActionState(
				makeVideo({ processingStatus: "ready", publishStatus: "draft" }),
			),
		).toEqual({
			canPublish: true,
			canUnpublish: false,
			canDeleteDraft: true,
		});

		expect(
			getVideoActionState(
				makeVideo({ processingStatus: "processing", publishStatus: "published" }),
			),
		).toEqual({
			canPublish: false,
			canUnpublish: true,
			canDeleteDraft: false,
		});
	});

	it("returns stable fallback labels", () => {
		expect(getVideoDisplayTitle({ title: "   " })).toBe("未命名视频");
		expect(getVideoDurationLabel(null)).toBe("时长未知");
		expect(getVideoDateTimeLabel("bad-date")).toBe("-");
		expect(getProcessingStatusLabel("ready")).toBe("可发布");
		expect(getPublishStatusLabel("published")).toBe("已发布");
	});
});
