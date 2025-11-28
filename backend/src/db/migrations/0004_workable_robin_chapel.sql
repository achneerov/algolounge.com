CREATE TABLE `voice_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`voice_session_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`joined_at` integer NOT NULL,
	`left_at` integer,
	`is_muted` integer DEFAULT 0 NOT NULL,
	`is_video_enabled` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`voice_session_id`) REFERENCES `voice_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `voice_participants_session_idx` ON `voice_participants` (`voice_session_id`);--> statement-breakpoint
CREATE INDEX `voice_participants_user_idx` ON `voice_participants` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `voice_participants_session_user_unique` ON `voice_participants` (`voice_session_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `voice_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_by_user_id` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`max_participants` integer DEFAULT 20,
	`created_at` integer NOT NULL,
	`closed_at` integer,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `voice_sessions_created_by_idx` ON `voice_sessions` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `voice_sessions_status_idx` ON `voice_sessions` (`status`);