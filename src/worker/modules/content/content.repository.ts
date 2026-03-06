import { eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db/client";
import { cmsAssets, cmsEntries, cmsRevisions } from "../../shared/db/schema";
import {
	HOME_SECTION_ENTRY_KEYS,
	type HomeSectionEntryKey,
} from "./content.schema";

export class ContentRepository {
	constructor(private readonly db: AppDatabase) {}

	async getPublishedHomeSectionContent() {
		const entries = await this.db
			.select()
			.from(cmsEntries)
			.where(inArray(cmsEntries.entryKey, [...HOME_SECTION_ENTRY_KEYS]));

		const revisionIds = entries
			.map((entry) => entry.publishedRevisionId)
			.filter((id): id is string => Boolean(id));

		if (revisionIds.length === 0) {
			return new Map<HomeSectionEntryKey, unknown>();
		}

		const revisions = await this.db
			.select()
			.from(cmsRevisions)
			.where(inArray(cmsRevisions.id, revisionIds));

		const revisionMap = new Map(revisions.map((revision) => [revision.id, revision]));
		const contentByKey = new Map<HomeSectionEntryKey, unknown>();

		for (const entry of entries) {
			const entryKey = entry.entryKey as HomeSectionEntryKey;
			if (!entry.publishedRevisionId) continue;
			const revision = revisionMap.get(entry.publishedRevisionId);
			if (!revision) continue;
			try {
				contentByKey.set(entryKey, JSON.parse(revision.contentJson));
			} catch {
				continue;
			}
		}

		return contentByKey;
	}

	async getAssetById(assetId: string) {
		const rows = await this.db
			.select()
			.from(cmsAssets)
			.where(eq(cmsAssets.id, assetId))
			.limit(1);
		return rows[0] ?? null;
	}
}
