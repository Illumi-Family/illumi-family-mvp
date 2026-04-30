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

			{!isLoading && !isError && items.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border/70 bg-background/70 px-4 py-5 text-sm text-muted-foreground">
					{t("home.familyStoriesEmpty")}
				</div>
			) : null}

			{!isLoading && !isError && items.length > 0 ? (
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
				</div>
			) : null}
		</section>
	);
}
