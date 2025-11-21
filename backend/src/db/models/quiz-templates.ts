import { sql } from "drizzle-orm";
import { sqliteTable, integer, text, unique } from "drizzle-orm/sqlite-core";
import { questions } from "./questions";

// Reusable quiz templates
export const quizTemplates = sqliteTable("quiz_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  startingCountdownSeconds: integer("starting_countdown_seconds").notNull().default(5),
  transitionSeconds: integer("transition_seconds").notNull().default(3),
  createdAt: integer("created_at")
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

// Many-to-many relationship between templates and questions
export const quizTemplateRounds = sqliteTable(
  "quiz_template_rounds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quizTemplateId: integer("quiz_template_id")
      .notNull()
      .references(() => quizTemplates.id),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id),
    roundOrder: integer("round_order").notNull(),
  },
  (table) => ({
    uniqueTemplateOrder: unique().on(table.quizTemplateId, table.roundOrder),
  })
);
