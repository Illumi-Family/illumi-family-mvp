import { zValidator } from "@hono/zod-validator";
import { requireAdminSession } from "../../shared/auth/session";
import { getDb } from "../../shared/db/client";
import { AppError } from "../../shared/http/errors";
import { factory } from "../../shared/http/factory";
import { jsonSuccess } from "../../shared/http/response";
import type { AppBindings } from "../../types";
import { VideoRepository } from "./video.repository";
import {
	adminVideoImportBodySchema,
	adminVideoIdParamSchema,
	adminVideoUpdateBodySchema,
	adminVideoUploadUrlBodySchema,
} from "./video.schema";
import { VideoService } from "./video.service";

const buildVideoService = (env: AppBindings) => {
	const db = getDb(env);
	const repository = new VideoRepository(db);
	return new VideoService(repository);
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

const requireVideoId = factory.createMiddleware(async (c, next) => {
	const parsed = adminVideoIdParamSchema.safeParse(c.req.param());
	if (!parsed.success) {
		throw new AppError("BAD_REQUEST", "Invalid video id", 400, {
			issues: parsed.error.issues,
		});
	}
	c.set("videoId", parsed.data.videoId);
	await next();
});

export const listAdminVideosHandlers = factory.createHandlers(
	requireAdminSession,
	async (c) => {
		const service = buildVideoService(c.env);
		const videos = await service.listAdminVideos();
		return jsonSuccess(c, { videos });
	},
);

export const createAdminVideoUploadUrlHandlers = factory.createHandlers(
	requireAdminSession,
	requireJsonBody,
	zValidator("json", adminVideoUploadUrlBodySchema),
	async (c) => {
		const authUserId = c.get("authUserId");
		if (!authUserId) {
			throw new AppError("UNAUTHORIZED", "Authentication required", 401);
		}
		const service = buildVideoService(c.env);
		const result = await service.issueUploadUrl(c.env, {
			authUserId,
			body: c.req.valid("json"),
		});
		return jsonSuccess(c, result, 201);
	},
);

export const importAdminVideoHandlers = factory.createHandlers(
	requireAdminSession,
	requireJsonBody,
	zValidator("json", adminVideoImportBodySchema),
	async (c) => {
		const authUserId = c.get("authUserId");
		if (!authUserId) {
			throw new AppError("UNAUTHORIZED", "Authentication required", 401);
		}
		const service = buildVideoService(c.env);
		const result = await service.importExistingVideo(c.env, {
			authUserId,
			body: c.req.valid("json"),
		});
		return jsonSuccess(c, result, result.reused ? 200 : 201);
	},
);

export const updateAdminVideoHandlers = factory.createHandlers(
	requireAdminSession,
	requireVideoId,
	requireJsonBody,
	zValidator("json", adminVideoUpdateBodySchema),
	async (c) => {
		const authUserId = c.get("authUserId");
		const videoId = c.get("videoId");
		if (!authUserId) {
			throw new AppError("UNAUTHORIZED", "Authentication required", 401);
		}
		if (!videoId) {
			throw new AppError("BAD_REQUEST", "Invalid video id", 400);
		}
		const service = buildVideoService(c.env);
		const video = await service.updateVideoMetadata(c.env, {
			videoId,
			authUserId,
			body: c.req.valid("json"),
		});
		return jsonSuccess(c, { video });
	},
);

export const publishAdminVideoHandlers = factory.createHandlers(
	requireAdminSession,
	requireVideoId,
	async (c) => {
		const authUserId = c.get("authUserId");
		const videoId = c.get("videoId");
		if (!authUserId) {
			throw new AppError("UNAUTHORIZED", "Authentication required", 401);
		}
		if (!videoId) {
			throw new AppError("BAD_REQUEST", "Invalid video id", 400);
		}
		const service = buildVideoService(c.env);
		const result = await service.publishVideo(c.env, { videoId, authUserId });
		return jsonSuccess(c, result);
	},
);

export const unpublishAdminVideoHandlers = factory.createHandlers(
	requireAdminSession,
	requireVideoId,
	async (c) => {
		const authUserId = c.get("authUserId");
		const videoId = c.get("videoId");
		if (!authUserId) {
			throw new AppError("UNAUTHORIZED", "Authentication required", 401);
		}
		if (!videoId) {
			throw new AppError("BAD_REQUEST", "Invalid video id", 400);
		}
		const service = buildVideoService(c.env);
		const result = await service.unpublishVideo(c.env, { videoId, authUserId });
		return jsonSuccess(c, result);
	},
);

export const syncAdminVideoStatusHandlers = factory.createHandlers(
	requireAdminSession,
	requireVideoId,
	async (c) => {
		const authUserId = c.get("authUserId");
		const videoId = c.get("videoId");
		if (!authUserId) {
			throw new AppError("UNAUTHORIZED", "Authentication required", 401);
		}
		if (!videoId) {
			throw new AppError("BAD_REQUEST", "Invalid video id", 400);
		}
		const service = buildVideoService(c.env);
		const video = await service.syncVideoStatus(c.env, { videoId, authUserId });
		return jsonSuccess(c, { video });
	},
);

export const cleanupAdminVideoDraftHandlers = factory.createHandlers(
	requireAdminSession,
	requireVideoId,
	async (c) => {
		const authUserId = c.get("authUserId");
		const videoId = c.get("videoId");
		if (!authUserId) {
			throw new AppError("UNAUTHORIZED", "Authentication required", 401);
		}
		if (!videoId) {
			throw new AppError("BAD_REQUEST", "Invalid video id", 400);
		}
		const service = buildVideoService(c.env);
		const result = await service.cleanupDraftVideo(c.env, { videoId, authUserId });
		return jsonSuccess(c, result);
	},
);

export const syncAdminVideoCatalogHandlers = factory.createHandlers(
	requireAdminSession,
	async (c) => {
		const authUserId = c.get("authUserId");
		if (!authUserId) {
			throw new AppError("UNAUTHORIZED", "Authentication required", 401);
		}
		const service = buildVideoService(c.env);
		const summary = await service.syncCatalogFromStream(c.env, { authUserId });
		return jsonSuccess(c, summary);
	},
);
