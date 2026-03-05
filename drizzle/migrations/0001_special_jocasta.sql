CREATE TABLE `auth_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `auth_accounts_user_id_idx` ON `auth_accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_accounts_provider_account_unique` ON `auth_accounts` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_token_unique` ON `auth_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `auth_sessions_user_id_idx` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `auth_sessions_expires_at_idx` ON `auth_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_users_email_unique` ON `auth_users` (`email`);--> statement-breakpoint
CREATE INDEX `auth_users_created_at_idx` ON `auth_users` (`created_at`);--> statement-breakpoint
CREATE TABLE `auth_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_verifications_identifier_idx` ON `auth_verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `auth_verifications_expires_at_idx` ON `auth_verifications` (`expires_at`);--> statement-breakpoint
CREATE TABLE `app_users` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_user_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `app_users_auth_user_id_idx` ON `app_users` (`auth_user_id`);--> statement-breakpoint
CREATE INDEX `app_users_status_idx` ON `app_users` (`status`);--> statement-breakpoint
CREATE TABLE `user_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`app_user_id` text NOT NULL,
	`auth_user_id` text,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`email` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`phone` text,
	`unionid` text,
	`openid` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`app_user_id`) REFERENCES `app_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_identities_provider_provider_user_id_unique` ON `user_identities` (`provider`,`provider_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_identities_primary_per_app_user_unique` ON `user_identities` (`app_user_id`) WHERE "user_identities"."is_primary" = 1;--> statement-breakpoint
CREATE UNIQUE INDEX `user_identities_email_provider_unique` ON `user_identities` (`provider`,`email`) WHERE "user_identities"."provider" = 'email' and "user_identities"."email" is not null;--> statement-breakpoint
CREATE INDEX `user_identities_app_user_id_idx` ON `user_identities` (`app_user_id`);--> statement-breakpoint
CREATE INDEX `user_identities_auth_user_id_idx` ON `user_identities` (`auth_user_id`);--> statement-breakpoint
CREATE TABLE `user_security_events` (
	`id` text PRIMARY KEY NOT NULL,
	`app_user_id` text,
	`auth_user_id` text,
	`event_type` text NOT NULL,
	`provider` text,
	`ip_address` text,
	`user_agent` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`app_user_id`) REFERENCES `app_users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `user_security_events_app_user_id_idx` ON `user_security_events` (`app_user_id`);--> statement-breakpoint
CREATE INDEX `user_security_events_auth_user_id_idx` ON `user_security_events` (`auth_user_id`);--> statement-breakpoint
CREATE INDEX `user_security_events_event_type_idx` ON `user_security_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `user_security_events_created_at_idx` ON `user_security_events` (`created_at`);
--> statement-breakpoint
INSERT INTO `app_users` (`id`, `auth_user_id`, `status`, `display_name`, `created_at`, `updated_at`)
SELECT `id`, NULL, 'active', `name`, `created_at`, `updated_at`
FROM `users`;
--> statement-breakpoint
INSERT INTO `user_identities` (
	`id`,
	`app_user_id`,
	`auth_user_id`,
	`provider`,
	`provider_user_id`,
	`email`,
	`email_verified`,
	`is_primary`,
	`created_at`,
	`updated_at`
)
SELECT
	lower(hex(randomblob(16))),
	`id`,
	NULL,
	'email',
	lower(trim(`email`)),
	lower(trim(`email`)),
	0,
	1,
	`created_at`,
	`updated_at`
FROM `users`;
--> statement-breakpoint
INSERT INTO `user_security_events` (
	`id`,
	`app_user_id`,
	`auth_user_id`,
	`event_type`,
	`provider`,
	`metadata`,
	`created_at`
)
SELECT
	lower(hex(randomblob(16))),
	`id`,
	NULL,
	'migration_backfill_user',
	'email',
	'{"source":"users_table","email_verified":false}',
	`updated_at`
FROM `users`;
