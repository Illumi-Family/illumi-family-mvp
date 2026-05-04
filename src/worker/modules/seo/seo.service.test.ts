import { describe, expect, it } from "vitest";
import { SeoService } from "./seo.service";

describe("seo service", () => {
	it("builds video meta with poster fallback and canonical path", () => {
		const service = new SeoService();
		const meta = service.getVideoMeta({
			origin: "https://illumi-family.com",
			streamVideoId: "stream-1",
			video: {
				title: "家庭故事·第一集",
				posterUrl: null,
			},
		});

		expect(meta.title).toBe("家庭故事·第一集");
		expect(meta.description).toContain("童蒙家塾家庭故事视频");
		expect(meta.imageUrl).toBe("https://illumi-family.com/apple-touch-icon.png");
		expect(meta.canonicalPath).toBe("/video/stream-1");
	});

	it("renders html meta tags with updated values", () => {
		const service = new SeoService();
		const html = `<!doctype html><html><head><meta name="description" content="old" /><title>old</title></head><body></body></html>`;
		const rendered = service.renderMetaHtml({
			html,
			origin: "https://illumi-family.com",
			meta: {
				title: "新标题",
				description: "新描述",
				imageUrl: "https://illumi-family.com/new.png",
				canonicalPath: "/video/stream-2",
			},
		});

		expect(rendered).toContain("<title>新标题</title>");
		expect(rendered).toContain('name="description" content="新描述"');
		expect(rendered).toContain('property="og:title" content="新标题"');
		expect(rendered).toContain('property="og:image" content="https://illumi-family.com/new.png"');
		expect(rendered).toContain(
			'<link rel="canonical" href="https://illumi-family.com/video/stream-2" />',
		);
	});
});
