import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VideoPlayerModal } from "@/components/video/video-player-modal";
import { Button } from "@/components/ui/button";
import { publicVideosQueryOptions } from "@/lib/query-options";
import type { PublicVideoRecord } from "@/lib/api";

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

const formatDuration = (seconds: number | null) => {
	if (seconds === null || Number.isNaN(seconds)) return "Unknown";
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remain = seconds % 60;
	return `${minutes}m ${remain}s`;
};

const formatPublishDate = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return date.toLocaleDateString();
};

export function VideosPage() {
	const videosQuery = useQuery(publicVideosQueryOptions());
	const [selectedVideo, setSelectedVideo] = useState<PublicVideoRecord | null>(null);

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
			<header className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">Family Videos</h1>
				<p className="text-sm text-muted-foreground">
					Published and ready videos from the family content library.
				</p>
			</header>

			{videosQuery.isLoading ? (
				<div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
					Loading videos...
				</div>
			) : null}

			{videosQuery.isError ? (
				<div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-6 text-sm text-rose-800">
					Failed to load videos: {readErrorMessage(videosQuery.error)}
				</div>
			) : null}

			{videosQuery.data && videosQuery.data.length === 0 ? (
				<div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
					No published videos yet.
				</div>
			) : null}

			{videosQuery.data && videosQuery.data.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{videosQuery.data.map((video) => (
						<article
							key={video.id}
							className="flex h-full flex-col rounded-2xl border border-border bg-card"
						>
							<div className="aspect-video overflow-hidden rounded-t-2xl bg-muted">
								{video.posterUrl ? (
									<img
										src={video.posterUrl}
										alt={video.title}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
										No poster
									</div>
								)}
							</div>
							<div className="flex flex-1 flex-col gap-3 p-4">
								<h2 className="line-clamp-2 text-lg font-medium text-foreground">
									{video.title || "Untitled video"}
								</h2>
								<div className="space-y-1 text-xs text-muted-foreground">
									<p>Duration: {formatDuration(video.durationSeconds)}</p>
									<p>Published: {formatPublishDate(video.publishedAt)}</p>
								</div>
								<div className="mt-auto">
									<Button
										type="button"
										onClick={() => setSelectedVideo(video)}
									>
										Play Video
									</Button>
								</div>
							</div>
						</article>
					))}
				</div>
			) : null}

			<VideoPlayerModal
				open={Boolean(selectedVideo)}
				onClose={() => setSelectedVideo(null)}
				streamVideoId={selectedVideo?.streamVideoId ?? null}
				title={selectedVideo?.title}
			/>
		</div>
	);
}
