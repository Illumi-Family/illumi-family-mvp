import type { UpdateCurrentUserBody } from "./users.schema";
import { UsersRepository } from "./users.repository";

export class UsersService {
	constructor(private readonly repository: UsersRepository) {}

	async getCurrentUser() {
		const user = await this.repository.getCurrentUser();
		if (!user) return null;
		return user;
	}

	updateCurrentUser(input: UpdateCurrentUserBody) {
		return this.repository.updateCurrentUser(input);
	}
}
