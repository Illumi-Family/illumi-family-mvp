import { describe, expect, it } from "vitest";
import { parseHomeSectionContent, parseTypedHomeSectionContent } from "./content.schema";

describe("home section payload schema", () => {
	it("parses hero slogan and featured video sections", () => {
		const slogan = parseTypedHomeSectionContent("home.hero_slogan", {
			title: "三代同堂家风家学传承践行者",
			subtitle: "每个家庭都能有属于自己的童蒙家塾",
		});
		const mainVideo = parseTypedHomeSectionContent("home.main_video", {
			streamVideoId: "stream-main-1",
		});
		const characters = parseTypedHomeSectionContent("home.character_videos", {
			items: [{ streamVideoId: "stream-char-1" }],
		});

		expect(slogan.title).toContain("三代同堂");
		expect(mainVideo.streamVideoId).toBe("stream-main-1");
		expect(characters.items[0]?.streamVideoId).toBe("stream-char-1");
	});

	it("allows empty character videos list for draft save", () => {
		const parsed = parseTypedHomeSectionContent("home.character_videos", {
			items: [],
		});
		expect(parsed.items).toEqual([]);
	});

	it("parses philosophy section payload", () => {
		const parsed = parseTypedHomeSectionContent("home.philosophy", {
			intro: "理念引导",
			items: [{ title: "静定", description: "先安顿身心" }],
		});
		expect(parsed.items[0]?.title).toBe("静定");
	});

	it("rejects invalid hero slogan payload", () => {
		expect(() =>
			parseHomeSectionContent("home.hero_slogan", {
				subtitle: "缺少主句",
			}),
		).toThrowError();
	});

	it("rejects invalid stories payload", () => {
		expect(() =>
			parseHomeSectionContent("home.stories", {
				items: [{ title: "故事", summary: "内容", status: "invalid" }],
			}),
		).toThrowError();
	});
});
