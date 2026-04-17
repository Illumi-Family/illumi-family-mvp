import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db/client";
import {
	cmsAssets,
	cmsEntries,
	cmsRevisions,
	videoAssets,
} from "../../shared/db/schema";
import type { ContentLocale } from "../../shared/i18n/locale";
import {
	HOME_SECTION_ENTRY_KEYS,
	type AdminUpsertHomeSectionBody,
	type HomeSectionEntryKey,
} from "../content/content.schema";

type DbExecutor = Pick<AppDatabase, "select" | "insert" | "update">;
type PublishFailureReason = "ENTRY_NOT_FOUND" | "REVISION_NOT_FOUND";
type RevisionLookupFailureReason =
	| PublishFailureReason
	| "REVISION_CONTENT_INVALID";

export class AdminRepository {
	constructor(private readonly db: AppDatabase) {}

	private async getEntryByKeyWithDb(
		db: DbExecutor,
		entryKey: HomeSectionEntryKey,
		locale: ContentLocale,
	) {
		const rows = await db
			.select()
			.from(cmsEntries)
			.where(
				and(eq(cmsEntries.entryKey, entryKey), eq(cmsEntries.locale, locale)),
			)
			.limit(1);
		return rows[0] ?? null;
	}

	private async ensureEntryWithDb(
		db: DbExecutor,
		entryKey: HomeSectionEntryKey,
		locale: ContentLocale,
	) {
		const existing = await this.getEntryByKeyWithDb(db, entryKey, locale);
		if (existing) return existing;

		const now = new Date();
		const record = {
			id: crypto.randomUUID(),
			entryKey,
			locale,
			entryType: "home_section",
			schemaKey: entryKey,
			status: "draft",
			publishedRevisionId: null,
			createdAt: now,
			updatedAt: now,
			publishedAt: null,
		} as const;

		await db.insert(cmsEntries).values(record);
		return record;
	}

	private async getNextRevisionNoWithDb(db: DbExecutor, entryId: string) {
		const rows = await db
			.select({ maxRevisionNo: sql<number>`max(${cmsRevisions.revisionNo})` })
			.from(cmsRevisions)
			.where(eq(cmsRevisions.entryId, entryId));
		const current = rows[0]?.maxRevisionNo ?? 0;
		return current + 1;
	}

	private async createHomeSectionDraftWithDb(
		db: DbExecutor,
		input: {
			entryKey: HomeSectionEntryKey;
			locale: ContentLocale;
			body: AdminUpsertHomeSectionBody;
			authUserId: string;
		},
	) {
		const entry = await this.ensureEntryWithDb(db, input.entryKey, input.locale);
		const revisionNo = await this.getNextRevisionNoWithDb(db, entry.id);
		const now = new Date();
		const revision = {
			id: crypto.randomUUID(),
			entryId: entry.id,
			revisionNo,
			title: input.body.title,
			summaryMd: input.body.summaryMd ?? null,
			bodyMd: input.body.bodyMd ?? null,
			contentJson: JSON.stringify(input.body.contentJson),
			createdByAuthUserId: input.authUserId,
			createdAt: now,
		} as const;

		await db.insert(cmsRevisions).values(revision);
		await db
			.update(cmsEntries)
			.set({
				status: "draft",
				updatedAt: now,
			})
			.where(eq(cmsEntries.id, entry.id));

		return {
			entryId: entry.id,
			revisionId: revision.id,
			revisionNo,
		};
	}

