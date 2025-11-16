import { Router, Request, Response } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import {
  createQuizEvent,
  getEventByRoomCode,
  getEventById,
  joinQuizEvent,
  startQuizEvent,
  advanceToNextRound,
  submitAnswer,
  getLeaderboard,
  getParticipants,
  getActiveRound,
  getEventRounds,
  getRoundQuestion,
} from "../services/quiz";
import { db, users } from "../db";
import { eq, inArray } from "drizzle-orm";
import { addClient, broadcastToEvent, SSE_EVENTS } from "../services/sse";

const router = Router();

// POST /api/quiz-events - Create new quiz event (admin only)
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { quiz_template_id } = req.body;

      if (!quiz_template_id) {
        return res.status(400).json({ error: "quiz_template_id is required" });
      }

      const event = await createQuizEvent(
        quiz_template_id,
        req.user!.userId
      );

      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// GET /api/quiz-events/:room_code - Get event by room code
router.get("/:room_code", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { room_code } = req.params;

    const event = await getEventByRoomCode(room_code);

    if (!event) {
      return res.status(404).json({ error: "Quiz event not found" });
    }

    // Get template
    const { getTemplateById } = await import("../services/quiz");
    const template = await getTemplateById(event.quizTemplateId);

    // Get participants
    const participants = await getParticipants(event.id);

    // Get participant user details
    const userIds = participants.map((p) => p.userId);
    const participantUsers = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(inArray(users.id, userIds));

    // Get rounds
    const rounds = await getEventRounds(event.id);

    // Get active round if any
    const activeRound = await getActiveRound(event.id);

    res.json({
      ...event,
      template,
      participants: participantUsers,
      rounds,
      activeRound,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quiz-events/:id/join - Join a quiz event
router.post("/:id/join", authMiddleware, async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);

    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const participant = await joinQuizEvent(eventId, req.user!.userId);

    // Get user details
    const user = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);

    // Broadcast player_joined event
    if (user.length > 0) {
      broadcastToEvent(eventId, SSE_EVENTS.PLAYER_JOINED, {
        userId: user[0].id,
        username: user[0].username,
      });
    }

    res.status(201).json(participant);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/quiz-events/:id/start - Start a quiz event (admin only)
router.post(
  "/:id/start",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);

      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      await startQuizEvent(eventId, req.user!.userId);

      // Get updated event with active round
      const event = await getEventById(eventId);
      const activeRound = await getActiveRound(eventId);

      // Broadcast quiz_started event
      broadcastToEvent(eventId, SSE_EVENTS.QUIZ_STARTED, {
        eventId: event!.id,
        startedAt: event!.startedAt,
      });

      // Broadcast round_started event
      if (activeRound) {
        broadcastToEvent(eventId, SSE_EVENTS.ROUND_STARTED, {
          roundId: activeRound.id,
          roundNumber: activeRound.roundNumber,
          startedAt: activeRound.startedAt,
        });
      }

      res.json({
        ...event,
        activeRound,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/quiz-events/:id/advance - Advance to next round (admin only)
router.post(
  "/:id/advance",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);

      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      const result = await advanceToNextRound(eventId, req.user!.userId);

      // Get leaderboard
      const leaderboard = await getLeaderboard(eventId);

      // Get user details for leaderboard
      const userIds = leaderboard.map((entry) => entry.userId);
      const leaderboardUsers = await db
        .select({
          id: users.id,
          username: users.username,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      const leaderboardWithUsers = leaderboard.map((entry) => {
        const user = leaderboardUsers.find((u) => u.id === entry.userId);
        return {
          userId: entry.userId,
          username: user?.username || "Unknown",
          score: entry.score,
        };
      });

      if (result.completed) {
        // Broadcast quiz_ended event
        broadcastToEvent(eventId, SSE_EVENTS.QUIZ_ENDED, {
          leaderboard: leaderboardWithUsers,
        });
      } else {
        // Broadcast round_ended event
        broadcastToEvent(eventId, SSE_EVENTS.ROUND_ENDED, {
          leaderboard: leaderboardWithUsers,
        });

        // Get template to determine transition delay
        const event = await getEventById(eventId);
        const { getTemplateById } = await import("../services/quiz");
        const template = event ? await getTemplateById(event.quizTemplateId) : null;
        const transitionSeconds = template?.transitionSeconds || 3;

        // Wait for transition period before broadcasting next round
        if (result.nextRound) {
          setTimeout(() => {
            broadcastToEvent(eventId, SSE_EVENTS.ROUND_STARTED, {
              roundId: result.nextRound!.id,
              roundNumber: result.nextRound!.roundNumber,
              startedAt: result.nextRound!.startedAt,
            });
          }, transitionSeconds * 1000);
        }
      }

      res.json({
        completed: result.completed,
        nextRound: result.nextRound,
        leaderboard: leaderboardWithUsers,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// GET /api/quiz-events/:event_id/rounds/:round_id/question - Get question for a round
router.get(
  "/:event_id/rounds/:round_id/question",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.event_id);
      const roundId = parseInt(req.params.round_id);

      if (isNaN(eventId) || isNaN(roundId)) {
        return res.status(400).json({ error: "Invalid event or round ID" });
      }

      const question = await getRoundQuestion(eventId, roundId);

      res.json(question);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/quiz-events/:event_id/rounds/:round_id/answer - Submit answer
router.post(
  "/:event_id/rounds/:round_id/answer",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.event_id);
      const roundId = parseInt(req.params.round_id);
      const { answer } = req.body;

      if (isNaN(eventId) || isNaN(roundId)) {
        return res.status(400).json({ error: "Invalid event or round ID" });
      }

      // Allow empty answers (user didn't answer in time or chose not to)
      const answerString = answer !== undefined && answer !== null ? answer.toString() : '';

      const performance = await submitAnswer(
        eventId,
        roundId,
        req.user!.userId,
        answerString
      );

      // Return success without revealing if answer is correct
      res.status(201).json({
        submitted: true,
        submittedAt: performance.submittedAt,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// GET /api/quiz-events/:id/leaderboard - Get leaderboard
router.get(
  "/:id/leaderboard",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);

      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      const leaderboard = await getLeaderboard(eventId);

      // Get user details
      const userIds = leaderboard.map((entry) => entry.userId);
      const leaderboardUsers = await db
        .select({
          id: users.id,
          username: users.username,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      const leaderboardWithUsers = leaderboard.map((entry) => {
        const user = leaderboardUsers.find((u) => u.id === entry.userId);
        return {
          userId: entry.userId,
          username: user?.username || "Unknown",
          score: entry.score,
        };
      });

      res.json(leaderboardWithUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/quiz-events/:id/stream - Server-Sent Events stream
router.get(
  "/:id/stream",
  async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);

      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      // Handle auth from query parameter (EventSource doesn't support headers)
      const token = req.query.token as string;
      if (!token) {
        return res.status(401).json({ error: "Missing token" });
      }

      // Verify token
      const { verifyToken } = await import("../services/auth");
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Verify event exists
      const event = await getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Quiz event not found" });
      }

      // Set headers for SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Add client to SSE manager
      addClient(eventId, payload.userId, res);

      // Send initial connection message
      res.write(`event: connected\ndata: ${JSON.stringify({ eventId })}\n\n`);

      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        res.write(`:heartbeat\n\n`);
      }, 30000); // Every 30 seconds

      // Clean up on connection close
      res.on("close", () => {
        clearInterval(heartbeat);
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
