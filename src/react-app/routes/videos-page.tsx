import { useEffect, useMemo, useState } from "react";
import { Stream } from "@cloudflare/stream-react";
import { useQuery } from "@tanstack/react-query";
import { MobileShareFab } from "@/components/share/mobile-share-fab";
import { PublicVideoGrid } from "@/components/video/public/public-video-grid";
import { Button } from "@/components/ui/button";
import type { PublicVideoRecord } from "@/lib/api";
import { publicVideosQueryOptions } from "@/lib/query-options";
import { warmupVideoPlaybackIntent } from "@/lib/video-player-warmup";
import {
	buildPublicVideoWatchHref,
	readStreamVideoIdFromPathname,
	readStreamVideoIdFromSearch,
	resolveActivePublicVideo,
	shouldReplaceWatchRouteQuery,
} from "@/lib/video-watch-route";

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

const EMPTY_PUBLIC_VIDEOS: PublicVideoRecord[] = [];

const readRequestedStreamVideoId = () => {
	if (typeof window === "undefined") return null;
	const streamVideoIdFromPath = readStreamVideoIdFromPathname(window.location.pathname);
	if (streamVideoIdFromPath) return streamVideoIdFromPath;
	return readStreamVideoIdFromSearch(window.location.search);
};

const writeStreamVideoIdToUrl = (
	streamVideoId: string | null,
	options?: { replace?: boolean },
) => {
	if (typeof window === "undefined") return;
	const nextPath = streamVideoId ? buildPublicVideoWatchHref(streamVideoId) : "/video";
	const nextUrl = new URL(nextPath, window.location.origin);
	const nextHistoryPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
	if (options?.replace) {
		window.history.replaceState(window.history.state, "", nextHistoryPath);
		return;
	}
	window.history.pushState(window.history.state, "", nextHistoryPath);
};

export function VideosPage() {
	const videosQuery = useQuery(publicVideosQueryOptions());
	const [requestedStreamVideoId, setRequestedStreamVideoId] = useState<string | null>(
		() => readRequestedStreamVideoId(),
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const handlePopState = () => {
			setRequestedStreamVideoId(readRequestedStreamVideoId());
		};
		window.addEventListener("popstate", handlePopState);
		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, []);

	const videos = videosQuery.data ?? EMPTY_PUBLIC_VIDEOS;
	const activeVideo = useMemo(
		() => resolveActivePublicVideo(videos, requestedStreamVideoId),
		[videos, requestedStreamVideoId],
	);

	useEffect(() => {
		if (videosQuery.isLoading || videosQuery.isError) return;
		const shouldReplace = shouldReplaceWatchRouteQuery(
			videos,
			requestedStreamVideoId,
			activeVideo?.streamVideoId ?? null,
		);
		if (!shouldReplace) return;
		const nextStreamVideoId = activeVideo?.streamVideoId ?? null;
		writeStreamVideoIdToUrl(nextStreamVideoId, { replace: true });
	}, [
		videos,
		activeVideo,
		requestedStreamVideoId,
		videosQuery.isLoading,
		videosQuery.isError,
	]);

	const handlePlayIntent = (video: PublicVideoRecord) => {
		void warmupVideoPlaybackIntent(video.streamVideoId);
	};

	const handlePlay = (video: PublicVideoRecord) => {
		if (video.streamVideoId === requestedStreamVideoId) return;
		writeStreamVideoIdToUrl(video.streamVideoId);
		setRequestedStreamVideoId(video.streamVideoId);
		if (typeof window !== "undefined") {
			window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
		}
	};

	return (
		<div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8">
			{videosQuery.isLoading ? (
				<div className="space-y-4">
					<div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-card/70">
						<div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,rgba(166,124,82,0.14),rgba(255,252,247,0.7),rgba(166,124,82,0.14))]" />
					</div>
					<div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
						正在加载视频...
					</div>
				</div>
			) : null}

			{videosQuery.isError ? (
				<div className="space-y-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-6 text-sm text-rose-800">
					<p>加载失败：{readErrorMessage(videosQuery.error)}</p>
					<Button type="button" variant="outline" onClick={() => videosQuery.refetch()}>
						重试加载
					</Button>
				</div>
			) : null}

			{!videosQuery.isLoading && !videosQuery.isError && videos.length === 0 ? (
				<div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
					暂无已发布视频。
				</div>
			) : null}

			{!videosQuery.isLoading && !videosQuery.isError && videos.length > 0 && activeVideo ? (
				<section className="space-y-4" aria-live="polite">
					<div className="space-y-1">
						<h1 className="text-2xl font-semibold tracking-tight text-foreground">
							{activeVideo.title}
						</h1>
					</div>
					<div className="relative aspect-video w-full overflow-hidden rounded-[16px] border border-black/5 bg-black/5">
						<Stream
							key={activeVideo.streamVideoId}
							src={activeVideo.streamVideoId}
							controls
							autoplay
							muted={false}
							loop={false}
							preload="metadata"
							responsive={false}
							width="100%"
							height="100%"
							className="h-full w-full"
							poster={activeVideo.posterUrl ?? undefined}
						/>
					</div>
					<PublicVideoGrid
						videos={videos}
						activeStreamVideoId={activeVideo.streamVideoId}
						onPlay={handlePlay}
						onPlayIntent={handlePlayIntent}
					/>
				</section>
			) : null}
			<MobileShareFab />
		</div>
	);
}
