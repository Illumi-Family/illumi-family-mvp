import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const authUsers = sqliteTable(
	"auth_users",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull(),
		emailVerified: integer("email_verified", { mode: "boolean" })
			.notNull()
			.default(false),
		image: text("image"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		uniqueIndex("auth_users_email_unique").on(table.email),
		index("auth_users_created_at_idx").on(table.createdAt),
	],
);

export const authSessions = sqliteTable(
	"auth_sessions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => authUsers.id, { onDelete: "cascade" }),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		uniqueIndex("auth_sessions_token_unique").on(table.token),
		index("auth_sessions_user_id_idx").on(table.userId),
		index("auth_sessions_expires_at_idx").on(table.expiresAt),
	],
);

export const authAccounts = sqliteTable(
	"auth_accounts",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => authUsers.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		index("auth_accounts_user_id_idx").on(table.userId),
		uniqueIndex("auth_accounts_provider_account_unique").on(
			table.providerId,
			table.accountId,
		),
	],
);

export const authVerifications = sqliteTable(
	"auth_verifications",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		index("auth_verifications_identifier_idx").on(table.identifier),
		index("auth_verifications_expires_at_idx").on(table.expiresAt),
	],
);

export type AuthUserRow = typeof authUsers.$inferSelect;
export type AuthAccountRow = typeof authAccounts.$inferSelect;
