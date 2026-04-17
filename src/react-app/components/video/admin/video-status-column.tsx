import type { AdminVideoRecord } from "@/lib/api";
import { VideoRecordCard } from "./video-record-card";

type VideoStatusColumnProps = {
	label: string;
	items: AdminVideoRecord[];
	titleDrafts: Record<string, string>;
	posterDrafts: Record<string, string>;
	activeInlinePreviewId: string | null;
	isActionPending: boolean;
	isPosterUploading: boolean;
	onTitleDraft: (videoId: string, value: string) => void;
	onPosterDraft: (videoId: string, value: string) => void;
	onUploadPosterFile: (videoId: string, file: File) => void;
	onSaveMetadata: (video: AdminVideoRecord) => void;
	onPublish: (videoId: string) => void;
	onUnpublish: (videoId: string) => void;
	onSyncStatus: (videoId: string) => void;
	onDeleteDraft: (videoId: string) => void;
	onInlinePreview: (videoId: string) => void;
	onOpenModal: (video: AdminVideoRecord) => void;
};

export function VideoStatusColumn(props: VideoStatusColumnProps) {
	const {
		label,
		items,
		titleDrafts,
		posterDrafts,
		activeInlinePreviewId,
		isActionPending,
		isPosterUploading,
		onTitleDraft,
		onPosterDraft,
		onUploadPosterFile,
		onSaveMetadata,
		onPublish,
		onUnpublish,
		onSyncStatus,
		onDeleteDraft,
		onInlinePreview,
		onOpenModal,
	} = props;

	return (
		<section className="space-y-3 rounded-2xl border border-border bg-background/50 p-3">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold tracking-tight">{label}</h3>
				<span className="text-xs text-muted-foreground">{items.length}</span>
			</div>

			{items.length === 0 ? (
				<div className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
					当前列暂无视频
				</div>
			) : null}

			<div className="space-y-3">
				{items.map((video) => (
					<VideoRecordCard
						key={video.id}
						video={video}
						titleValue={titleDrafts[video.id] ?? video.title}
						posterValue={posterDrafts[video.id] ?? (video.posterUrl ?? "")}
						isInlinePreviewActive={activeInlinePreviewId === video.id}
						isActionPending={isActionPending}
						isPosterUploading={isPosterUploading}
						onTitleChange={(value) => onTitleDraft(video.id, value)}
						onPosterChange={(value) => onPosterDraft(video.id, value)}
						onUploadPosterFile={(file) => onUploadPosterFile(video.id, file)}
						onSaveMetadata={() => onSaveMetadata(video)}
						onPublish={() => onPublish(video.id)}
						onUnpublish={() => onUnpublish(video.id)}
						onSyncStatus={() => onSyncStatus(video.id)}
						onDeleteDraft={() => onDeleteDraft(video.id)}
						onOpenInlinePreview={() => onInlinePreview(video.id)}
						onOpenModal={() => onOpenModal(video)}
					/>
				))}
			</div>
		</section>
	);
}
