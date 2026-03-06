import { AppError } from "../../shared/http/errors";
import type { ContentRepository } from "./content.repository";
import {
	parseTypedHomeSectionContent,
	type ColearningSectionContent,
	type DailyNotesSectionContent,
	type PhilosophySectionContent,
	type StoriesSectionContent,
} from "./content.schema";

const HOME_CONTENT_CACHE_KEY = "cms:home:published:v1";
const HOME_CONTENT_CACHE_TTL_SECONDS = 120;

export type HomeContentPayload = {
	philosophy: PhilosophySectionContent;
	dailyNotes: DailyNotesSectionContent;
	stories: StoriesSectionContent;
	colearning: ColearningSectionContent;
	updatedAt: string;
};

const EMPTY_HOME_CONTENT: HomeContentPayload = {
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
	updatedAt: new Date(0).toISOString(),
};

export class ContentService {
	constructor(private readonly repository: ContentRepository) {}

	async getPublishedHomeContent(): Promise<HomeContentPayload> {
		const map = await this.repository.getPublishedHomeSectionContent();

		const philosophy = map.has("home.philosophy")
			? parseTypedHomeSectionContent(
					"home.philosophy",
					map.get("home.philosophy"),
				)
			: EMPTY_HOME_CONTENT.philosophy;
		const dailyNotes = map.has("home.daily_notes")
			? parseTypedHomeSectionContent(
					"home.daily_notes",
					map.get("home.daily_notes"),
				)
			: EMPTY_HOME_CONTENT.dailyNotes;
		const stories = map.has("home.stories")
			? parseTypedHomeSectionContent("home.stories", map.get("home.stories"))
			: EMPTY_HOME_CONTENT.stories;
		const colearning = map.has("home.colearning")
			? parseTypedHomeSectionContent(
					"home.colearning",
					map.get("home.colearning"),
				)
			: EMPTY_HOME_CONTENT.colearning;

		return {
			philosophy,
			dailyNotes,
			stories,
			colearning,
			updatedAt: new Date().toISOString(),
		};
	}

	static getCacheKey() {
		return HOME_CONTENT_CACHE_KEY;
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
