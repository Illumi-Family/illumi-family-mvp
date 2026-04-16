CREATE TABLE `video_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`stream_video_id` text NOT NULL,
	`processing_status` text DEFAULT 'processing' NOT NULL,
	`publish_status` text DEFAULT 'draft' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`poster_url` text,
	`duration_seconds` integer,
	`created_by_auth_user_id` text,
	`updated_by_auth_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer,
	CONSTRAINT `video_assets_processing_status_check`
		CHECK (`processing_status` IN ('processing', 'ready', 'failed')),
	CONSTRAINT `video_assets_publish_status_check`
		CHECK (`publish_status` IN ('draft', 'published'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `video_assets_stream_video_id_unique`
ON `video_assets` (`stream_video_id`);
--> statement-breakpoint
CREATE INDEX `video_assets_publish_processing_idx`
ON `video_assets` (`publish_status`, `processing_status`);
--> statement-breakpoint
CREATE INDEX `video_assets_published_at_idx`
ON `video_assets` (`published_at`);
