import type { AdminVideoRecord } from "./api";

export type ProcessingVideoSyncSummary = {
	total: number;
	synced: number;
	failed: number;
};

export const pickProcessingVideoIds = (
	videos: AdminVideoRecord[],
	limit: number = Number.POSITIVE_INFINITY,
) => {
	if (limit <= 0) return [];

	const picked: string[] = [];
	for (const video of videos) {
		if (video.processingStatus !== "processing") continue;
		picked.push(video.id);
		if (picked.length >= limit) break;
	}
	return picked;
};

export const summarizeProcessingVideoSync = (
	results: PromiseSettledResult<unknown>[],
): ProcessingVideoSyncSummary => {
	let synced = 0;
	let failed = 0;
	for (const result of results) {
		if (result.status === "fulfilled") {
			synced += 1;
		} else {
			failed += 1;
		}
	}
	return {
		total: results.length,
		synced,
		failed,
	};
};
