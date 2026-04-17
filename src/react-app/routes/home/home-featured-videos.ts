import type { PublicVideoRecord } from "@/lib/api";
import type { AppLocale } from "@/i18n/types";

type LocalizedText = {
	"zh-CN": string;
	"en-US": string;
};

type FeaturedVideoSlot = {
	key: string;
	streamVideoId: string;
	roleLabel: LocalizedText;
	fallbackTitle: LocalizedText;
};

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
	duplicateConfiguredIds: string[];
};

export const HOME_MAIN_VIDEO_STREAM_ID = "replace-main-family-video-id";

export const HOME_CHARACTER_VIDEO_STREAM_IDS = [
	"replace-character-video-id-1",
	"replace-character-video-id-2",
	"replace-character-video-id-3",
	"replace-character-video-id-4",
	"replace-character-video-id-5",
	"replace-character-video-id-6",
] as const;

const HOME_MAIN_VIDEO_SLOT: FeaturedVideoSlot = {
	key: "main-family-video",
	streamVideoId: HOME_MAIN_VIDEO_STREAM_ID,
	roleLabel: {
		"zh-CN": "全家福主片",
		"en-US": "Family Portrait",
	},
	fallbackTitle: {
		"zh-CN": "全家福 · 家风传承纪实",
		"en-US": "Family Portrait · Values in Practice",
	},
};

const HOME_CHARACTER_VIDEO_SLOTS: FeaturedVideoSlot[] = [
	{
		key: "character-grandparent",
		streamVideoId: HOME_CHARACTER_VIDEO_STREAM_IDS[0],
		roleLabel: {
			"zh-CN": "祖辈篇",
			"en-US": "Grandparent Story",
		},
		fallbackTitle: {
			"zh-CN": "祖辈篇 · 家学根脉",
			"en-US": "Grandparent Story · Family Roots",
		},
	},
	{
		key: "character-father",
		streamVideoId: HOME_CHARACTER_VIDEO_STREAM_IDS[1],
		roleLabel: {
			"zh-CN": "父亲篇",
			"en-US": "Father Story",
		},
		fallbackTitle: {
			"zh-CN": "父亲篇 · 责任与担当",
			"en-US": "Father Story · Responsibility",
		},
	},
	{
		key: "character-mother",
		streamVideoId: HOME_CHARACTER_VIDEO_STREAM_IDS[2],
		roleLabel: {
			"zh-CN": "母亲篇",
			"en-US": "Mother Story",
		},
		fallbackTitle: {
			"zh-CN": "母亲篇 · 温润陪伴",
			"en-US": "Mother Story · Warm Guidance",
		},
	},
	{
		key: "character-child-1",
		streamVideoId: HOME_CHARACTER_VIDEO_STREAM_IDS[3],
		roleLabel: {
			"zh-CN": "长子篇",
			"en-US": "Child Story I",
		},
		fallbackTitle: {
			"zh-CN": "长子篇 · 共学成长",
			"en-US": "Child Story I · Learning Together",
		},
	},
	{
		key: "character-child-2",
		streamVideoId: HOME_CHARACTER_VIDEO_STREAM_IDS[4],
		roleLabel: {
			"zh-CN": "次女篇",
			"en-US": "Child Story II",
		},
		fallbackTitle: {
			"zh-CN": "次女篇 · 日常觉察",
			"en-US": "Child Story II · Daily Awareness",
		},
	},
	{
		key: "character-child-3",
		streamVideoId: HOME_CHARACTER_VIDEO_STREAM_IDS[5],
		roleLabel: {
			"zh-CN": "幼子篇",
			"en-US": "Child Story III",
		},
		fallbackTitle: {
			"zh-CN": "幼子篇 · 童蒙养正",
			"en-US": "Child Story III · Early Character",
		},
	},
];

const resolveLocalizedText = (value: LocalizedText, locale: AppLocale) =>
	locale === "en-US" ? value["en-US"] : value["zh-CN"];

const normalizeStreamVideoId = (value: string) => value.trim();

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

const resolveFeaturedVideoSlot = (input: {
	slot: FeaturedVideoSlot;
	videosByStreamVideoId: Map<string, PublicVideoRecord>;
	locale: AppLocale;
	duplicateIds: Set<string>;
}): ResolvedHomeFeaturedVideo => {
	const configuredId = normalizeStreamVideoId(input.slot.streamVideoId);
	const resolvedVideo = configuredId
		? input.videosByStreamVideoId.get(configuredId) ?? null
		: null;
	const resolvedTitle =
		resolvedVideo?.title.trim() ||
		resolveLocalizedText(input.slot.fallbackTitle, input.locale);

	return {
		key: input.slot.key,
		streamVideoId: configuredId,
		roleLabel: resolveLocalizedText(input.slot.roleLabel, input.locale),
		title: resolvedTitle,
		video: resolvedVideo,
		status: resolvedVideo ? "ready" : "missing",
		isDuplicateConfiguredId: input.duplicateIds.has(configuredId),
	};
};

export const HOME_CHARACTER_VIDEO_SLOT_COUNT = HOME_CHARACTER_VIDEO_SLOTS.length;

export const resolveHomeFeaturedVideos = (
	videos: PublicVideoRecord[],
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

	const configuredIds = [
		HOME_MAIN_VIDEO_SLOT.streamVideoId,
		...HOME_CHARACTER_VIDEO_SLOTS.map((slot) => slot.streamVideoId),
	];
	const duplicateConfiguredIds = collectDuplicateFeaturedVideoIds(configuredIds);
	const duplicateIdSet = new Set<string>(duplicateConfiguredIds);

	const main = resolveFeaturedVideoSlot({
		slot: HOME_MAIN_VIDEO_SLOT,
		videosByStreamVideoId,
		locale,
		duplicateIds: duplicateIdSet,
	});
	const characters = HOME_CHARACTER_VIDEO_SLOTS.map((slot) =>
		resolveFeaturedVideoSlot({
			slot,
			videosByStreamVideoId,
			locale,
			duplicateIds: duplicateIdSet,
		}),
	);

	return {
		main,
		characters,
		duplicateConfiguredIds,
	};
};
