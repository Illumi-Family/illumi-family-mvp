import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mockPathnameState = { value: "/video" };

vi.mock("@tanstack/react-router", () => ({
	Link: (props: { children: unknown }) => createElement("span", {}, props.children),
	Outlet: () => createElement("div", { "data-testid": "outlet-proxy" }),
	useRouterState: () => mockPathnameState.value,
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

vi.mock("@/lib/auth-client", () => ({
	authClient: {
		useSession: () => ({ data: null }),
	},
}));

import { RootLayout } from "./root-layout";

describe("root layout", () => {
	it("hides utility nav on /video path", () => {
		mockPathnameState.value = "/video";
		const html = renderToStaticMarkup(createElement(RootLayout));
		expect(html).not.toContain("utilityNav.ariaLabel");
		expect(html).toContain("skipToContent");
	});

	it("hides utility nav on /legal routes", () => {
		mockPathnameState.value = "/legal/privacy";
		const html = renderToStaticMarkup(createElement(RootLayout));
		expect(html).not.toContain("utilityNav.ariaLabel");
	});

	it("hides utility nav on /auth path", () => {
		mockPathnameState.value = "/auth";
		const html = renderToStaticMarkup(createElement(RootLayout));
		expect(html).not.toContain("utilityNav.ariaLabel");
	});

	it("shows utility nav on non-home and non-video paths", () => {
		mockPathnameState.value = "/admin/videos";
		const html = renderToStaticMarkup(createElement(RootLayout));
		expect(html).toContain("utilityNav.ariaLabel");
		expect(html).toContain("utilityNav.adminProfile");
		expect(html).toContain("utilityNav.adminCms");
		expect(html).toContain("utilityNav.adminVideos");
		expect(html).toContain("utilityNav.signOut");
		expect(html).not.toContain("utilityNav.home");
		expect(html).not.toContain("utilityNav.auth");
		expect(html).not.toContain("utilityNav.profile");
	});
});
