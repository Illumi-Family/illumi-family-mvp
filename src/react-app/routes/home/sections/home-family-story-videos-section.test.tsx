import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ResolvedHomeFeaturedVideo } from "@/routes/home/home-featured-videos";
import type { HomeFamilyStoriesConfig } from "@/routes/home-page.data";
import { HomeFamilyStoryVideosSection } from "./home-family-story-videos-section";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { message?: string }) =>
			options?.message ? `${key}:${options.message}` : key,
	}),
}));

const config: HomeFamilyStoriesConfig = {
	sectionId: "section-home-family-stories",
	label: "家庭故事",
	title: "家庭故事视频",
	description: "家庭故事区描述",
	streamVideoIds: [],
};

const createItem = (
	overrides: Partial<ResolvedHomeFeaturedVideo> = {},
): ResolvedHomeFeaturedVideo => ({
	key: overrides.key ?? "family-story-1",
	streamVideoId: overrides.streamVideoId ?? "stream-family-story-1",
	roleLabel: overrides.roleLabel ?? "家庭故事",
	title: overrides.title ?? "家庭故事一",
	status: overrides.status ?? "ready",
	video:
		overrides.video === undefined
			? {
					id: "video-family-story-1",
					streamVideoId: "stream-family-story-1",
					title: "家庭故事一",
					posterUrl: "/poster-family-story-1.png",
					durationSeconds: 100,
					publishedAt: "2026-05-01T00:00:00.000Z",
				}
			: overrides.video,
	isDuplicateConfiguredId: overrides.isDuplicateConfiguredId ?? false,
});

describe("home-family-story-videos-section", () => {
	it("always appends one placeholder card after video cards", () => {
		const html = renderToStaticMarkup(
			createElement(HomeFamilyStoryVideosSection, {
				config,
				items: [
					createItem({ key: "family-story-1", title: "家庭故事一" }),
					createItem({ key: "family-story-2", title: "家庭故事二" }),
				],
				isLoading: false,
				isError: false,
				errorMessage: null,
				onRetry: () => {},
				onPlay: () => {},
				onPlayIntent: () => {},
			}),
		);

		const lastVideoTitleIndex = html.lastIndexOf("家庭故事二");
		const placeholderIndex = html.lastIndexOf("home.familyStoriesPlaceholder");

		expect(lastVideoTitleIndex).toBeGreaterThan(-1);
		expect(placeholderIndex).toBeGreaterThan(lastVideoTitleIndex);
		expect(html).toContain('data-testid="home-family-story-placeholder-card"');
		expect(html).toContain('data-testid="home-family-story-placeholder-icon"');
		expect(html).toContain("home.familyStoriesPlaceholderHint");
	});

	it("renders placeholder card when no family story videos are available", () => {
		const html = renderToStaticMarkup(
			createElement(HomeFamilyStoryVideosSection, {
				config,
				items: [],
				isLoading: false,
				isError: false,
				errorMessage: null,
				onRetry: () => {},
				onPlay: () => {},
				onPlayIntent: () => {},
			}),
		);

		expect(html).toContain('data-testid="home-family-story-placeholder-card"');
		expect(html).toContain("home.familyStoriesPlaceholder");
		expect(html).toContain("home.familyStoriesPlaceholderHint");
		expect(html).not.toContain("home.familyStoriesEmpty");
	});

	it("renders loading skeleton while query is pending", () => {
		const html = renderToStaticMarkup(
			createElement(HomeFamilyStoryVideosSection, {
				config,
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
		expect(html.match(/animate-pulse/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
		expect(html).not.toContain('data-testid="home-family-story-placeholder-card"');
	});

	it("renders error panel and hides placeholder card on error", () => {
		const html = renderToStaticMarkup(
			createElement(HomeFamilyStoryVideosSection, {
				config,
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
		expect(html).not.toContain('data-testid="home-family-story-placeholder-card"');
	});
});
