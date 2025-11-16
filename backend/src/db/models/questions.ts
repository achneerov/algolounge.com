import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { questionTypes } from "./question-types";

// Base questions table
export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionTypeId: integer("question_type_id")
    .notNull()
    .references(() => questionTypes.id),
  questionText: text("question_text").notNull(),
  questionDisplaySeconds: integer("question_display_seconds").notNull().default(5),
  answerTimeSeconds: integer("answer_time_seconds").notNull().default(30),
  createdAt: integer("created_at")
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

// Multiple choice with 2 options
export const questionsMultipleChoice2 = sqliteTable(
  "questions_multiple_choice_2",
  {
    questionId: integer("question_id")
      .primaryKey()
      .references(() => questions.id),
    option1: text("option_1").notNull(),
    option2: text("option_2").notNull(),
    correctOptionIndex: integer("correct_option_index").notNull(),
  }
);

// Multiple choice with 3 options
export const questionsMultipleChoice3 = sqliteTable(
  "questions_multiple_choice_3",
  {
    questionId: integer("question_id")
      .primaryKey()
      .references(() => questions.id),
    option1: text("option_1").notNull(),
    option2: text("option_2").notNull(),
    option3: text("option_3").notNull(),
    correctOptionIndex: integer("correct_option_index").notNull(),
  }
);

// Multiple choice with 4 options
export const questionsMultipleChoice4 = sqliteTable(
  "questions_multiple_choice_4",
  {
    questionId: integer("question_id")
      .primaryKey()
      .references(() => questions.id),
    option1: text("option_1").notNull(),
    option2: text("option_2").notNull(),
    option3: text("option_3").notNull(),
    option4: text("option_4").notNull(),
    correctOptionIndex: integer("correct_option_index").notNull(),
  }
);

// True/False questions
export const questionsTrueFalse = sqliteTable("questions_true_false", {
  questionId: integer("question_id")
    .primaryKey()
    .references(() => questions.id),
  correctAnswer: integer("correct_answer", { mode: "boolean" }).notNull(),
});

// Typed (free text) questions
export const questionsTyped = sqliteTable("questions_typed", {
  questionId: integer("question_id")
    .primaryKey()
    .references(() => questions.id),
  correctAnswer: text("correct_answer").notNull(),
  caseSensitive: integer("case_sensitive", { mode: "boolean" })
    .notNull()
    .default(false),
});
