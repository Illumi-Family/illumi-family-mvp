import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { VideosPage } from "./videos-page";
import { router } from "@/router";

vi.mock("@/i18n/context", () => ({
	useAppI18n: () => ({
		locale: "zh-CN" as const,
		lang: "zh" as const,
		switchLocale: () => {},
	}),
}));

describe("videos page", () => {
	it("registers public watch route at /video and removes /videos route", () => {
		const paths = router.routeTree.children.map((route) => route.path);
		expect(paths).toContain("video");
		expect(paths).not.toContain("videos");
	});

	it("renders sticky watch player and grouped collections", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(["public-videos"], [
			{
				id: "video-1",
				streamVideoId: "stream-1",
				title: "示例视频标题",
				posterUrl: null,
				durationSeconds: 42,
				publishedAt: "2026-05-01T00:00:00.000Z",
			},
			{
				id: "video-2",
				streamVideoId: "stream-2",
				title: "角色视频一",
				posterUrl: null,
				durationSeconds: 61,
				publishedAt: "2026-05-01T00:00:00.000Z",
			},
			{
				id: "video-3",
				streamVideoId: "stream-3",
				title: "家庭故事一",
				posterUrl: null,
				durationSeconds: 88,
				publishedAt: "2026-05-01T00:00:00.000Z",
			},
		]);
		queryClient.setQueryData(["home-content", "zh-CN"], {
			heroSlogan: { title: "A", subtitle: "B" },
			featuredVideos: {
				main: { streamVideoId: "" },
				characters: { items: [{ streamVideoId: "stream-2" }] },
				familyStories: { items: [{ streamVideoId: "stream-3" }] },
			},
			philosophy: { intro: "", items: [] },
			dailyNotes: { items: [] },
			stories: { items: [] },
			colearning: {
				intro: "",
				methods: [],
				benefits: [],
				caseHighlight: {
					title: "",
					summary: "",
					cta: { label: "", href: "" },
				},
			},
			locale: "zh-CN",
			fallbackFrom: [],
			updatedAt: "2026-05-05T00:00:00.000Z",
		});
		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<VideosPage />
			</QueryClientProvider>,
		);

		expect(html).toContain("示例视频标题");
		expect(html).toContain("video-watch-sticky-player-shell");
		expect(html).toContain("video-watch-collection-characters");
		expect(html).toContain("video-watch-collection-familyStories");
		expect(html).toContain("video-watch-collection-public");
	});
});
