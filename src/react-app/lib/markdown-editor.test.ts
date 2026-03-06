import { describe, expect, it } from "vitest";
import {
	applyMarkdownAction,
	getMarkdownPolicyIssues,
} from "./markdown-editor";

describe("markdown editor helper", () => {
	it("wraps selected text with bold markdown", () => {
		const result = applyMarkdownAction({
			value: "hello world",
			action: "bold",
			selection: { selectionStart: 6, selectionEnd: 11 },
		});

		expect(result.nextValue).toBe("hello **world**");
	});

	it("converts multiline selection into bullet list", () => {
		const result = applyMarkdownAction({
			value: "第一行\n第二行",
			action: "bullet-list",
			selection: { selectionStart: 0, selectionEnd: 7 },
		});

		expect(result.nextValue).toBe("- 第一行\n- 第二行");
	});

	it("creates markdown image syntax with fallback url", () => {
		const result = applyMarkdownAction({
			value: "",
			action: "image",
			selection: { selectionStart: 0, selectionEnd: 0 },
			fallbackImageUrl: "/api/content/assets/asset-1",
		});

		expect(result.nextValue).toContain("![");
		expect(result.nextValue).toContain("/api/content/assets/asset-1");
	});

	it("reports unsupported markdown syntax", () => {
		const issues = getMarkdownPolicyIssues(
			"```ts\nconsole.log('x')\n```\n<div>unsafe</div>",
		);
		expect(issues).toContain("暂不支持代码块（```）");
		expect(issues).toContain("不允许 HTML 标签");
	});

	it("keeps supported markdown clean", () => {
		const issues = getMarkdownPolicyIssues(
			"## 标题\n\n- 列表\n\n[链接](https://illumi-family.com)",
		);
		expect(issues).toEqual([]);
	});
});
