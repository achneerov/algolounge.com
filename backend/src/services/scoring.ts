import { db, quizRoundPerformances } from "../db";
import { eq, and } from "drizzle-orm";

/**
 * Calculate and assign points for a completed quiz round
 * Scoring algorithm:
 * - Only correct answers get points
 * - Fastest gets 100 points
 * - Slowest gets 50 points
 * - Everyone in between scaled linearly (50-100 range)
 * - If everyone wrong: no points
 * - If only 1 correct: they get 100 points
 * - Ties (same timestamp): get averaged position points
 */
export async function calculatePoints(roundId: number) {
  // Get all performances for this round
  const performances = await db
    .select()
    .from(quizRoundPerformances)
    .where(eq(quizRoundPerformances.quizEventRoundId, roundId));

  // Filter only correct answers
  const correctAnswers = performances.filter((p) => p.answeredCorrectly);

  if (correctAnswers.length === 0) {
    // No one answered correctly - everyone gets 0 points (already default)
    return;
  }

  if (correctAnswers.length === 1) {
    // Only one correct answer - they get 100 points
    await db
      .update(quizRoundPerformances)
      .set({ pointsEarned: 100 })
      .where(eq(quizRoundPerformances.id, correctAnswers[0].id));
    return;
  }

  // Sort by submission time (earliest to latest)
  const sorted = [...correctAnswers].sort(
    (a, b) => a.submittedAt - b.submittedAt
  );

  // Group by timestamp to handle ties
  type Performance = typeof sorted[number];
  const groups: Performance[][] = [];
  let currentGroup: Performance[] = [];
  let currentTimestamp = sorted[0].submittedAt;

  for (const perf of sorted) {
    if (perf.submittedAt === currentTimestamp) {
      currentGroup.push(perf);
    } else {
      groups.push(currentGroup);
      currentGroup = [perf];
      currentTimestamp = perf.submittedAt;
    }
  }
  groups.push(currentGroup); // Add last group

  // Calculate points for each group
  let position = 0;

  for (const group of groups) {
    const groupSize = group.length;
    const startPos = position;
    const endPos = position + groupSize - 1;

    // Calculate average position for this group
    const avgPosition = (startPos + endPos) / 2;

    // Linear interpolation: position 0 = 100 points, last position = 50 points
    const totalPositions = sorted.length - 1;
    let points: number;

    if (totalPositions === 0) {
      // Only one position (should not happen due to early return, but safety check)
      points = 100;
    } else {
      // Linear scale from 100 (first) to 50 (last)
      points = 100 - (avgPosition / totalPositions) * 50;
      points = Math.round(points);
    }

    // Assign points to all members of this group
    for (const perf of group) {
      await db
        .update(quizRoundPerformances)
        .set({ pointsEarned: points })
        .where(eq(quizRoundPerformances.id, perf.id));
    }

    position += groupSize;
  }
}
