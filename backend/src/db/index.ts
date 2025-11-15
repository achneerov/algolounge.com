import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { users } from "./models/users";
import { favoriteCourses, favoriteCourseUnique } from "./models/favorite-courses";
import { questionCompletions } from "./models/question-completions";
import { userRoles } from "./models/user-roles";
import { questionTypes } from "./models/question-types";
import {
  questions,
  questionsMultipleChoice2,
  questionsMultipleChoice3,
  questionsMultipleChoice4,
  questionsTrueFalse,
  questionsTyped,
} from "./models/questions";
import { quizTemplates, quizTemplateRounds } from "./models/quiz-templates";
import {
  quizEvents,
  quizEventParticipants,
  quizEventRounds,
} from "./models/quiz-events";
import { quizRoundPerformances } from "./models/quiz-round-performances";
import path from "path";

const dbPath = path.join(__dirname, "../../database.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

const schema = {
  users,
  favoriteCourses,
  favoriteCourseUnique,
  questionCompletions,
  userRoles,
  questionTypes,
  questions,
  questionsMultipleChoice2,
  questionsMultipleChoice3,
  questionsMultipleChoice4,
  questionsTrueFalse,
  questionsTyped,
  quizTemplates,
  quizTemplateRounds,
  quizEvents,
  quizEventParticipants,
  quizEventRounds,
  quizRoundPerformances,
};

export const db = drizzle(sqlite, { schema });

// Re-export all models
export {
  users,
  favoriteCourses,
  favoriteCourseUnique,
  questionCompletions,
  userRoles,
  questionTypes,
  questions,
  questionsMultipleChoice2,
  questionsMultipleChoice3,
  questionsMultipleChoice4,
  questionsTrueFalse,
  questionsTyped,
  quizTemplates,
  quizTemplateRounds,
  quizEvents,
  quizEventParticipants,
  quizEventRounds,
  quizRoundPerformances,
};
