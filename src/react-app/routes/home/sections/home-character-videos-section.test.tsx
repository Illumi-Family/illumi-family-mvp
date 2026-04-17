import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ResolvedHomeFeaturedVideo } from "@/routes/home/home-featured-videos";
import { HomeCharacterVideosSection } from "./home-character-videos-section";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { message?: string }) =>
			options?.message ? `${key}:${options.message}` : key,
	}),
}));

const createItem = (
	overrides: Partial<ResolvedHomeFeaturedVideo> = {},
): ResolvedHomeFeaturedVideo => ({
	key: overrides.key ?? "character-grandparent",
	streamVideoId: overrides.streamVideoId ?? "stream-character",
	roleLabel: overrides.roleLabel ?? "祖辈篇",
	title: overrides.title ?? "祖辈篇 · 家学根脉",
	status: overrides.status ?? "ready",
	video:
		overrides.video === undefined
			? {
					id: "video-character",
					streamVideoId: "stream-character",
					title: "祖辈篇 · 家学根脉",
					posterUrl: "/poster-role.png",
					durationSeconds: 96,
					publishedAt: "2026-04-01T00:00:00.000Z",
				}
			: overrides.video,
	isDuplicateConfiguredId: overrides.isDuplicateConfiguredId ?? false,
});

describe("home-character-videos-section", () => {
	it("renders loading skeleton state while videos are loading", () => {
		const html = renderToStaticMarkup(
			createElement(HomeCharacterVideosSection, {
				items: [],
				isLoading: true,
				isError: false,
				errorMessage: null,
				onRetry: () => {},
				onPlay: () => {},
				onPlayIntent: () => {},
			}),
		);

		expect(html).toContain("animate-pulse");
		expect(html).toContain("homeVideo.charactersTitle");
	});

	it("renders playable and unavailable cards with different affordances", () => {
		const html = renderToStaticMarkup(
			createElement(HomeCharacterVideosSection, {
				items: [
					createItem({
						key: "character-ready",
						title: "角色视频一",
						status: "ready",
					}),
					createItem({
						key: "character-missing",
						title: "角色视频二",
						status: "missing",
						video: null,
					}),
				],
				isLoading: false,
				isError: false,
				errorMessage: null,
				onRetry: () => {},
				onPlay: () => {},
				onPlayIntent: () => {},
			}),
		);

		expect(html).toContain("homeVideo.cardPlay");
		expect(html).toContain("homeVideo.cardUnavailable");
		expect(html).toContain("角色视频一");
		expect(html).toContain("角色视频二");
	});

	it("renders error panel with retry when query fails", () => {
		const html = renderToStaticMarkup(
			createElement(HomeCharacterVideosSection, {
				items: [],
				isLoading: false,
				isError: true,
				errorMessage: "network down",
				onRetry: () => {},
				onPlay: () => {},
				onPlayIntent: () => {},
			}),
		);

		expect(html).toContain("homeVideo.charactersError:network down");
		expect(html).toContain("homeVideo.retry");
	});
});
