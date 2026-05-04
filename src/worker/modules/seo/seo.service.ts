import type { PublicVideoRecord } from "../video/video.service";

const HOME_TITLE = "童蒙家塾｜传播传统文化｜家庭教育系统";
const HOME_DESCRIPTION =
	"把传统文化与现代家庭教育结合为可执行步骤，围绕亲子关系、习惯养成与自主学习能力，提供长期可持续的方法系统。";
const DEFAULT_SHARE_IMAGE_PATH = "/apple-touch-icon.png";

type MetaTag = {
	key: string;
	attribute: "name" | "property";
	content: string;
};

export type SeoPageMeta = {
	title: string;
	description: string;
	imageUrl: string;
	canonicalPath: string;
};

const escapeRegex = (value: string) =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const escapeAttribute = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

const normalizeOrigin = (raw: string) => {
	try {
		return new URL(raw).origin;
	} catch {
		return raw;
	}
};

const toAbsoluteUrl = (raw: string | null | undefined, origin: string) => {
	if (!raw) return `${origin}${DEFAULT_SHARE_IMAGE_PATH}`;
	try {
		return new URL(raw, origin).toString();
	} catch {
		return `${origin}${DEFAULT_SHARE_IMAGE_PATH}`;
	}
};

const upsertTitle = (html: string, title: string) => {
	const titleTag = `<title>${escapeAttribute(title)}</title>`;
	if (/<title>[\s\S]*?<\/title>/i.test(html)) {
		return html.replace(/<title>[\s\S]*?<\/title>/i, titleTag);
	}
	if (html.includes("</head>")) {
		return html.replace("</head>", `${titleTag}\n</head>`);
	}
	return `${html}\n${titleTag}`;
};

const upsertMeta = (html: string, meta: MetaTag) => {
	const escapedKey = escapeRegex(meta.key);
	const pattern = new RegExp(
		`<meta\\b[^>]*\\b${meta.attribute}\\s*=\\s*["']${escapedKey}["'][^>]*>`,
		"i",
	);
	const nextTag = `<meta ${meta.attribute}="${meta.key}" content="${escapeAttribute(meta.content)}" />`;
	if (pattern.test(html)) {
		return html.replace(pattern, nextTag);
	}
	if (html.includes("</head>")) {
		return html.replace("</head>", `${nextTag}\n</head>`);
	}
	return `${html}\n${nextTag}`;
};

const upsertCanonical = (html: string, canonicalUrl: string) => {
	const nextTag = `<link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />`;
	if (/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i.test(html)) {
		return html.replace(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i, nextTag);
	}
	if (html.includes("</head>")) {
		return html.replace("</head>", `${nextTag}\n</head>`);
	}
	return `${html}\n${nextTag}`;
};

export class SeoService {
	buildVideoDescription(title: string) {
		return `${title}｜童蒙家塾家庭故事视频`;
	}

	getHomeMeta(origin: string): SeoPageMeta {
		const normalizedOrigin = normalizeOrigin(origin);
		return {
			title: HOME_TITLE,
			description: HOME_DESCRIPTION,
			imageUrl: `${normalizedOrigin}${DEFAULT_SHARE_IMAGE_PATH}`,
			canonicalPath: "/",
		};
	}

	getVideoMeta(input: {
		origin: string;
		streamVideoId: string;
		video: Pick<PublicVideoRecord, "title" | "posterUrl">;
	}): SeoPageMeta {
		const normalizedOrigin = normalizeOrigin(input.origin);
		const title = input.video.title.trim() || "家庭故事视频";
		return {
			title,
			description: this.buildVideoDescription(title),
			imageUrl: toAbsoluteUrl(input.video.posterUrl, normalizedOrigin),
			canonicalPath: `/video/${encodeURIComponent(input.streamVideoId)}`,
		};
	}

	renderMetaHtml(input: { html: string; meta: SeoPageMeta; origin: string }) {
		const normalizedOrigin = normalizeOrigin(input.origin);
		const canonicalUrl = `${normalizedOrigin}${input.meta.canonicalPath}`;
		const tags: MetaTag[] = [
			{
				key: "description",
				attribute: "name",
				content: input.meta.description,
			},
			{
				key: "og:title",
				attribute: "property",
				content: input.meta.title,
			},
			{
				key: "og:description",
				attribute: "property",
				content: input.meta.description,
			},
			{
				key: "og:image",
				attribute: "property",
				content: input.meta.imageUrl,
			},
			{
				key: "og:url",
				attribute: "property",
				content: canonicalUrl,
			},
			{
				key: "twitter:card",
				attribute: "name",
				content: "summary_large_image",
			},
			{
				key: "twitter:title",
				attribute: "name",
				content: input.meta.title,
			},
			{
				key: "twitter:description",
				attribute: "name",
				content: input.meta.description,
			},
			{
				key: "twitter:image",
				attribute: "name",
				content: input.meta.imageUrl,
			},
		];

		let nextHtml = upsertTitle(input.html, input.meta.title);
		for (const tag of tags) {
			nextHtml = upsertMeta(nextHtml, tag);
		}
		nextHtml = upsertCanonical(nextHtml, canonicalUrl);
		return nextHtml;
	}
}
