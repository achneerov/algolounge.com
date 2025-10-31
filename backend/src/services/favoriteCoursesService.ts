import { db } from '../db';
import { favoriteCourses } from '../models';
import { eq, and } from 'drizzle-orm';

export async function getFavoriteCourses(userId: number): Promise<string[]> {
  const results = await db
    .select({ courseFilename: favoriteCourses.courseFilename })
    .from(favoriteCourses)
    .where(eq(favoriteCourses.userId, userId));

  return results.map((r) => r.courseFilename);
}

export async function addFavoriteCourse(
  userId: number,
  courseFilename: string
): Promise<void> {
  // Check if already favorited
  const existing = await db
    .select()
    .from(favoriteCourses)
    .where(
      and(
        eq(favoriteCourses.userId, userId),
        eq(favoriteCourses.courseFilename, courseFilename)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(favoriteCourses).values({
      userId,
      courseFilename,
    });
  }
}

export async function removeFavoriteCourse(
  userId: number,
  courseFilename: string
): Promise<void> {
  await db
    .delete(favoriteCourses)
    .where(
      and(
        eq(favoriteCourses.userId, userId),
        eq(favoriteCourses.courseFilename, courseFilename)
      )
    );
}
