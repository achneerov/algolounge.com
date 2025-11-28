import { sqliteTable, integer, index, unique } from "drizzle-orm/sqlite-core";
import { voiceSessions } from "./voice-sessions";
import { users } from "./users";

export const voiceParticipants = sqliteTable(
  "voice_participants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    voiceSessionId: integer("voice_session_id")
      .notNull()
      .references(() => voiceSessions.id),
    userId: integer("user_id").notNull().references(() => users.id),
    joinedAt: integer("joined_at").notNull(),
    leftAt: integer("left_at"),
    isMuted: integer("is_muted").default(0).notNull(), // SQLite boolean as 0/1
    isVideoEnabled: integer("is_video_enabled").default(1).notNull(), // SQLite boolean as 0/1
  },
  (table) => [
    index("voice_participants_session_idx").on(table.voiceSessionId),
    index("voice_participants_user_idx").on(table.userId),
    unique("voice_participants_session_user_unique").on(
      table.voiceSessionId,
      table.userId
    ),
  ]
);

export type VoiceParticipant = typeof voiceParticipants.$inferSelect;
export type NewVoiceParticipant = typeof voiceParticipants.$inferInsert;
