import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const favoriteCourses = sqliteTable("favorite_courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseFilename: text("course_filename").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

// Composite unique constraint for (user_id, course_filename)
export const favoriteCourseUnique = sql`CREATE UNIQUE INDEX IF NOT EXISTS favorite_courses_unique
  ON favorite_courses(user_id, course_filename)`;
