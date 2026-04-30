import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ResolvedHomeFeaturedVideo } from "@/routes/home/home-featured-videos";
import { HomeMainVideoSection } from "./home-main-video-section";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { message?: string }) =>
			options?.message ? `${key}:${options.message}` : key,
	}),
}));

vi.mock("@cloudflare/stream-react", () => ({
	Stream: (props: {
		src: string;
		autoplay?: boolean;
		muted?: boolean;
		loop?: boolean;
		controls?: boolean;
		letterboxColor?: string;
		preload?: string;
		poster?: string;
		width?: string;
		height?: string;
	}) =>
		createElement("div", {
			"data-testid": "stream-player",
			"data-src": props.src,
			"data-autoplay": String(Boolean(props.autoplay)),
			"data-muted": String(Boolean(props.muted)),
			"data-loop": String(Boolean(props.loop)),
			"data-controls": String(Boolean(props.controls)),
			"data-letterbox-color": props.letterboxColor ?? "",
			"data-preload": props.preload ?? "",
			"data-poster": props.poster ?? "",
			"data-width": props.width ?? "",
			"data-height": props.height ?? "",
		}),
}));

const createFeaturedVideo = (
	overrides: Partial<ResolvedHomeFeaturedVideo> = {},
): ResolvedHomeFeaturedVideo => ({
	key: overrides.key ?? "main-family-video",
	streamVideoId: overrides.streamVideoId ?? "stream-main",
	roleLabel: overrides.roleLabel ?? "全家福主片",
	title: overrides.title ?? "全家福主片",
	status: overrides.status ?? "ready",
	video:
		overrides.video === undefined
			? {
					id: "video-main",
					streamVideoId: "stream-main",
					title: "全家福主片",
					posterUrl: "/poster-main.png",
					durationSeconds: 188,
					publishedAt: "2026-04-01T00:00:00.000Z",
				}
			: overrides.video,
	isDuplicateConfiguredId: overrides.isDuplicateConfiguredId ?? false,
});

describe("home-main-video-section", () => {
	it("renders loading placeholder while public videos query is pending", () => {
		const html = renderToStaticMarkup(
			createElement(HomeMainVideoSection, {
				video: createFeaturedVideo(),
				isLoading: true,
				isError: false,
				errorMessage: null,
				onRetry: () => {},
			}),
		);

		expect(html).toContain("home-main-video-query-skeleton");
		expect(html).toContain("sr-only");
		expect(html).toContain("homeVideo.heroLoading");
		expect(html).toContain("homeVideo.heroLabel");
		expect(html).toContain("aspect-video");
	});

	it("renders missing fallback state when main video is not configured", () => {
		const html = renderToStaticMarkup(
			createElement(HomeMainVideoSection, {
				video: createFeaturedVideo({
					title: "全家福 · 家风传承纪实",
					status: "missing",
					video: null,
				}),
				isLoading: false,
				isError: false,
				errorMessage: null,
				onRetry: () => {},
			}),
		);

		expect(html).toContain("全家福 · 家风传承纪实");
		expect(html).toContain("homeVideo.heroMissing");
	});

	it("renders stream player shell with metadata preload before play intent", () => {
		const html = renderToStaticMarkup(
			createElement(HomeMainVideoSection, {
				video: createFeaturedVideo(),
				isLoading: false,
				isError: false,
				errorMessage: null,
				onRetry: () => {},
			}),
		);

		expect(html).toContain('data-testid="stream-player"');
		expect(html).toContain('data-preload="metadata"');
		expect(html).toContain('data-controls="true"');
		expect(html).toContain("aspect-video");
	});

	it("keeps startup loading hint in markup for accessibility", () => {
		const html = renderToStaticMarkup(
			createElement(HomeMainVideoSection, {
				video: createFeaturedVideo(),
				isLoading: false,
				isError: false,
				errorMessage: null,
				onRetry: () => {},
			}),
		);

		expect(html).toContain('data-testid="stream-player"');
		expect(html).not.toContain("主视频加载中");
	});

	it("renders retry affordance on query error", () => {
		const html = renderToStaticMarkup(
			createElement(HomeMainVideoSection, {
				video: createFeaturedVideo(),
				isLoading: false,
				isError: true,
				errorMessage: "request timeout",
				onRetry: () => {},
			}),
		);

		expect(html).toContain("homeVideo.retry");
		expect(html).toContain("homeVideo.heroError:request timeout");
	});
});
