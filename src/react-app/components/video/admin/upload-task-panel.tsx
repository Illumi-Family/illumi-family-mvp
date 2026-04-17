import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "./upload-dropzone";
import type { UploadTaskStatus } from "@/lib/video-upload-task";

type UploadTaskPanelProps = {
	title: string;
	file: File | null;
	progressPercent: number;
	status: UploadTaskStatus;
	errorMessage: string | null;
	isSubmitting: boolean;
	onTitleChange: (value: string) => void;
	onSelectFile: (file: File | null) => void;
	onSubmit: () => void;
	onRetry: () => void;
};

const STATUS_LABELS: Record<UploadTaskStatus, string> = {
	idle: "待上传",
	issuing_url: "签发上传地址中",
	uploading: "上传中",
	processing_wait: "等待视频处理",
	ready: "已就绪",
	failed: "上传失败",
};

export function UploadTaskPanel(props: UploadTaskPanelProps) {
	const {
		title,
		file,
		progressPercent,
		status,
		errorMessage,
		isSubmitting,
		onTitleChange,
		onSelectFile,
		onSubmit,
		onRetry,
	} = props;

	const canSubmit = Boolean(file) && !isSubmitting;

	return (
		<section className="space-y-4 rounded-2xl border border-border bg-card p-4">
			<div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-end">
				<div className="space-y-2">
					<Label htmlFor="upload-title">视频标题</Label>
					<Input
						id="upload-title"
						value={title}
						onChange={(event) => onTitleChange(event.target.value)}
						placeholder="例如：周末家庭记录"
						disabled={isSubmitting}
					/>
				</div>
				<div className="text-xs text-muted-foreground">状态：{STATUS_LABELS[status]}</div>
			</div>

			<UploadDropzone disabled={isSubmitting} onSelectFile={onSelectFile} />

			<div className="flex flex-wrap items-center gap-3">
				<Button type="button" onClick={onSubmit} disabled={!canSubmit}>
					{isSubmitting ? "上传中..." : "开始上传"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={onRetry}
					disabled={status !== "failed" || !file || isSubmitting}
				>
					重试上传
				</Button>
				{file ? <p className="text-xs text-muted-foreground">当前文件：{file.name}</p> : null}
			</div>

			<div className="space-y-2">
				<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
					<div
						className="h-full bg-primary transition-all"
						style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
					/>
				</div>
				<p className="text-xs text-muted-foreground">上传进度：{progressPercent}%</p>
			</div>

			{errorMessage ? (
				<div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
					{errorMessage}
				</div>
			) : null}
		</section>
	);
}
