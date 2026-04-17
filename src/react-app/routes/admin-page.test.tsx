import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
	adminHomeSectionsQueryKey,
	adminVideosQueryKey,
} from "@/lib/query-options";
import { AdminPage } from "./admin-page";

const createSectionRecord = (overrides: {
	entryKey: string;
	latestContentJson: unknown;
}) => ({
	entryKey: overrides.entryKey,
	locale: "zh-CN" as const,
	status: "draft",
	publishedRevisionId: null,
	latestRevisionId: "rev-1",
	latestRevisionNo: 1,
	latestTitle: "section-title",
	latestSummaryMd: null,
	latestBodyMd: null,
	latestContentJson: overrides.latestContentJson,
	updatedAt: "2026-04-17T00:00:00.000Z",
});

describe("admin page", () => {
	it("keeps new tab editable even when backend has no revision for that key yet", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(adminHomeSectionsQueryKey("zh-CN"), [
			createSectionRecord({
				entryKey: "home.colearning",
				latestContentJson: {
					intro: "以陪伴为灯，以共学为路，以成长为果。",
					methods: [],
					benefits: [],
					caseHighlight: {
						title: "",
						summary: "",
						cta: { label: "", href: "#" },
					},
				},
			}),
		]);
		queryClient.setQueryData(adminVideosQueryKey, []);

		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<AdminPage />
			</QueryClientProvider>,
		);

		expect(html).toContain("Slogan 模块");
		expect(html).toContain("主句");
		expect(html).toContain("副句");
	});

	it("renders new editable module entries for slogan and videos", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(adminHomeSectionsQueryKey("zh-CN"), [
			createSectionRecord({
				entryKey: "home.hero_slogan",
				latestContentJson: {
					title: "三代同堂家风家学传承践行者",
					subtitle: "每个家庭都能有属于自己的童蒙家塾",
				},
			}),
		]);
		queryClient.setQueryData(adminVideosQueryKey, []);

		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<AdminPage />
			</QueryClientProvider>,
		);

		expect(html).toContain("首屏 Slogan");
		expect(html).toContain("首页核心视频");
		expect(html).toContain("角色视频列表");
		expect(html).toContain("主句");
		expect(html).toContain("副句");
	});

	it("renders main video selector with ready+published candidates only", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(adminHomeSectionsQueryKey("zh-CN"), [
			createSectionRecord({
				entryKey: "home.main_video",
				latestContentJson: {
					streamVideoId: "stream-ready-1",
				},
			}),
		]);
		queryClient.setQueryData(adminVideosQueryKey, [
			{
				id: "video-ready",
				streamVideoId: "stream-ready-1",
				processingStatus: "ready",
				publishStatus: "published",
				title: "Ready Video",
				posterUrl: null,
				durationSeconds: null,
				createdByAuthUserId: "auth-1",
				updatedByAuthUserId: "auth-1",
				createdAt: "2026-04-16T00:00:00.000Z",
				updatedAt: "2026-04-16T00:00:00.000Z",
				publishedAt: "2026-04-16T00:00:00.000Z",
			},
			{
				id: "video-draft",
				streamVideoId: "stream-draft-1",
				processingStatus: "ready",
				publishStatus: "draft",
				title: "Draft Video",
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
				<AdminPage initialEntryKey="home.main_video" />
			</QueryClientProvider>,
		);

		expect(html).toContain("核心视频（仅 ready + published）");
		expect(html).toContain("Ready Video");
		expect(html).not.toContain("Draft Video");
	});

	it("renders character videos editor and max limit hint", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(adminHomeSectionsQueryKey("zh-CN"), [
			createSectionRecord({
				entryKey: "home.character_videos",
				latestContentJson: {
					items: [{ streamVideoId: "stream-ready-1" }],
				},
			}),
		]);
		queryClient.setQueryData(adminVideosQueryKey, [
			{
				id: "video-ready",
				streamVideoId: "stream-ready-1",
				processingStatus: "ready",
				publishStatus: "published",
				title: "Role Video",
				posterUrl: null,
				durationSeconds: null,
				createdByAuthUserId: "auth-1",
				updatedByAuthUserId: "auth-1",
				createdAt: "2026-04-16T00:00:00.000Z",
				updatedAt: "2026-04-16T00:00:00.000Z",
				publishedAt: "2026-04-16T00:00:00.000Z",
			},
		]);

		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<AdminPage initialEntryKey="home.character_videos" />
			</QueryClientProvider>,
		);

		expect(html).toContain("角色视频列表（最多");
		expect(html).toContain("12");
		expect(html).toContain("Role Video");
		expect(html).toContain("上移");
		expect(html).toContain("下移");
	});
});
