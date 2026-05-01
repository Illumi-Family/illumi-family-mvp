import type { PublicVideoRecord } from "@/lib/api";
import { PublicVideoCard } from "./public-video-card";

type PublicVideoGridProps = {
	videos: PublicVideoRecord[];
	onPlay: (video: PublicVideoRecord) => void;
	onPlayIntent?: (video: PublicVideoRecord) => void;
	activeStreamVideoId?: string | null;
};

export function PublicVideoGrid(props: PublicVideoGridProps) {
	const { videos, onPlay, onPlayIntent, activeStreamVideoId = null } = props;
	return (
		<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
			{videos.map((video) => (
				<PublicVideoCard
					key={video.id}
					video={video}
					active={video.streamVideoId === activeStreamVideoId}
					onPlay={() => onPlay(video)}
					onPlayIntent={onPlayIntent ? () => onPlayIntent(video) : undefined}
				/>
			))}
		</div>
	);
}
