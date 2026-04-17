import { describe, expect, it, vi } from "vitest";
import { ContentService } from "./content.service";

describe("content service", () => {
	it("returns aggregated home content from published sections", async () => {
		const service = new ContentService({
			getPublishedHomeSectionContent: async () =>
				new Map([
					[
						"home.hero_slogan",
						{
							title: "三代同堂家风家学传承践行者",
							subtitle: "每个家庭都能有属于自己的童蒙家塾",
						},
					],
					[
						"home.main_video",
						{
							streamVideoId: "stream-main-1",
						},
					],
					[
						"home.character_videos",
						{
							items: [
								{ streamVideoId: "stream-char-1" },
								{ streamVideoId: "stream-char-2" },
							],
						},
					],
					[
						"home.philosophy",
						{ intro: "理念", items: [{ title: "静定", description: "先定" }] },
					],
					[
						"home.daily_notes",
						{
							items: [
								{
									date: "2026-03-06",
									title: "日思",
									summary: "summary",
									tags: ["tag"],
								},
							],
						},
					],
					[
						"home.stories",
						{
							items: [
								{
									title: "故事",
									summary: "summary",
									publishDate: "2026-03-06",
									duration: "10:00",
									status: "published",
								},
							],
						},
					],
					[
						"home.colearning",
						{
							intro: "共学",
							methods: [{ title: "共读", description: "desc" }],
							benefits: ["benefit"],
							caseHighlight: {
								title: "案例",
								summary: "summary",
								cta: { label: "查看", href: "#" },
							},
						},
					],
				]),
		} as never);

		const result = await service.getPublishedHomeContent("zh-CN");
		expect(result.heroSlogan.title).toContain("三代同堂");
		expect(result.featuredVideos.main.streamVideoId).toBe("stream-main-1");
		expect(result.featuredVideos.characters.items).toHaveLength(2);
		expect(result.philosophy.items[0]?.title).toBe("静定");
		expect(result.dailyNotes.items.length).toBe(1);
		expect(result.stories.items[0]?.status).toBe("published");
		expect(result.colearning.methods[0]?.title).toBe("共读");
		expect(result.locale).toBe("zh-CN");
		expect(result.fallbackFrom).toEqual([]);
	});

	it("falls back to zh-CN per entry when target locale content is missing or invalid", async () => {
		const getPublishedHomeSectionContent = vi
			.fn()
			.mockImplementation(async (locale: string) => {
				if (locale === "en-US") {
					return new Map([
						[
							"home.hero_slogan",
							{
								title: "A family values practitioner",
								subtitle: "Every home can be a school",
							},
						],
						[
							"home.main_video",
							{
								streamVideoId: 123,
							},
						],
						[
							"home.philosophy",
							{
								intro: "Philosophy",
								items: [{ title: "Calmness", description: "desc" }],
							},
						],
						[
							"home.stories",
							{
								items: [
									{
										title: "",
										summary: "invalid",
										publishDate: "2026-03-06",
										duration: "10:00",
										status: "published",
									},
								],
							},
						],
					]);
				}
				return new Map([
					[
						"home.hero_slogan",
						{
							title: "三代同堂家风家学传承践行者",
							subtitle: "每个家庭都能有属于自己的童蒙家塾",
						},
					],
					[
						"home.main_video",
						{
							streamVideoId: "stream-main-zh",
						},
					],
					[
						"home.character_videos",
						{
							items: [{ streamVideoId: "stream-char-zh-1" }],
						},
					],
					[
						"home.philosophy",
						{
							intro: "理念",
							items: [{ title: "静定", description: "先定" }],
						},
					],
					[
						"home.daily_notes",
						{
							items: [
								{
									date: "2026-03-06",
									title: "日思",
									summary: "summary",
									tags: ["tag"],
								},
							],
						},
					],
					[
						"home.stories",
						{
							items: [
								{
									title: "故事",
									summary: "summary",
									publishDate: "2026-03-06",
									duration: "10:00",
									status: "published",
								},
							],
						},
					],
					[
						"home.colearning",
						{
							intro: "共学",
							methods: [{ title: "共读", description: "desc" }],
							benefits: ["benefit"],
							caseHighlight: {
								title: "案例",
								summary: "summary",
								cta: { label: "查看", href: "#" },
							},
						},
					],
				]);
			});
		const service = new ContentService({
			getPublishedHomeSectionContent,
		} as never);

		const result = await service.getPublishedHomeContent("en-US");

		expect(getPublishedHomeSectionContent).toHaveBeenCalledWith("en-US");
		expect(getPublishedHomeSectionContent).toHaveBeenCalledWith("zh-CN");
		expect(result.locale).toBe("en-US");
		expect(result.fallbackFrom).toEqual(["zh-CN"]);
		expect(result.heroSlogan.title).toBe("A family values practitioner");
		expect(result.featuredVideos.main.streamVideoId).toBe("stream-main-zh");
		expect(result.featuredVideos.characters.items[0]?.streamVideoId).toBe(
			"stream-char-zh-1",
		);
		expect(result.dailyNotes.items[0]?.title).toBe("日思");
		expect(result.stories.items[0]?.title).toBe("故事");
	});
});
