import { sql } from "drizzle-orm";
import { sqliteTable, integer, text, unique, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { quizEventRounds } from "./quiz-events";

// User performance and answers for each quiz round
export const quizRoundPerformances = sqliteTable(
  "quiz_round_performances",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quizEventRoundId: integer("quiz_event_round_id")
      .notNull()
      .references(() => quizEventRounds.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    userAnswer: text("user_answer"),
    submittedAt: integer("submitted_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    answeredCorrectly: integer("answered_correctly", { mode: "boolean" })
      .notNull()
      .default(false),
    pointsEarned: integer("points_earned").notNull().default(0),
  },
  (table) => ({
    uniqueRoundUser: unique().on(table.quizEventRoundId, table.userId),
    roundIdSubmittedIdx: index("quiz_round_performances_round_submitted_idx").on(
      table.quizEventRoundId,
      table.submittedAt
    ),
    roundIdCorrectIdx: index("quiz_round_performances_round_correct_idx").on(
      table.quizEventRoundId,
      table.answeredCorrectly
    ),
  })
);
