import type { UpdateCurrentUserBody } from "./users.schema";
import { UsersRepository } from "./users.repository";

export class UsersService {
	constructor(private readonly repository: UsersRepository) {}

	async getCurrentUser(authUserId: string) {
		const user = await this.repository.getCurrentUser(authUserId);
		if (!user) return null;
		return user;
	}

	updateCurrentUser(authUserId: string, input: UpdateCurrentUserBody) {
		return this.repository.updateCurrentUser(authUserId, input);
	}
}
