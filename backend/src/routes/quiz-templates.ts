import { Router, Request, Response } from "express";
import { db, quizTemplates, quizTemplateRounds, questions, questionsMultipleChoice2, questionsMultipleChoice3, questionsMultipleChoice4, questionsTrueFalse, questionsTyped, questionTypes } from "../db";
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

// POST /api/quiz-templates/upload - Upload a quiz JSON (admin only)
router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { name, transitionSeconds, rounds } = req.body;

      // Validation
      if (!name || !Array.isArray(rounds) || rounds.length === 0) {
        return res.status(400).json({
          error: "Invalid quiz format. Required: name (string), rounds (array with at least 1 item)"
        });
      }

      // Create quiz template
      const templateResult = await db
        .insert(quizTemplates)
        .values({
          name,
          transitionSeconds: transitionSeconds || 3,
        })
        .returning();

      const templateId = templateResult[0].id;

      // Process each round
      for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];

        // Validate round data
        if (!round.questionText || !round.questionType) {
          throw new Error(`Round ${i + 1}: Missing questionText or questionType`);
        }

        // Get question type ID
        const typeResult = await db
          .select()
          .from(questionTypes)
          .where(eq(questionTypes.typeName, round.questionType))
          .limit(1);

        if (typeResult.length === 0) {
          throw new Error(`Round ${i + 1}: Unknown question type "${round.questionType}"`);
        }

        const questionTypeId = typeResult[0].id;

        // Create question
        const questionResult = await db
          .insert(questions)
          .values({
            questionTypeId,
            questionText: round.questionText,
            questionDisplaySeconds: round.questionDisplaySeconds || 5,
            answerTimeSeconds: round.answerTimeSeconds || 30,
            answerRevealSeconds: round.answerRevealSeconds || 5,
          })
          .returning();

        const questionId = questionResult[0].id;

        // Create question-specific data based on type
        if (round.questionType === "multiple_choice_2" && round.options) {
          await db.insert(questionsMultipleChoice2).values({
            questionId,
            option1: round.options[0],
            option2: round.options[1],
            correctOptionIndex: round.correctOptionIndex || 0,
          });
        } else if (round.questionType === "multiple_choice_3" && round.options) {
          await db.insert(questionsMultipleChoice3).values({
            questionId,
            option1: round.options[0],
            option2: round.options[1],
            option3: round.options[2],
            correctOptionIndex: round.correctOptionIndex || 0,
          });
        } else if (round.questionType === "multiple_choice_4" && round.options) {
          await db.insert(questionsMultipleChoice4).values({
            questionId,
            option1: round.options[0],
            option2: round.options[1],
            option3: round.options[2],
            option4: round.options[3],
            correctOptionIndex: round.correctOptionIndex || 0,
          });
        } else if (round.questionType === "true_false") {
          await db.insert(questionsTrueFalse).values({
            questionId,
            correctAnswer: round.correctAnswer || false,
          });
        } else if (round.questionType === "typed") {
          await db.insert(questionsTyped).values({
            questionId,
            correctAnswer: round.correctAnswer || "",
            caseSensitive: round.caseSensitive || false,
          });
        }

        // Link question to template round
        await db.insert(quizTemplateRounds).values({
          quizTemplateId: templateId,
          questionId,
          roundOrder: i + 1,
        });
      }

      res.status(201).json({
        message: "Quiz template uploaded successfully",
        templateId,
        name,
        roundCount: rounds.length,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
