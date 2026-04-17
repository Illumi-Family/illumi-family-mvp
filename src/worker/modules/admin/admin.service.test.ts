import { describe, expect, it, vi } from "vitest";
import { AdminService } from "./admin.service";

describe("admin service", () => {
	it("saveHomeSectionDraft mirrors shared section to zh-CN and en-US", async () => {
		const repository = {
			listVideoPublishStatesByStreamVideoIds: vi.fn().mockResolvedValue([]),
			createHomeSectionDrafts: vi.fn().mockResolvedValue([
				{
					locale: "zh-CN",
					entryId: "entry-zh",
					revisionId: "rev-zh",
					revisionNo: 7,
				},
				{
					locale: "en-US",
					entryId: "entry-en",
					revisionId: "rev-en",
					revisionNo: 7,
				},
			]),
		};
		const service = new AdminService(repository as never);

		const result = await service.saveHomeSectionDraft({
			entryKey: "home.hero_slogan",
			locale: "en-US",
			authUserId: "auth-1",
			body: {
				title: "Slogan",
				contentJson: {
					title: "A family values practitioner",
					subtitle: "Every home can be a school",
				},
			},
		});

		expect(repository.createHomeSectionDrafts).toHaveBeenCalledWith({
			entryKey: "home.hero_slogan",
			locales: ["zh-CN", "en-US"],
			authUserId: "auth-1",
			body: {
				title: "Slogan",
				contentJson: {
					title: "A family values practitioner",
					subtitle: "Every home can be a school",
				},
			},
		});
		expect(result).toEqual({
			entryId: "entry-en",
			revisionId: "rev-en",
			revisionNo: 7,
		});
	});

	it("publishing shared section clears zh-CN and en-US home cache keys", async () => {
		const repository = {
			getHomeSectionRevisionContent: vi
				.fn()
				.mockResolvedValueOnce({
					found: true,
					entryId: "entry-zh",
					revisionId: "rev-zh",
					contentJson: {
						title: "三代同堂家风家学传承践行者",
						subtitle: "每个家庭都能有属于自己的童蒙家塾",
					},
				})
				.mockResolvedValueOnce({
					found: true,
					entryId: "entry-en",
					revisionId: "rev-en",
					contentJson: {
						title: "A family values practitioner",
						subtitle: "Every home can be a school",
					},
				}),
			listVideoPublishStatesByStreamVideoIds: vi.fn().mockResolvedValue([]),
			publishHomeSections: vi.fn().mockResolvedValue({
				changed: true,
				results: [
					{ locale: "zh-CN", entryId: "entry-zh", revisionId: "rev-zh" },
					{ locale: "en-US", entryId: "entry-en", revisionId: "rev-en" },
				],
			}),
		};
		const service = new AdminService(repository as never);
		const deleteSpy = vi
			.spyOn((await import("../../shared/storage/kv")), "deleteCacheKey")
			.mockResolvedValue(undefined);

		const result = await service.publishHomeSection(
			{ CACHE: {} } as never,
			{
				entryKey: "home.hero_slogan",
				body: { revisionId: "rev-zh" },
				locale: "zh-CN",
			},
		);

		expect(repository.publishHomeSections).toHaveBeenCalledWith({
			entries: [
				{
					entryKey: "home.hero_slogan",
					locale: "zh-CN",
					revisionId: "rev-zh",
				},
				{
					entryKey: "home.hero_slogan",
					locale: "en-US",
					revisionId: "rev-en",
				},
			],
		});
		expect(deleteSpy).toHaveBeenCalledTimes(2);
		expect(deleteSpy).toHaveBeenNthCalledWith(
			1,
			{},
			"cms:home:published:v1:zh-CN",
		);
		expect(deleteSpy).toHaveBeenNthCalledWith(
			2,
			{},
			"cms:home:published:v1:en-US",
		);
		expect(result.changed).toBe(true);
		deleteSpy.mockRestore();
	});

	it("publishing non-shared en-US clears only en-US home cache key", async () => {
		const repository = {
			getHomeSectionRevisionContent: vi.fn().mockResolvedValue({
				found: true,
				entryId: "entry-1",
				revisionId: "rev-1",
				contentJson: {
					intro: "Philosophy",
					items: [{ title: "Calmness", description: "desc" }],
				},
			}),
			listVideoPublishStatesByStreamVideoIds: vi.fn().mockResolvedValue([]),
			publishHomeSection: vi.fn().mockResolvedValue({
				changed: true,
				entryId: "entry-1",
				revisionId: "rev-1",
			}),
		};
		const service = new AdminService(repository as never);
		const deleteSpy = vi
			.spyOn((await import("../../shared/storage/kv")), "deleteCacheKey")
			.mockResolvedValue(undefined);

		await service.publishHomeSection(
			{ CACHE: {} } as never,
			{
				entryKey: "home.philosophy",
				body: {},
				locale: "en-US",
			},
		);

		expect(repository.publishHomeSection).toHaveBeenCalledWith({
			entryKey: "home.philosophy",
			locale: "en-US",
			revisionId: "rev-1",
		});
		expect(deleteSpy).toHaveBeenCalledTimes(1);
		expect(deleteSpy).toHaveBeenNthCalledWith(
			1,
			{},
			"cms:home:published:v1:en-US",
		);
		deleteSpy.mockRestore();
	});

	it("blocks save when selected video is not ready and published", async () => {
		const repository = {
			listVideoPublishStatesByStreamVideoIds: vi.fn().mockResolvedValue([
				{
					streamVideoId: "stream-main-1",
					processingStatus: "processing",
					publishStatus: "draft",
				},
			]),
			createHomeSectionDraft: vi.fn(),
		};
		const service = new AdminService(repository as never);

		await expect(
			service.saveHomeSectionDraft({
				entryKey: "home.main_video",
				locale: "zh-CN",
				authUserId: "auth-1",
				body: {
					title: "Main Video",
					contentJson: {
						streamVideoId: "stream-main-1",
					},
				},
			}),
		).rejects.toThrow("Selected videos must be ready and published");
	});

	it("rejects non-image content type when uploading asset", async () => {
		const repository = {
			createAsset: vi.fn(),
		};
		const service = new AdminService(repository as never);

		await expect(
			service.uploadAsset(
				{ APP_ENV: "dev", FILES: {} } as never,
				{
					fileName: "x.txt",
					contentType: "text/plain",
					dataBase64: "aGVsbG8=",
					authUserId: "auth-1",
				},
			),
		).rejects.toThrow("Asset must be image content type");
	});
});
