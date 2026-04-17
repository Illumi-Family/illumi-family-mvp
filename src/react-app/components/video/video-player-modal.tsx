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
				className={`absolute inset-0 transition-opacity duration-300 ${
					overlayMode === "hidden" ? "pointer-events-none opacity-0" : "opacity-100"
				}`}
			>
				{overlayMode === "loading" ? (
					<div className="relative h-full w-full">
						{posterUrl ? (
							<img
								src={posterUrl}
								alt={`${displayTitle} 封面`}
								className="h-full w-full object-cover opacity-90"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
								<p className="text-sm text-white/75">封面准备中</p>
							</div>
						)}
						<div className="absolute inset-0 bg-black/45" />
						<div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-4 py-3 text-sm text-white">
							<p className="font-medium">正在加载视频</p>
							<p className="text-xs text-white/80">请稍候...</p>
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
