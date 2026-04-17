import { describe, expect, it } from "vitest";
import {
	buildVideoBoardColumns,
	getVideoDateTimeLabel,
	getVideoDisplayTitle,
	getVideoDurationLabel,
} from "./video-state";

const makeVideo = (
	overrides: Partial<{
		id: string;
		processingStatus: "processing" | "ready" | "failed";
		updatedAt: string;
		title: string;
		durationSeconds: number | null;
	}> = {},
) => ({
	id: overrides.id ?? "v-1",
	streamVideoId: "stream-1",
	processingStatus: overrides.processingStatus ?? "processing",
	publishStatus: "draft" as const,
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
	it("groups records into processing/ready/failed columns", () => {
		const columns = buildVideoBoardColumns([
			makeVideo({ id: "p1", processingStatus: "processing" }),
			makeVideo({ id: "r1", processingStatus: "ready" }),
			makeVideo({ id: "f1", processingStatus: "failed" }),
		]);

		expect(columns[0]?.key).toBe("processing");
		expect(columns[0]?.items).toHaveLength(1);
		expect(columns[1]?.key).toBe("ready");
		expect(columns[1]?.items).toHaveLength(1);
		expect(columns[2]?.key).toBe("failed");
		expect(columns[2]?.items).toHaveLength(1);
	});

	it("sorts each column by updatedAt desc", () => {
		const columns = buildVideoBoardColumns([
			makeVideo({
				id: "old",
				processingStatus: "processing",
				updatedAt: "2026-04-16T00:00:00.000Z",
			}),
			makeVideo({
				id: "new",
				processingStatus: "processing",
				updatedAt: "2026-04-16T00:00:05.000Z",
			}),
		]);

		expect(columns[0]?.items.map((item) => item.id)).toEqual(["new", "old"]);
	});

	it("returns stable fallback labels", () => {
		expect(getVideoDisplayTitle({ title: "   " })).toBe("未命名视频");
		expect(getVideoDurationLabel(null)).toBe("时长未知");
		expect(getVideoDateTimeLabel("bad-date")).toBe("-");
	});
});
