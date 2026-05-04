import type { PublicVideoRecord } from "@/lib/api";

export const VIDEO_QUERY_KEY = "v";
const VIDEO_PATH_PREFIX = "/video/";

export const normalizeStreamVideoId = (value: string | null | undefined) => {
	const trimmed = value?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const readStreamVideoIdFromSearch = (search: string) => {
	const params = new URLSearchParams(search);
	return normalizeStreamVideoId(params.get(VIDEO_QUERY_KEY));
};

export const readStreamVideoIdFromPathname = (pathname: string) => {
	if (!pathname.startsWith(VIDEO_PATH_PREFIX)) return null;
	const rawSegment = pathname.slice(VIDEO_PATH_PREFIX.length);
	if (!rawSegment) return null;
	const firstSegment = rawSegment.split("/")[0] ?? "";
	if (!firstSegment) return null;
	try {
		return normalizeStreamVideoId(decodeURIComponent(firstSegment));
	} catch {
		return null;
	}
};

export const buildPublicVideoWatchHref = (streamVideoId: string) => {
	return `/video/${encodeURIComponent(streamVideoId)}`;
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
