import { Hono } from "hono";
import { authRouter } from "./modules/auth/auth.router";
import { healthRouter } from "./modules/health/health.router";
import { usersRouter } from "./modules/users/users.router";
import { handleAppError } from "./shared/http/middleware/error-handler";
import { requestIdMiddleware } from "./shared/http/middleware/request-id";
import { jsonFailure, jsonSuccess } from "./shared/http/response";
import type { AppContext } from "./types";

export const createApp = () => {
	const app = new Hono<AppContext>();

	app.use("*", requestIdMiddleware);

	app.get("/api/", (c) => jsonSuccess(c, { name: "illumi-family-mvp" }));
	app.route("/api/health", healthRouter);
	app.route("/api/auth", authRouter);
	app.route("/api/users", usersRouter);

	app.all("/api/*", (c) =>
		jsonFailure(
			c,
			{ code: "ROUTE_NOT_FOUND", message: "Route not found" },
			404,
		),
	);

	app.onError((error, c) => handleAppError(error, c));

	return app;
};
