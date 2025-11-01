import { db } from "../db";
import { favoriteCourses } from "../db/schema";
import { eq, and } from "drizzle-orm";

export async function addFavoriteCourse(userId: number, courseFilename: string) {
  try {
    const result = await db
      .insert(favoriteCourses)
      .values({
        userId,
        courseFilename,
      })
      .returning();

    return result[0];
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      throw new Error("Course already in favorites");
    }
    throw error;
  }
}

export async function removeFavoriteCourse(
  userId: number,
  courseFilename: string
) {
  await db
    .delete(favoriteCourses)
    .where(
      and(
        eq(favoriteCourses.userId, userId),
        eq(favoriteCourses.courseFilename, courseFilename)
      )
    );

  return { success: true };
}

export async function getUserFavoriteCourses(userId: number) {
  const favorites = await db
    .select()
    .from(favoriteCourses)
    .where(eq(favoriteCourses.userId, userId));

  return favorites.map((fav) => fav.courseFilename);
}

export async function isFavoriteCourse(
  userId: number,
  courseFilename: string
): Promise<boolean> {
  const result = await db
    .select()
    .from(favoriteCourses)
    .where(
      and(
        eq(favoriteCourses.userId, userId),
        eq(favoriteCourses.courseFilename, courseFilename)
      )
    )
    .limit(1);

  return result.length > 0;
}
