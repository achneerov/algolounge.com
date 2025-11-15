import { sql } from "drizzle-orm";
import { sqliteTable, integer, text, unique, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { quizTemplates, quizTemplateRounds } from "./quiz-templates";

// Live quiz game sessions
export const quizEvents = sqliteTable(
  "quiz_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quizTemplateId: integer("quiz_template_id")
      .notNull()
      .references(() => quizTemplates.id),
    roomCode: text("room_code").notNull(),
    createdByUserId: integer("created_by_user_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull().default("waiting"), // 'waiting', 'in_progress', 'completed'
    createdAt: integer("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    startedAt: integer("started_at"),
    endedAt: integer("ended_at"),
  },
  (table) => ({
    roomCodeIdx: index("quiz_events_room_code_idx").on(table.roomCode),
  })
);

// Participants in a quiz event
export const quizEventParticipants = sqliteTable(
  "quiz_event_participants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quizEventId: integer("quiz_event_id")
      .notNull()
      .references(() => quizEvents.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    joinedAt: integer("joined_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => ({
    uniqueEventUser: unique().on(table.quizEventId, table.userId),
    eventIdIdx: index("quiz_event_participants_event_id_idx").on(table.quizEventId),
    userIdIdx: index("quiz_event_participants_user_id_idx").on(table.userId),
  })
);

// Individual rounds (questions) within a quiz event
export const quizEventRounds = sqliteTable(
  "quiz_event_rounds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quizEventId: integer("quiz_event_id")
      .notNull()
      .references(() => quizEvents.id),
    quizTemplateRoundId: integer("quiz_template_round_id")
      .notNull()
      .references(() => quizTemplateRounds.id),
    roundNumber: integer("round_number").notNull(),
    status: text("status").notNull().default("pending"), // 'pending', 'active', 'completed'
    startedAt: integer("started_at"),
    endedAt: integer("ended_at"),
  },
  (table) => ({
    uniqueEventRound: unique().on(table.quizEventId, table.roundNumber),
    eventIdRoundNumberIdx: index("quiz_event_rounds_event_round_idx").on(
      table.quizEventId,
      table.roundNumber
    ),
    eventIdStatusIdx: index("quiz_event_rounds_event_status_idx").on(
      table.quizEventId,
      table.status
    ),
  })
);