	private async resolveRevisionWithDb(
		db: DbExecutor,
		input: {
			entryKey: HomeSectionEntryKey;
			locale: ContentLocale;
			revisionId?: string;
		},
	): Promise<
		| {
				found: true;
				entry: Awaited<ReturnType<AdminRepository["ensureEntryWithDb"]>>;
				revisionId: string;
				contentJson: string;
		  }
		| { found: false; reason: PublishFailureReason }
	> {
		const entry = await this.getEntryByKeyWithDb(db, input.entryKey, input.locale);
		if (!entry) {
			return { found: false, reason: "ENTRY_NOT_FOUND" };
		}

		let revisionId = input.revisionId;
		if (!revisionId) {
			const latest = await db
				.select()
				.from(cmsRevisions)
				.where(eq(cmsRevisions.entryId, entry.id))
				.orderBy(desc(cmsRevisions.revisionNo))
				.limit(1);
			revisionId = latest[0]?.id;
		}
		if (!revisionId) {
			return { found: false, reason: "REVISION_NOT_FOUND" };
		}

		const revision = await db
			.select({
				id: cmsRevisions.id,
				contentJson: cmsRevisions.contentJson,
			})
			.from(cmsRevisions)
			.where(
				and(
					eq(cmsRevisions.id, revisionId),
					eq(cmsRevisions.entryId, entry.id),
				),
			)
			.limit(1);
		if (!revision[0]) {
			return { found: false, reason: "REVISION_NOT_FOUND" };
		}

		return {
			found: true,
			entry,
			revisionId,
			contentJson: revision[0].contentJson,
		};
	}

	private async publishHomeSectionWithDb(
		db: DbExecutor,
		input: {
			entryKey: HomeSectionEntryKey;
			locale: ContentLocale;
			revisionId?: string;
		},
	) {
		const resolved = await this.resolveRevisionWithDb(db, input);
		if (!resolved.found) {
			return { changed: false as const, reason: resolved.reason };
		}

		const now = new Date();
		await db
			.update(cmsEntries)
			.set({
				status: "published",
				publishedRevisionId: resolved.revisionId,
				publishedAt: now,
				updatedAt: now,
			})
			.where(eq(cmsEntries.id, resolved.entry.id));

		return {
			changed: true as const,
			entryId: resolved.entry.id,
			revisionId: resolved.revisionId,
		};
	}

	async listHomeSections(locale: ContentLocale) {
		const entries = await this.db
			.select()
			.from(cmsEntries)
			.where(
				and(
					inArray(cmsEntries.entryKey, [...HOME_SECTION_ENTRY_KEYS]),
					eq(cmsEntries.locale, locale),
				),
			);

		if (entries.length === 0) {
			return [] as Array<{
				entryKey: string;
				locale: ContentLocale;
				status: string;
				publishedRevisionId: string | null;
				latestRevisionId: string | null;
				latestRevisionNo: number | null;
				updatedAt: Date;
			}>;
		}

		const entryIds = entries.map((entry) => entry.id);
		const revisions = await this.db
			.select()
			.from(cmsRevisions)
			.where(inArray(cmsRevisions.entryId, entryIds))
			.orderBy(desc(cmsRevisions.revisionNo));

		const latestByEntryId = new Map<string, (typeof revisions)[number]>();
		for (const revision of revisions) {
			if (!latestByEntryId.has(revision.entryId)) {
				latestByEntryId.set(revision.entryId, revision);
			}
		}

		return entries.map((entry) => {
			const latest = latestByEntryId.get(entry.id);
			let latestContentJson: unknown = null;
			if (latest?.contentJson) {
				try {
					latestContentJson = JSON.parse(latest.contentJson);
				} catch {
					latestContentJson = null;
				}
			}
			return {
				entryKey: entry.entryKey,
				locale: entry.locale as ContentLocale,
				status: entry.status,
				publishedRevisionId: entry.publishedRevisionId,
				latestRevisionId: latest?.id ?? null,
				latestRevisionNo: latest?.revisionNo ?? null,
				latestTitle: latest?.title ?? null,
				latestSummaryMd: latest?.summaryMd ?? null,
				latestBodyMd: latest?.bodyMd ?? null,
				latestContentJson,
				updatedAt: entry.updatedAt,
			};
		});
	}

