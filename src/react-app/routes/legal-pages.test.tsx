import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { router } from "@/router";
import { LegalPage } from "./legal-page";

vi.mock("@tanstack/react-router", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@tanstack/react-router")>();
	return {
		...actual,
		Link: (props: { children: unknown }) => createElement("a", {}, props.children),
	};
});

vi.mock("@/i18n/context", () => ({
	useAppI18n: () => ({
		locale: "zh-CN",
		lang: "zh",
		switchLocale: () => {},
	}),
}));

describe("legal routes and page", () => {
	it("registers three public legal routes", () => {
		const paths = router.routeTree.children.map((route) => route.path);
		expect(paths).toContain("legal/privacy");
		expect(paths).toContain("legal/minor-protection");
		expect(paths).toContain("legal/copyright");
	});

	it("renders legal metadata and contact info", () => {
		const html = renderToStaticMarkup(
			createElement(LegalPage, {
				pageKey: "privacy",
			}),
		);
		expect(html).toContain("隐私政策");
		expect(html).toContain("v1.0");
		expect(html).toContain("contact@illumi-family.com");
		expect(html).toContain("返回首页");
	});
});
