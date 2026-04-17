import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VideoPlayerModal } from "@/components/video/video-player-modal";
import { publicVideosQueryOptions } from "@/lib/query-options";
import type { PublicVideoRecord } from "@/lib/api";
import { PublicVideoGrid } from "@/components/video/public/public-video-grid";
import { Button } from "@/components/ui/button";
import type { VideoPlaybackStartupKind } from "@/lib/video-playback-metrics";
import {
	hasVideoPlaybackWarmupHit,
	scheduleVideoPlayerSdkWarmup,
	warmupVideoPlaybackIntent,
} from "@/lib/video-player-warmup";

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

export function VideosPage() {
	const videosQuery = useQuery(publicVideosQueryOptions());
	const [selectedVideo, setSelectedVideo] = useState<PublicVideoRecord | null>(null);
	const [selectedStartupKind, setSelectedStartupKind] =
		useState<VideoPlaybackStartupKind>("cold");

	useEffect(() => {
		void scheduleVideoPlayerSdkWarmup();
	}, []);

	const handlePlayIntent = (video: PublicVideoRecord) => {
		void warmupVideoPlaybackIntent(video.streamVideoId);
	};

	const handleOpenVideo = (video: PublicVideoRecord) => {
		setSelectedStartupKind(
			hasVideoPlaybackWarmupHit(video.streamVideoId) ? "warm" : "cold",
		);
		setSelectedVideo(video);
	};

	const handleCloseModal = () => {
		setSelectedVideo(null);
		setSelectedStartupKind("cold");
	};

	return (
		<div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8">
			<header className="space-y-2">
				<h1 className="text-3xl font-semibold tracking-tight">视频中心</h1>
				<p className="text-sm text-muted-foreground">
					点击卡片即可进入沉浸播放。
				</p>
			</header>

			{videosQuery.isLoading ? (
				<div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
					正在加载视频...
				</div>
			) : null}

			{videosQuery.isError ? (
				<div className="space-y-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-6 text-sm text-rose-800">
					<p>加载失败：{readErrorMessage(videosQuery.error)}</p>
					<Button type="button" variant="outline" onClick={() => videosQuery.refetch()}>
						重试加载
					</Button>
				</div>
			) : null}

			{videosQuery.data && videosQuery.data.length === 0 ? (
				<div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
					暂无已发布视频。
				</div>
			) : null}

			{videosQuery.data && videosQuery.data.length > 0 ? (
				<PublicVideoGrid
					videos={videosQuery.data}
					onPlay={handleOpenVideo}
					onPlayIntent={handlePlayIntent}
				/>
			) : null}

			<VideoPlayerModal
				open={Boolean(selectedVideo)}
				onClose={handleCloseModal}
				streamVideoId={selectedVideo?.streamVideoId ?? null}
				posterUrl={selectedVideo?.posterUrl ?? null}
				videoTitle={selectedVideo?.title ?? null}
				startupKind={selectedStartupKind}
			/>
		</div>
	);
}
