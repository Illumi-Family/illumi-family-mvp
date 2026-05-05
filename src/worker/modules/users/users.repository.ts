import { eq } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db/client";
import { appUsers, authUsers } from "../../shared/db/schema";
import { AppError } from "../../shared/http/errors";
import type { UpdateCurrentUserBody } from "./users.schema";

export class UsersRepository {
	constructor(private readonly db: AppDatabase) {}

	async getCurrentUser(authUserId: string) {
		const authRecords = await this.db
			.select()
			.from(authUsers)
			.where(eq(authUsers.id, authUserId))
			.limit(1);

		const authUser = authRecords[0];
		if (!authUser) return null;

		const appUserRecords = await this.db
			.select({
				displayName: appUsers.displayName,
			})
			.from(appUsers)
			.where(eq(appUsers.authUserId, authUserId))
			.limit(1);

		return {
			id: authUser.id,
			email: authUser.email,
			name: appUserRecords[0]?.displayName || authUser.name,
			createdAt: authUser.createdAt,
			updatedAt: authUser.updatedAt,
		};
	}

	async updateCurrentUser(authUserId: string, input: UpdateCurrentUserBody) {
		const currentUser = await this.getCurrentUser(authUserId);
		if (!currentUser) {
			throw new AppError(
				"CURRENT_USER_NOT_FOUND",
				"Current user is not available",
				404,
			);
		}

		const now = new Date();
		const normalizedName = input.name.trim();
		await this.db
			.update(authUsers)
			.set({
				name: normalizedName,
				updatedAt: now,
			})
			.where(eq(authUsers.id, authUserId));
		await this.db
			.update(appUsers)
			.set({
				displayName: normalizedName,
				updatedAt: now,
			})
			.where(eq(appUsers.authUserId, authUserId));

		return {
			...currentUser,
			name: normalizedName,
			updatedAt: now,
		};
	}
}
