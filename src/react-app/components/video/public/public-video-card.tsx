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
	active?: boolean;
	compact?: boolean;
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
	const { video, onPlay, onPlayIntent, disabled = false, ariaLabel, active = false } =
		props;
	const compact = props.compact ?? false;
	const displayTitle = video.title.trim() || "未命名视频";
	const playable = !disabled;
	const resolvedAriaLabel =
		ariaLabel ??
		(playable ? `播放视频：${displayTitle}` : `视频暂不可播放：${displayTitle}`);

	return (
		<article
			data-active={active ? "true" : "false"}
			className={`group overflow-hidden rounded-[4px] border bg-card/95 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-0.5 ${
				active
					? "border-[color:var(--brand-primary)] ring-2 ring-[color:rgba(166,124,82,0.28)]"
					: "border-border/70"
			}`}
		>
			<button
				type="button"
				disabled={disabled}
				aria-current={active ? "true" : undefined}
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
				<div className={compact ? "flex items-center gap-2.5 p-2.5" : ""}>
					<div
						className={
							compact
								? "relative w-[132px] shrink-0 overflow-hidden rounded-[4px] bg-black"
								: "relative aspect-video overflow-hidden bg-black"
						}
					>
						<div className={compact ? "aspect-video" : ""}>
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

					<span
						className={
							compact
								? "absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white"
								: "absolute bottom-2 right-2 rounded-md bg-black/78 px-2 py-1 text-[11px] font-medium text-white"
						}
					>
						{formatDuration(video.durationSeconds)}
					</span>
					{playable ? (
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<span
								className={`inline-flex items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_12px_24px_-12px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-105 group-hover:bg-black/65 ${
									compact ? "h-11 w-11" : "h-14 w-14"
								}`}
							>
								<Play className={compact ? "size-5" : "size-6"} strokeWidth={1.8} />
							</span>
						</div>
					) : null}
						</div>
					</div>

					{compact ? (
						<div className="min-w-0 flex-1">
							<h2 className="line-clamp-2 text-sm font-semibold leading-5 tracking-tight text-foreground">
								{displayTitle}
							</h2>
						</div>
					) : null}
				</div>

				{compact ? null : (
					<div className="space-y-1 px-4 py-3">
						<h2 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground">
							{displayTitle}
						</h2>
					</div>
				)}
			</button>
		</article>
	);
}
