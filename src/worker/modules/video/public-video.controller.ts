import { getDb } from "../../shared/db/client";
import { factory } from "../../shared/http/factory";
import { jsonSuccess } from "../../shared/http/response";
import type { AppBindings } from "../../types";
import { VideoRepository } from "./video.repository";
import { VideoService } from "./video.service";

const buildVideoService = (env: AppBindings) => {
	const db = getDb(env);
	const repository = new VideoRepository(db);
	return new VideoService(repository);
};

export const listPublicVideosHandlers = factory.createHandlers(async (c) => {
	const service = buildVideoService(c.env);
	const videos = await service.listPublicVideos(c.env);
	return jsonSuccess(c, { videos });
});
