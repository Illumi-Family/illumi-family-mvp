import { Hono } from "hono";
import { adminRouter } from "./modules/admin/admin.router";
import { authRouter } from "./modules/auth/auth.router";
import { contentRouter } from "./modules/content/content.router";
import { healthRouter } from "./modules/health/health.router";
import { seoRouter } from "./modules/seo/seo.router";
import { usersRouter } from "./modules/users/users.router";
import { streamWebhookRouter } from "./modules/video/stream-webhook.router";
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
	app.route("/api/admin", adminRouter);
	app.route("/api/content", contentRouter);
	app.route("/api/webhooks", streamWebhookRouter);
	app.route("/", seoRouter);

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
