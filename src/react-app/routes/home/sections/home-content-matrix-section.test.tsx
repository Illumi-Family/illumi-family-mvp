import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { HomeContentMatrixContent } from "@/routes/home-page.data";
import { HomeContentMatrixSection } from "./home-content-matrix-section";

const content: HomeContentMatrixContent = {
	sectionId: "section-home-content-matrix",
	label: "发现更多",
	title: "多平台内容矩阵",
	description: "本期仅展示平台二维码，不提供点击跳转。",
	items: [
		{
			platform: "小红书",
			qrImageSrc: "/images/social/xhs.jpg",
			qrImageAlt: "童蒙家塾小红书二维码",
		},
		{
			platform: "B 站",
			qrImageSrc: "/images/social/bilibili.jpg",
			qrImageAlt: "童蒙家塾B站二维码",
		},
		{
			platform: "抖音",
			qrImageSrc: "/images/social/douyin.jpg",
			qrImageAlt: "童蒙家塾抖音二维码",
		},
		{
			platform: "微信视频号",
			qrImageSrc: "/images/social/wechat.jpg",
			qrImageAlt: "童蒙家塾微信视频号二维码",
		},
	],
};

describe("home-content-matrix-section", () => {
	it("renders four qr triggers mapped to content items", () => {
		const html = renderToStaticMarkup(
			createElement(HomeContentMatrixSection, {
				content,
			}),
		);

		expect(html).toContain('id="section-home-content-matrix"');
		expect(html.match(/type="button"/g)?.length).toBe(4);
		expect(html).toContain("小红书二维码预览");
		expect(html).toContain("B 站二维码预览");
		expect(html).toContain("抖音二维码预览");
		expect(html).toContain("微信视频号二维码预览");
		expect(html).toContain("/images/social/xhs.jpg");
		expect(html).toContain("/images/social/bilibili.jpg");
		expect(html).toContain("/images/social/douyin.jpg");
		expect(html).toContain("/images/social/wechat.jpg");
	});

	it("keeps preview disabled in initial SSR output to avoid desktop-triggered modal", () => {
		const html = renderToStaticMarkup(
			createElement(HomeContentMatrixSection, {
				content,
			}),
		);

		expect(html).toContain('data-mobile-preview-enabled="false"');
		expect(html).toContain('aria-disabled="true"');
		expect(html).not.toContain('role="dialog"');
		expect(html).not.toContain("可长按保存或识别二维码");
	});
});
