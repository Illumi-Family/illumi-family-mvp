export type MarkdownToolbarAction =
	| "heading2"
	| "heading3"
	| "bold"
	| "bullet-list"
	| "link"
	| "image";

export type MarkdownSelection = {
	selectionStart: number;
	selectionEnd: number;
};

export type ApplyMarkdownActionInput = {
	value: string;
	action: MarkdownToolbarAction;
	selection: MarkdownSelection;
	fallbackLinkText?: string;
	fallbackLinkUrl?: string;
	fallbackImageAlt?: string;
	fallbackImageUrl?: string;
};

export type ApplyMarkdownActionResult = {
	nextValue: string;
	nextSelectionStart: number;
	nextSelectionEnd: number;
};

const surroundText = (
	text: string,
	prefix: string,
	suffix: string,
	replacement: string,
) => {
	const core = text || replacement;
	return {
		nextText: `${prefix}${core}${suffix}`,
		cursorStartOffset: prefix.length,
		cursorEndOffset: prefix.length + core.length,
	};
};

const toBulletList = (text: string) => {
	if (!text.trim()) {
		return "- 列表项一\n- 列表项二";
	}
	return text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => `- ${line.replace(/^[-*]\s+/, "")}`)
		.join("\n");
};

const toHeading = (text: string, level: "##" | "###") => {
	const normalized = (text || "小标题")
		.split(/\r?\n/)
		.map((line) => `${level} ${line.replace(/^#{1,6}\s+/, "").trim() || "小标题"}`);
	return normalized.join("\n");
};

export const applyMarkdownAction = (
	input: ApplyMarkdownActionInput,
): ApplyMarkdownActionResult => {
	const { value, action } = input;
	const start = Math.max(0, Math.min(input.selection.selectionStart, value.length));
	const end = Math.max(start, Math.min(input.selection.selectionEnd, value.length));
	const selectedText = value.slice(start, end);

	let nextText = "";
	let cursorStartOffset = 0;
	let cursorEndOffset = 0;

	switch (action) {
		case "heading2": {
			nextText = toHeading(selectedText, "##");
			cursorStartOffset = nextText.length;
			cursorEndOffset = nextText.length;
			break;
		}
		case "heading3": {
			nextText = toHeading(selectedText, "###");
			cursorStartOffset = nextText.length;
			cursorEndOffset = nextText.length;
			break;
		}
		case "bold": {
			const wrapped = surroundText(selectedText, "**", "**", "强调内容");
			nextText = wrapped.nextText;
			cursorStartOffset = wrapped.cursorStartOffset;
			cursorEndOffset = wrapped.cursorEndOffset;
			break;
		}
		case "bullet-list": {
			nextText = toBulletList(selectedText);
			cursorStartOffset = nextText.length;
			cursorEndOffset = nextText.length;
			break;
		}
		case "link": {
			const wrapped = surroundText(
				selectedText,
				"[",
				`](${input.fallbackLinkUrl || "https://"})`,
				input.fallbackLinkText || "链接文字",
			);
			nextText = wrapped.nextText;
			cursorStartOffset = wrapped.cursorStartOffset;
			cursorEndOffset = wrapped.cursorEndOffset;
			break;
		}
		case "image": {
			nextText = `![${selectedText || input.fallbackImageAlt || "图片说明"}](${input.fallbackImageUrl || "/api/content/assets/asset-id"})`;
			cursorStartOffset = nextText.length;
			cursorEndOffset = nextText.length;
			break;
		}
	}

	const nextValue = `${value.slice(0, start)}${nextText}${value.slice(end)}`;
	const nextSelectionStart = start + cursorStartOffset;
	const nextSelectionEnd = start + cursorEndOffset;

	return {
		nextValue,
		nextSelectionStart,
		nextSelectionEnd,
	};
};

const MARKDOWN_POLICY_RULES: Array<{ pattern: RegExp; message: string }> = [
	{ pattern: /```/, message: "暂不支持代码块（```）" },
	{ pattern: /`[^`]+`/, message: "暂不支持行内代码（`code`）" },
	{ pattern: /^>\s+/m, message: "暂不支持引用块（>）" },
	{ pattern: /^-{3,}$/m, message: "暂不支持分割线（---）" },
	{ pattern: /^\|.*\|$/m, message: "暂不支持表格语法（|）" },
	{ pattern: /<\/?[a-z][^>]*>/i, message: "不允许 HTML 标签" },
];

export const getMarkdownPolicyIssues = (markdown: string): string[] => {
	if (!markdown.trim()) return [];
	const issues: string[] = [];
	for (const rule of MARKDOWN_POLICY_RULES) {
		if (rule.pattern.test(markdown)) {
			issues.push(rule.message);
		}
	}
	return issues;
};
