import { useEffect, useMemo, useState } from "react";
import { Stream } from "@cloudflare/stream-react";
import { useQuery } from "@tanstack/react-query";
import { PublicVideoGrid } from "@/components/video/public/public-video-grid";
import { useAppI18n } from "@/i18n/context";
import { homeContentQueryOptions } from "@/lib/query-options";
import { Button } from "@/components/ui/button";
import type { PublicVideoRecord } from "@/lib/api";
import { publicVideosQueryOptions } from "@/lib/query-options";
import { resolveVideoWatchCollections } from "@/lib/video-watch-collections";
import { warmupVideoPlaybackIntent } from "@/lib/video-player-warmup";
import {
	readStreamVideoIdFromSearch,
	resolveActivePublicVideo,
	shouldReplaceWatchRouteQuery,
	VIDEO_QUERY_KEY,
} from "@/lib/video-watch-route";
import { getHomePageData } from "./home-page.data";

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

const EMPTY_PUBLIC_VIDEOS: PublicVideoRecord[] = [];

const readRequestedStreamVideoId = () => {
	if (typeof window === "undefined") return null;
	return readStreamVideoIdFromSearch(window.location.search);
};

const writeStreamVideoIdToUrl = (
	streamVideoId: string | null,
	options?: { replace?: boolean },
) => {
	if (typeof window === "undefined") return;
	const nextUrl = new URL(window.location.href);
	if (streamVideoId) {
		nextUrl.searchParams.set(VIDEO_QUERY_KEY, streamVideoId);
	} else {
		nextUrl.searchParams.delete(VIDEO_QUERY_KEY);
	}
	const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
	if (options?.replace) {
		window.history.replaceState(window.history.state, "", nextPath);
		return;
	}
	window.history.pushState(window.history.state, "", nextPath);
};

export function VideosPage() {
	const { locale } = useAppI18n();
	const homeData = getHomePageData(locale);
	const videosQuery = useQuery(publicVideosQueryOptions());
	const homeContentQuery = useQuery(homeContentQueryOptions(locale));
	const homeContent = homeContentQuery.data ?? homeData.defaultHomeContent;
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
	const collections = useMemo(
		() =>
			resolveVideoWatchCollections({
				videos,
				featuredVideos: homeContent.featuredVideos,
				locale,
			}),
		[videos, homeContent.featuredVideos, locale],
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
	};

	return (
		<div className="w-full pb-8">
			{videosQuery.isLoading ? (
				<div className="mx-auto w-full max-w-[1200px] space-y-4 px-4 pt-6">
					<div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-card/70">
						<div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,rgba(166,124,82,0.14),rgba(255,252,247,0.7),rgba(166,124,82,0.14))]" />
					</div>
					<div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
						正在加载视频...
					</div>
				</div>
			) : null}

			{videosQuery.isError ? (
				<div className="mx-auto mt-6 w-full max-w-[1200px] space-y-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-6 text-sm text-rose-800">
					<p>加载失败：{readErrorMessage(videosQuery.error)}</p>
					<Button type="button" variant="outline" onClick={() => videosQuery.refetch()}>
						重试加载
					</Button>
				</div>
			) : null}

			{!videosQuery.isLoading && !videosQuery.isError && videos.length === 0 ? (
				<div className="mx-auto mt-6 w-full max-w-[1200px] rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
					暂无已发布视频。
				</div>
			) : null}

			{!videosQuery.isLoading && !videosQuery.isError && videos.length > 0 && activeVideo ? (
				<section className="space-y-4" aria-live="polite" data-testid="video-watch-page">
					<div
						className="sticky top-0 z-30 space-y-2 bg-[color:rgba(255,252,247,0.96)] pt-2 shadow-[0_10px_24px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:pt-3"
						data-testid="video-watch-sticky-player-shell"
					>
						<div className="space-y-1 px-3 sm:px-4">
							<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
								{activeVideo.title}
							</h1>
						</div>
						<div className="relative aspect-video w-full overflow-hidden bg-black/5">
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
					</div>

					<div className="mx-auto w-full max-w-[1080px] space-y-4 px-3 sm:px-4">
						{collections.map((collection) => (
							<section
								key={collection.key}
								className="space-y-2"
								data-testid={`video-watch-collection-${collection.key}`}
							>
								<h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
									{collection.title}
								</h2>
								<PublicVideoGrid
									videos={collection.videos}
									activeStreamVideoId={activeVideo.streamVideoId}
									onPlay={handlePlay}
									onPlayIntent={handlePlayIntent}
									compact
								/>
							</section>
						))}
					</div>
				</section>
			) : null}
		</div>
	);
}
