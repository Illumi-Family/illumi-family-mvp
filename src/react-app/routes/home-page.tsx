import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getHomePageData } from "@/routes/home-page.data";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { useAppI18n } from "@/i18n/context";
import {
	homeContentQueryOptions,
	publicVideosQueryOptions,
} from "@/lib/query-options";
import { VideoPlayerModal } from "@/components/video/video-player-modal";
import type { VideoPlaybackStartupKind } from "@/lib/video-playback-metrics";
import {
	hasVideoPlaybackWarmupHit,
	scheduleVideoPlayerSdkWarmup,
	warmupVideoPlaybackIntent,
} from "@/lib/video-player-warmup";
import { AboutSection } from "@/routes/home/sections/about-section";
import { ColearningSection } from "@/routes/home/sections/colearning-section";
import { DailyNotesSection } from "@/routes/home/sections/daily-notes-section";
import { FooterSection } from "@/routes/home/sections/footer-section";
import { HeroSection } from "@/routes/home/sections/hero-section";
import { HomeCharacterVideosSection } from "@/routes/home/sections/home-character-videos-section";
import { HomeMainVideoSection } from "@/routes/home/sections/home-main-video-section";
import { PhilosophySection } from "@/routes/home/sections/philosophy-section";
import { StoriesSection } from "@/routes/home/sections/stories-section";
import {
	resolveHomeFeaturedVideos,
	type ResolvedHomeFeaturedVideo,
} from "@/routes/home/home-featured-videos";
import { scheduleHomeEntryScrollReset } from "./home-page.scroll";

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

