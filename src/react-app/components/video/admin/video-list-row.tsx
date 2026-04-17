import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminVideoRecord } from "@/lib/api";
import {
	getProcessingStatusLabel,
	getPublishStatusLabel,
	getVideoActionState,
	getVideoDateTimeLabel,
	getVideoDisplayTitle,
	getVideoDurationLabel,
} from "./video-state";
import { VideoRowMoreMenu } from "./video-row-more-menu";

type VideoListRowProps = {
	video: AdminVideoRecord;
	isActionPending: boolean;
	onPreview: () => void;
	onPreviewIntent: () => void;
	onPublish: () => void;
	onUnpublish: () => void;
	onOpenEdit: () => void;
	onSyncStatus: () => void;
	onDeleteDraft: () => void;
};

const processingBadgeClass: Record<AdminVideoRecord["processingStatus"], string> = {
	processing: "bg-amber-100 text-amber-800",
	ready: "bg-emerald-100 text-emerald-800",
	failed: "bg-rose-100 text-rose-800",
};

const publishBadgeClass: Record<AdminVideoRecord["publishStatus"], string> = {
	draft: "bg-slate-100 text-slate-800",
	published: "bg-indigo-100 text-indigo-800",
};

export function VideoListRow(props: VideoListRowProps) {
	const {
		video,
		isActionPending,
		onPreview,
		onPreviewIntent,
		onPublish,
		onUnpublish,
		onOpenEdit,
		onSyncStatus,
		onDeleteDraft,
	} = props;

	const actionState = getVideoActionState(video);
	const primaryActionLabel =
		video.publishStatus === "published" ? "下线" : "发布";
	const primaryActionHandler =
		video.publishStatus === "published" ? onUnpublish : onPublish;
	const primaryActionDisabled =
		video.publishStatus === "published"
			? !actionState.canUnpublish || isActionPending
			: !actionState.canPublish || isActionPending;

	return (
		<article className="rounded-xl border border-border bg-card p-4">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<Badge className={processingBadgeClass[video.processingStatus]}>
							{getProcessingStatusLabel(video.processingStatus)}
						</Badge>
						<Badge className={publishBadgeClass[video.publishStatus]}>
							{getPublishStatusLabel(video.publishStatus)}
						</Badge>
					</div>
					<p className="truncate text-sm font-medium text-foreground" title={video.title}>
						{getVideoDisplayTitle(video)}
					</p>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
						<p>时长：{getVideoDurationLabel(video.durationSeconds)}</p>
						<p>更新时间：{getVideoDateTimeLabel(video.updatedAt)}</p>
						<p className="truncate">ID：{video.id}</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onPreview}
						onMouseEnter={onPreviewIntent}
						onFocus={onPreviewIntent}
						onTouchStart={onPreviewIntent}
					>
						预览
					</Button>
					<Button
						type="button"
						size="sm"
						onClick={primaryActionHandler}
						disabled={primaryActionDisabled}
					>
						{primaryActionLabel}
					</Button>
					<VideoRowMoreMenu
						disabled={isActionPending}
						canDeleteDraft={actionState.canDeleteDraft}
						onEdit={onOpenEdit}
						onSyncStatus={onSyncStatus}
						onDeleteDraft={onDeleteDraft}
					/>
				</div>
			</div>
		</article>
	);
}
