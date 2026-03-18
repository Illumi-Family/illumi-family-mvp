import { describe, expect, it, vi } from "vitest";
import { ContentService } from "./content.service";

describe("content service", () => {
	it("returns aggregated home content from published sections", async () => {
		const service = new ContentService({
			getPublishedHomeSectionContent: async () =>
				new Map([
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
		expect(result.dailyNotes.items[0]?.title).toBe("日思");
		expect(result.stories.items[0]?.title).toBe("故事");
	});
});
