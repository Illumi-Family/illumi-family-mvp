import { describe, expect, it } from "vitest";
import { getLegalPageContent } from "./legal-pages.data";

describe("legal pages data", () => {
	it("provides all legal pages in zh-CN and en-US with required metadata", () => {
		const pageKeys = ["privacy", "minorProtection", "copyright"] as const;
		for (const pageKey of pageKeys) {
			const zh = getLegalPageContent("zh-CN", pageKey);
			const en = getLegalPageContent("en-US", pageKey);

			expect(zh.version).toBe("v1.0");
			expect(en.version).toBe("v1.0");
			expect(zh.contactEmail).toBe("contact@illumi-family.com");
			expect(en.contactEmail).toBe("contact@illumi-family.com");
			expect(zh.sections.length).toBeGreaterThan(0);
			expect(en.sections.length).toBeGreaterThan(0);
		}
	});

	it("contains official release notice in both locales", () => {
		const zh = getLegalPageContent("zh-CN", "privacy");
		const en = getLegalPageContent("en-US", "privacy");
		expect(zh.reviewNotice).toContain("正式发布");
		expect(en.reviewNotice).toContain("Official release");
	});

	it("contains explicit legal basis and reporting instructions", () => {
		const zhPrivacy = getLegalPageContent("zh-CN", "privacy");
		const zhMinor = getLegalPageContent("zh-CN", "minorProtection");
		const zhCopyright = getLegalPageContent("zh-CN", "copyright");
		expect(zhPrivacy.summary).toContain("《个人信息保护法》");
		expect(zhMinor.summary).toContain("《未成年人网络保护条例》");
		expect(zhCopyright.summary).toContain("《著作权法》");
		expect(zhMinor.sections[zhMinor.sections.length - 1]?.body).toContain(
			"问题说明",
		);
		expect(zhCopyright.sections[3]?.body).toContain("身份证明");
	});
});
