import { useEffect, useRef, useState } from "react";
import { Stream, type StreamPlayerApi } from "@cloudflare/stream-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { ResolvedHomeFeaturedVideo } from "@/routes/home/home-featured-videos";

type HomeMainVideoSectionProps = {
	video: ResolvedHomeFeaturedVideo;
	isLoading: boolean;
	isError: boolean;
	errorMessage: string | null;
	onRetry: () => void;
};

type MainVideoStartupPhase = "loading" | "ready" | "error";

type MainVideoPlayerProps = {
	streamVideoId: string;
	posterUrl: string | null;
	onRetry: () => void;
	loadingHint: string;
	errorTitle: string;
	errorHint: string;
	retryLabel: string;
};

const resolveMessage = (value: string | null) => {
	const trimmed = value?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : null;
};

function MainVideoPlayer(props: MainVideoPlayerProps) {
	const {
		streamVideoId,
		posterUrl,
		onRetry,
		loadingHint,
		errorTitle,
		errorHint,
		retryLabel,
	} = props;
	const streamRef = useRef<StreamPlayerApi | undefined>(undefined);
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const [startupPhase, setStartupPhase] = useState<MainVideoStartupPhase>("loading");

	useEffect(() => {
		if (typeof IntersectionObserver !== "function") return;
		const node = viewportRef.current;
		if (!node) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				const player = streamRef.current;
				if (!entry || !player) {
					return;
				}

				if (entry.isIntersecting) {
					if (player.paused) {
						void player.play().catch(() => {
							// ignore autoplay policy failures; overlay already provides fallback
						});
					}
					return;
				}

				if (!player.paused) {
					player.pause();
				}
			},
			{ threshold: 0.35 },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [streamVideoId]);

	const showLoadingOverlay = startupPhase === "loading";
	const showErrorOverlay = startupPhase === "error";

	return (
		<div
			ref={viewportRef}
			className="relative aspect-video w-full overflow-hidden rounded-[20px]"
		>
			<div className="absolute inset-0 h-full w-full">
				<Stream
					src={streamVideoId}
					streamRef={streamRef}
					autoplay={false}
					muted={false}
					loop={false}
					controls
					letterboxColor="transparent"
					preload="metadata"
					responsive={false}
					width="100%"
					height="100%"
					className="h-full w-full"
					poster={posterUrl ?? undefined}
					onLoadStart={() => setStartupPhase("loading")}
					onLoadedData={() => setStartupPhase("ready")}
					onPlaying={() => setStartupPhase("ready")}
					onError={() => setStartupPhase("error")}
				/>
			</div>

			{showLoadingOverlay ? (
				<div className="absolute inset-0 flex flex-col justify-end bg-[linear-gradient(180deg,rgba(24,20,18,0.06)_0%,rgba(24,20,18,0.62)_100%)] px-5 py-4 text-white">
					<p className="text-sm font-medium">{loadingHint}</p>
				</div>
			) : null}

			{showErrorOverlay ? (
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-6 text-center text-white">
					<p className="text-base font-medium">{errorTitle}</p>
					<p className="text-xs text-white/80">{errorHint}</p>
					<Button type="button" variant="secondary" onClick={onRetry}>
						{retryLabel}
					</Button>
				</div>
			) : null}
		</div>
	);
}

export function HomeMainVideoSection(props: HomeMainVideoSectionProps) {
	const { video, isLoading, isError, errorMessage, onRetry } = props;
	const { t } = useTranslation("home");

	if (isLoading) {
		return (
			<section id="home-main-video" className="space-y-4 py-2" aria-live="polite">
				<p className="text-xs uppercase tracking-[0.14em] text-[color:var(--brand-primary)]">
					{t("homeVideo.heroLabel")}
				</p>
				<div className="relative aspect-video w-full overflow-hidden rounded-[2rem] border border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(243,236,227,0.72)]">
					<div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,rgba(166,124,82,0.14),rgba(255,252,247,0.68),rgba(166,124,82,0.14))]" />
					<div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
						{t("homeVideo.heroLoading")}
					</div>
				</div>
			</section>
		);
	}

	if (isError) {
		return (
			<section id="home-main-video" className="space-y-4 py-2" aria-live="assertive">
				<p className="text-xs uppercase tracking-[0.14em] text-[color:var(--brand-primary)]">
					{t("homeVideo.heroLabel")}
				</p>
				<div className="space-y-4 rounded-[2rem] border border-rose-300 bg-rose-50 px-6 py-8 text-rose-900">
					<p className="text-base font-medium">{t("homeVideo.errorTitle")}</p>
					<p className="text-sm">
						{t("homeVideo.heroError", {
							message: resolveMessage(errorMessage) ?? t("homeVideo.errorUnknown"),
						})}
					</p>
					<div>
						<Button type="button" variant="outline" onClick={onRetry}>
							{t("homeVideo.retry")}
						</Button>
					</div>
				</div>
			</section>
		);
	}

	if (!video.video || video.status === "missing") {
		return (
			<section id="home-main-video" className="space-y-4 py-2" aria-live="polite">
				<p className="text-xs uppercase tracking-[0.14em] text-[color:var(--brand-primary)]">
					{t("homeVideo.heroLabel")}
				</p>
				<div className="space-y-2 rounded-[2rem] border border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.82)] px-6 py-8">
					<p className="text-base font-medium text-foreground">{video.title}</p>
					<p className="text-sm text-muted-foreground">{t("homeVideo.heroMissing")}</p>
				</div>
			</section>
		);
	}

	return (
		<section id="home-main-video" className="space-y-4 py-2" aria-live="polite">
			{/* <div className="flex flex-wrap items-end justify-between gap-3">
				<div className="space-y-1">
					<p className="text-xs uppercase tracking-[0.14em] text-[color:var(--brand-primary)]">
						{t("homeVideo.heroLabel")}
					</p>
					<p className="text-sm text-muted-foreground">{video.roleLabel}</p>
				</div>
				<p className="text-xs text-muted-foreground">{t("homeVideo.heroDescription")}</p>
			</div> */}
			<MainVideoPlayer
				key={video.video.streamVideoId}
				streamVideoId={video.video.streamVideoId}
				posterUrl={video.video.posterUrl}
				onRetry={onRetry}
				loadingHint={t("homeVideo.loadingHint")}
				errorTitle={t("homeVideo.errorTitle")}
				errorHint={t("homeVideo.errorHint")}
				retryLabel={t("homeVideo.retry")}
			/>
		</section>
	);
}
