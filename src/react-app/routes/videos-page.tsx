import { useEffect, useMemo, useState } from "react";
import { Stream } from "@cloudflare/stream-react";
import { Menu, X } from "lucide-react";
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
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
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

	useEffect(() => {
		if (!mobileNavOpen) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [mobileNavOpen]);

	useEffect(() => {
		if (!mobileNavOpen) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			event.preventDefault();
			setMobileNavOpen(false);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [mobileNavOpen]);

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

	const closeMobileNav = () => {
		setMobileNavOpen(false);
	};

	return (
		<div className="w-full pb-8">
			<header className="sticky top-0 z-40">
				<div className="mx-auto flex w-full items-center justify-between gap-3 border-b border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.85)] px-4 py-2 backdrop-blur-md">
					<a href="/" className="flex min-w-0 items-center gap-3">
						<img
							src="/images/logo.jpg"
							alt="童蒙家塾 logo"
							className="h-14 w-auto rounded-md bg-card p-1"
						/>
					</a>

					<div className="flex flex-1 items-center justify-end gap-2">
						<nav className="hidden items-center gap-1 lg:flex" aria-label="主导航">
							{homeData.siteNavigation.map((item) => (
								<a
									key={item.sectionId}
									href={`/#${item.sectionId}`}
									className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-[color:rgba(166,124,82,0.12)] hover:text-foreground"
								>
									{item.label}
								</a>
							))}
						</nav>
						<button
							type="button"
							className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:rgba(166,124,82,0.3)] bg-[color:rgba(255,252,247,0.95)] text-muted-foreground transition-colors duration-200 hover:bg-[color:rgba(243,236,227,0.92)] hover:text-foreground lg:hidden"
							aria-controls="video-mobile-nav-drawer"
							aria-expanded={mobileNavOpen}
							aria-label={mobileNavOpen ? "关闭移动端导航菜单" : "打开移动端导航菜单"}
							onClick={() => setMobileNavOpen((prev) => !prev)}
						>
							{mobileNavOpen ? (
								<X aria-hidden="true" className="h-4 w-4" />
							) : (
								<Menu aria-hidden="true" className="h-4 w-4" />
							)}
						</button>
					</div>
				</div>
			</header>

			{mobileNavOpen ? (
				<div className="fixed inset-0 z-50 lg:hidden">
					<button
						type="button"
						aria-label="关闭移动端导航菜单"
						className="absolute inset-0 bg-black/35"
						onClick={closeMobileNav}
					/>
					<div
						id="video-mobile-nav-drawer"
						role="dialog"
						aria-modal="true"
						aria-label="移动端导航抽屉"
						className="absolute inset-x-0 top-0 border-b border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.97)] p-4 shadow-xl backdrop-blur-md"
					>
						<nav className="flex flex-col gap-2" aria-label="移动端快捷导航">
							{homeData.siteNavigation.map((item) => (
								<a
									key={`video-mobile-drawer-${item.sectionId}`}
									href={`/#${item.sectionId}`}
									onClick={closeMobileNav}
									className="w-full rounded-full bg-[color:rgba(243,236,227,0.9)] px-4 py-2 text-left text-sm text-muted-foreground transition-colors duration-200 hover:bg-[color:rgba(212,184,133,0.3)] hover:text-foreground"
								>
									{item.label}
								</a>
							))}
						</nav>
					</div>
				</div>
			) : null}

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
				<section
					className="mx-auto w-full max-w-[1380px] space-y-4 px-3 sm:px-4 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)] lg:items-start lg:gap-5 lg:space-y-0"
					aria-live="polite"
					data-testid="video-watch-page"
				>
					<div
						className="sticky top-[4.5rem] z-30 space-y-2 bg-[color:rgba(255,252,247,0.96)] pt-2 shadow-[0_10px_24px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:pt-3"
						data-testid="video-watch-sticky-player-shell"
					>
						<div className="space-y-1">
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

					<div className="space-y-4 lg:max-h-[calc(100dvh-5.25rem)] lg:overflow-y-auto lg:pr-1">
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
