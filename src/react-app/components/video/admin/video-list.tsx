import type { AdminVideoRecord } from "@/lib/api";
import { VideoListRow } from "./video-list-row";

type VideoListProps = {
	videos: AdminVideoRecord[];
	isActionPending: boolean;
	activeStreamVideoId?: string | null;
	onPreview: (video: AdminVideoRecord) => void;
	onPreviewIntent: (video: AdminVideoRecord) => void;
	onPublish: (videoId: string) => void;
	onUnpublish: (videoId: string) => void;
	onOpenEdit: (video: AdminVideoRecord) => void;
	onSyncStatus: (videoId: string) => void;
	onDeleteDraft: (videoId: string) => void;
};

export function VideoList(props: VideoListProps) {
	const {
		videos,
		isActionPending,
		activeStreamVideoId = null,
		onPreview,
		onPreviewIntent,
		onPublish,
		onUnpublish,
		onOpenEdit,
		onSyncStatus,
		onDeleteDraft,
	} = props;

	return (
		<div className="space-y-2">
			{videos.map((video) => (
				<VideoListRow
					key={video.id}
					video={video}
					isActionPending={isActionPending}
					isActivePreview={video.streamVideoId === activeStreamVideoId}
					onPreview={() => onPreview(video)}
					onPreviewIntent={() => onPreviewIntent(video)}
					onPublish={() => onPublish(video.id)}
					onUnpublish={() => onUnpublish(video.id)}
					onOpenEdit={() => onOpenEdit(video)}
					onSyncStatus={() => onSyncStatus(video.id)}
					onDeleteDraft={() => onDeleteDraft(video.id)}
				/>
			))}
		</div>
	);
}
