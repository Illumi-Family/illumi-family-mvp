import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const cmsEntries = sqliteTable(
	"cms_entries",
	{
		id: text("id").primaryKey(),
		entryKey: text("entry_key").notNull(),
		locale: text("locale").notNull().default("zh-CN"),
		entryType: text("entry_type").notNull().default("home_section"),
		schemaKey: text("schema_key").notNull(),
		status: text("status").notNull().default("draft"),
		publishedRevisionId: text("published_revision_id"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
		publishedAt: integer("published_at", { mode: "timestamp_ms" }),
	},
	(table) => [
		uniqueIndex("cms_entries_entry_key_locale_unique").on(
			table.entryKey,
			table.locale,
		),
		index("cms_entries_locale_idx").on(table.locale),
		index("cms_entries_status_idx").on(table.status),
	],
);

export const cmsRevisions = sqliteTable(
	"cms_revisions",
	{
		id: text("id").primaryKey(),
		entryId: text("entry_id")
			.notNull()
			.references(() => cmsEntries.id, { onDelete: "cascade" }),
		revisionNo: integer("revision_no").notNull(),
		title: text("title").notNull(),
		summaryMd: text("summary_md"),
		bodyMd: text("body_md"),
		contentJson: text("content_json").notNull(),
		createdByAuthUserId: text("created_by_auth_user_id"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		uniqueIndex("cms_revisions_entry_revision_unique").on(
			table.entryId,
			table.revisionNo,
		),
		index("cms_revisions_entry_id_idx").on(table.entryId),
		index("cms_revisions_created_at_idx").on(table.createdAt),
	],
);

export const cmsAssets = sqliteTable(
	"cms_assets",
	{
		id: text("id").primaryKey(),
		r2Key: text("r2_key").notNull(),
		fileName: text("file_name").notNull(),
		mimeType: text("mime_type").notNull(),
		sizeBytes: integer("size_bytes").notNull(),
		width: integer("width"),
		height: integer("height"),
		sha256: text("sha256").notNull(),
		uploadedByAuthUserId: text("uploaded_by_auth_user_id"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		uniqueIndex("cms_assets_r2_key_unique").on(table.r2Key),
		index("cms_assets_created_at_idx").on(table.createdAt),
	],
);

export const cmsEntryAssets = sqliteTable(
	"cms_entry_assets",
	{
		id: text("id").primaryKey(),
		entryId: text("entry_id")
			.notNull()
			.references(() => cmsEntries.id, { onDelete: "cascade" }),
		revisionId: text("revision_id")
			.notNull()
			.references(() => cmsRevisions.id, { onDelete: "cascade" }),
		assetId: text("asset_id")
			.notNull()
			.references(() => cmsAssets.id, { onDelete: "cascade" }),
		usage: text("usage").notNull(),
		sortOrder: integer("sort_order").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		index("cms_entry_assets_entry_id_idx").on(table.entryId),
		index("cms_entry_assets_revision_id_idx").on(table.revisionId),
		index("cms_entry_assets_asset_id_idx").on(table.assetId),
	],
);

export type CmsEntryRow = typeof cmsEntries.$inferSelect;
export type CmsRevisionRow = typeof cmsRevisions.$inferSelect;
export type CmsAssetRow = typeof cmsAssets.$inferSelect;
