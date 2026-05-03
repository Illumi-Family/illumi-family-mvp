import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getHomePageData } from "@/routes/home-page.data";
import { useAppI18n } from "@/i18n/context";
import {
	homeContentQueryOptions,
	publicVideosQueryOptions,
} from "@/lib/query-options";
import { buildPublicVideoWatchHref } from "@/lib/video-watch-route";
import {
	scheduleVideoPlayerSdkWarmup,
	warmupVideoPlaybackIntent,
} from "@/lib/video-player-warmup";
import { FooterSection } from "@/routes/home/sections/footer-section";
import { HomeCharacterVideosSection } from "@/routes/home/sections/home-character-videos-section";
import { HomeContentMatrixSection } from "@/routes/home/sections/home-content-matrix-section";
import { HomeFamilyStoryVideosSection } from "@/routes/home/sections/home-family-story-videos-section";
import { HomeMainVideoSection } from "@/routes/home/sections/home-main-video-section";
import { HomeOriginSection } from "@/routes/home/sections/home-origin-section";
import { HomeBusinessContactSection } from "@/routes/home/sections/home-business-contact-section";
import {
	resolveConfiguredVideoList,
	resolveHomeFeaturedVideos,
	type ResolvedHomeFeaturedVideo,
} from "@/routes/home/home-featured-videos";
import {
	handleMobileNavSelection,
	scheduleHomeEntryScrollReset,
} from "./home-page.scroll";

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

