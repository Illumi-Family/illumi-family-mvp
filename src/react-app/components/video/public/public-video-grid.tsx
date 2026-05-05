import type { PublicVideoRecord } from "@/lib/api";
import { PublicVideoCard } from "./public-video-card";

type PublicVideoGridProps = {
	videos: PublicVideoRecord[];
	onPlay: (video: PublicVideoRecord) => void;
	onPlayIntent?: (video: PublicVideoRecord) => void;
	activeStreamVideoId?: string | null;
	compact?: boolean;
};

export function PublicVideoGrid(props: PublicVideoGridProps) {
	const {
		videos,
		onPlay,
		onPlayIntent,
		activeStreamVideoId = null,
		compact = false,
	} = props;
	return (
		<div
			className={
				compact
					? "grid grid-cols-1 gap-2.5"
					: "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
			}
		>
			{videos.map((video) => (
				<PublicVideoCard
					key={video.id}
					video={video}
					active={video.streamVideoId === activeStreamVideoId}
					compact={compact}
					onPlay={() => onPlay(video)}
					onPlayIntent={onPlayIntent ? () => onPlayIntent(video) : undefined}
				/>
			))}
		</div>
	);
}
