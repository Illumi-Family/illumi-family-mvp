import { zValidator } from "@hono/zod-validator";
import { getDb } from "../../shared/db/client";
import { requireAdminSession } from "../../shared/auth/session";
import { AppError } from "../../shared/http/errors";
import { factory } from "../../shared/http/factory";
import { jsonSuccess } from "../../shared/http/response";
import type { AppBindings } from "../../types";
import { AdminRepository } from "./admin.repository";
import {
	adminAssetUploadBodySchema,
	adminHomeSectionParamSchema,
	adminPublishHomeSectionBodySchema,
	adminUpsertHomeSectionBodySchema,
} from "./admin.schema";
import { AdminService } from "./admin.service";

const buildAdminService = (env: AppBindings) => {
	const db = getDb(env);
	const repository = new AdminRepository(db);
	return new AdminService(repository);
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

const requireHomeSectionKey = factory.createMiddleware(async (c, next) => {
	const parsed = adminHomeSectionParamSchema.safeParse(c.req.param());
	if (!parsed.success) {
		throw new AppError("BAD_REQUEST", "Invalid home section key", 400, {
			issues: parsed.error.issues,
		});
	}
	c.set("homeSectionEntryKey", parsed.data.entryKey);
	await next();
});

export const adminMeHandlers = factory.createHandlers(
	requireAdminSession,
	async (c) => {
		const authUserId = c.get("authUserId");
		const service = buildAdminService(c.env);
		return jsonSuccess(c, {
			me: service.getMe({ authUserId: authUserId ?? "" }),
		});
	},
);

export const adminListHomeContentHandlers = factory.createHandlers(
	requireAdminSession,
	async (c) => {
		const service = buildAdminService(c.env);
		const sections = await service.listHomeSections();
		return jsonSuccess(c, { sections });
	},
);

export const adminSaveHomeContentDraftHandlers = factory.createHandlers(
	requireAdminSession,
	requireHomeSectionKey,
	requireJsonBody,
	zValidator("json", adminUpsertHomeSectionBodySchema),
	async (c) => {
		const authUserId = c.get("authUserId");
		const entryKey = c.get("homeSectionEntryKey");
		if (!authUserId) {
			throw new AppError("UNAUTHORIZED", "Authentication required", 401);
		}
		if (!entryKey) {
			throw new AppError("BAD_REQUEST", "Invalid home section key", 400);
		}
		const service = buildAdminService(c.env);
		const result = await service.saveHomeSectionDraft({
			entryKey,
			body: c.req.valid("json"),
			authUserId,
		});
		return jsonSuccess(c, result, 201);
	},
);

export const adminPublishHomeContentHandlers = factory.createHandlers(
	requireAdminSession,
	requireHomeSectionKey,
	requireJsonBody,
	zValidator("json", adminPublishHomeSectionBodySchema),
	async (c) => {
		const entryKey = c.get("homeSectionEntryKey");
		if (!entryKey) {
			throw new AppError("BAD_REQUEST", "Invalid home section key", 400);
		}
		const service = buildAdminService(c.env);
		const result = await service.publishHomeSection(c.env, {
			entryKey,
			body: c.req.valid("json"),
		});
		return jsonSuccess(c, result);
	},
);

export const adminUploadAssetHandlers = factory.createHandlers(
	requireAdminSession,
	requireJsonBody,
	zValidator("json", adminAssetUploadBodySchema),
	async (c) => {
		const authUserId = c.get("authUserId");
		if (!authUserId) {
			throw new AppError("UNAUTHORIZED", "Authentication required", 401);
		}
		const service = buildAdminService(c.env);
		const result = await service.uploadAsset(c.env, {
			...c.req.valid("json"),
			authUserId,
		});
		return jsonSuccess(c, { asset: result }, 201);
	},
);
