CREATE TABLE `question_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type_name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `question_types_type_name_unique` ON `question_types` (`type_name`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_type_id` integer NOT NULL,
	`question_text` text NOT NULL,
	`image_filename` text,
	`question_display_seconds` integer DEFAULT 5 NOT NULL,
	`answer_time_seconds` integer DEFAULT 30 NOT NULL,
	`answer_reveal_seconds` integer DEFAULT 5 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`question_type_id`) REFERENCES `question_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions_multiple_choice_2` (
	`question_id` integer PRIMARY KEY NOT NULL,
	`option_1` text NOT NULL,
	`option_2` text NOT NULL,
	`correct_option_index` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions_multiple_choice_3` (
	`question_id` integer PRIMARY KEY NOT NULL,
	`option_1` text NOT NULL,
	`option_2` text NOT NULL,
	`option_3` text NOT NULL,
	`correct_option_index` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions_multiple_choice_4` (
	`question_id` integer PRIMARY KEY NOT NULL,
	`option_1` text NOT NULL,
	`option_2` text NOT NULL,
	`option_3` text NOT NULL,
	`option_4` text NOT NULL,
	`correct_option_index` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions_true_false` (
	`question_id` integer PRIMARY KEY NOT NULL,
	`correct_answer` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions_typed` (
	`question_id` integer PRIMARY KEY NOT NULL,
	`correct_answer` text NOT NULL,
	`case_sensitive` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quiz_event_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quiz_event_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`joined_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`quiz_event_id`) REFERENCES `quiz_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quiz_event_participants_event_id_idx` ON `quiz_event_participants` (`quiz_event_id`);--> statement-breakpoint
CREATE INDEX `quiz_event_participants_user_id_idx` ON `quiz_event_participants` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_event_participants_quiz_event_id_user_id_unique` ON `quiz_event_participants` (`quiz_event_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `quiz_event_rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quiz_event_id` integer NOT NULL,
	`quiz_template_round_id` integer NOT NULL,
	`round_number` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`started_at` integer,
	`ended_at` integer,
	FOREIGN KEY (`quiz_event_id`) REFERENCES `quiz_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quiz_template_round_id`) REFERENCES `quiz_template_rounds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quiz_event_rounds_event_round_idx` ON `quiz_event_rounds` (`quiz_event_id`,`round_number`);--> statement-breakpoint
CREATE INDEX `quiz_event_rounds_event_status_idx` ON `quiz_event_rounds` (`quiz_event_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_event_rounds_quiz_event_id_round_number_unique` ON `quiz_event_rounds` (`quiz_event_id`,`round_number`);--> statement-breakpoint
CREATE TABLE `quiz_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quiz_template_id` integer NOT NULL,
	`room_code` text NOT NULL,
	`created_by_user_id` integer NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`started_at` integer,
	`ended_at` integer,
	FOREIGN KEY (`quiz_template_id`) REFERENCES `quiz_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quiz_events_room_code_idx` ON `quiz_events` (`room_code`);--> statement-breakpoint
CREATE TABLE `quiz_round_performances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quiz_event_round_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`user_answer` text,
	`submitted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`answered_correctly` integer DEFAULT false NOT NULL,
	`points_earned` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`quiz_event_round_id`) REFERENCES `quiz_event_rounds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quiz_round_performances_round_submitted_idx` ON `quiz_round_performances` (`quiz_event_round_id`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `quiz_round_performances_round_correct_idx` ON `quiz_round_performances` (`quiz_event_round_id`,`answered_correctly`);--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_round_performances_quiz_event_round_id_user_id_unique` ON `quiz_round_performances` (`quiz_event_round_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `quiz_template_rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quiz_template_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`round_order` integer NOT NULL,
	FOREIGN KEY (`quiz_template_id`) REFERENCES `quiz_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_template_rounds_quiz_template_id_round_order_unique` ON `quiz_template_rounds` (`quiz_template_id`,`round_order`);--> statement-breakpoint
CREATE TABLE `quiz_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`transition_seconds` integer DEFAULT 3 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role_name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_roles_role_name_unique` ON `user_roles` (`role_name`);--> statement-breakpoint
ALTER TABLE `users` ADD `role_id` integer NOT NULL DEFAULT 2 REFERENCES user_roles(id);--> statement-breakpoint
-- Seed question types (required for quiz questions)
INSERT INTO `question_types` (`id`, `type_name`) VALUES (1, 'multiple_choice_2');--> statement-breakpoint
INSERT INTO `question_types` (`id`, `type_name`) VALUES (2, 'multiple_choice_3');--> statement-breakpoint
INSERT INTO `question_types` (`id`, `type_name`) VALUES (3, 'multiple_choice_4');--> statement-breakpoint
INSERT INTO `question_types` (`id`, `type_name`) VALUES (4, 'true_false');--> statement-breakpoint
INSERT INTO `question_types` (`id`, `type_name`) VALUES (5, 'typed');--> statement-breakpoint
-- Seed user roles (required for user accounts)
INSERT INTO `user_roles` (`id`, `role_name`) VALUES (1, 'admin');--> statement-breakpoint
INSERT INTO `user_roles` (`id`, `role_name`) VALUES (2, 'member');--> statement-breakpoint
-- Seed sample quiz template
INSERT INTO `quiz_templates` (`id`, `name`, `transition_seconds`) VALUES (1, 'Sample Geography Quiz', 5);--> statement-breakpoint
-- Question 1: Multiple Choice 4 - Capital of France
INSERT INTO `questions` (`id`, `question_type_id`, `question_text`, `image_filename`, `question_display_seconds`, `answer_time_seconds`, `answer_reveal_seconds`) VALUES (1, 3, 'What is the capital of France?', 'eiffel-tower.jpg', 3, 15, 5);--> statement-breakpoint
INSERT INTO `questions_multiple_choice_4` (`question_id`, `option_1`, `option_2`, `option_3`, `option_4`, `correct_option_index`) VALUES (1, 'London', 'Berlin', 'Paris', 'Madrid', 3);--> statement-breakpoint
-- Question 2: Typed Answer - JavaScript creator
INSERT INTO `questions` (`id`, `question_type_id`, `question_text`, `image_filename`, `question_display_seconds`, `answer_time_seconds`, `answer_reveal_seconds`) VALUES (2, 5, 'Who created JavaScript? (First and last name)', 'javascript-code.jpg', 3, 15, 5);--> statement-breakpoint
INSERT INTO `questions_typed` (`question_id`, `correct_answer`, `case_sensitive`) VALUES (2, 'Brendan Eich', 0);--> statement-breakpoint
-- Question 3: True/False - Earth is flat
INSERT INTO `questions` (`id`, `question_type_id`, `question_text`, `question_display_seconds`, `answer_time_seconds`, `answer_reveal_seconds`) VALUES (3, 4, 'The Earth is flat.', 3, 15, 5);--> statement-breakpoint
INSERT INTO `questions_true_false` (`question_id`, `correct_answer`) VALUES (3, 0);--> statement-breakpoint
-- Link questions to quiz template
INSERT INTO `quiz_template_rounds` (`quiz_template_id`, `question_id`, `round_order`) VALUES (1, 1, 1);--> statement-breakpoint
INSERT INTO `quiz_template_rounds` (`quiz_template_id`, `question_id`, `round_order`) VALUES (1, 2, 2);--> statement-breakpoint
INSERT INTO `quiz_template_rounds` (`quiz_template_id`, `question_id`, `round_order`) VALUES (1, 3, 3);
