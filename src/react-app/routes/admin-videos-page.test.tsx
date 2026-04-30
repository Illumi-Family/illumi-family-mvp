import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { AdminVideosPage } from "./admin-videos-page";

describe("admin videos page", () => {
	it("renders workbench heading and list section", () => {
		const queryClient = new QueryClient();
		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<AdminVideosPage />
			</QueryClientProvider>,
		);

		expect(html).toContain("视频管理工作台");
		expect(html).toContain("导入已有 Stream 视频");
		expect(html).toContain("新上传会创建新的 Stream 计费对象");
		expect(html).toContain("视频列表");
		expect(html).toContain("同步 Stream 目录");
	});

	it("shows row actions and more menu trigger for records", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(["admin-videos"], [
			{
				id: "video-1",
				streamVideoId: "stream-1",
				processingStatus: "ready",
				publishStatus: "draft",
				title: "Video 1",
				posterUrl: null,
				durationSeconds: null,
				createdByAuthUserId: "auth-1",
				updatedByAuthUserId: "auth-1",
				createdAt: "2026-04-16T00:00:00.000Z",
				updatedAt: "2026-04-16T00:00:00.000Z",
				publishedAt: null,
			},
		]);
		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<AdminVideosPage />
			</QueryClientProvider>,
		);

		expect(html).toContain("预览");
		expect(html).toContain("发布");
		expect(html).toContain("更多");
	});
});
