-- Create a sample quiz template
INSERT INTO `quiz_templates` (`id`, `name`, `description`)
VALUES (1, 'Sample Quiz', 'A basic quiz with 3 different question types');
--> statement-breakpoint
-- Question 1: Multiple choice with 4 options
INSERT INTO `questions` (`id`, `question_type_id`, `question_text`, `time_limit_seconds`)
VALUES (1, 3, 'What is the capital of France?', 30);
--> statement-breakpoint
INSERT INTO `questions_multiple_choice_4` (`question_id`, `option_1`, `option_2`, `option_3`, `option_4`, `correct_option_index`)
VALUES (1, 'London', 'Berlin', 'Paris', 'Madrid', 3);
--> statement-breakpoint
-- Question 2: Typed answer (text input)
INSERT INTO `questions` (`id`, `question_type_id`, `question_text`, `time_limit_seconds`)
VALUES (2, 5, 'What programming language is used for web browsers?', 30);
--> statement-breakpoint
INSERT INTO `questions_typed` (`question_id`, `correct_answer`, `case_sensitive`)
VALUES (2, 'JavaScript', 0);
--> statement-breakpoint
-- Question 3: True/False
INSERT INTO `questions` (`id`, `question_type_id`, `question_text`, `time_limit_seconds`)
VALUES (3, 4, 'The Earth is flat.', 20);
--> statement-breakpoint
INSERT INTO `questions_true_false` (`question_id`, `correct_answer`)
VALUES (3, 0);
--> statement-breakpoint
-- Link questions to quiz template (in order)
INSERT INTO `quiz_template_rounds` (`quiz_template_id`, `question_id`, `round_order`)
VALUES (1, 1, 1);
--> statement-breakpoint
INSERT INTO `quiz_template_rounds` (`quiz_template_id`, `question_id`, `round_order`)
VALUES (1, 2, 2);
--> statement-breakpoint
INSERT INTO `quiz_template_rounds` (`quiz_template_id`, `question_id`, `round_order`)
VALUES (1, 3, 3);
