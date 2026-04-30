import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

vi.mock("@/i18n/context", () => ({
	useAppI18n: () => ({
		locale: "zh-CN",
		lang: "zh",
		switchLocale: () => {},
	}),
}));

vi.mock("@/components/video/video-player-modal", () => ({
	VideoPlayerModal: (props: { open: boolean }) =>
		createElement("div", {
			"data-testid": "home-video-modal-proxy",
			"data-open": String(props.open),
		}),
}));

import {
	handleMobileNavSelection,
	scheduleHomeEntryScrollReset,
} from "./home-page.scroll";
import { HomePage } from "./home-page";

describe("home page", () => {
	it("resets to top on initial entry when url has no hash", () => {
		const scrollTo = vi.fn();
		const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
			callback(0);
			return 11;
		});

		const frameId = scheduleHomeEntryScrollReset({
			requestAnimationFrame: requestAnimationFrame as (
				callback: FrameRequestCallback,
			) => number,
			scrollTo: scrollTo as (options: ScrollToOptions) => void,
		});

		expect(frameId).toBe(11);
		expect(requestAnimationFrame).toHaveBeenCalledOnce();
		expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
	});

	it("closes mobile drawer before scheduling section scroll", () => {
		const steps: string[] = [];
		const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
			steps.push("raf");
			callback(0);
			return 1;
		});

		handleMobileNavSelection("section-home-origin", {
			closeDrawer: () => steps.push("close"),
			onScrollToSection: () => steps.push("scroll"),
			requestAnimationFrame: requestAnimationFrame as (
				callback: FrameRequestCallback,
			) => number,
		});

		expect(steps).toEqual(["close", "raf", "scroll"]);
	});

	it("renders home shell and keeps unified video modal entry closed by default", () => {
		const queryClient = new QueryClient();
		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<HomePage />
			</QueryClientProvider>,
		);

		expect(html).toContain('id="main-content"');
		expect(html).toContain("家塾起源");
		expect(html).toContain('data-testid="home-video-modal-proxy"');
		expect(html).toContain('data-open="false"');
		expect(html).toContain("navigation.mobileMenuOpenAriaLabel");
		expect(html).not.toContain("navigation.mobileAriaLabel");
	});
});
