import type { PublicVideoRecord } from "@/lib/api";

export const VIDEO_QUERY_KEY = "v";

export const normalizeStreamVideoId = (value: string | null | undefined) => {
	const trimmed = value?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const readStreamVideoIdFromSearch = (search: string) => {
	const params = new URLSearchParams(search);
	return normalizeStreamVideoId(params.get(VIDEO_QUERY_KEY));
};

export const buildPublicVideoWatchHref = (streamVideoId: string) => {
	const params = new URLSearchParams();
	params.set(VIDEO_QUERY_KEY, streamVideoId);
	return `/video?${params.toString()}`;
};

export const resolveActivePublicVideo = (
	videos: PublicVideoRecord[],
	requestedStreamVideoId: string | null,
) => {
	if (videos.length === 0) return null;
	if (!requestedStreamVideoId) return videos[0] ?? null;
	const matched = videos.find(
		(video) => video.streamVideoId === requestedStreamVideoId,
	);
	return matched ?? videos[0] ?? null;
};

export const shouldReplaceWatchRouteQuery = (
	videos: PublicVideoRecord[],
	requestedStreamVideoId: string | null,
	activeStreamVideoId: string | null,
) => {
	if (videos.length === 0) {
		return requestedStreamVideoId !== null;
	}
	if (!activeStreamVideoId) return false;
	return requestedStreamVideoId !== activeStreamVideoId;
};
