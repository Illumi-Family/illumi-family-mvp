import { describe, expect, it } from "vitest";
import {
	defaultHomeContent,
	homeBusinessContactContent,
	homeContentMatrixContent,
	homeOriginContent,
	siteNavigation,
	getHomePageData,
} from "./home-page.data";

describe("official website home data", () => {
	it("contains five non-hash navigation sections", () => {
		expect(siteNavigation.map((item) => item.sectionId)).toEqual([
			"section-home-origin",
			"section-home-character-videos",
			"section-home-family-stories",
			"section-home-content-matrix",
			"section-home-business",
		]);
	});

	it("locks home origin copy from requirement source", () => {
		expect(homeOriginContent.ipIntro[0]).toContain("童蒙家塾");
		expect(homeOriginContent.brandVision[0]).toContain("传统文化");
	});

	it("defines matrix and business contact blocks", () => {
		expect(homeContentMatrixContent.items).toHaveLength(4);
		expect(homeBusinessContactContent.phone).toBe("13570380204");
		expect(homeBusinessContactContent.email).toBe("contact@illumi-family.com");
	});

	it("keeps zh and en locale structures aligned", () => {
		const zh = getHomePageData("zh-CN");
		const en = getHomePageData("en-US");
		expect(zh.siteNavigation).toHaveLength(5);
		expect(en.siteNavigation).toHaveLength(5);
		expect(zh.homeContentMatrixContent.items).toHaveLength(4);
		expect(en.homeContentMatrixContent.items).toHaveLength(4);
	});

	it("keeps slogan fallback and dynamic featured videos defaults", () => {
		const zh = getHomePageData("zh-CN");
		expect(defaultHomeContent.heroSlogan.title).toBe(zh.heroContent.title);
		expect(defaultHomeContent.heroSlogan.subtitle).toBe(zh.heroContent.subtitle);
		expect(defaultHomeContent.featuredVideos.main.streamVideoId).toBe("");
		expect(defaultHomeContent.featuredVideos.characters.items).toEqual([]);
	});
});
