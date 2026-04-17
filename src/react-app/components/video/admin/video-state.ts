import type { AdminVideoRecord } from "@/lib/api";

const readTimestamp = (value: string | null) => {
	if (!value) return 0;
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? 0 : parsed;
};

const compareByUpdatedAtDesc = (a: AdminVideoRecord, b: AdminVideoRecord) =>
	readTimestamp(b.updatedAt) - readTimestamp(a.updatedAt);

export const buildVideoListRows = (videos: AdminVideoRecord[]) =>
	[...videos].sort(compareByUpdatedAtDesc);

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

export const getProcessingStatusLabel = (
	status: AdminVideoRecord["processingStatus"],
) => {
	if (status === "ready") return "可发布";
	if (status === "failed") return "失败";
	return "处理中";
};

export const getPublishStatusLabel = (
	status: AdminVideoRecord["publishStatus"],
) => {
	if (status === "published") return "已发布";
	return "草稿";
};

export const getVideoActionState = (video: AdminVideoRecord) => ({
	canPublish:
		video.processingStatus === "ready" && video.publishStatus === "draft",
	canUnpublish: video.publishStatus === "published",
	canDeleteDraft: video.publishStatus === "draft",
});
