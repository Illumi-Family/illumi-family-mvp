import { getDb } from "../../shared/db/client";
import { AppError } from "../../shared/http/errors";
import { factory } from "../../shared/http/factory";
import type { AppBindings } from "../../types";
import { VideoRepository } from "../video/video.repository";
import { VideoService } from "../video/video.service";
import { SeoService } from "./seo.service";

const buildVideoService = (env: AppBindings) => {
	const db = getDb(env);
	const repository = new VideoRepository(db);
	return new VideoService(repository);
};

const FALLBACK_INDEX_HTML = `<!doctype html>
<html lang="zh-CN">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>童蒙家塾｜传播传统文化｜家庭教育系统</title>
		<script type="module">
			import RefreshRuntime from "/@react-refresh";
			RefreshRuntime.injectIntoGlobalHook(window);
			window.$RefreshReg$ = () => {};
			window.$RefreshSig$ = () => (type) => type;
			window.__vite_plugin_react_preamble_installed__ = true;
		</script>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/src/react-app/main.tsx"></script>
	</body>
</html>`;

const readRequestOrigin = (request: Request) => {
	const url = new URL(request.url);
	return `${url.protocol}//${url.host}`;
};

const fetchIndexHtml = async (request: Request, env: AppBindings) => {
	const assetFetcher = env.ASSETS?.fetch;
	if (typeof assetFetcher !== "function") {
		return FALLBACK_INDEX_HTML;
	}
	const response = await assetFetcher(new URL("/index.html", request.url));
	if (!response.ok) {
		return FALLBACK_INDEX_HTML;
	}
	return response.text();
};

const renderSeoHtmlResponse = (html: string) =>
	new Response(html, {
		status: 200,
		headers: {
			"content-type": "text/html; charset=UTF-8",
			"cache-control": "public, max-age=120",
		},
	});

export const getSeoHomePageHandlers = factory.createHandlers(async (c) => {
	const seoService = new SeoService();
	const origin = readRequestOrigin(c.req.raw);
	const meta = seoService.getHomeMeta(origin);
	const indexHtml = await fetchIndexHtml(c.req.raw, c.env);
	const rendered = seoService.renderMetaHtml({
		html: indexHtml,
		meta,
		origin,
	});
	return renderSeoHtmlResponse(rendered);
});

export const getSeoVideoPageHandlers = factory.createHandlers(async (c) => {
	const streamVideoId = c.req.param("streamVideoId")?.trim();
	if (!streamVideoId) {
		throw new AppError("BAD_REQUEST", "streamVideoId is required", 400);
	}

	const origin = readRequestOrigin(c.req.raw);
	const seoService = new SeoService();
	const videoService = buildVideoService(c.env);
	const videos = await videoService.listPublicVideos(c.env);
	const matchedVideo = videos.find((video) => video.streamVideoId === streamVideoId);
	if (!matchedVideo) {
		throw new AppError("NOT_FOUND", "Video not found", 404);
	}
	const meta = seoService.getVideoMeta({
		origin,
		streamVideoId,
		video: matchedVideo,
	});
	const indexHtml = await fetchIndexHtml(c.req.raw, c.env);
	const rendered = seoService.renderMetaHtml({
		html: indexHtml,
		meta,
		origin,
	});
	return renderSeoHtmlResponse(rendered);
});
