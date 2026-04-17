import { z } from "zod";

export const HOME_SECTION_ENTRY_KEYS = [
	"home.hero_slogan",
	"home.main_video",
	"home.character_videos",
	"home.philosophy",
	"home.daily_notes",
	"home.stories",
	"home.colearning",
] as const;

export const homeSectionEntryKeySchema = z.enum(HOME_SECTION_ENTRY_KEYS);

export type HomeSectionEntryKey = z.infer<typeof homeSectionEntryKeySchema>;

export const homeSectionPayloadSchema = z.object({
	title: z.string().min(1).max(200),
	cards: z
		.array(
			z.object({
				title: z.string().min(1).max(200),
				description: z.string().min(1),
			}),
		)
		.default([]),
});

export const heroSloganSectionContentSchema = z.object({
	title: z.string().max(200),
	subtitle: z.string().max(200),
});

export const mainVideoSectionContentSchema = z.object({
	streamVideoId: z.string().max(255),
});

export const characterVideoItemSchema = z.object({
	streamVideoId: z.string().max(255),
});

export const characterVideosSectionContentSchema = z.object({
	items: z.array(characterVideoItemSchema).max(12),
});

export const philosophySectionContentSchema = z.object({
	intro: z.string().min(1),
	items: z.array(
		z.object({
			title: z.string().min(1).max(200),
			description: z.string().min(1),
		}),
	),
});

export const dailyNotesSectionContentSchema = z.object({
	items: z.array(
		z.object({
			date: z.string().min(1).max(20),
			title: z.string().min(1).max(200),
			summary: z.string().min(1),
			tags: z.array(z.string().min(1).max(50)),
		}),
	),
});

export const storiesSectionContentSchema = z.object({
	items: z.array(
		z.object({
			title: z.string().min(1).max(200),
			summary: z.string().min(1),
			publishDate: z.string().min(1).max(20),
			duration: z.string().min(1).max(50),
			status: z.enum(["published", "coming_soon"]),
			link: z.string().max(500).optional(),
		}),
	),
});

export const colearningSectionContentSchema = z.object({
	intro: z.string().min(1),
	methods: z.array(
		z.object({
			title: z.string().min(1).max(200),
			description: z.string().min(1),
		}),
	),
	benefits: z.array(z.string().min(1)),
	caseHighlight: z.object({
		title: z.string().min(1).max(200),
		summary: z.string().min(1),
		cta: z.object({
			label: z.string().min(1).max(100),
			href: z.string().min(1).max(500),
		}),
	}),
});

export const homeSectionContentSchemaByKey = {
	"home.hero_slogan": heroSloganSectionContentSchema,
	"home.main_video": mainVideoSectionContentSchema,
	"home.character_videos": characterVideosSectionContentSchema,
	"home.philosophy": philosophySectionContentSchema,
	"home.daily_notes": dailyNotesSectionContentSchema,
	"home.stories": storiesSectionContentSchema,
	"home.colearning": colearningSectionContentSchema,
} as const;

export const parseHomeSectionContent = (
	entryKey: HomeSectionEntryKey,
	contentJson: unknown,
) =>
	homeSectionContentSchemaByKey[entryKey].parse(contentJson) as unknown;

export const parseTypedHomeSectionContent = <K extends HomeSectionEntryKey>(
	entryKey: K,
	contentJson: unknown,
): z.infer<(typeof homeSectionContentSchemaByKey)[K]> =>
	homeSectionContentSchemaByKey[entryKey].parse(
		contentJson,
	) as z.infer<(typeof homeSectionContentSchemaByKey)[K]>;

export const adminUpsertHomeSectionBodySchema = z.object({
	title: z.string().min(1).max(200),
	summaryMd: z.string().max(50_000).optional(),
	bodyMd: z.string().max(200_000).optional(),
	contentJson: z.record(z.string(), z.unknown()),
});

export const adminPublishHomeSectionBodySchema = z.object({
	revisionId: z.string().min(1).max(255).optional(),
});

export type AdminUpsertHomeSectionBody = z.infer<
	typeof adminUpsertHomeSectionBodySchema
>;
export type AdminPublishHomeSectionBody = z.infer<
	typeof adminPublishHomeSectionBodySchema
>;

export type HeroSloganSectionContent = z.infer<
	typeof heroSloganSectionContentSchema
>;
export type MainVideoSectionContent = z.infer<
	typeof mainVideoSectionContentSchema
>;
export type CharacterVideoItem = z.infer<typeof characterVideoItemSchema>;
export type CharacterVideosSectionContent = z.infer<
	typeof characterVideosSectionContentSchema
>;
export type PhilosophySectionContent = z.infer<
	typeof philosophySectionContentSchema
>;
export type DailyNotesSectionContent = z.infer<
	typeof dailyNotesSectionContentSchema
>;
export type StoriesSectionContent = z.infer<typeof storiesSectionContentSchema>;
export type ColearningSectionContent = z.infer<
	typeof colearningSectionContentSchema
>;
