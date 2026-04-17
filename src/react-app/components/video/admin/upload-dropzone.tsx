import { useId, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";

type UploadDropzoneProps = {
	disabled?: boolean;
	onSelectFile: (file: File | null) => void;
	accept?: string;
};

export function UploadDropzone(props: UploadDropzoneProps) {
	const { disabled = false, onSelectFile, accept = "video/*" } = props;
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const inputId = useId();

	const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		if (disabled) return;
		setIsDragging(true);
	};

	const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(false);
		if (disabled) return;
		onSelectFile(event.dataTransfer.files?.[0] ?? null);
	};

	return (
		<div
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			className={[
				"rounded-xl border border-dashed p-4 transition",
				isDragging ? "border-primary bg-primary/5" : "border-border bg-background/50",
				disabled ? "opacity-60" : "",
			].join(" ")}
		>
			<input
				id={inputId}
				ref={inputRef}
				type="file"
				accept={accept}
				className="hidden"
				disabled={disabled}
				onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
			/>
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<p className="text-sm font-medium">拖拽视频到这里，或点击选择文件</p>
					<p className="text-xs text-muted-foreground">首期仅支持单文件上传。</p>
				</div>
				<Button
					type="button"
					variant="outline"
					disabled={disabled}
					onClick={() => inputRef.current?.click()}
				>
					选择文件
				</Button>
			</div>
		</div>
	);
}
