CREATE TABLE `quiz_template_statuses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status_name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_template_statuses_status_name_unique` ON `quiz_template_statuses` (`status_name`);--> statement-breakpoint
ALTER TABLE `quiz_templates` ADD `status_id` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
-- Seed status values
INSERT INTO `quiz_template_statuses` (`id`, `status_name`) VALUES (1, 'active');--> statement-breakpoint
INSERT INTO `quiz_template_statuses` (`id`, `status_name`) VALUES (2, 'hidden');