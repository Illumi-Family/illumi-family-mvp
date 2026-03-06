import { useRef, useState } from "react";
import {
	Bold,
	Heading2,
	Heading3,
	ImagePlus,
	Link as LinkIcon,
	List,
	PanelBottom,
	ScanText,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/common/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	applyMarkdownAction,
	type MarkdownToolbarAction,
} from "@/lib/markdown-editor";

type MarkdownEditorProps = {
	id: string;
	label: string;
	value: string;
	onChange: (nextValue: string) => void;
	placeholder?: string;
	rows?: number;
	description?: string;
	emptyPreviewLabel?: string;
};

type ViewMode = "visual" | "source";

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

const VIEW_BUTTON_STYLE =
	"h-8 rounded-md px-3 text-xs transition-transform active:scale-[0.98]";

export function MarkdownEditor({
	id,
	label,
	value,
	onChange,
	placeholder,
	rows = 8,
	description,
	emptyPreviewLabel = "暂无内容",
}: MarkdownEditorProps) {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [viewMode, setViewMode] = useState<ViewMode>("visual");

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

	return (
		<section className="space-y-3 border-t border-border/70 pt-4">
			<div className="space-y-2">
				<Label htmlFor={id}>{label}</Label>
				{description ? (
					<p className="text-xs text-muted-foreground">{description}</p>
				) : null}
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-1 rounded-lg border border-border/70 bg-background/70 p-1">
					{TOOLBAR_ACTIONS.map((item) => {
						const Icon = item.icon;
						return (
							<Button
								key={item.action}
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => applyAction(item.action)}
								className="h-8 gap-1 rounded-md px-2 text-xs transition-transform active:scale-[0.98]"
							>
								<Icon className="size-3.5" aria-hidden="true" />
								<span>{item.label}</span>
							</Button>
						);
					})}
				</div>
				<div className="flex items-center gap-1 rounded-lg border border-border/70 bg-background/70 p-1">
					<Button
						type="button"
						variant={viewMode === "visual" ? "secondary" : "ghost"}
						onClick={() => setViewMode("visual")}
						className={VIEW_BUTTON_STYLE}
					>
						<PanelBottom className="size-3.5" aria-hidden="true" />
						可见
					</Button>
					<Button
						type="button"
						variant={viewMode === "source" ? "secondary" : "ghost"}
						onClick={() => setViewMode("source")}
						className={VIEW_BUTTON_STYLE}
					>
						<ScanText className="size-3.5" aria-hidden="true" />
						源码
					</Button>
				</div>
			</div>

			{viewMode === "visual" ? (
				<div className="grid gap-3 lg:grid-cols-2">
					<Textarea
						id={id}
						ref={textareaRef}
						value={value}
						onChange={(event) => onChange(event.target.value)}
						placeholder={placeholder}
						rows={rows}
						className="min-h-48 bg-background/80"
					/>
					<div className="min-h-48 rounded-xl border border-border/70 bg-background/75 p-3">
						<p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
							即时预览
						</p>
						<MarkdownRenderer
							content={value}
							emptyFallback={
								<p className="text-sm text-muted-foreground">{emptyPreviewLabel}</p>
							}
						/>
					</div>
				</div>
			) : (
				<Textarea
					id={id}
					ref={textareaRef}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					placeholder={placeholder}
					rows={rows}
					className="min-h-52 font-mono text-xs"
				/>
			)}
		</section>
	);
}
