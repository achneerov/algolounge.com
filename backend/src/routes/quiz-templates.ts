import { Router, Request, Response } from "express";
import { db, quizTemplates, quizTemplateRounds, questions } from "../db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const router = Router();

// GET /api/quiz-templates - List all quiz templates (admin only)
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const templates = await db.select().from(quizTemplates);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/quiz-templates/:id - Get template details with questions (admin only)
router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }

      // Get template
      const template = await db
        .select()
        .from(quizTemplates)
        .where(eq(quizTemplates.id, templateId))
        .limit(1);

      if (template.length === 0) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Get all rounds for this template
      const rounds = await db
        .select()
        .from(quizTemplateRounds)
        .where(eq(quizTemplateRounds.quizTemplateId, templateId))
        .orderBy(quizTemplateRounds.roundOrder);

      // Get question details for each round
      const roundsWithQuestions = await Promise.all(
        rounds.map(async (round) => {
          const question = await db
            .select()
            .from(questions)
            .where(eq(questions.id, round.questionId))
            .limit(1);

          return {
            ...round,
            question: question[0] || null,
          };
        })
      );

      res.json({
        ...template[0],
        rounds: roundsWithQuestions,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