	async createHomeSectionDraft(input: {
		entryKey: HomeSectionEntryKey;
		locale: ContentLocale;
		body: AdminUpsertHomeSectionBody;
		authUserId: string;
	}) {
		return this.createHomeSectionDraftWithDb(this.db, input);
	}

	async createHomeSectionDrafts(input: {
		entryKey: HomeSectionEntryKey;
		locales: ContentLocale[];
		body: AdminUpsertHomeSectionBody;
		authUserId: string;
	}) {
		const results: Array<{
			locale: ContentLocale;
			entryId: string;
			revisionId: string;
			revisionNo: number;
		}> = [];

		for (const locale of input.locales) {
			const result = await this.createHomeSectionDraftWithDb(this.db, {
				entryKey: input.entryKey,
				locale,
				body: input.body,
				authUserId: input.authUserId,
			});
			results.push({ locale, ...result });
		}

		return results;
	}

	async getHomeSectionRevisionContent(input: {
		entryKey: HomeSectionEntryKey;
		locale: ContentLocale;
		revisionId?: string;
	}): Promise<
		| {
				found: true;
				entryId: string;
				revisionId: string;
				contentJson: unknown;
		  }
		| {
				found: false;
				reason: RevisionLookupFailureReason;
		  }
	> {
		const resolved = await this.resolveRevisionWithDb(this.db, input);
		if (!resolved.found) {
			return resolved;
		}

		try {
			return {
				found: true,
				entryId: resolved.entry.id,
				revisionId: resolved.revisionId,
				contentJson: JSON.parse(resolved.contentJson),
			};
		} catch {
			return {
				found: false,
				reason: "REVISION_CONTENT_INVALID",
			};
		}
	}

	async publishHomeSection(input: {
		entryKey: HomeSectionEntryKey;
		locale: ContentLocale;
		revisionId?: string;
	}) {
		return this.publishHomeSectionWithDb(this.db, input);
	}

	async publishHomeSections(input: {
		entries: Array<{
			entryKey: HomeSectionEntryKey;
			locale: ContentLocale;
			revisionId?: string;
		}>;
	}) {
		const results: Array<{
			locale: ContentLocale;
			entryId: string;
			revisionId: string;
		}> = [];
		for (const entry of input.entries) {
			const result = await this.publishHomeSectionWithDb(this.db, entry);
			if (!result.changed) {
				return {
					changed: false as const,
					reason: result.reason,
					locale: entry.locale,
				};
			}
			results.push({
				locale: entry.locale,
				entryId: result.entryId,
				revisionId: result.revisionId,
			});
		}

		return {
			changed: true as const,
			results,
		};
	}

	async listVideoPublishStatesByStreamVideoIds(streamVideoIds: string[]) {
		const ids = [...new Set(streamVideoIds.map((id) => id.trim()).filter(Boolean))];
		if (ids.length === 0) {
			return [] as Array<{
				streamVideoId: string;
				processingStatus: string;
				publishStatus: string;
			}>;
		}

		return this.db
			.select({
				streamVideoId: videoAssets.streamVideoId,
				processingStatus: videoAssets.processingStatus,
				publishStatus: videoAssets.publishStatus,
			})
			.from(videoAssets)
			.where(inArray(videoAssets.streamVideoId, ids));
	}

	async createAsset(input: {
		r2Key: string;
		fileName: string;
		mimeType: string;
		sizeBytes: number;
		width?: number;
		height?: number;
		sha256: string;
		uploadedByAuthUserId: string;
	}) {
		const now = new Date();
		const record = {
			id: crypto.randomUUID(),
			r2Key: input.r2Key,
			fileName: input.fileName,
			mimeType: input.mimeType,
			sizeBytes: input.sizeBytes,
			width: input.width ?? null,
			height: input.height ?? null,
			sha256: input.sha256,
			uploadedByAuthUserId: input.uploadedByAuthUserId,
			createdAt: now,
		} as const;
		await this.db.insert(cmsAssets).values(record);
		return record;
	}
}
