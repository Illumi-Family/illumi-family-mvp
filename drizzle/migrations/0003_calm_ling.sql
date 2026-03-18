ALTER TABLE `cms_entries` ADD `locale` text DEFAULT 'zh-CN' NOT NULL;
--> statement-breakpoint
UPDATE `cms_entries`
SET `locale` = 'zh-CN'
WHERE `locale` IS NULL OR trim(`locale`) = '';
--> statement-breakpoint
CREATE UNIQUE INDEX `cms_entries_entry_key_locale_unique` ON `cms_entries` (`entry_key`,`locale`);
--> statement-breakpoint
DROP INDEX IF EXISTS `cms_entries_entry_key_unique`;
--> statement-breakpoint
CREATE INDEX `cms_entries_locale_idx` ON `cms_entries` (`locale`);
