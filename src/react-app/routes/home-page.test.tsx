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

import { scheduleHomeEntryScrollReset } from "./home-page.scroll";
import { HomePage } from "./home-page";

describe("home page", () => {
	it("resets to top on initial entry when url has no hash", () => {
		const scrollTo = vi.fn();
		const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
			callback(0);
			return 11;
		});

		const frameId = scheduleHomeEntryScrollReset({
			hash: "",
			requestAnimationFrame: requestAnimationFrame as (
				callback: FrameRequestCallback,
			) => number,
			scrollTo: scrollTo as (options: ScrollToOptions) => void,
		});

		expect(frameId).toBe(11);
		expect(requestAnimationFrame).toHaveBeenCalledOnce();
		expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
	});

	it("keeps explicit hash anchor behavior on initial entry", () => {
		const scrollTo = vi.fn();
		const requestAnimationFrame = vi.fn();

		const frameId = scheduleHomeEntryScrollReset({
			hash: "#contact",
			requestAnimationFrame: requestAnimationFrame as (
				callback: FrameRequestCallback,
			) => number,
			scrollTo: scrollTo as (options: ScrollToOptions) => void,
		});

		expect(frameId).toBeNull();
		expect(requestAnimationFrame).not.toHaveBeenCalled();
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("renders home shell and keeps unified video modal entry closed by default", () => {
		const queryClient = new QueryClient();
		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<HomePage />
			</QueryClientProvider>,
		);

		expect(html).toContain('id="main-content"');
		expect(html).toContain('href="#philosophy"');
		expect(html).toContain('data-testid="home-video-modal-proxy"');
		expect(html).toContain('data-open="false"');
	});
});
