import { Play } from "lucide-react";
import type { PublicVideoRecord } from "@/lib/api";

type PublicVideoCardVideo = Pick<
	PublicVideoRecord,
	"title" | "posterUrl" | "durationSeconds"
>;

type PublicVideoCardProps = {
	video: PublicVideoCardVideo;
	onPlay: () => void;
	onPlayIntent?: () => void;
	disabled?: boolean;
	ariaLabel?: string;
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

export function PublicVideoCard(props: PublicVideoCardProps) {
	const { video, onPlay, onPlayIntent, disabled = false, ariaLabel } = props;
	const displayTitle = video.title.trim() || "未命名视频";
	const playable = !disabled;
	const resolvedAriaLabel =
		ariaLabel ??
		(playable ? `播放视频：${displayTitle}` : `视频暂不可播放：${displayTitle}`);

	return (
		<article className="group overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-0.5">
			<button
				type="button"
				disabled={disabled}
				aria-label={resolvedAriaLabel}
				className="w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0"
				onClick={() => {
					if (playable) {
						onPlay();
					}
				}}
				onMouseEnter={() => {
					if (playable) {
						onPlayIntent?.();
					}
				}}
				onFocus={() => {
					if (playable) {
						onPlayIntent?.();
					}
				}}
				onTouchStart={() => {
					if (playable) {
						onPlayIntent?.();
					}
				}}
			>
				<div className="relative aspect-video overflow-hidden bg-black">
					{video.posterUrl ? (
						<img
							src={video.posterUrl}
							alt={displayTitle}
							className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
						/>
					) : (
						<div className="flex h-full items-center justify-center text-xs text-white/70">
							暂无封面
						</div>
					)}

					<span className="absolute bottom-2 right-2 rounded-md bg-black/78 px-2 py-1 text-[11px] font-medium text-white">
						{formatDuration(video.durationSeconds)}
					</span>
					{playable ? (
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_12px_24px_-12px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-105 group-hover:bg-black/65">
								<Play className="size-6" strokeWidth={1.8} />
							</span>
						</div>
					) : null}
				</div>

				<div className="space-y-1 px-4 py-3">
					<h2 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground">
						{displayTitle}
					</h2>
				</div>
			</button>
		</article>
	);
}