export function HomePage() {
	const { t } = useTranslation("home");
	const { locale } = useAppI18n();
	const homeData = getHomePageData(locale);
	const homeContentQuery = useQuery(homeContentQueryOptions(locale));
	const publicVideosQuery = useQuery(publicVideosQueryOptions());
	const homeContent = homeContentQuery.data ?? homeData.defaultHomeContent;
	const videos = publicVideosQuery.data ?? [];
	const featuredVideos = resolveHomeFeaturedVideos(
		videos,
		homeContent.featuredVideos,
		locale,
	);
	const familyStoryVideos = resolveConfiguredVideoList(
		videos,
		homeContent.featuredVideos.familyStories.items.map((item) => item.streamVideoId),
		{
			locale,
			keyPrefix: "family-story",
			roleLabelPrefixZh: "家庭故事",
			roleLabelPrefixEn: "Family Story",
			titlePrefixZh: "家庭故事视频",
			titlePrefixEn: "Family Story Video",
		},
	);
	const showFallbackHint = homeContentQuery.isError;
	const [mobileNavOpen, setMobileNavOpen] = useState(false);

	useEffect(() => {
		void scheduleVideoPlayerSdkWarmup();
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const frameId = scheduleHomeEntryScrollReset({
			requestAnimationFrame: window.requestAnimationFrame.bind(window),
			scrollTo: window.scrollTo.bind(window),
		});
		return () => {
			if (frameId !== null) {
				window.cancelAnimationFrame(frameId);
			}
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

	const handleCharacterVideoPlayIntent = (item: ResolvedHomeFeaturedVideo) => {
		if (!item.video) return;
		void warmupVideoPlaybackIntent(item.video.streamVideoId);
	};

	const handleCharacterVideoPlay = (item: ResolvedHomeFeaturedVideo) => {
		if (!item.video) return;
		if (typeof window === "undefined") return;
		window.location.assign(buildPublicVideoWatchHref(item.video.streamVideoId));
	};

	const publicVideoErrorMessage = readErrorMessage(publicVideosQuery.error);
	const scrollToSection = (sectionId: string) => {
		if (typeof document === "undefined") return;
		const section = document.getElementById(sectionId);
		section?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const closeMobileNav = () => {
		setMobileNavOpen(false);
	};

	const handleMobileNavSelect = (sectionId: string) => {
		handleMobileNavSelection(sectionId, {
			closeDrawer: closeMobileNav,
			onScrollToSection: scrollToSection,
			requestAnimationFrame:
				typeof window !== "undefined"
					? window.requestAnimationFrame.bind(window)
					: undefined,
		});
	};

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
							className="h-14 w-auto rounded-md bg-card p-1"
						/>
						{/* <div className="min-w-0">
							<p className="truncate text-xs text-muted-foreground">
								{homeData.siteMeta.brandSubtitle}
							</p>
						</div> */}
					</a>

					<div className="flex flex-1 items-center justify-end gap-2">
						<nav
							className="hidden items-center gap-1 lg:flex"
							aria-label={t("navigation.mainAriaLabel")}
						>
							{homeData.siteNavigation.map((item) => (
								<button
									key={item.sectionId}
									type="button"
									onClick={() => scrollToSection(item.sectionId)}
									className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-[color:rgba(166,124,82,0.12)] hover:text-foreground"
								>
									{item.label}
								</button>
							))}
						</nav>
						<button
							type="button"
							className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:rgba(166,124,82,0.3)] bg-[color:rgba(255,252,247,0.95)] text-muted-foreground transition-colors duration-200 hover:bg-[color:rgba(243,236,227,0.92)] hover:text-foreground lg:hidden"
							aria-controls="home-mobile-nav-drawer"
							aria-expanded={mobileNavOpen}
							aria-label={t(
								mobileNavOpen
									? "navigation.mobileMenuCloseAriaLabel"
									: "navigation.mobileMenuOpenAriaLabel",
							)}
							onClick={() => setMobileNavOpen((prev) => !prev)}
						>
							{mobileNavOpen ? (
								<X aria-hidden="true" className="h-4 w-4" />
							) : (
								<Menu aria-hidden="true" className="h-4 w-4" />
							)}
						</button>
						{/* <a
							href={homeData.siteMeta.headerCta.href}
							className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-[color:rgba(166,124,82,0.92)]"
						>
							{homeData.siteMeta.headerCta.label}
						</a> */}
					</div>
				</div>
			</header>

			{mobileNavOpen ? (
				<div className="fixed inset-0 z-50 lg:hidden">
					<button
						type="button"
						aria-label={t("navigation.mobileMenuCloseAriaLabel")}
						className="absolute inset-0 bg-black/35"
						onClick={closeMobileNav}
					/>
					<div
						id="home-mobile-nav-drawer"
						role="dialog"
						aria-modal="true"
						aria-label={t("navigation.mobileDrawerAriaLabel")}
						className="absolute inset-x-0 top-0 border-b border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.97)] p-4 shadow-xl backdrop-blur-md"
					>
						<nav
							className="flex flex-col gap-2"
							aria-label={t("navigation.mobileAriaLabel")}
						>
							{homeData.siteNavigation.map((item) => (
								<button
									key={`mobile-drawer-${item.sectionId}`}
									type="button"
									onClick={() => handleMobileNavSelect(item.sectionId)}
									className="w-full rounded-full bg-[color:rgba(243,236,227,0.9)] px-4 py-2 text-left text-sm text-muted-foreground transition-colors duration-200 hover:bg-[color:rgba(212,184,133,0.3)] hover:text-foreground"
								>
									{item.label}
								</button>
							))}
						</nav>
					</div>
				</div>
			) : null}

			<main id="main-content" className="w-full pb-20">
				<div className="">
					<HomeMainVideoSection
						video={featuredVideos.main}
						isLoading={publicVideosQuery.isLoading}
						isError={publicVideosQuery.isError}
						errorMessage={publicVideoErrorMessage}
						onRetry={() => void publicVideosQuery.refetch()}
					/>
				</div>
				<div className="mx-auto w-full max-w-7xl space-y-10 px-4 pt-8 md:px-8">
					{showFallbackHint ? (
						<div className="rounded-2xl border border-[color:rgba(166,124,82,0.22)] bg-[color:rgba(255,252,247,0.82)] px-4 py-3 text-sm text-muted-foreground">
							{t("fallbackNotice")}
						</div>
					) : null}
					<HomeOriginSection content={homeData.homeOriginContent} />
					<HomeCharacterVideosSection
						items={featuredVideos.characters}
						isLoading={publicVideosQuery.isLoading}
						isError={publicVideosQuery.isError}
						errorMessage={publicVideoErrorMessage}
						onRetry={() => void publicVideosQuery.refetch()}
						onPlay={handleCharacterVideoPlay}
						onPlayIntent={handleCharacterVideoPlayIntent}
					/>
					<HomeFamilyStoryVideosSection
						config={homeData.homeFamilyStoriesConfig}
						items={familyStoryVideos}
						isLoading={publicVideosQuery.isLoading}
						isError={publicVideosQuery.isError}
						errorMessage={publicVideoErrorMessage}
						onRetry={() => void publicVideosQuery.refetch()}
						onPlay={handleCharacterVideoPlay}
						onPlayIntent={handleCharacterVideoPlayIntent}
					/>
					<HomeContentMatrixSection content={homeData.homeContentMatrixContent} />
					<HomeBusinessContactSection content={homeData.homeBusinessContactContent} />
				</div>
			</main>

			<FooterSection content={homeData.footerContent} />
		</div>
	);
}
