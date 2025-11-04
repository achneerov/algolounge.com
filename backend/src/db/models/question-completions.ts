import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const questionCompletions = sqliteTable("question_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionFilename: text("question_filename").notNull(),
  completedAt: integer("completed_at")
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});
