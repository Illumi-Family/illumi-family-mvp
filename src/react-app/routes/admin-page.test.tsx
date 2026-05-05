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
	status?: string;
	publishedRevisionId?: string | null;
	latestRevisionId?: string | null;
	latestRevisionNo?: number | null;
}) => ({
	entryKey: overrides.entryKey,
	locale: "zh-CN" as const,
	status: overrides.status ?? "draft",
	publishedRevisionId: overrides.publishedRevisionId ?? null,
	latestRevisionId: overrides.latestRevisionId ?? "rev-1",
	latestRevisionNo: overrides.latestRevisionNo ?? 1,
	latestTitle: "section-title",
	latestSummaryMd: null,
	latestBodyMd: null,
	latestContentJson: overrides.latestContentJson,
	updatedAt: "2026-04-17T00:00:00.000Z",
});

describe("admin cms page", () => {
	it("renders only three cms modules and hides removed modules", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(adminHomeSectionsQueryKey("zh-CN"), []);
		queryClient.setQueryData(adminVideosQueryKey, []);

		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<AdminPage />
			</QueryClientProvider>,
		);

		expect(html).toContain("首屏核心视频");
		expect(html).toContain("角色视频列表");
		expect(html).toContain("家庭故事列表");
		expect(html).not.toContain("首屏 Slogan");
		expect(html).not.toContain("家风家学·理念");
		expect(html).not.toContain("践行感悟·日思");
		expect(html).not.toContain("三代同堂·故事");
		expect(html).not.toContain("家庭共学·陪伴");
		expect(html).not.toContain("ZH");
		expect(html).not.toContain("EN");
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

		expect(html).toContain("角色视频列表");
		expect(html).toContain("最多 12 条");
		expect(html).toContain("Role Video");
		expect(html).toContain("上移");
		expect(html).toContain("下移");
	});

	it("renders family story videos editor without max limit", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(adminHomeSectionsQueryKey("zh-CN"), [
			createSectionRecord({
				entryKey: "home.family_story_videos",
				latestContentJson: {
					items: [{ streamVideoId: "stream-story-1" }],
				},
			}),
		]);
		queryClient.setQueryData(adminVideosQueryKey, [
			{
				id: "video-story",
				streamVideoId: "stream-story-1",
				processingStatus: "ready",
				publishStatus: "published",
				title: "Family Story Video",
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
				<AdminPage initialEntryKey="home.family_story_videos" />
			</QueryClientProvider>,
		);

		expect(html).toContain("家庭故事列表");
		expect(html).toContain("不设条数上限");
		expect(html).not.toContain("最多 12 条");
		expect(html).toContain("Family Story Video");
	});

	it("renders published status for synchronized published revision", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(adminHomeSectionsQueryKey("zh-CN"), [
			createSectionRecord({
				entryKey: "home.main_video",
				latestContentJson: {
					streamVideoId: "stream-ready-1",
				},
				status: "published",
				publishedRevisionId: "rev-1",
				latestRevisionId: "rev-1",
				latestRevisionNo: 1,
			}),
		]);
		queryClient.setQueryData(adminVideosQueryKey, []);

		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<AdminPage initialEntryKey="home.main_video" />
			</QueryClientProvider>,
		);

		expect(html).toContain("已发布");
		expect(html).toContain("系统状态正常，可继续操作");
		expect(html).toContain("当前线上版本为 rev 1");
	});

	it("renders draft-not-published warning when latest differs from published revision", () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(adminHomeSectionsQueryKey("zh-CN"), [
			createSectionRecord({
				entryKey: "home.main_video",
				latestContentJson: {
					streamVideoId: "stream-ready-1",
				},
				status: "published",
				publishedRevisionId: "rev-1",
				latestRevisionId: "rev-2",
				latestRevisionNo: 2,
			}),
		]);
		queryClient.setQueryData(adminVideosQueryKey, []);

		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<AdminPage initialEntryKey="home.main_video" />
			</QueryClientProvider>,
		);

		expect(html).toContain("草稿未发布");
		expect(html).toContain("线上仍为已发布旧版本");
	});
});
