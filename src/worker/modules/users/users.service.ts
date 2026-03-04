import type { CreateUserBody } from "./users.schema";
import { UsersRepository } from "./users.repository";

export class UsersService {
	constructor(private readonly repository: UsersRepository) {}

	listUsers() {
		return this.repository.listUsers();
	}

	createUser(input: CreateUserBody) {
		return this.repository.createUser(input);
	}
}
