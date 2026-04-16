import { getDb } from "../../shared/db/client";
import { AppError } from "../../shared/http/errors";
import { factory } from "../../shared/http/factory";
import { jsonSuccess } from "../../shared/http/response";
import { STREAM_WEBHOOK_SIGNATURE_HEADER } from "../../shared/integrations/stream/stream-webhook";
import type { AppBindings } from "../../types";
import { VideoRepository } from "./video.repository";
import { VideoService } from "./video.service";

const buildVideoService = (env: AppBindings) => {
	const db = getDb(env);
	const repository = new VideoRepository(db);
	return new VideoService(repository);
};

export const ingestStreamWebhookHandlers = factory.createHandlers(async (c) => {
	const rawBody = await c.req.text();
	if (!rawBody.trim()) {
		throw new AppError("BAD_REQUEST", "Webhook body is required", 400);
	}

	let payload: unknown;
	try {
		payload = JSON.parse(rawBody) as unknown;
	} catch {
		throw new AppError("BAD_REQUEST", "Webhook body must be valid JSON", 400);
	}

	const service = buildVideoService(c.env);
	const result = await service.ingestStreamWebhook(c.env, {
		rawBody,
		signature: c.req.header(STREAM_WEBHOOK_SIGNATURE_HEADER),
		payload,
	});
	return jsonSuccess(c, result, 202);
});
