import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/utils", () => ({
	cn: (...parts: Array<string | undefined>) => parts.filter(Boolean).join(" "),
}));

import { MarkdownRenderer } from "./markdown-renderer";

describe("markdown renderer", () => {
	it("renders ordered list syntax", () => {
		const html = renderToStaticMarkup(
			createElement(MarkdownRenderer, { content: "1. one\n2. two" }),
		);
		expect(html).toContain("<ol");
		expect(html).toContain("one");
		expect(html).toContain("two");
	});

	it("does not render unsafe javascript links", () => {
		const html = renderToStaticMarkup(
			createElement(MarkdownRenderer, {
				content: "[x](javascript:alert(1))",
			}),
		);
		expect(html).not.toContain('href="javascript:alert(1)"');
		expect(html).toContain("[x](javascript:alert(1))");
	});

	it("renders safe image asset urls", () => {
		const html = renderToStaticMarkup(
			createElement(MarkdownRenderer, {
				content: "![cover](/api/content/assets/asset-1)",
			}),
		);
		expect(html).toContain('src="/api/content/assets/asset-1"');
	});
});
