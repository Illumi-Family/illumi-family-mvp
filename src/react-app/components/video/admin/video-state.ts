import type { AdminVideoRecord } from "@/lib/api";

export type VideoBoardColumnKey = "processing" | "ready" | "failed";

export type VideoBoardColumn = {
	key: VideoBoardColumnKey;
	label: string;
	items: AdminVideoRecord[];
};

const COLUMN_ORDER: VideoBoardColumnKey[] = ["processing", "ready", "failed"];

const COLUMN_LABELS: Record<VideoBoardColumnKey, string> = {
	processing: "处理中",
	ready: "可发布",
	failed: "失败",
};

const normalizeColumnKey = (
	status: AdminVideoRecord["processingStatus"],
): VideoBoardColumnKey => {
	if (status === "ready") return "ready";
	if (status === "failed") return "failed";
	return "processing";
};

const readTimestamp = (value: string | null) => {
	if (!value) return 0;
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? 0 : parsed;
};

const compareByUpdatedAtDesc = (a: AdminVideoRecord, b: AdminVideoRecord) =>
	readTimestamp(b.updatedAt) - readTimestamp(a.updatedAt);

export const buildVideoBoardColumns = (
	videos: AdminVideoRecord[],
): VideoBoardColumn[] => {
	const buckets: Record<VideoBoardColumnKey, AdminVideoRecord[]> = {
		processing: [],
		ready: [],
		failed: [],
	};

	for (const video of videos) {
		buckets[normalizeColumnKey(video.processingStatus)].push(video);
	}

	for (const key of COLUMN_ORDER) {
		buckets[key].sort(compareByUpdatedAtDesc);
	}

	return COLUMN_ORDER.map((key) => ({
		key,
		label: COLUMN_LABELS[key],
		items: buckets[key],
	}));
};

export const getVideoDisplayTitle = (video: Pick<AdminVideoRecord, "title">) => {
	const trimmed = video.title.trim();
	return trimmed.length > 0 ? trimmed : "未命名视频";
};

export const getVideoDurationLabel = (seconds: number | null) => {
	if (seconds === null || Number.isNaN(seconds)) return "时长未知";
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remain = seconds % 60;
	return `${minutes}m ${remain}s`;
};

export const getVideoDateTimeLabel = (value: string | null) => {
	if (!value) return "-";
	const parsed = Date.parse(value);
	if (Number.isNaN(parsed)) return "-";
	return new Date(parsed).toLocaleString();
};
