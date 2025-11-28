import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const voiceSessions = sqliteTable(
  "voice_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    name: text("name").notNull(),
    createdByUserId: integer("created_by_user_id")
      .notNull()
      .references(() => users.id),
    status: text("status").default("active").notNull(), // 'active', 'closed'
    maxParticipants: integer("max_participants").default(20),
    createdAt: integer("created_at")
      .default(() => Math.floor(Date.now()))
      .notNull(),
    closedAt: integer("closed_at"),
  },
  (table) => [
    index("voice_sessions_created_by_idx").on(table.createdByUserId),
    index("voice_sessions_status_idx").on(table.status),
  ]
);

export type VoiceSession = typeof voiceSessions.$inferSelect;
export type NewVoiceSession = typeof voiceSessions.$inferInsert;
