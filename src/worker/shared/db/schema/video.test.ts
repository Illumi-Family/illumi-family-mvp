import { describe, expect, it } from "vitest";
import {
	VIDEO_PROCESSING_STATUSES,
	VIDEO_PUBLISH_STATUSES,
} from "../../../modules/video/video.schema";
import { videoAssets } from "./video";

describe("video schema", () => {
	it("defines supported processing and publish statuses", () => {
		expect(VIDEO_PROCESSING_STATUSES).toEqual(["processing", "ready", "failed"]);
		expect(VIDEO_PUBLISH_STATUSES).toEqual(["draft", "published"]);
	});

	it("defines table columns for stream id and lifecycle states", () => {
		expect(videoAssets.streamVideoId.name).toBe("stream_video_id");
		expect(videoAssets.processingStatus.name).toBe("processing_status");
		expect(videoAssets.publishStatus.name).toBe("publish_status");
		expect(videoAssets.publishedAt.name).toBe("published_at");
	});
});
