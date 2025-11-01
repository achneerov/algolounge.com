import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  addFavoriteCourse,
  removeFavoriteCourse,
  getUserFavoriteCourses,
} from "../services/favorites";

const router = Router();

// Get user's favorite courses
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const favorites = await getUserFavoriteCourses(userId);
    res.json({ favorites });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add a favorite course
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { courseFilename } = req.body;
    const userId = req.user!.userId;

    if (!courseFilename) {
      return res.status(400).json({ error: "courseFilename is required" });
    }

    const result = await addFavoriteCourse(userId, courseFilename);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remove a favorite course
router.delete("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { courseFilename } = req.body;
    const userId = req.user!.userId;

    if (!courseFilename) {
      return res.status(400).json({ error: "courseFilename is required" });
    }

    await removeFavoriteCourse(userId, courseFilename);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
