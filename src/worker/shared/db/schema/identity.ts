import { sql } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const appUsers = sqliteTable(
	"app_users",
	{
		id: text("id").primaryKey(),
		authUserId: text("auth_user_id"),
		status: text("status").notNull().default("active"),
		displayName: text("display_name").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		index("app_users_auth_user_id_idx").on(table.authUserId),
		index("app_users_status_idx").on(table.status),
	],
);

export const userIdentities = sqliteTable(
	"user_identities",
	{
		id: text("id").primaryKey(),
		appUserId: text("app_user_id")
			.notNull()
			.references(() => appUsers.id, { onDelete: "cascade" }),
		authUserId: text("auth_user_id"),
		provider: text("provider").notNull(),
		providerUserId: text("provider_user_id").notNull(),
		email: text("email"),
		emailVerified: integer("email_verified", { mode: "boolean" })
			.notNull()
			.default(false),
		phone: text("phone"),
		unionid: text("unionid"),
		openid: text("openid"),
		isPrimary: integer("is_primary", { mode: "boolean" })
			.notNull()
			.default(false),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		uniqueIndex("user_identities_provider_provider_user_id_unique").on(
			table.provider,
			table.providerUserId,
		),
		uniqueIndex("user_identities_primary_per_app_user_unique")
			.on(table.appUserId)
			.where(sql`${table.isPrimary} = 1`),
		uniqueIndex("user_identities_email_provider_unique")
			.on(table.provider, table.email)
			.where(sql`${table.provider} = 'email' and ${table.email} is not null`),
		index("user_identities_app_user_id_idx").on(table.appUserId),
		index("user_identities_auth_user_id_idx").on(table.authUserId),
	],
);

export const userSecurityEvents = sqliteTable(
	"user_security_events",
	{
		id: text("id").primaryKey(),
		appUserId: text("app_user_id").references(() => appUsers.id, {
			onDelete: "set null",
		}),
		authUserId: text("auth_user_id"),
		eventType: text("event_type").notNull(),
		provider: text("provider"),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		metadata: text("metadata"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		index("user_security_events_app_user_id_idx").on(table.appUserId),
		index("user_security_events_auth_user_id_idx").on(table.authUserId),
		index("user_security_events_event_type_idx").on(table.eventType),
		index("user_security_events_created_at_idx").on(table.createdAt),
	],
);

export type AppUserRow = typeof appUsers.$inferSelect;
export type UserIdentityRow = typeof userIdentities.$inferSelect;
