import { useRef, useState } from "react";
import {
	Bold,
	Heading2,
	Heading3,
	ImagePlus,
	Link as LinkIcon,
	List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	applyMarkdownAction,
	type MarkdownToolbarAction,
} from "@/lib/markdown-editor";

type UploadedImageResult = {
	assetId: string;
	assetUrl: string;
	markdownSnippet: string;
};

type MarkdownEditorProps = {
	id: string;
	label: string;
	value: string;
	onChange: (nextValue: string) => void;
	placeholder?: string;
	rows?: number;
	description?: string;
	onUploadImage?: (file: File) => Promise<UploadedImageResult>;
};

const TOOLBAR_ACTIONS: Array<{
	action: MarkdownToolbarAction;
	label: string;
	icon: typeof Bold;
}> = [
	{ action: "heading2", label: "H2", icon: Heading2 },
	{ action: "heading3", label: "H3", icon: Heading3 },
	{ action: "bold", label: "加粗", icon: Bold },
	{ action: "bullet-list", label: "列表", icon: List },
	{ action: "link", label: "链接", icon: LinkIcon },
	{ action: "image", label: "图片", icon: ImagePlus },
];

export function MarkdownEditor({
	id,
	label,
	value,
	onChange,
	placeholder,
	rows = 8,
	description,
	onUploadImage,
}: MarkdownEditorProps) {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadedImage, setUploadedImage] = useState<UploadedImageResult | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const applyAction = (action: MarkdownToolbarAction) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const result = applyMarkdownAction({
			value,
			action,
			selection: {
				selectionStart: textarea.selectionStart,
				selectionEnd: textarea.selectionEnd,
			},
			fallbackImageAlt: "配图说明",
			fallbackLinkText: "链接文字",
		});

		onChange(result.nextValue);
		requestAnimationFrame(() => {
			textarea.focus();
			textarea.setSelectionRange(
				result.nextSelectionStart,
				result.nextSelectionEnd,
			);
		});
	};

	const handleUpload = async () => {
		if (!selectedFile || !onUploadImage) return;
		setUploading(true);
		setUploadError(null);
		try {
			const result = await onUploadImage(selectedFile);
			setUploadedImage(result);
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : "上传失败");
		} finally {
			setUploading(false);
		}
	};

	const handleInsertImage = () => {
		if (!uploadedImage) return;
		const next = value
			? `${value}\n\n${uploadedImage.markdownSnippet}`
			: uploadedImage.markdownSnippet;
		onChange(next);
	};

	return (
		<section className="space-y-3 border-t border-border/70 pt-4">
			<div className="space-y-2">
				<Label htmlFor={id}>{label}</Label>
				{description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
			</div>

			<div className="overflow-x-auto rounded-lg border border-border/70 bg-background/75 p-1">
				<div className="inline-flex min-w-max items-center gap-1">
					{TOOLBAR_ACTIONS.map((item) => {
						const Icon = item.icon;
						return (
							<Button
								key={item.action}
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => applyAction(item.action)}
								title={item.label}
								className="h-10 min-w-10 gap-1 rounded-md px-2 text-xs transition-transform active:scale-[0.98]"
							>
								<Icon className="size-3.5" aria-hidden="true" />
								<span className="hidden sm:inline">{item.label}</span>
							</Button>
						);
					})}
				</div>
			</div>

			{onUploadImage ? (
				<div className="grid gap-2 rounded-lg border border-border/70 bg-background/65 p-2">
					<Input
						type="file"
						accept="image/*"
						onChange={(event) => {
							setSelectedFile(event.target.files?.[0] ?? null);
							setUploadedImage(null);
							setUploadError(null);
						}}
					/>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleUpload}
							disabled={!selectedFile || uploading}
							className="h-8 px-3 text-xs"
						>
							{uploading ? "上传中..." : "上传图片"}
						</Button>
						<Button
							type="button"
							onClick={handleInsertImage}
							disabled={!uploadedImage}
							className="h-8 px-3 text-xs"
						>
							插入图片
						</Button>
					</div>
					{uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
					{uploadedImage ? (
						<p className="text-xs text-muted-foreground">
							已上传：<code>{uploadedImage.markdownSnippet}</code>
						</p>
					) : null}
				</div>
			) : null}

			<Textarea
				id={id}
				ref={textareaRef}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				rows={rows}
				className="min-h-44 px-3 py-2 font-mono text-sm leading-6"
			/>
		</section>
	);
}
