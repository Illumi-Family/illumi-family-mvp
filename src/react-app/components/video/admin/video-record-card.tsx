import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminVideoRecord } from "@/lib/api";
import {
	getVideoDateTimeLabel,
	getVideoDisplayTitle,
	getVideoDurationLabel,
} from "./video-state";
import { VideoInlinePreview } from "./video-inline-preview";

type VideoRecordCardProps = {
	video: AdminVideoRecord;
	titleValue: string;
	posterValue: string;
	isActionPending: boolean;
	isPosterUploading: boolean;
	isInlinePreviewActive: boolean;
	onTitleChange: (value: string) => void;
	onPosterChange: (value: string) => void;
	onUploadPosterFile: (file: File) => void;
	onSaveMetadata: () => void;
	onPublish: () => void;
	onUnpublish: () => void;
	onSyncStatus: () => void;
	onDeleteDraft: () => void;
	onOpenInlinePreview: () => void;
	onOpenModal: () => void;
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

export function VideoRecordCard(props: VideoRecordCardProps) {
	const {
		video,
		titleValue,
		posterValue,
		isActionPending,
		isPosterUploading,
		isInlinePreviewActive,
		onTitleChange,
		onPosterChange,
		onUploadPosterFile,
		onSaveMetadata,
		onPublish,
		onUnpublish,
		onSyncStatus,
		onDeleteDraft,
		onOpenInlinePreview,
		onOpenModal,
	} = props;
	const posterInputRef = useRef<HTMLInputElement | null>(null);

	const canPublish =
		video.processingStatus === "ready" && video.publishStatus === "draft";

	return (
		<article className="space-y-4 rounded-2xl border border-border bg-card p-4">
			<div className="flex flex-wrap items-center gap-2">
				<Badge className={processingBadgeClass[video.processingStatus]}>
					{video.processingStatus}
				</Badge>
				<Badge className={publishBadgeClass[video.publishStatus]}>
					{video.publishStatus}
				</Badge>
				<p className="text-xs text-muted-foreground">ID: {video.id}</p>
			</div>

			<VideoInlinePreview
				streamVideoId={video.streamVideoId}
				posterUrl={video.posterUrl}
				title={getVideoDisplayTitle(video)}
				active={isInlinePreviewActive}
			/>

			<div className="grid gap-3 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor={`title-${video.id}`}>标题</Label>
					<Input
						id={`title-${video.id}`}
						value={titleValue}
						onChange={(event) => onTitleChange(event.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<Label htmlFor={`poster-${video.id}`}>封面地址</Label>
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={isPosterUploading}
							onClick={() => posterInputRef.current?.click()}
						>
							{isPosterUploading ? "上传中..." : "上传封面"}
						</Button>
					</div>
					<Input
						id={`poster-${video.id}`}
						value={posterValue}
						onChange={(event) => onPosterChange(event.target.value)}
						placeholder="可选"
					/>
					<input
						ref={posterInputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={(event) => {
							const file = event.target.files?.[0];
							if (file) {
								onUploadPosterFile(file);
							}
							event.currentTarget.value = "";
						}}
					/>
					<p className="text-xs text-muted-foreground">
						支持 jpg/png/webp，上传后自动回填封面地址
					</p>
				</div>
			</div>

			<div className="space-y-2 rounded-xl border border-border bg-background/60 p-3">
				<p className="text-xs font-medium tracking-wide text-foreground">元数据</p>
				<div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
					<p>标题：{getVideoDisplayTitle(video)}</p>
					<p>时长：{getVideoDurationLabel(video.durationSeconds)}</p>
					<p className="truncate">Stream ID：{video.streamVideoId}</p>
					<p>发布状态：{video.publishStatus}</p>
					<p>处理状态：{video.processingStatus}</p>
					<p>更新时间：{getVideoDateTimeLabel(video.updatedAt)}</p>
					<p>发布时间：{getVideoDateTimeLabel(video.publishedAt)}</p>
					<p className="truncate">封面：{video.posterUrl ?? "-"}</p>
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button type="button" variant="outline" onClick={onOpenInlinePreview}>
					快速预览
				</Button>
				<Button type="button" variant="outline" onClick={onOpenModal}>
					沉浸播放
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={onSaveMetadata}
					disabled={isActionPending}
				>
					保存信息
				</Button>
				<Button type="button" onClick={onPublish} disabled={!canPublish || isActionPending}>
					发布
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={onUnpublish}
					disabled={video.publishStatus !== "published" || isActionPending}
				>
					下线
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={onSyncStatus}
					disabled={isActionPending}
				>
					同步状态
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={onDeleteDraft}
					disabled={video.publishStatus !== "draft" || isActionPending}
				>
					删除草稿
				</Button>
			</div>
		</article>
	);
}
