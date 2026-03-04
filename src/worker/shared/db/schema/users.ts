import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	name: text("name").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
