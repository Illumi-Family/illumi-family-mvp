import { asc, eq } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db/client";
import { users } from "../../shared/db/schema";
import { AppError } from "../../shared/http/errors";
import type { UpdateCurrentUserBody } from "./users.schema";

export class UsersRepository {
	constructor(private readonly db: AppDatabase) {}

	async getCurrentUser() {
		const records = await this.db
			.select()
			.from(users)
			.orderBy(asc(users.createdAt))
			.limit(1);

		return records[0] ?? null;
	}

	async updateCurrentUser(input: UpdateCurrentUserBody) {
		const currentUser = await this.getCurrentUser();
		if (!currentUser) {
			throw new AppError(
				"CURRENT_USER_NOT_FOUND",
				"Current user is not available",
				404,
			);
		}

		const now = new Date();
		await this.db
			.update(users)
			.set({
				name: input.name,
				updatedAt: now,
			})
			.where(eq(users.id, currentUser.id));

		return {
			...currentUser,
			name: input.name,
			updatedAt: now,
		};
	}
}
