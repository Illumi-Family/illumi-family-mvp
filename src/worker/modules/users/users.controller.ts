import { zValidator } from "@hono/zod-validator";
import { getDb } from "../../shared/db/client";
import { AppError } from "../../shared/http/errors";
import { factory } from "../../shared/http/factory";
import { jsonSuccess } from "../../shared/http/response";
import type { AppBindings } from "../../types";
import { UsersRepository } from "./users.repository";
import { createUserBodySchema } from "./users.schema";
import { UsersService } from "./users.service";

const buildUsersService = (env: AppBindings) => {
	const db = getDb(env);
	const repository = new UsersRepository(db);
	return new UsersService(repository);
};

const requireJsonBody = factory.createMiddleware(async (c, next) => {
	const contentType = c.req.header("content-type")?.toLowerCase() ?? "";
	if (!contentType.includes("application/json")) {
		throw new AppError(
			"UNSUPPORTED_MEDIA_TYPE",
			"Content-Type must be application/json",
			415,
		);
	}

	await next();
});

export const listUsersHandlers = factory.createHandlers(async (c) => {
	const service = buildUsersService(c.env);
	const users = await service.listUsers();
	return jsonSuccess(c, { users });
});

export const createUserHandlers = factory.createHandlers(
	requireJsonBody,
	zValidator("json", createUserBodySchema),
	async (c) => {
		const service = buildUsersService(c.env);
		const created = await service.createUser(c.req.valid("json"));
		return jsonSuccess(c, { user: created }, 201);
	},
);
