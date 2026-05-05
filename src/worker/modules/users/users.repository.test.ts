import { describe, expect, it, vi } from "vitest";
import { appUsers, authUsers } from "../../shared/db/schema";
import { AppError } from "../../shared/http/errors";
import { UsersRepository } from "./users.repository";

describe("users repository", () => {
	it("loads current user by auth user id", async () => {
		const authRow = {
			id: "auth-1",
			email: "user@example.com",
			name: "Auth Name",
			emailVerified: true,
			image: null,
			createdAt: new Date("2026-05-01T00:00:00.000Z"),
			updatedAt: new Date("2026-05-01T01:00:00.000Z"),
		};

		const appRow = {
			displayName: "Display Name",
		};

		const authLimit = vi.fn().mockResolvedValue([authRow]);
		const authWhere = vi.fn().mockReturnValue({ limit: authLimit });
		const authFrom = vi.fn().mockReturnValue({ where: authWhere });

		const appLimit = vi.fn().mockResolvedValue([appRow]);
		const appWhere = vi.fn().mockReturnValue({ limit: appLimit });
		const appFrom = vi.fn().mockReturnValue({ where: appWhere });

		const db = {
			select: vi
				.fn()
				.mockReturnValueOnce({ from: authFrom })
				.mockReturnValueOnce({ from: appFrom }),
		};

		const repository = new UsersRepository(db as never);
		const result = await repository.getCurrentUser("auth-1");

		expect(result).toEqual({
			id: "auth-1",
			email: "user@example.com",
			name: "Display Name",
			createdAt: authRow.createdAt,
			updatedAt: authRow.updatedAt,
		});
	});

	it("throws CURRENT_USER_NOT_FOUND when auth user does not exist", async () => {
		const authLimit = vi.fn().mockResolvedValue([]);
		const authWhere = vi.fn().mockReturnValue({ limit: authLimit });
		const authFrom = vi.fn().mockReturnValue({ where: authWhere });

		const db = {
			select: vi.fn().mockReturnValue({ from: authFrom }),
			update: vi.fn(),
		};

		const repository = new UsersRepository(db as never);
		await expect(
			repository.updateCurrentUser("missing-auth-user", { name: "Next Name" }),
		).rejects.toMatchObject({
			code: "CURRENT_USER_NOT_FOUND",
			status: 404,
		} satisfies Pick<AppError, "code" | "status">);
		expect(db.update).not.toHaveBeenCalled();
	});

	it("updates auth_users and app_users display name for current auth user", async () => {
		const authRow = {
			id: "auth-1",
			email: "user@example.com",
			name: "Before",
			emailVerified: true,
			image: null,
			createdAt: new Date("2026-05-01T00:00:00.000Z"),
			updatedAt: new Date("2026-05-01T01:00:00.000Z"),
		};

		const authLimit = vi.fn().mockResolvedValue([authRow]);
		const authWhere = vi.fn().mockReturnValue({ limit: authLimit });
		const authFrom = vi.fn().mockReturnValue({ where: authWhere });

		const appLimit = vi.fn().mockResolvedValue([{ displayName: "Before" }]);
		const appWhere = vi.fn().mockReturnValue({ limit: appLimit });
		const appFrom = vi.fn().mockReturnValue({ where: appWhere });

		const updateAuthWhere = vi.fn().mockResolvedValue(undefined);
		const updateAuthSet = vi.fn().mockReturnValue({ where: updateAuthWhere });
		const updateAppWhere = vi.fn().mockResolvedValue(undefined);
		const updateAppSet = vi.fn().mockReturnValue({ where: updateAppWhere });

		const db = {
			select: vi
				.fn()
				.mockReturnValueOnce({ from: authFrom })
				.mockReturnValueOnce({ from: appFrom }),
			update: vi
				.fn()
				.mockReturnValueOnce({ set: updateAuthSet })
				.mockReturnValueOnce({ set: updateAppSet }),
		};

		const repository = new UsersRepository(db as never);
		const result = await repository.updateCurrentUser("auth-1", {
			name: "  New Display Name  ",
		});

		expect(db.update).toHaveBeenNthCalledWith(1, authUsers);
		expect(db.update).toHaveBeenNthCalledWith(2, appUsers);
		expect(updateAuthSet).toHaveBeenCalledWith({
			name: "New Display Name",
			updatedAt: expect.any(Date),
		});
		expect(updateAppSet).toHaveBeenCalledWith({
			displayName: "New Display Name",
			updatedAt: expect.any(Date),
		});
		expect(result).toMatchObject({
			id: "auth-1",
			email: "user@example.com",
			name: "New Display Name",
		});
	});
});
