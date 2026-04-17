import type { AdminVideoRecord } from "@/lib/api";
import type { VideoBoardColumn } from "./video-state";
import { VideoStatusColumn } from "./video-status-column";

type VideoStatusBoardProps = {
	columns: VideoBoardColumn[];
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

export function VideoStatusBoard(props: VideoStatusBoardProps) {
	const {
		columns,
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
		<div className="grid gap-4 lg:grid-cols-3">
			{columns.map((column) => (
				<VideoStatusColumn
					key={column.key}
					label={column.label}
					items={column.items}
					titleDrafts={titleDrafts}
					posterDrafts={posterDrafts}
					activeInlinePreviewId={activeInlinePreviewId}
					isActionPending={isActionPending}
					isPosterUploading={isPosterUploading}
					onTitleDraft={onTitleDraft}
					onPosterDraft={onPosterDraft}
					onUploadPosterFile={onUploadPosterFile}
					onSaveMetadata={onSaveMetadata}
					onPublish={onPublish}
					onUnpublish={onUnpublish}
					onSyncStatus={onSyncStatus}
					onDeleteDraft={onDeleteDraft}
					onInlinePreview={onInlinePreview}
					onOpenModal={onOpenModal}
				/>
			))}
		</div>
	);
}