export function HomePage() {
	const { t } = useTranslation("home");
	const { locale } = useAppI18n();
	const homeData = getHomePageData(locale);
	const homeContentQuery = useQuery(homeContentQueryOptions(locale));
	const publicVideosQuery = useQuery(publicVideosQueryOptions());
	const homeContent = homeContentQuery.data ?? homeData.defaultHomeContent;
	const heroTitle = homeContent.heroSlogan.title.trim() || homeData.heroContent.title;
	const heroSubtitle =
		homeContent.heroSlogan.subtitle.trim() || homeData.heroContent.subtitle;
	const featuredVideos = resolveHomeFeaturedVideos(
		publicVideosQuery.data ?? [],
		homeContent.featuredVideos,
		locale,
	);
	const showFallbackHint = homeContentQuery.isError;
	const [selectedVideo, setSelectedVideo] =
		useState<ResolvedHomeFeaturedVideo | null>(null);
	const [selectedStartupKind, setSelectedStartupKind] =
		useState<VideoPlaybackStartupKind>("cold");

	useEffect(() => {
		void scheduleVideoPlayerSdkWarmup();
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const frameId = scheduleHomeEntryScrollReset({
			hash: window.location.hash,
			requestAnimationFrame: window.requestAnimationFrame.bind(window),
			scrollTo: window.scrollTo.bind(window),
		});
		return () => {
			if (frameId !== null) {
				window.cancelAnimationFrame(frameId);
			}
		};
	}, []);

	const handleCharacterVideoPlayIntent = (item: ResolvedHomeFeaturedVideo) => {
		if (!item.video) return;
		void warmupVideoPlaybackIntent(item.video.streamVideoId);
	};

	const handleCharacterVideoPlay = (item: ResolvedHomeFeaturedVideo) => {
		if (!item.video) return;
		setSelectedStartupKind(
			hasVideoPlaybackWarmupHit(item.video.streamVideoId) ? "warm" : "cold",
		);
		setSelectedVideo(item);
	};

	const handleCloseModal = () => {
		setSelectedVideo(null);
		setSelectedStartupKind("cold");
	};

	const publicVideoErrorMessage = readErrorMessage(publicVideosQuery.error);

	return (
		<div className="relative isolate min-h-[100dvh] overflow-x-clip">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(212,184,133,0.16),transparent_45%),radial-gradient(circle_at_90%_8%,rgba(166,124,82,0.12),transparent_38%)]"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(180deg,rgba(255,252,247,0.9),transparent)]"
			/>

			<header className="sticky top-0 z-40">
				<div className="mx-auto flex w-full items-center justify-between gap-3 border-b border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.85)] px-4 py-2 backdrop-blur-md">
					<a href="/" className="flex min-w-0 items-center gap-3">
						<img
							src="/images/logo.jpg"
							alt="童蒙家塾 logo"
							className="h-12 w-auto rounded-md bg-card p-1"
						/>
						{/* <div className="min-w-0">
							<p className="truncate text-xs text-muted-foreground">
								{homeData.siteMeta.brandSubtitle}
							</p>
						</div> */}
					</a>

					<nav
						className="hidden items-center gap-1 lg:flex"
						aria-label={t("navigation.mainAriaLabel")}
					>
						{homeData.siteNavigation.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-[color:rgba(166,124,82,0.12)] hover:text-foreground"
							>
								{item.label}
							</a>
						))}
					</nav>

					<div className="flex items-center gap-2">
						<LanguageSwitcher className="hidden items-center gap-2 md:flex" />
						{/* <a
							href={homeData.siteMeta.headerCta.href}
							className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-[color:rgba(166,124,82,0.92)]"
						>
							{homeData.siteMeta.headerCta.label}
						</a> */}
					</div>
				</div>

				<nav
					className="mx-auto mt-2 flex w-full max-w-7xl gap-2 overflow-x-auto rounded-xl border border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.88)] px-3 py-2 lg:hidden"
					aria-label={t("navigation.mobileAriaLabel")}
				>
					{homeData.siteNavigation.map((item) => (
						<a
							key={`mobile-${item.href}`}
							href={item.href}
							className="whitespace-nowrap rounded-full bg-[color:rgba(243,236,227,0.9)] px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:bg-[color:rgba(212,184,133,0.3)] hover:text-foreground"
						>
							{item.label}
						</a>
					))}
					<LanguageSwitcher className="ml-auto flex items-center gap-2 md:hidden" />
				</nav>
			</header>

			<main
				id="main-content"
				className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-20 pt-4 md:px-8 md:pt-6"
			>
				{showFallbackHint ? (
					<div className="rounded-2xl border border-[color:rgba(166,124,82,0.22)] bg-[color:rgba(255,252,247,0.82)] px-4 py-3 text-sm text-muted-foreground">
						{t("fallbackNotice")}
					</div>
				) : null}
				<HeroSection
					title={heroTitle}
					subtitle={heroSubtitle}
					descriptionLines={homeData.heroContent.descriptionLines}
				/>
				<HomeMainVideoSection
					video={featuredVideos.main}
					isLoading={publicVideosQuery.isLoading}
					isError={publicVideosQuery.isError}
					errorMessage={publicVideoErrorMessage}
					onRetry={() => void publicVideosQuery.refetch()}
				/>
				<HomeCharacterVideosSection
					items={featuredVideos.characters}
					isLoading={publicVideosQuery.isLoading}
					isError={publicVideosQuery.isError}
					errorMessage={publicVideoErrorMessage}
					onRetry={() => void publicVideosQuery.refetch()}
					onPlay={handleCharacterVideoPlay}
					onPlayIntent={handleCharacterVideoPlayIntent}
				/>
				<PhilosophySection
					intro={homeContent.philosophy.intro}
					items={homeContent.philosophy.items}
				/>
				<DailyNotesSection items={homeContent.dailyNotes.items} />
				<StoriesSection items={homeContent.stories.items} />
				<ColearningSection
					intro={homeContent.colearning.intro}
					methods={homeContent.colearning.methods}
					benefits={homeContent.colearning.benefits}
					caseHighlight={homeContent.colearning.caseHighlight}
				/>
				<AboutSection content={homeData.aboutContent} />
			</main>

			<VideoPlayerModal
				open={Boolean(selectedVideo)}
				onClose={handleCloseModal}
				streamVideoId={selectedVideo?.video?.streamVideoId ?? null}
				posterUrl={selectedVideo?.video?.posterUrl ?? null}
				videoTitle={selectedVideo?.title ?? null}
				startupKind={selectedStartupKind}
			/>
			<FooterSection content={homeData.footerContent} />
		</div>
	);
}
