import { zValidator } from "@hono/zod-validator";
import { createAuth } from "../../shared/auth/better-auth";
import { requireAuthSession } from "../../shared/auth/session";
import { getDb } from "../../shared/db/client";
import { AppError } from "../../shared/http/errors";
import { factory } from "../../shared/http/factory";
import { jsonSuccess } from "../../shared/http/response";
import { buildAuthService } from "./auth.service";
import { rollbackIdentityBodySchema } from "./auth.schema";

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

export const authProxyHandlers = factory.createHandlers(async (c) => {
	const auth = createAuth(c.env);
	return auth.handler(c.req.raw);
});

export const rollbackIdentityHandlers = factory.createHandlers(
	requireAuthSession,
	requireJsonBody,
	zValidator("json", rollbackIdentityBodySchema),
	async (c) => {
		const authUserId = c.get("authUserId");
		if (!authUserId) {
			throw new AppError("UNAUTHORIZED", "Authentication required", 401);
		}

		const service = buildAuthService(getDb(c.env));
		const result = await service.rollbackIdentity({
			authUserId,
			...c.req.valid("json"),
		});

		return jsonSuccess(c, {
			changed: result.changed,
		});
	},
);
