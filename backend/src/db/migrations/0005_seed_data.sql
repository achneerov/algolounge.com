-- Add answer_reveal_seconds to questions table
ALTER TABLE `questions` ADD `answer_reveal_seconds` integer DEFAULT 5 NOT NULL;--> statement-breakpoint

-- Seed test user accounts
-- Member account: member@algolounge.com / algolounge123
INSERT INTO `users` (`username`, `email`, `password_hash`, `role_id`)
VALUES ('member', 'member@algolounge.com', '$2b$10$BXJ841nJrZPtunPwfP.z2uu0arJvQu9NNcvMwcWR//D9.KGtXmzGe', 2);
--> statement-breakpoint
-- Admin account: admin@algolounge.com / algolounge123
INSERT INTO `users` (`username`, `email`, `password_hash`, `role_id`)
VALUES ('admin', 'admin@algolounge.com', '$2b$10$BDUcC5hgX7az0OdW/sZQnuGji24BM7r5MZ1WkiF5S2lUEO6YkZgJu', 1);
--> statement-breakpoint

-- Seed sample quiz template with custom timings
INSERT INTO `quiz_templates` (`name`, `description`, `starting_countdown_seconds`, `transition_seconds`)
VALUES ('Sample Geography Quiz', 'A quick 3-question geography quiz for testing', 5, 5);
--> statement-breakpoint

-- Question 1: Multiple Choice 4 - Capital of France
-- question_display_seconds: 3, answer_time_seconds: 15, answer_reveal_seconds: 5
INSERT INTO `questions` (`question_type_id`, `question_text`, `question_display_seconds`, `answer_time_seconds`, `answer_reveal_seconds`)
VALUES (3, 'What is the capital of France?', 3, 15, 5);
--> statement-breakpoint
INSERT INTO `questions_multiple_choice_4` (`question_id`, `option_1`, `option_2`, `option_3`, `option_4`, `correct_option_index`)
VALUES (1, 'London', 'Berlin', 'Paris', 'Madrid', 3);
--> statement-breakpoint

-- Question 2: Typed Answer - JavaScript creator
-- question_display_seconds: 3, answer_time_seconds: 15, answer_reveal_seconds: 5
INSERT INTO `questions` (`question_type_id`, `question_text`, `question_display_seconds`, `answer_time_seconds`, `answer_reveal_seconds`)
VALUES (5, 'Who created JavaScript? (First and last name)', 3, 15, 5);
--> statement-breakpoint
INSERT INTO `questions_typed` (`question_id`, `correct_answer`, `case_sensitive`)
VALUES (2, 'Brendan Eich', 0);
--> statement-breakpoint

-- Question 3: True/False - Earth is flat
-- question_display_seconds: 3, answer_time_seconds: 15, answer_reveal_seconds: 5
INSERT INTO `questions` (`question_type_id`, `question_text`, `question_display_seconds`, `answer_time_seconds`, `answer_reveal_seconds`)
VALUES (4, 'The Earth is flat.', 3, 15, 5);
--> statement-breakpoint
INSERT INTO `questions_true_false` (`question_id`, `correct_answer`)
VALUES (3, 0);
--> statement-breakpoint

-- Link questions to quiz template
INSERT INTO `quiz_template_rounds` (`quiz_template_id`, `question_id`, `round_order`)
VALUES
  (1, 1, 1),
  (1, 2, 2),
  (1, 3, 3);
