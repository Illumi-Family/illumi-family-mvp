import { zValidator } from "@hono/zod-validator";
import { getDb } from "../../shared/db/client";
import { AppError } from "../../shared/http/errors";
import { factory } from "../../shared/http/factory";
import { jsonSuccess } from "../../shared/http/response";
import type { AppBindings } from "../../types";
import { UsersRepository } from "./users.repository";
import { updateCurrentUserBodySchema } from "./users.schema";
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

export const getCurrentUserHandlers = factory.createHandlers(async (c) => {
	const service = buildUsersService(c.env);
	const user = await service.getCurrentUser();
	if (!user) {
		throw new AppError(
			"CURRENT_USER_NOT_FOUND",
			"Current user is not available",
			404,
		);
	}

	return jsonSuccess(c, { user });
});

export const updateCurrentUserHandlers = factory.createHandlers(
	requireJsonBody,
	zValidator("json", updateCurrentUserBodySchema),
	async (c) => {
		const service = buildUsersService(c.env);
		const user = await service.updateCurrentUser(c.req.valid("json"));
		return jsonSuccess(c, { user });
	},
);
