import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const videoAssets = sqliteTable(
	"video_assets",
	{
		id: text("id").primaryKey(),
		streamVideoId: text("stream_video_id").notNull(),
		processingStatus: text("processing_status").notNull().default("processing"),
		publishStatus: text("publish_status").notNull().default("draft"),
		title: text("title").notNull().default(""),
		posterUrl: text("poster_url"),
		durationSeconds: integer("duration_seconds"),
		createdByAuthUserId: text("created_by_auth_user_id"),
		updatedByAuthUserId: text("updated_by_auth_user_id"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
		publishedAt: integer("published_at", { mode: "timestamp_ms" }),
	},
	(table) => [
		uniqueIndex("video_assets_stream_video_id_unique").on(table.streamVideoId),
		index("video_assets_publish_processing_idx").on(
			table.publishStatus,
			table.processingStatus,
		),
		index("video_assets_published_at_idx").on(table.publishedAt),
	],
);

export type VideoAssetRow = typeof videoAssets.$inferSelect;
