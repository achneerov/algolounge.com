import { db } from "../db";
import {
  quizEvents,
  quizEventParticipants,
  quizEventRounds,
  quizRoundPerformances,
  quizTemplates,
  quizTemplateRounds,
  questions,
  questionsMultipleChoice2,
  questionsMultipleChoice3,
  questionsMultipleChoice4,
  questionsTrueFalse,
  questionsTyped,
} from "../db";
import { eq, and, or, desc, asc } from "drizzle-orm";
import { calculatePoints } from "./scoring";

// Generate random 4-digit room code (1000-9999)
function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Create a new quiz event from a template
export async function createQuizEvent(
  quizTemplateId: number,
  createdByUserId: number
) {
  // Verify template exists
  const template = await db
    .select()
    .from(quizTemplates)
    .where(eq(quizTemplates.id, quizTemplateId))
    .limit(1);

  if (template.length === 0) {
    throw new Error("Quiz template not found");
  }

  // Get all template rounds
  const templateRounds = await db
    .select()
    .from(quizTemplateRounds)
    .where(eq(quizTemplateRounds.quizTemplateId, quizTemplateId))
    .orderBy(asc(quizTemplateRounds.roundOrder));

  if (templateRounds.length === 0) {
    throw new Error("Quiz template has no questions");
  }

  // Generate unique room code
  let roomCode = generateRoomCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await db
      .select()
      .from(quizEvents)
      .where(
        and(
          eq(quizEvents.roomCode, roomCode),
          or(
            eq(quizEvents.status, "waiting"),
            eq(quizEvents.status, "in_progress")
          )
        )
      )
      .limit(1);

    if (existing.length === 0) break;

    roomCode = generateRoomCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique room code");
  }

  // Create quiz event
  const eventResult = await db
    .insert(quizEvents)
    .values({
      quizTemplateId,
      roomCode,
      createdByUserId,
      status: "waiting",
    })
    .returning();

  const event = eventResult[0];

  // Create all rounds eagerly
  const roundsToInsert = templateRounds.map((tr, index) => ({
    quizEventId: event.id,
    quizTemplateRoundId: tr.id,
    roundNumber: index + 1,
    status: "pending" as const,
  }));

  await db.insert(quizEventRounds).values(roundsToInsert);

  return event;
}

// Get quiz event by room code
export async function getEventByRoomCode(roomCode: string) {
  const result = await db
    .select()
    .from(quizEvents)
    .where(eq(quizEvents.roomCode, roomCode))
    .limit(1);

  return result[0] || null;
}

// Get quiz event by ID
export async function getEventById(eventId: number) {
  const result = await db
    .select()
    .from(quizEvents)
    .where(eq(quizEvents.id, eventId))
    .limit(1);

  return result[0] || null;
}

