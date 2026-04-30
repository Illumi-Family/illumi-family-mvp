ALTER TABLE `video_assets`
ADD COLUMN `missing_from_stream_streak` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `video_assets`
ADD COLUMN `last_seen_in_stream_at` integer;
