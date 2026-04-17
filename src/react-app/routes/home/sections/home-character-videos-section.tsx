import { useTranslation } from "react-i18next";
import { PublicVideoCard } from "@/components/video/public/public-video-card";
import { Button } from "@/components/ui/button";
import type { ResolvedHomeFeaturedVideo } from "@/routes/home/home-featured-videos";

type HomeCharacterVideosSectionProps = {
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

export function HomeCharacterVideosSection(props: HomeCharacterVideosSectionProps) {
	const { items, isLoading, isError, errorMessage, onRetry, onPlay, onPlayIntent } = props;
	const { t } = useTranslation("home");

	return (
		<section id="home-character-videos" className="space-y-6 py-2" aria-live="polite">
			<div className="space-y-2">
				<p className="text-xs uppercase tracking-[0.14em] text-[color:var(--brand-primary)]">
					{t("homeVideo.charactersLabel")}
				</p>
				{/* <h2 className="font-brand text-3xl leading-tight text-foreground md:text-4xl">
					{t("homeVideo.charactersTitle")}
				</h2>
				<p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
					{t("homeVideo.charactersDescription")}
				</p> */}
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: Math.max(items.length, 3) }).map((_, index) => (
						<div
							key={`loading-${index}`}
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
										? `播放视频：${item.title}`
										: `角色视频待配置：${item.title}`
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
