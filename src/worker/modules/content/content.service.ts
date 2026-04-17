import { AppError } from "../../shared/http/errors";
import {
	DEFAULT_CONTENT_LOCALE,
	type ContentLocale,
} from "../../shared/i18n/locale";
import type { ContentRepository } from "./content.repository";
import {
	parseTypedHomeSectionContent,
	type HomeSectionEntryKey,
	type CharacterVideosSectionContent,
	type ColearningSectionContent,
	type DailyNotesSectionContent,
	type HeroSloganSectionContent,
	type MainVideoSectionContent,
	type PhilosophySectionContent,
	type StoriesSectionContent,
} from "./content.schema";

const HOME_CONTENT_CACHE_KEY_PREFIX = "cms:home:published:v1";
const HOME_CONTENT_CACHE_TTL_SECONDS = 120;

export type HomeContentPayload = {
	heroSlogan: HeroSloganSectionContent;
	featuredVideos: {
		main: MainVideoSectionContent;
		characters: CharacterVideosSectionContent;
	};
	philosophy: PhilosophySectionContent;
	dailyNotes: DailyNotesSectionContent;
	stories: StoriesSectionContent;
	colearning: ColearningSectionContent;
	locale: ContentLocale;
	fallbackFrom: ContentLocale[];
	updatedAt: string;
};

const EMPTY_HOME_CONTENT = {
	heroSlogan: {
		title: "",
		subtitle: "",
	},
	featuredVideos: {
		main: {
			streamVideoId: "",
		},
		characters: {
			items: [],
		},
	},
	philosophy: {
		intro: "",
		items: [],
	},
	dailyNotes: {
		items: [],
	},
	stories: {
		items: [],
	},
	colearning: {
		intro: "",
		methods: [],
		benefits: [],
		caseHighlight: {
			title: "",
			summary: "",
			cta: {
				label: "",
				href: "#",
			},
		},
	},
};

export class ContentService {
	constructor(private readonly repository: ContentRepository) {}

	async getPublishedHomeContent(locale: ContentLocale): Promise<HomeContentPayload> {
		const targetMap = await this.repository.getPublishedHomeSectionContent(locale);
		const fallbackMap =
			locale === DEFAULT_CONTENT_LOCALE
				? targetMap
				: await this.repository.getPublishedHomeSectionContent(
						DEFAULT_CONTENT_LOCALE,
					);
		let usedFallback = false;

		const resolveSection = <K extends HomeSectionEntryKey, TValue>(
			entryKey: K,
			emptyValue: TValue,
		): TValue => {
			if (targetMap.has(entryKey)) {
				try {
					return parseTypedHomeSectionContent(
						entryKey,
						targetMap.get(entryKey),
					) as TValue;
				} catch {
					// fallback to zh-CN
				}
			}

			if (locale !== DEFAULT_CONTENT_LOCALE && fallbackMap.has(entryKey)) {
				try {
					const fallbackValue = parseTypedHomeSectionContent(
						entryKey,
						fallbackMap.get(entryKey),
					) as TValue;
					usedFallback = true;
					return fallbackValue;
				} catch {
					// use empty value if fallback also invalid
				}
			}

			return emptyValue;
		};

		const heroSlogan = resolveSection(
			"home.hero_slogan",
			EMPTY_HOME_CONTENT.heroSlogan,
		);
		const featuredMain = resolveSection(
			"home.main_video",
			EMPTY_HOME_CONTENT.featuredVideos.main,
		);
		const featuredCharacters = resolveSection(
			"home.character_videos",
			EMPTY_HOME_CONTENT.featuredVideos.characters,
		);
		const philosophy = resolveSection(
			"home.philosophy",
			EMPTY_HOME_CONTENT.philosophy,
		);
		const dailyNotes = resolveSection(
			"home.daily_notes",
			EMPTY_HOME_CONTENT.dailyNotes,
		);
		const stories = resolveSection(
			"home.stories",
			EMPTY_HOME_CONTENT.stories,
		);
		const colearning = resolveSection(
			"home.colearning",
			EMPTY_HOME_CONTENT.colearning,
		);

		return {
			heroSlogan,
			featuredVideos: {
				main: featuredMain,
				characters: featuredCharacters,
			},
			philosophy,
			dailyNotes,
			stories,
			colearning,
			locale,
			fallbackFrom: usedFallback ? [DEFAULT_CONTENT_LOCALE] : [],
			updatedAt: new Date().toISOString(),
		};
	}

	static getCacheKey(locale: ContentLocale) {
		return `${HOME_CONTENT_CACHE_KEY_PREFIX}:${locale}`;
	}

	static getCacheTtlSeconds() {
		return HOME_CONTENT_CACHE_TTL_SECONDS;
	}

	assertAssetContentType(contentType: string | null | undefined) {
		if (!contentType) return;
		if (!contentType.startsWith("image/")) {
			throw new AppError(
				"UNSUPPORTED_MEDIA_TYPE",
				"Asset must be image content type",
				415,
			);
		}
	}
}
