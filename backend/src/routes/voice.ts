import express, { Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { voiceService } from "../services/voice.service";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/voice/sessions - List all active voice sessions
router.get("/sessions", async (req: Request, res: Response) => {
  try {
    const sessions = await voiceService.getActiveSessions();

    // Enrich sessions with participant count
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => ({
        ...session,
        participantCount: await voiceService.getParticipantCount(session.id),
      }))
    );

    res.json(enrichedSessions);
  } catch (error) {
    console.error("Error listing voice sessions:", error);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

// POST /api/voice/sessions - Create a new voice session
router.post("/sessions", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Session name is required" });
      return;
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const session = await voiceService.createSession(name, userId);

    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating voice session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// GET /api/voice/sessions/:id - Get session details
router.get("/sessions/:id", async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid session ID" });
      return;
    }

    const session = await voiceService.getSession(sessionId);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const participantCount = await voiceService.getParticipantCount(sessionId);

    res.json({
      ...session,
      participantCount,
    });
  } catch (error) {
    console.error("Error getting voice session:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
});

// DELETE /api/voice/sessions/:id - Close a voice session (creator only)
router.delete("/sessions/:id", async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = (req as any).user?.userId;

    if (isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid session ID" });
      return;
    }

    const session = await voiceService.getSession(sessionId);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Only creator can close session
    if (session.createdByUserId !== userId) {
      res.status(403).json({ error: "Only session creator can close it" });
      return;
    }

    await voiceService.closeSession(sessionId);

    res.json({ message: "Session closed" });
  } catch (error) {
    console.error("Error closing voice session:", error);
    res.status(500).json({ error: "Failed to close session" });
  }
});

// GET /api/voice/sessions/:id/participants - Get session participants
router.get("/sessions/:id/participants", async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid session ID" });
      return;
    }

    const session = await voiceService.getSession(sessionId);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const participants = await voiceService.getParticipants(sessionId);

    res.json(participants);
  } catch (error) {
    console.error("Error getting voice session participants:", error);
    res.status(500).json({ error: "Failed to get participants" });
  }
});

export default router;
