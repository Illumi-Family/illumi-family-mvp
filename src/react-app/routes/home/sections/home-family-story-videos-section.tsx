import { useTranslation } from "react-i18next";
import { PublicVideoCard } from "@/components/video/public/public-video-card";
import { Button } from "@/components/ui/button";
import type { ResolvedHomeFeaturedVideo } from "@/routes/home/home-featured-videos";
import type { HomeFamilyStoriesConfig } from "@/routes/home-page.data";
import { SectionHeading } from "@/routes/home/components/section-heading";

type HomeFamilyStoryVideosSectionProps = {
	config: HomeFamilyStoriesConfig;
	items: ResolvedHomeFeaturedVideo[];
	isLoading: boolean;
	isError: boolean;
	errorMessage: string | null;
	onRetry: () => void;
	onPlay: (item: ResolvedHomeFeaturedVideo) => void;
	onPlayIntent: (item: ResolvedHomeFeaturedVideo) => void;
};

const resolveMessage = (value: string | null) => {
	const trimmed = value?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : null;
};

export function HomeFamilyStoryVideosSection(props: HomeFamilyStoryVideosSectionProps) {
	const { t } = useTranslation("home");
	const { config, items, isLoading, isError, errorMessage, onRetry, onPlay, onPlayIntent } =
		props;

	return (
		<section id={config.sectionId} className="space-y-8 py-2" aria-live="polite">
			<SectionHeading
				label={config.label}
				title={config.title}
				description={config.description}
			/>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: Math.max(items.length, 3) }).map((_, index) => (
						<div
							key={`family-story-loading-${index}`}
							className="min-h-56 animate-pulse rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(243,236,227,0.66)]"
						/>
					))}
				</div>
			) : null}

			{isError ? (
				<div className="space-y-4 rounded-2xl border border-rose-300 bg-rose-50 px-5 py-6 text-rose-900">
					<p className="text-sm">
						{t("homeVideo.charactersError", {
							message: resolveMessage(errorMessage) ?? t("homeVideo.errorUnknown"),
						})}
					</p>
					<Button type="button" variant="outline" onClick={onRetry}>
						{t("homeVideo.retry")}
					</Button>
				</div>
			) : null}

			{!isLoading && !isError ? (
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
					{items.map((item) => {
						const playable = item.status === "ready" && Boolean(item.video);
						const video = {
							title: item.title,
							posterUrl: item.video?.posterUrl ?? null,
							durationSeconds: item.video?.durationSeconds ?? null,
						};

						return (
							<PublicVideoCard
								key={item.key}
								video={video}
								disabled={!playable}
								ariaLabel={
									playable
										? `${t("home.familyStoriesPlayAria")}${item.title}`
										: `${t("home.familyStoriesUnavailableAria")}${item.title}`
								}
								onPlay={() => onPlay(item)}
								onPlayIntent={() => onPlayIntent(item)}
							/>
						);
					})}
					<article
						data-testid="home-family-story-placeholder-card"
						aria-label={t("home.familyStoriesPlaceholder")}
						className="overflow-hidden rounded-[4px] border border-dashed border-border/70 bg-card/95 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)]"
					>
						<div className="relative aspect-video overflow-hidden bg-[color:rgba(243,236,227,0.66)]">
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
								<span
									aria-hidden="true"
									className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[color:rgba(166,124,82,0.28)] bg-white/80 text-[color:rgba(115,94,73,0.95)] shadow-[0_10px_20px_-12px_rgba(0,0,0,0.35)]"
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										className="h-7 w-7"
										data-testid="home-family-story-placeholder-icon"
									>
										<rect
											x="3.5"
											y="6.5"
											width="17"
											height="11"
											rx="2.5"
											stroke="currentColor"
											strokeWidth="1.6"
										/>
										<path
											d="M10.2 10.1L14.7 12L10.2 13.9V10.1Z"
											fill="currentColor"
										/>
										<path
											d="M7 4.8H17"
											stroke="currentColor"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
										<circle cx="7.5" cy="19.2" r="0.9" fill="currentColor" />
										<circle cx="16.5" cy="19.2" r="0.9" fill="currentColor" />
									</svg>
								</span>
								<p className="text-base font-semibold tracking-tight text-[color:rgba(86,78,70,0.95)]">
									{t("home.familyStoriesPlaceholder")}
								</p>
								<p className="text-xs font-medium tracking-[0.08em] text-[color:rgba(120,108,95,0.92)]">
									{t("home.familyStoriesPlaceholderHint")}
								</p>
							</div>
						</div>
					</article>
				</div>
			) : null}
		</section>
	);
}
