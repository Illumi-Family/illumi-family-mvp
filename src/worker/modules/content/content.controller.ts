import { getDb } from "../../shared/db/client";
import { AppError } from "../../shared/http/errors";
import { factory } from "../../shared/http/factory";
import { jsonSuccess } from "../../shared/http/response";
import { normalizeContentLocale } from "../../shared/i18n/locale";
import { readCacheJson, writeCacheJson } from "../../shared/storage/kv";
import { getObject } from "../../shared/storage/r2";
import type { AppBindings } from "../../types";
import { ContentRepository } from "./content.repository";
import { ContentService, type HomeContentPayload } from "./content.service";

const buildContentService = (env: AppBindings) => {
	const db = getDb(env);
	const repository = new ContentRepository(db);
	return new ContentService(repository);
};

export const getHomeContentHandlers = factory.createHandlers(async (c) => {
	const locale = normalizeContentLocale(c.req.query("locale"));
	const cacheKey = ContentService.getCacheKey(locale);
	const cached = await readCacheJson<HomeContentPayload>(c.env.CACHE, cacheKey);
	if (cached) {
		return jsonSuccess(c, cached);
	}

	const service = buildContentService(c.env);
	const payload = await service.getPublishedHomeContent(locale);
	await writeCacheJson(
		c.env.CACHE,
		cacheKey,
		payload,
		ContentService.getCacheTtlSeconds(),
	);
	return jsonSuccess(c, payload);
});

export const getAssetHandlers = factory.createHandlers(async (c) => {
	const assetId = c.req.param("assetId");
	if (!assetId) {
		throw new AppError("BAD_REQUEST", "assetId is required", 400);
	}

	const service = buildContentService(c.env);
	const repository = new ContentRepository(getDb(c.env));
	const asset = await repository.getAssetById(assetId);
	if (!asset) {
		throw new AppError("NOT_FOUND", "Asset not found", 404);
	}

	const object = await getObject(c.env.FILES, asset.r2Key);
	if (!object || !object.body) {
		throw new AppError("NOT_FOUND", "Asset object not found", 404);
	}

	const contentType = object.httpMetadata?.contentType ?? asset.mimeType;
	service.assertAssetContentType(contentType);

	const headers = new Headers();
	headers.set("Cache-Control", "public, max-age=300");
	headers.set("Content-Type", contentType ?? "application/octet-stream");
	if (asset.fileName) {
		headers.set("Content-Disposition", `inline; filename="${asset.fileName}"`);
	}

	return new Response(object.body, { status: 200, headers });
});
