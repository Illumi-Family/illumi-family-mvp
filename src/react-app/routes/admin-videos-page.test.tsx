import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { AdminVideosPage } from "./admin-videos-page";

describe("admin videos page", () => {
	it("renders page heading", () => {
		const queryClient = new QueryClient();
		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<AdminVideosPage />
			</QueryClientProvider>,
		);

		expect(html).toContain("Admin Videos");
		expect(html).toContain("Video Inventory");
	});

	it("shows delete draft action for draft records", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(["admin-videos"], [
			{
				id: "video-1",
				streamVideoId: "stream-1",
				processingStatus: "processing",
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

		expect(html).toContain("Delete Draft");
	});
});
