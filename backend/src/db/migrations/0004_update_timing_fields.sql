-- Add timing fields to quiz_templates
ALTER TABLE `quiz_templates` ADD `starting_countdown_seconds` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_templates` ADD `transition_seconds` integer DEFAULT 3 NOT NULL;--> statement-breakpoint

-- Add question_display_seconds to questions table
ALTER TABLE `questions` ADD `question_display_seconds` integer DEFAULT 5 NOT NULL;--> statement-breakpoint

-- Rename time_limit_seconds to answer_time_seconds
ALTER TABLE `questions` RENAME COLUMN `time_limit_seconds` TO `answer_time_seconds`;
