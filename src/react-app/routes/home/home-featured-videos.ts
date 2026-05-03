import type { AppLocale } from "@/i18n/types";
import type { HomeContentPayload, PublicVideoRecord } from "@/lib/api";

type FeaturedVideosConfig = HomeContentPayload["featuredVideos"];

export type ResolvedHomeFeaturedVideo = {
	key: string;
	streamVideoId: string;
	roleLabel: string;
	title: string;
	video: PublicVideoRecord | null;
	status: "ready" | "missing";
	isDuplicateConfiguredId: boolean;
};

export type HomeFeaturedVideosResolved = {
	main: ResolvedHomeFeaturedVideo;
	characters: ResolvedHomeFeaturedVideo[];
	familyStories: ResolvedHomeFeaturedVideo[];
	duplicateConfiguredIds: string[];
};

type ResolveConfiguredVideoListOptions = {
	locale: AppLocale;
	keyPrefix: string;
	roleLabelPrefixZh: string;
	roleLabelPrefixEn: string;
	titlePrefixZh: string;
	titlePrefixEn: string;
};

const normalizeStreamVideoId = (value: string) => value.trim();

const resolveMainFallbackTitle = (locale: AppLocale) =>
	locale === "en-US" ? "Homepage Main Video" : "首页核心视频";

const resolveCharacterFallbackTitle = (locale: AppLocale, index: number) =>
	locale === "en-US" ? `Character Video ${index + 1}` : `角色视频 ${index + 1}`;

const resolveCharacterRoleLabel = (locale: AppLocale, index: number) =>
	locale === "en-US" ? `Character ${index + 1}` : `角色 ${index + 1}`;

export const collectDuplicateFeaturedVideoIds = (streamVideoIds: string[]) => {
	const seen = new Set<string>();
	const duplicated = new Set<string>();

	for (const rawId of streamVideoIds) {
		const streamVideoId = normalizeStreamVideoId(rawId);
		if (!streamVideoId) {
			continue;
		}
		if (seen.has(streamVideoId)) {
			duplicated.add(streamVideoId);
			continue;
		}
		seen.add(streamVideoId);
	}

	return [...duplicated];
};

export const resolveHomeFeaturedVideos = (
	videos: PublicVideoRecord[],
	config: FeaturedVideosConfig,
	locale: AppLocale,
): HomeFeaturedVideosResolved => {
	const videosByStreamVideoId = new Map<string, PublicVideoRecord>();
	for (const video of videos) {
		const streamVideoId = normalizeStreamVideoId(video.streamVideoId);
		if (!streamVideoId || videosByStreamVideoId.has(streamVideoId)) {
			continue;
		}
		videosByStreamVideoId.set(streamVideoId, video);
	}

	const configuredMainId = normalizeStreamVideoId(config.main.streamVideoId);
	const configuredCharacterIds = config.characters.items
		.map((item) => normalizeStreamVideoId(item.streamVideoId))
		.filter(Boolean);
	const configuredFamilyStoryIds = config.familyStories.items
		.map((item) => normalizeStreamVideoId(item.streamVideoId))
		.filter(Boolean);

	const duplicateConfiguredIds = collectDuplicateFeaturedVideoIds([
		configuredMainId,
		...configuredCharacterIds,
		...configuredFamilyStoryIds,
	]);
	const duplicateIdSet = new Set<string>(duplicateConfiguredIds);

	const mainVideo = configuredMainId
		? videosByStreamVideoId.get(configuredMainId) ?? null
		: null;
	const main: ResolvedHomeFeaturedVideo = {
		key: "main-video",
		streamVideoId: configuredMainId,
		roleLabel: locale === "en-US" ? "Main Video" : "核心视频",
		title:
			mainVideo?.title.trim() ||
			resolveMainFallbackTitle(locale),
		video: mainVideo,
		status: mainVideo ? "ready" : "missing",
		isDuplicateConfiguredId: duplicateIdSet.has(configuredMainId),
	};

	const characters = configuredCharacterIds.map((streamVideoId, index) => {
		const resolvedVideo = videosByStreamVideoId.get(streamVideoId) ?? null;
		return {
			key: `character-${index + 1}`,
			streamVideoId,
			roleLabel: resolveCharacterRoleLabel(locale, index),
			title:
				resolvedVideo?.title.trim() ||
				resolveCharacterFallbackTitle(locale, index),
			video: resolvedVideo,
			status: resolvedVideo ? "ready" : "missing",
			isDuplicateConfiguredId: duplicateIdSet.has(streamVideoId),
		} satisfies ResolvedHomeFeaturedVideo;
	});

	const familyStories = resolveConfiguredVideoList(videos, configuredFamilyStoryIds, {
		locale,
		keyPrefix: "family-story",
		roleLabelPrefixZh: "家庭故事",
		roleLabelPrefixEn: "Family Story",
		titlePrefixZh: "家庭故事视频",
		titlePrefixEn: "Family Story Video",
	});

	return {
		main,
		characters,
		familyStories,
		duplicateConfiguredIds,
	};
};

export const resolveConfiguredVideoList = (
	videos: PublicVideoRecord[],
	configuredStreamVideoIds: string[],
	options: ResolveConfiguredVideoListOptions,
): ResolvedHomeFeaturedVideo[] => {
	const videosByStreamVideoId = new Map<string, PublicVideoRecord>();
	for (const video of videos) {
		const streamVideoId = normalizeStreamVideoId(video.streamVideoId);
		if (!streamVideoId || videosByStreamVideoId.has(streamVideoId)) {
			continue;
		}
		videosByStreamVideoId.set(streamVideoId, video);
	}

	const normalizedIds = configuredStreamVideoIds
		.map((item) => normalizeStreamVideoId(item))
		.filter(Boolean);
	const duplicateIdSet = new Set(collectDuplicateFeaturedVideoIds(normalizedIds));

	return normalizedIds.map((streamVideoId, index) => {
		const resolvedVideo = videosByStreamVideoId.get(streamVideoId) ?? null;
		const suffix = `${index + 1}`;
		return {
			key: `${options.keyPrefix}-${suffix}`,
			streamVideoId,
			roleLabel:
				options.locale === "en-US"
					? `${options.roleLabelPrefixEn} ${suffix}`
					: `${options.roleLabelPrefixZh} ${suffix}`,
			title:
				resolvedVideo?.title.trim() ||
				(options.locale === "en-US"
					? `${options.titlePrefixEn} ${suffix}`
					: `${options.titlePrefixZh} ${suffix}`),
			video: resolvedVideo,
			status: resolvedVideo ? "ready" : "missing",
			isDuplicateConfiguredId: duplicateIdSet.has(streamVideoId),
		} satisfies ResolvedHomeFeaturedVideo;
	});
};
