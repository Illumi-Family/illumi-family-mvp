import { describe, expect, it } from "vitest";
import { parseHomeSectionContent, parseTypedHomeSectionContent } from "./content.schema";

describe("home section payload schema", () => {
	it("parses philosophy section payload", () => {
		const parsed = parseTypedHomeSectionContent("home.philosophy", {
			intro: "理念引导",
			items: [{ title: "静定", description: "先安顿身心" }],
		});
		expect(parsed.items[0]?.title).toBe("静定");
	});

	it("rejects invalid stories payload", () => {
		expect(() =>
			parseHomeSectionContent("home.stories", {
				items: [{ title: "故事", summary: "内容", status: "invalid" }],
			}),
		).toThrowError();
	});
});
