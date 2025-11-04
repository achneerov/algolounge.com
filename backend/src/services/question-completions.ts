import { db, questionCompletions } from "../db";
import { eq } from "drizzle-orm";

export async function markQuestionCompleted(
  userId: number,
  questionFilename: string
) {
  const result = await db
    .insert(questionCompletions)
    .values({
      userId,
      questionFilename,
    })
    .returning();

  return result[0];
}

export async function getUserCompletedQuestions(userId: number) {
  const completions = await db
    .selectDistinct({ questionFilename: questionCompletions.questionFilename })
    .from(questionCompletions)
    .where(eq(questionCompletions.userId, userId));

  return completions.map((c) => c.questionFilename);
}

export async function isQuestionCompleted(
  userId: number,
  questionFilename: string
): Promise<boolean> {
  const result = await db
    .select()
    .from(questionCompletions)
    .where(
      eq(questionCompletions.userId, userId) &&
        eq(questionCompletions.questionFilename, questionFilename)
    )
    .limit(1);

  return result.length > 0;
}
