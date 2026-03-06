import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db/client";
import { cmsAssets, cmsEntries, cmsRevisions } from "../../shared/db/schema";
import {
	HOME_SECTION_ENTRY_KEYS,
	type AdminUpsertHomeSectionBody,
	type HomeSectionEntryKey,
} from "../content/content.schema";

export class AdminRepository {
	constructor(private readonly db: AppDatabase) {}

	private async getEntryByKey(entryKey: HomeSectionEntryKey) {
		const rows = await this.db
			.select()
			.from(cmsEntries)
			.where(eq(cmsEntries.entryKey, entryKey))
			.limit(1);
		return rows[0] ?? null;
	}

	private async ensureEntry(entryKey: HomeSectionEntryKey) {
		const existing = await this.getEntryByKey(entryKey);
		if (existing) return existing;

		const now = new Date();
		const record = {
			id: crypto.randomUUID(),
			entryKey,
			entryType: "home_section",
			schemaKey: entryKey,
			status: "draft",
			publishedRevisionId: null,
			createdAt: now,
			updatedAt: now,
			publishedAt: null,
		} as const;

		await this.db.insert(cmsEntries).values(record);
		return record;
	}

	private async getNextRevisionNo(entryId: string) {
		const rows = await this.db
			.select({ maxRevisionNo: sql<number>`max(${cmsRevisions.revisionNo})` })
			.from(cmsRevisions)
			.where(eq(cmsRevisions.entryId, entryId));
		const current = rows[0]?.maxRevisionNo ?? 0;
		return current + 1;
	}

	async listHomeSections() {
		const entries = await this.db
			.select()
			.from(cmsEntries)
			.where(inArray(cmsEntries.entryKey, [...HOME_SECTION_ENTRY_KEYS]));

		if (entries.length === 0) {
			return [] as Array<{
				entryKey: string;
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
		body: AdminUpsertHomeSectionBody;
		authUserId: string;
	}) {
		const entry = await this.ensureEntry(input.entryKey);
		const revisionNo = await this.getNextRevisionNo(entry.id);
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

		await this.db.insert(cmsRevisions).values(revision);
		await this.db
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

	async publishHomeSection(input: {
		entryKey: HomeSectionEntryKey;
		revisionId?: string;
	}) {
		const entry = await this.getEntryByKey(input.entryKey);
		if (!entry) {
			return { changed: false as const, reason: "ENTRY_NOT_FOUND" as const };
		}

		let revisionId = input.revisionId;
		if (!revisionId) {
			const latest = await this.db
				.select()
				.from(cmsRevisions)
				.where(eq(cmsRevisions.entryId, entry.id))
				.orderBy(desc(cmsRevisions.revisionNo))
				.limit(1);
			revisionId = latest[0]?.id;
		}
		if (!revisionId) {
			return { changed: false as const, reason: "REVISION_NOT_FOUND" as const };
		}

		const revision = await this.db
			.select({ id: cmsRevisions.id })
			.from(cmsRevisions)
			.where(
				and(
					eq(cmsRevisions.id, revisionId),
					eq(cmsRevisions.entryId, entry.id),
				),
			)
			.limit(1);
		if (!revision[0]) {
			return { changed: false as const, reason: "REVISION_NOT_FOUND" as const };
		}

		const now = new Date();
		await this.db
			.update(cmsEntries)
			.set({
				status: "published",
				publishedRevisionId: revisionId,
				publishedAt: now,
				updatedAt: now,
			})
			.where(eq(cmsEntries.id, entry.id));

		return {
			changed: true as const,
			entryId: entry.id,
			revisionId,
		};
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
