import { AppError } from "../http/errors";
import { factory } from "../http/factory";
import { createAuth } from "./better-auth";
import type { AppBindings } from "../../types";

export type AuthSessionPayload = {
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
	};
	user: {
		id: string;
		email: string;
		emailVerified: boolean;
		name: string;
	};
};

export const getAuthSession = async (
	env: AppBindings,
	request: Request,
): Promise<AuthSessionPayload | null> => {
	try {
		const auth = createAuth(env);
		const session = await auth.api.getSession({
			headers: request.headers,
			query: { disableRefresh: true },
		});
		if (!session) return null;
		return session as AuthSessionPayload;
	} catch {
		return null;
	}
};

export const requireAuthSession = factory.createMiddleware(async (c, next) => {
	const session = await getAuthSession(c.env, c.req.raw);
	if (!session) {
		throw new AppError("UNAUTHORIZED", "Authentication required", 401);
	}
	c.set("authUserId", session.user.id);
	await next();
});
