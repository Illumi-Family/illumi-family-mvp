import type { HomeContentPayload, PublicVideoRecord } from "@/lib/api";
import { normalizeStreamVideoId } from "@/lib/video-watch-route";

type VideoWatchCollectionKey = "characters" | "familyStories" | "public";

export type VideoWatchCollection = {
	key: VideoWatchCollectionKey;
	title: string;
	videos: PublicVideoRecord[];
};

const dedupeConfiguredIdsInOrder = (ids: string[]) => {
	const seen = new Set<string>();
	const deduped: string[] = [];
	for (const rawId of ids) {
		const normalizedId = normalizeStreamVideoId(rawId);
		if (!normalizedId) continue;
		if (seen.has(normalizedId)) continue;
		seen.add(normalizedId);
		deduped.push(normalizedId);
	}
	return deduped;
};

const pickConfiguredVideosInOrder = (
	configuredIds: string[],
	videosById: Map<string, PublicVideoRecord>,
) => {
	const ordered: PublicVideoRecord[] = [];
	for (const streamVideoId of dedupeConfiguredIdsInOrder(configuredIds)) {
		const video = videosById.get(streamVideoId);
		if (!video) continue;
		ordered.push(video);
	}
	return ordered;
};

const createCollectionTitle = (
	key: VideoWatchCollectionKey,
	locale: HomeContentPayload["locale"],
) => {
	if (locale === "en-US") {
		if (key === "characters") return "Character Introductions";
		if (key === "familyStories") return "Family Stories";
		return "Public Collection";
	}
	if (key === "characters") return "角色介绍";
	if (key === "familyStories") return "家庭故事";
	return "公共列表";
};

export const resolveVideoWatchCollections = (input: {
	videos: PublicVideoRecord[];
	featuredVideos: HomeContentPayload["featuredVideos"];
	locale: HomeContentPayload["locale"];
}): VideoWatchCollection[] => {
	const videosById = new Map<string, PublicVideoRecord>();
	for (const video of input.videos) {
		const normalizedId = normalizeStreamVideoId(video.streamVideoId);
		if (!normalizedId || videosById.has(normalizedId)) continue;
		videosById.set(normalizedId, video);
	}

	const characterIds = input.featuredVideos.characters.items.map(
		(item) => item.streamVideoId,
	);
	const familyStoryIds = input.featuredVideos.familyStories.items.map(
		(item) => item.streamVideoId,
	);

	const characterVideos = pickConfiguredVideosInOrder(characterIds, videosById);
	const familyStoryVideos = pickConfiguredVideosInOrder(familyStoryIds, videosById);

	const groupedIdSet = new Set<string>([
		...dedupeConfiguredIdsInOrder(characterIds),
		...dedupeConfiguredIdsInOrder(familyStoryIds),
	]);
	const publicVideos = input.videos.filter(
		(video) => !groupedIdSet.has(video.streamVideoId),
	);

	const collections: VideoWatchCollection[] = [
		{
			key: "characters",
			title: createCollectionTitle("characters", input.locale),
			videos: characterVideos,
		},
		{
			key: "familyStories",
			title: createCollectionTitle("familyStories", input.locale),
			videos: familyStoryVideos,
		},
		{
			key: "public",
			title: createCollectionTitle("public", input.locale),
			videos: publicVideos,
		},
	];

	return collections.filter((collection) => collection.videos.length > 0);
};
