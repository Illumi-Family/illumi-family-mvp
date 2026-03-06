CREATE TABLE `cms_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`r2_key` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`width` integer,
	`height` integer,
	`sha256` text NOT NULL,
	`uploaded_by_auth_user_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cms_assets_r2_key_unique` ON `cms_assets` (`r2_key`);--> statement-breakpoint
CREATE INDEX `cms_assets_created_at_idx` ON `cms_assets` (`created_at`);--> statement-breakpoint
CREATE TABLE `cms_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_key` text NOT NULL,
	`entry_type` text DEFAULT 'home_section' NOT NULL,
	`schema_key` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_revision_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cms_entries_entry_key_unique` ON `cms_entries` (`entry_key`);--> statement-breakpoint
CREATE INDEX `cms_entries_status_idx` ON `cms_entries` (`status`);--> statement-breakpoint
CREATE TABLE `cms_entry_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`revision_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`usage` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `cms_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`revision_id`) REFERENCES `cms_revisions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `cms_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cms_entry_assets_entry_id_idx` ON `cms_entry_assets` (`entry_id`);--> statement-breakpoint
CREATE INDEX `cms_entry_assets_revision_id_idx` ON `cms_entry_assets` (`revision_id`);--> statement-breakpoint
CREATE INDEX `cms_entry_assets_asset_id_idx` ON `cms_entry_assets` (`asset_id`);--> statement-breakpoint
CREATE TABLE `cms_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`revision_no` integer NOT NULL,
	`title` text NOT NULL,
	`summary_md` text,
	`body_md` text,
	`content_json` text NOT NULL,
	`created_by_auth_user_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `cms_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cms_revisions_entry_revision_unique` ON `cms_revisions` (`entry_id`,`revision_no`);--> statement-breakpoint
CREATE INDEX `cms_revisions_entry_id_idx` ON `cms_revisions` (`entry_id`);--> statement-breakpoint
CREATE INDEX `cms_revisions_created_at_idx` ON `cms_revisions` (`created_at`);
--> statement-breakpoint
INSERT INTO `cms_entries` (
	`id`,
	`entry_key`,
	`entry_type`,
	`schema_key`,
	`status`,
	`published_revision_id`,
	`created_at`,
	`updated_at`,
	`published_at`
) VALUES
	(
		'cms-entry-home-philosophy',
		'home.philosophy',
		'home_section',
		'home.philosophy',
		'published',
		'cms-rev-home-philosophy-1',
		1760000000000,
		1760000000000,
		1760000000000
	),
	(
		'cms-entry-home-daily-notes',
		'home.daily_notes',
		'home_section',
		'home.daily_notes',
		'published',
		'cms-rev-home-daily-notes-1',
		1760000000000,
		1760000000000,
		1760000000000
	),
	(
		'cms-entry-home-stories',
		'home.stories',
		'home_section',
		'home.stories',
		'published',
		'cms-rev-home-stories-1',
		1760000000000,
		1760000000000,
		1760000000000
	),
	(
		'cms-entry-home-colearning',
		'home.colearning',
		'home_section',
		'home.colearning',
		'published',
		'cms-rev-home-colearning-1',
		1760000000000,
		1760000000000,
		1760000000000
	);
--> statement-breakpoint
INSERT INTO `cms_revisions` (
	`id`,
	`entry_id`,
	`revision_no`,
	`title`,
	`summary_md`,
	`body_md`,
	`content_json`,
	`created_by_auth_user_id`,
	`created_at`
) VALUES
	(
		'cms-rev-home-philosophy-1',
		'cms-entry-home-philosophy',
		1,
		'家风家学·理念',
		NULL,
		NULL,
		'{"intro":"以经典为根，以家庭为塾，以静定为要，以养正为宗。","items":[{"title":"静定","description":"先安顿家长与孩子的身心，再谈方法与效率。"},{"title":"养正","description":"以日常小事培养品格与边界感。"},{"title":"家塾","description":"把读书、习劳、感恩、自省融入一日生活。"}]}',
		NULL,
		1760000000000
	),
	(
		'cms-rev-home-daily-notes-1',
		'cms-entry-home-daily-notes',
		1,
		'践行感悟·日思',
		NULL,
		NULL,
		'{"items":[{"date":"2026-03-05","title":"把“催促”变“共学”：晚饭后 20 分钟共读","summary":"今晚不讲大道理，只做一件小事：一起读 10 分钟经典，再各自复述一句触动的话。","tags":["共读","家庭节奏","日常践行"]},{"date":"2026-03-03","title":"情绪起伏时，先守住语气再谈规则","summary":"关系先被看见，规则才会被听见；先共情，再立界，最后再行动。","tags":["情绪教养","亲子沟通","养正"]}]}',
		NULL,
		1760000000000
	),
	(
		'cms-rev-home-stories-1',
		'cms-entry-home-stories',
		1,
		'三代同堂·故事',
		NULL,
		NULL,
		'{"items":[{"title":"《一家人的晨光》：从晨读到晨劳的三代协同","summary":"记录祖辈、父母与孩子如何在清晨完成读书-分工-互助。","publishDate":"2026-02-18","duration":"08:24","status":"published","link":"#contact"},{"title":"《节气饭桌课》：奶奶的二十四节气故事","summary":"以家庭饭桌为课堂，把节气、饮食与德行教育连接起来。","publishDate":"2026-03-20","duration":"筹备中","status":"coming_soon"}]}',
		NULL,
		1760000000000
	),
	(
		'cms-rev-home-colearning-1',
		'cms-entry-home-colearning',
		1,
		'家庭共学·陪伴',
		NULL,
		NULL,
		'{"intro":"以陪伴为灯，以共学为路，以成长为果。","methods":[{"title":"共读共讲","description":"每周固定家庭共读，围绕一个主题做轮流复述与提问。"},{"title":"共劳共担","description":"通过家务与协作任务建立责任感，让孩子在参与中练习自主。"},{"title":"共省共进","description":"以周复盘记录家庭变化，用微调替代焦虑，用行动替代空谈。"}],"benefits":["降低家庭沟通摩擦，让规则与温度并行。","提升孩子自主学习与生活管理能力。","帮助家长形成可持续的教养方法，不被焦虑牵引。"],"caseHighlight":{"title":"案例摘要｜四周家庭共学实验","summary":"一个普通四口之家，通过固定晚间共读 + 周末家庭议事 + 每日小复盘，四周后孩子的作息稳定度、表达意愿与家务参与度都明显提升。","cta":{"label":"查看共学案例","href":"#contact"}}}',
		NULL,
		1760000000000
	);
