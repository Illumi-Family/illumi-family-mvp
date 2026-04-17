import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminVideoRecord } from "@/lib/api";

type VideoEditDrawerProps = {
	open: boolean;
	video: AdminVideoRecord | null;
	titleValue: string;
	posterValue: string;
	hasRemoteUpdate: boolean;
	isSaving: boolean;
	isPosterUploading: boolean;
	onClose: () => void;
	onTitleChange: (value: string) => void;
	onPosterChange: (value: string) => void;
	onUploadPosterFile: (file: File) => void;
	onSave: () => void;
};

export function VideoEditDrawer(props: VideoEditDrawerProps) {
	const {
		open,
		video,
		titleValue,
		posterValue,
		hasRemoteUpdate,
		isSaving,
		isPosterUploading,
		onClose,
		onTitleChange,
		onPosterChange,
		onUploadPosterFile,
		onSave,
	} = props;
	const titleInputRef = useRef<HTMLInputElement | null>(null);
	const posterInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			event.preventDefault();
			onClose();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose]);

	useEffect(() => {
		if (!open) return;
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prevOverflow;
		};
	}, [open]);

	useEffect(() => {
		if (!open) return;
		titleInputRef.current?.focus();
	}, [open, video?.id]);

	if (!open || !video) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
			<aside
				role="dialog"
				aria-modal="true"
				aria-label="编辑视频信息"
				className="absolute right-0 top-0 h-full w-full overflow-y-auto border-l border-border bg-background p-4 shadow-2xl lg:max-w-xl"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-center justify-between gap-3 border-b border-border pb-3">
					<div>
						<h3 className="text-base font-semibold tracking-tight">编辑信息</h3>
						<p className="text-xs text-muted-foreground">视频 ID: {video.id}</p>
					</div>
					<Button type="button" variant="outline" size="sm" onClick={onClose}>
						关闭
					</Button>
				</div>

				{hasRemoteUpdate ? (
					<div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
						后台状态已更新，当前表单保留本地草稿；保存后将同步最新数据。
					</div>
				) : null}

				<div className="mt-4 space-y-4">
					<div className="space-y-2">
						<Label htmlFor={`drawer-title-${video.id}`}>标题</Label>
						<Input
							ref={titleInputRef}
							id={`drawer-title-${video.id}`}
							value={titleValue}
							onChange={(event) => onTitleChange(event.target.value)}
							disabled={isSaving}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between gap-2">
							<Label htmlFor={`drawer-poster-${video.id}`}>封面地址</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={isPosterUploading}
								onClick={() => posterInputRef.current?.click()}
							>
								{isPosterUploading ? "上传中..." : "上传封面"}
							</Button>
						</div>
						<Input
							id={`drawer-poster-${video.id}`}
							value={posterValue}
							onChange={(event) => onPosterChange(event.target.value)}
							placeholder="可选"
							disabled={isSaving}
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
							支持 jpg/png/webp，上传后自动回填封面地址。
						</p>
					</div>
				</div>

				<div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-3">
					<Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
						取消
					</Button>
					<Button type="button" onClick={onSave} disabled={isSaving || isPosterUploading}>
						{isSaving ? "保存中..." : "保存信息"}
					</Button>
				</div>
			</aside>
		</div>
	);
}
