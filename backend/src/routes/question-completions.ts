import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  markQuestionCompleted,
  getUserCompletedQuestions,
} from "../services/question-completions";

const router = Router();

// Get user's completed questions
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const completedQuestions = await getUserCompletedQuestions(userId);
    res.json({ completedQuestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark a question as completed
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { questionFilename } = req.body;
    const userId = req.user!.userId;

    if (!questionFilename) {
      return res.status(400).json({ error: "questionFilename is required" });
    }

    const result = await markQuestionCompleted(userId, questionFilename);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
