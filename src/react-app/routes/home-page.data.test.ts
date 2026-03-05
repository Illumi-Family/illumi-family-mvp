import { describe, expect, it } from "vitest";
import {
	aboutContent,
	colearningMethods,
	dailyNotes,
	footerContent,
	heroContent,
	philosophyItems,
	siteNavigation,
	stories,
} from "./home-page.data";

describe("official website home data", () => {
	it("contains all required anchor sections", () => {
		expect(siteNavigation.map((item) => item.href)).toEqual([
			"#philosophy",
			"#daily",
			"#stories",
			"#colearning",
			"#about",
			"#contact",
		]);
	});

	it("keeps core content blocks non-empty", () => {
		expect(heroContent.title.length).toBeGreaterThan(0);
		expect(philosophyItems.length).toBeGreaterThanOrEqual(3);
		expect(dailyNotes.length).toBeGreaterThanOrEqual(3);
		expect(colearningMethods.length).toBeGreaterThanOrEqual(3);
		expect(aboutContent.roles.length).toBeGreaterThan(0);
		expect(footerContent.links.length).toBeGreaterThan(0);
	});

	it("defines both published and coming soon story states", () => {
		const statuses = new Set(stories.map((story) => story.status));
		expect(statuses.has("published")).toBe(true);
		expect(statuses.has("coming_soon")).toBe(true);

		stories.forEach((story) => {
			if (story.status === "published") {
				expect(typeof story.link).toBe("string");
				expect(story.link?.length).toBeGreaterThan(0);
			}
		});
	});
});
