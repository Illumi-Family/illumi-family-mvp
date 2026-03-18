import { describe, expect, it, vi } from "vitest";
import { AdminService } from "./admin.service";

describe("admin service", () => {
	it("publishing zh-CN clears zh-CN and en-US home cache keys", async () => {
		const repository = {
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

		const result = await service.publishHomeSection(
			{ CACHE: {} } as never,
			{
				entryKey: "home.philosophy",
				body: {},
				locale: "zh-CN",
			},
		);

		expect(repository.publishHomeSection).toHaveBeenCalledWith({
			entryKey: "home.philosophy",
			locale: "zh-CN",
			revisionId: undefined,
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

	it("publishing en-US clears only en-US home cache key", async () => {
		const repository = {
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
			revisionId: undefined,
		});
		expect(deleteSpy).toHaveBeenCalledTimes(1);
		expect(deleteSpy).toHaveBeenNthCalledWith(
			1,
			{},
			"cms:home:published:v1:en-US",
		);
		deleteSpy.mockRestore();
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
