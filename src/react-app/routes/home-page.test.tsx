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

import { HomePage } from "./home-page";

describe("home page", () => {
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
