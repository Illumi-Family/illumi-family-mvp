import { useEffect, useState } from "react";
import { Stream } from "@cloudflare/stream-react";
import { Button } from "@/components/ui/button";
import {
	beginVideoPlaybackMetricSession,
	markVideoPlaybackMetric,
	type VideoPlaybackStartupKind,
} from "@/lib/video-playback-metrics";
import {
	getVideoPlayerOverlayMode,
	reduceVideoPlayerStartupPhase,
	type VideoPlayerStartupPhase,
} from "./video-player-modal-state";

type VideoPlayerModalProps = {
	open: boolean;
	onClose: () => void;
	streamVideoId: string | null;
	posterUrl?: string | null;
	videoTitle?: string | null;
	startupKind?: VideoPlaybackStartupKind;
};

type VideoPlayerSessionProps = {
	streamVideoId: string | null;
	posterUrl: string | null;
	displayTitle: string;
	onClose: () => void;
	startupKind: VideoPlaybackStartupKind;
};

function VideoPlayerSession(props: VideoPlayerSessionProps) {
	const { streamVideoId, posterUrl, displayTitle, onClose, startupKind } = props;
	const [startupPhase, setStartupPhase] = useState<VideoPlayerStartupPhase>(
		streamVideoId ? "loading" : "error",
	);
	const [playerSession, setPlayerSession] = useState(0);
	const [metricSessionId, setMetricSessionId] = useState(() =>
		beginVideoPlaybackMetricSession({
			streamVideoId,
			startupKind,
			surface: "video-modal",
		}),
	);

	useEffect(() => {
		if (streamVideoId) return;
		void markVideoPlaybackMetric(metricSessionId, "error");
	}, [streamVideoId, metricSessionId]);

	const overlayMode = getVideoPlayerOverlayMode(startupPhase);

	const handleRetry = () => {
		if (!streamVideoId) {
			setStartupPhase("error");
			void markVideoPlaybackMetric(metricSessionId, "error");
			return;
		}

		setStartupPhase((phase) => reduceVideoPlayerStartupPhase(phase, "retry"));
		const retrySessionId = beginVideoPlaybackMetricSession({
			streamVideoId,
			startupKind,
			surface: "video-modal",
		});
		setMetricSessionId(retrySessionId);
		setPlayerSession((value) => value + 1);
	};

	return (
		<>
			{streamVideoId ? (
				<Stream
					key={`${streamVideoId}-${playerSession}`}
					src={streamVideoId}
					controls
					autoplay
					preload="metadata"
					responsive={false}
					width="100%"
					height="100%"
					className="h-full w-full"
					poster={posterUrl ?? undefined}
					onLoadStart={() => {
						setStartupPhase((phase) =>
							reduceVideoPlayerStartupPhase(phase, "loadstart"),
						);
					}}
					onLoadedData={() => {
						setStartupPhase((phase) =>
							reduceVideoPlayerStartupPhase(phase, "loadeddata"),
						);
						void markVideoPlaybackMetric(metricSessionId, "loadeddata");
					}}
					onPlaying={() => {
						setStartupPhase((phase) =>
							reduceVideoPlayerStartupPhase(phase, "playing"),
						);
						void markVideoPlaybackMetric(metricSessionId, "playing");
					}}
					onError={() => {
						setStartupPhase((phase) =>
							reduceVideoPlayerStartupPhase(phase, "error"),
						);
						void markVideoPlaybackMetric(metricSessionId, "error");
					}}
				/>
			) : null}

			<div
				className={`absolute inset-0 z-10 transition-opacity ease-out motion-reduce:transition-none ${
					overlayMode === "hidden"
						? "pointer-events-none opacity-0 duration-[280ms]"
						: "opacity-100 duration-[620ms]"
				}`}
			>
				{overlayMode === "loading" ? (
					<div
						data-testid="video-loading-aura"
						className="relative h-full w-full overflow-hidden bg-slate-950"
					>
						{posterUrl ? (
							<img
								data-testid="video-loading-poster"
								src={posterUrl}
								alt={`${displayTitle} 封面`}
								className="h-full w-full scale-[1.015] object-cover opacity-[0.9]"
							/>
						) : (
							<div
								data-testid="video-loading-ambience"
								className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(166,124,82,0.42),transparent_52%),radial-gradient(circle_at_82%_78%,rgba(96,120,148,0.3),transparent_48%),linear-gradient(140deg,rgba(30,31,38,0.96)_0%,rgba(23,24,33,0.92)_46%,rgba(13,14,21,0.96)_100%)]"
							/>
						)}
						<div className="video-aura-breathe absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.03)_43%,rgba(0,0,0,0)_74%)] motion-reduce:opacity-20" />
						<div className="video-aura-drift absolute inset-0 bg-[radial-gradient(circle_at_26%_18%,rgba(236,211,176,0.26)_0%,rgba(236,211,176,0)_52%),radial-gradient(circle_at_78%_82%,rgba(120,146,176,0.2)_0%,rgba(120,146,176,0)_46%)] motion-reduce:opacity-25" />
						<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.06)_0%,rgba(2,6,23,0.42)_70%,rgba(2,6,23,0.68)_100%)]" />
						<div className="absolute inset-0 shadow-[inset_0_0_130px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.07)]" />
						<div
							data-testid="video-loading-signal"
							className="pointer-events-none absolute inset-0 flex items-center justify-center"
						>
							<span className="video-loading-halo absolute h-16 w-16 rounded-full border border-white/45 shadow-[0_0_24px_rgba(248,244,236,0.28)]" />
							<span className="video-loading-halo-secondary absolute h-24 w-24 rounded-full border border-white/30 shadow-[0_0_34px_rgba(248,244,236,0.2)]" />
							<span className="video-loading-core absolute h-10 w-10 rounded-full border border-white/75 bg-white/20 shadow-[0_0_38px_rgba(248,244,236,0.5)] backdrop-blur-[1px]" />
						</div>
					</div>
				) : null}

				{overlayMode === "error" ? (
					<div className="flex h-full flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center text-white">
						<div className="space-y-1">
							<p className="text-base font-semibold">视频暂时不可用</p>
							<p className="text-xs text-white/75">加载失败，请重试或先关闭窗口。</p>
						</div>
						<div className="flex items-center gap-2">
							<Button type="button" variant="secondary" onClick={handleRetry}>
								重试
							</Button>
							<Button type="button" variant="outline" onClick={onClose}>
								关闭
							</Button>
						</div>
					</div>
				) : null}
			</div>
		</>
	);
}

export function VideoPlayerModal(props: VideoPlayerModalProps) {
	const {
		open,
		onClose,
		streamVideoId,
		posterUrl = null,
		videoTitle = null,
		startupKind = "cold",
	} = props;

	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [open, onClose]);

	if (!open) {
		return null;
	}

	const trimmedTitle = videoTitle?.trim();
	const displayTitle = trimmedTitle && trimmedTitle.length > 0 ? trimmedTitle : "视频";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={`${displayTitle} 播放器`}
				className="relative overflow-hidden rounded-xl bg-slate-950 shadow-2xl"
				style={{
					width: "min(80vw, calc(80dvh * 16 / 9))",
					aspectRatio: "16 / 9",
					maxWidth: "80vw",
					maxHeight: "80dvh",
				}}
				onClick={(event) => event.stopPropagation()}
			>
				<VideoPlayerSession
					key={`${streamVideoId ?? "missing"}-${startupKind}`}
					streamVideoId={streamVideoId}
					posterUrl={posterUrl}
					displayTitle={displayTitle}
					onClose={onClose}
					startupKind={startupKind}
				/>
			</div>
		</div>
	);
}
