import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

type MockQueryState = {
	homeContentLoading: boolean;
	publicVideosLoading: boolean;
};

const queryState: MockQueryState = {
	homeContentLoading: false,
	publicVideosLoading: false,
};

vi.mock("@tanstack/react-query", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@tanstack/react-query")>();
	let callCount = 0;
	return {
		...actual,
		useQuery: (...args: Parameters<typeof actual.useQuery>) => {
			callCount += 1;
			if (callCount % 2 === 1) {
				return {
					data: undefined,
					isLoading: queryState.homeContentLoading,
					isError: false,
					error: null,
					refetch: vi.fn(),
				} as ReturnType<typeof actual.useQuery>;
			}
			return {
				data: [],
				isLoading: queryState.publicVideosLoading,
				isError: false,
				error: null,
				refetch: vi.fn(),
			} as ReturnType<typeof actual.useQuery>;
		},
	};
});

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

const homeMainVideoSectionSpy = vi.fn();

vi.mock("@/routes/home/sections/home-main-video-section", () => ({
	HomeMainVideoSection: (props: {
		isLoading: boolean;
		isError: boolean;
		errorMessage: string | null;
	}) => {
		homeMainVideoSectionSpy(props);
		return <div data-testid="home-main-video-section-mock" />;
	},
}));

import {
	handleMobileNavSelection,
	scheduleHomeEntryScrollReset,
} from "./home-page.scroll";
import { HomePage } from "./home-page";

describe("home page", () => {
	afterEach(() => {
		queryState.homeContentLoading = false;
		queryState.publicVideosLoading = false;
		homeMainVideoSectionSpy.mockReset();
	});

	it("keeps main video in loading state while home content query is pending", () => {
		queryState.homeContentLoading = true;
		queryState.publicVideosLoading = false;

		const queryClient = new QueryClient();
		renderToString(
			<QueryClientProvider client={queryClient}>
				<HomePage />
			</QueryClientProvider>,
		);

		expect(homeMainVideoSectionSpy).toHaveBeenCalled();
		expect(homeMainVideoSectionSpy.mock.calls[0][0]).toMatchObject({
			isLoading: true,
			isError: false,
		});
	});

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

	it("renders home shell without public video modal entry", () => {
		const queryClient = new QueryClient();
		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<HomePage />
			</QueryClientProvider>,
		);

		expect(html).toContain('id="main-content"');
		expect(html).toContain("家塾起源");
		expect(html).toContain("navigation.mobileMenuOpenAriaLabel");
		expect(html).not.toContain("navigation.mobileAriaLabel");
	});
});
