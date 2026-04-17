import { Play } from "lucide-react";
import { useTranslation } from "react-i18next";
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

const formatDuration = (seconds: number | null) => {
	if (seconds === null || Number.isNaN(seconds)) return "--:--";
	const safe = Math.max(0, Math.floor(seconds));
	const hours = Math.floor(safe / 3600);
	const minutes = Math.floor((safe % 3600) / 60);
	const remain = safe % 60;
	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
	}
	return `${minutes}:${String(remain).padStart(2, "0")}`;
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
				<h2 className="font-brand text-3xl leading-tight text-foreground md:text-4xl">
					{t("homeVideo.charactersTitle")}
				</h2>
				<p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
					{t("homeVideo.charactersDescription")}
				</p>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 6 }).map((_, index) => (
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
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{items.map((item) => {
						const playable = item.status === "ready" && Boolean(item.video);
						const mediaLabel = playable
							? `${t("homeVideo.durationPrefix")} ${formatDuration(item.video?.durationSeconds ?? null)}`
							: t("homeVideo.streamIdMissing");

						return (
							<article
								key={item.key}
								className="overflow-hidden rounded-2xl border border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.9)] shadow-[0_20px_34px_-28px_rgba(62,46,30,0.45)]"
							>
								<button
									type="button"
									disabled={!playable}
									aria-label={
										playable
											? `播放角色视频：${item.title}`
											: `角色视频待配置：${item.title}`
									}
									className="group w-full text-left disabled:cursor-not-allowed"
									onClick={() => {
										if (playable) {
											onPlay(item);
										}
									}}
									onMouseEnter={() => {
										if (playable) {
											onPlayIntent(item);
										}
									}}
									onFocus={() => {
										if (playable) {
											onPlayIntent(item);
										}
									}}
									onTouchStart={() => {
										if (playable) {
											onPlayIntent(item);
										}
									}}
								>
									<div className="relative aspect-[16/9] overflow-hidden bg-[#1b1714]">
										{playable && item.video?.posterUrl ? (
											<img
												src={item.video.posterUrl}
												alt={item.title}
												className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center text-xs text-white/70">
												{item.title}
											</div>
										)}
										<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.44)_100%)]" />
										<span className="absolute left-3 top-3 rounded-full border border-white/30 bg-black/42 px-2.5 py-1 text-[11px] text-white">
											{item.roleLabel}
										</span>
										<span className="absolute bottom-3 right-3 rounded-md bg-black/78 px-2 py-1 text-[11px] text-white">
											{mediaLabel}
										</span>
									</div>
									<div className="space-y-2 px-4 py-4">
										<h3 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground md:text-lg">
											{item.title}
										</h3>
										<div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
											{playable ? (
												<Play className="size-3.5" strokeWidth={1.8} />
											) : null}
											<span>
												{playable
													? t("homeVideo.cardPlay")
													: t("homeVideo.cardUnavailable")}
											</span>
										</div>
									</div>
								</button>
							</article>
						);
					})}
				</div>
			) : null}
		</section>
	);
}