// Join a quiz event
export async function joinQuizEvent(eventId: number, userId: number) {
  // Check if event exists and is in waiting status
  const event = await getEventById(eventId);

  if (!event) {
    throw new Error("Quiz event not found");
  }

  if (event.status !== "waiting") {
    throw new Error("Quiz has already started or ended");
  }

  // Check if user already joined
  const existing = await db
    .select()
    .from(quizEventParticipants)
    .where(
      and(
        eq(quizEventParticipants.quizEventId, eventId),
        eq(quizEventParticipants.userId, userId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Already joined this quiz");
  }

  // Add participant
  const result = await db
    .insert(quizEventParticipants)
    .values({
      quizEventId: eventId,
      userId,
    })
    .returning();

  return result[0];
}

// Start a quiz event
export async function startQuizEvent(eventId: number, userId: number) {
  const event = await getEventById(eventId);

  if (!event) {
    throw new Error("Quiz event not found");
  }

  if (event.createdByUserId !== userId) {
    throw new Error("Only the quiz creator can start the quiz");
  }

  if (event.status !== "waiting") {
    throw new Error("Quiz has already started or ended");
  }

  // Update event status
  await db
    .update(quizEvents)
    .set({
      status: "in_progress",
      startedAt: Date.now(),
    })
    .where(eq(quizEvents.id, eventId));

  // Activate first round
  await db
    .update(quizEventRounds)
    .set({
      status: "active",
      startedAt: Date.now(),
    })
    .where(
      and(
        eq(quizEventRounds.quizEventId, eventId),
        eq(quizEventRounds.roundNumber, 1)
      )
    );

  return true;
}

// Advance to next round
export async function advanceToNextRound(eventId: number, userId: number) {
  const event = await getEventById(eventId);

  if (!event) {
    throw new Error("Quiz event not found");
  }

  if (event.createdByUserId !== userId) {
    throw new Error("Only the quiz creator can advance rounds");
  }

  if (event.status !== "in_progress") {
    throw new Error("Quiz is not in progress");
  }

  // Get current active round
  const currentRound = await db
    .select()
    .from(quizEventRounds)
    .where(
      and(
        eq(quizEventRounds.quizEventId, eventId),
        eq(quizEventRounds.status, "active")
      )
    )
    .limit(1);

  if (currentRound.length === 0) {
    throw new Error("No active round found");
  }

  const round = currentRound[0];

  // Mark current round as completed
  await db
    .update(quizEventRounds)
    .set({
      status: "completed",
      endedAt: Date.now(),
    })
    .where(eq(quizEventRounds.id, round.id));

  // Calculate and store points for this round
  await calculatePoints(round.id);

  // Check if there are more rounds
  const nextRound = await db
    .select()
    .from(quizEventRounds)
    .where(
      and(
        eq(quizEventRounds.quizEventId, eventId),
        eq(quizEventRounds.roundNumber, round.roundNumber + 1)
      )
    )
    .limit(1);

  if (nextRound.length > 0) {
    // Activate next round
    await db
      .update(quizEventRounds)
      .set({
        status: "active",
        startedAt: Date.now(),
      })
      .where(eq(quizEventRounds.id, nextRound[0].id));

    return { completed: false, nextRound: nextRound[0] };
  } else {
    // No more rounds - mark event as completed
    await db
      .update(quizEvents)
      .set({
        status: "completed",
        endedAt: Date.now(),
      })
      .where(eq(quizEvents.id, eventId));

    return { completed: true, nextRound: null };
  }
}

// Submit an answer for a round
export async function submitAnswer(
  eventId: number,
  roundId: number,
  userId: number,
  answer: string
) {
  // Verify round exists and is active
  const round = await db
    .select()
    .from(quizEventRounds)
    .where(
      and(
        eq(quizEventRounds.id, roundId),
        eq(quizEventRounds.quizEventId, eventId)
      )
    )
    .limit(1);

  if (round.length === 0) {
    throw new Error("Round not found");
  }

  if (round[0].status !== "active") {
    throw new Error("Round is not active");
  }

  // Check if user already answered
  const existing = await db
    .select()
    .from(quizRoundPerformances)
    .where(
      and(
        eq(quizRoundPerformances.quizEventRoundId, roundId),
        eq(quizRoundPerformances.userId, userId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Already answered this question");
  }

  // Get the question to check answer
  const templateRound = await db
    .select()
    .from(quizTemplateRounds)
    .where(eq(quizTemplateRounds.id, round[0].quizTemplateRoundId))
    .limit(1);

  if (templateRound.length === 0) {
    throw new Error("Template round not found");
  }

  const question = await db
    .select()
    .from(questions)
    .where(eq(questions.id, templateRound[0].questionId))
    .limit(1);

  if (question.length === 0) {
    throw new Error("Question not found");
  }

  // Check if answer is correct based on question type
  const isCorrect = await checkAnswer(
    question[0].id,
    question[0].questionTypeId,
    answer
  );

  // Store performance (points will be calculated later)
  const result = await db
    .insert(quizRoundPerformances)
    .values({
      quizEventRoundId: roundId,
      userId,
      userAnswer: answer,
      answeredCorrectly: isCorrect,
      pointsEarned: 0, // Will be calculated when round ends
    })
    .returning();

  return result[0];
}

// Helper function to check if answer is correct
async function checkAnswer(
  questionId: number,
  questionTypeId: number,
  answer: string
): Promise<boolean> {
  // questionTypeId: 1=mc2, 2=mc3, 3=mc4, 4=true_false, 5=typed

  if (questionTypeId === 1) {
    const result = await db
      .select()
      .from(questionsMultipleChoice2)
      .where(eq(questionsMultipleChoice2.questionId, questionId))
      .limit(1);
    return result.length > 0 && result[0].correctOptionIndex.toString() === answer;
  }

  if (questionTypeId === 2) {
    const result = await db
      .select()
      .from(questionsMultipleChoice3)
      .where(eq(questionsMultipleChoice3.questionId, questionId))
      .limit(1);
    return result.length > 0 && result[0].correctOptionIndex.toString() === answer;
  }

  if (questionTypeId === 3) {
    const result = await db
      .select()
      .from(questionsMultipleChoice4)
      .where(eq(questionsMultipleChoice4.questionId, questionId))
      .limit(1);
    return result.length > 0 && result[0].correctOptionIndex.toString() === answer;
  }

  if (questionTypeId === 4) {
    const result = await db
      .select()
      .from(questionsTrueFalse)
      .where(eq(questionsTrueFalse.questionId, questionId))
      .limit(1);
    return result.length > 0 && result[0].correctAnswer.toString() === answer;
  }

  if (questionTypeId === 5) {
    const result = await db
      .select()
      .from(questionsTyped)
      .where(eq(questionsTyped.questionId, questionId))
      .limit(1);

    if (result.length === 0) return false;

    const correct = result[0].correctAnswer;
    const caseSensitive = result[0].caseSensitive;

    if (caseSensitive) {
      return correct.trim() === answer.trim();
    } else {
      return correct.trim().toLowerCase() === answer.trim().toLowerCase();
    }
  }

  return false;
}

// Get leaderboard for a quiz event
export async function getLeaderboard(eventId: number) {
  // Get all participants
  const participants = await db
    .select()
    .from(quizEventParticipants)
    .where(eq(quizEventParticipants.quizEventId, eventId));

  // Get all rounds for this event
  const rounds = await db
    .select()
    .from(quizEventRounds)
    .where(eq(quizEventRounds.quizEventId, eventId));

  const roundIds = rounds.map((r) => r.id);

  // Get all performances
  const performances = await db
    .select()
    .from(quizRoundPerformances)
    .where(
      and(
        eq(quizRoundPerformances.quizEventRoundId, roundIds[0]),
        // We need to get all performances for all rounds, so let's refactor this
      )
    );

  // Calculate total score for each user
  const userScores = new Map<number, number>();

  for (const participant of participants) {
    let totalScore = 0;

    for (const roundId of roundIds) {
      const perf = await db
        .select()
        .from(quizRoundPerformances)
        .where(
          and(
            eq(quizRoundPerformances.quizEventRoundId, roundId),
            eq(quizRoundPerformances.userId, participant.userId)
          )
        )
        .limit(1);

      if (perf.length > 0) {
        totalScore += perf[0].pointsEarned;
      }
    }

    userScores.set(participant.userId, totalScore);
  }

  // Sort by score descending
  const leaderboard = participants
    .map((p) => ({
      userId: p.userId,
      score: userScores.get(p.userId) || 0,
    }))
    .sort((a, b) => b.score - a.score);

  return leaderboard;
}

// Get participants for an event
export async function getParticipants(eventId: number) {
  return await db
    .select()
    .from(quizEventParticipants)
    .where(eq(quizEventParticipants.quizEventId, eventId));
}

// Get active round for an event
export async function getActiveRound(eventId: number) {
  const result = await db
    .select()
    .from(quizEventRounds)
    .where(
      and(
        eq(quizEventRounds.quizEventId, eventId),
        eq(quizEventRounds.status, "active")
      )
    )
    .limit(1);

  return result[0] || null;
}

// Get all rounds for an event
export async function getEventRounds(eventId: number) {
  return await db
    .select()
    .from(quizEventRounds)
    .where(eq(quizEventRounds.quizEventId, eventId))
    .orderBy(asc(quizEventRounds.roundNumber));
}

// Get question data for a round (without correct answer)
export async function getRoundQuestion(eventId: number, roundId: number) {
  // Get the round
  const round = await db
    .select()
    .from(quizEventRounds)
    .where(
      and(
        eq(quizEventRounds.id, roundId),
        eq(quizEventRounds.quizEventId, eventId)
      )
    )
    .limit(1);

  if (round.length === 0) {
    throw new Error("Round not found");
  }

  // Get the quiz template round
  const templateRound = await db
    .select()
    .from(quizTemplateRounds)
    .where(eq(quizTemplateRounds.id, round[0].quizTemplateRoundId))
    .limit(1);

  if (templateRound.length === 0) {
    throw new Error("Template round not found");
  }

  const questionId = templateRound[0].questionId;

  // Get the base question
  const question = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);

  if (question.length === 0) {
    throw new Error("Question not found");
  }

  const questionData = question[0];
  const questionTypeId = questionData.questionTypeId;

  // Get type-specific data (including correct answer)
  let options: any = null;

  if (questionTypeId === 1) {
    const result = await db
      .select()
      .from(questionsMultipleChoice2)
      .where(eq(questionsMultipleChoice2.questionId, questionId))
      .limit(1);
    if (result.length > 0) {
      options = {
        option1: result[0].option1,
        option2: result[0].option2,
        correctOptionIndex: result[0].correctOptionIndex,
      };
    }
  } else if (questionTypeId === 2) {
    const result = await db
      .select()
      .from(questionsMultipleChoice3)
      .where(eq(questionsMultipleChoice3.questionId, questionId))
      .limit(1);
    if (result.length > 0) {
      options = {
        option1: result[0].option1,
        option2: result[0].option2,
        option3: result[0].option3,
        correctOptionIndex: result[0].correctOptionIndex,
      };
    }
  } else if (questionTypeId === 3) {
    const result = await db
      .select()
      .from(questionsMultipleChoice4)
      .where(eq(questionsMultipleChoice4.questionId, questionId))
      .limit(1);
    if (result.length > 0) {
      options = {
        option1: result[0].option1,
        option2: result[0].option2,
        option3: result[0].option3,
        option4: result[0].option4,
        correctOptionIndex: result[0].correctOptionIndex,
      };
    }
  } else if (questionTypeId === 4) {
    // True/False
    const result = await db
      .select()
      .from(questionsTrueFalse)
      .where(eq(questionsTrueFalse.questionId, questionId))
      .limit(1);
    if (result.length > 0) {
      options = {
        correctAnswer: result[0].correctAnswer,
      };
    }
  } else if (questionTypeId === 5) {
    // Typed answer
    const result = await db
      .select()
      .from(questionsTyped)
      .where(eq(questionsTyped.questionId, questionId))
      .limit(1);
    if (result.length > 0) {
      options = {
        correctAnswer: result[0].correctAnswer,
      };
    }
  }

  return {
    id: questionData.id,
    questionTypeId: questionData.questionTypeId,
    questionText: questionData.questionText,
    questionDisplaySeconds: questionData.questionDisplaySeconds,
    answerTimeSeconds: questionData.answerTimeSeconds,
    answerRevealSeconds: questionData.answerRevealSeconds,
    options,
  };
}

// Get quiz template by ID
export async function getTemplateById(templateId: number) {
  const result = await db
    .select()
    .from(quizTemplates)
    .where(eq(quizTemplates.id, templateId))
    .limit(1);

  return result[0] || null;
}
