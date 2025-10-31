import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const favoriteCourses = sqliteTable('favorite_courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  courseFilename: text('course_filename').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type FavoriteCourse = typeof favoriteCourses.$inferSelect;
export type NewFavoriteCourse = typeof favoriteCourses.$inferInsert;
