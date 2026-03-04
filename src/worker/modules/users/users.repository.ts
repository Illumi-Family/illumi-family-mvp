import { eq } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db/client";
import { users } from "../../shared/db/schema";
import { AppError } from "../../shared/http/errors";
import type { CreateUserBody } from "./users.schema";

export class UsersRepository {
	constructor(private readonly db: AppDatabase) {}

	listUsers() {
		return this.db.select().from(users).orderBy(users.createdAt);
	}

	async createUser(input: CreateUserBody) {
		const existing = await this.db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, input.email))
			.limit(1);

		if (existing.length > 0) {
			throw new AppError("USER_EMAIL_TAKEN", "Email already exists", 409);
		}

		const now = new Date();
		const record = {
			id: crypto.randomUUID(),
			email: input.email,
			name: input.name,
			createdAt: now,
			updatedAt: now,
		};

		await this.db.insert(users).values(record);
		return record;
	}
}
