import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { VideosPage } from "./videos-page";
import { router } from "@/router";

describe("videos page", () => {
	it("registers public watch route at /video and removes /videos route", () => {
		const paths = router.routeTree.children.map((route) => route.path);
		expect(paths).toContain("video");
		expect(paths).not.toContain("videos");
	});

	it("renders watch-page heading and inline playback hint", () => {
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
		]);
		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<VideosPage />
			</QueryClientProvider>,
		);

		expect(html).toContain("示例视频标题");
		expect(html).not.toContain("视频中心");
		expect(html).not.toContain("顶部主播放区负责播放，点击下方卡片可切换视频。");
		expect(html).not.toContain("点击卡片即可进入沉浸播放。");
	});
});
