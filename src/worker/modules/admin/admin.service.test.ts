import { describe, expect, it, vi } from "vitest";
import { AdminService } from "./admin.service";

describe("admin service", () => {
	it("publishes revision and clears cache key", async () => {
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
			},
		);

		expect(repository.publishHomeSection).toHaveBeenCalled();
		expect(deleteSpy).toHaveBeenCalled();
		expect(result.changed).toBe(true);
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
