import { Router, Request, Response } from "express";
import { db, quizTemplates, quizTemplateRounds, questions, questionsMultipleChoice2, questionsMultipleChoice3, questionsMultipleChoice4, questionsTrueFalse, questionsTyped, questionTypes, quizTemplateStatuses } from "../db";
import { eq, inArray } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import * as fs from "fs";
import * as path from "path";
import Busboy from "busboy";

const router = Router();

// Ensure images directory exists
const imagesDir = path.join(__dirname, "../assets/quizy-images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// GET /api/quiz-templates - List all active quiz templates (admin only)
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const templates = await db
        .select()
        .from(quizTemplates)
        .where(eq(quizTemplates.statusId, 1));
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/quiz-templates/hidden/list - List all hidden quiz templates (admin only)
router.get(
  "/hidden/list",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const templates = await db
        .select()
        .from(quizTemplates)
        .where(eq(quizTemplates.statusId, 2));
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

// POST /api/quiz-templates/upload - Upload a quiz JSON with optional images (admin only)
router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      let quizData: any;
      const imageMap = new Map<string, Buffer>();

      // Check if this is FormData or regular JSON
      const contentType = req.headers['content-type'] as string;

      if (contentType && contentType.includes('multipart/form-data')) {
        // Parse FormData using busboy
        await new Promise<void>((resolve, reject) => {
          const bb = Busboy({ headers: req.headers });

          bb.on('field', (fieldname, val) => {
            if (fieldname === 'quizData') {
              try {
                quizData = JSON.parse(val);
              } catch (e) {
                reject(new Error('Invalid JSON in quizData field'));
              }
            }
          });

          bb.on('file', (fieldname, file, info) => {
            if (fieldname === 'images') {
              const chunks: Buffer[] = [];
              file.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
              });
              file.on('end', () => {
                const buffer = Buffer.concat(chunks);
                imageMap.set(info.filename, buffer);
              });
            }
          });

          bb.on('error', reject);
          bb.on('close', resolve);

          req.pipe(bb);
        });
      } else if (typeof req.body === 'object') {
        // Direct JSON object (backward compatibility - from express.json())
        quizData = req.body;
      } else if (typeof req.body === 'string') {
        // Try JSON parsing directly
        try {
          quizData = JSON.parse(req.body);
        } catch (e) {
          throw new Error('Failed to parse request body as JSON');
        }
      }

      // Validate quizData was parsed
      if (!quizData) {
        return res.status(400).json({
          error: "Failed to parse quiz data. Please ensure you're uploading valid quiz JSON or ZIP file."
        });
      }

      const { name, transitionSeconds, rounds } = quizData;

      // Validation
      if (!name || !Array.isArray(rounds) || rounds.length === 0) {
        return res.status(400).json({
          error: "Invalid quiz format. Required: name (string), rounds (array with at least 1 item)"
        });
      }

      // Create quiz template first
      const templateResult = await db
        .insert(quizTemplates)
        .values({
          name,
          transitionSeconds: transitionSeconds || 3,
        })
        .returning();

      const templateId = templateResult[0].id;
      const imageFilenameMap = new Map<string, string>(); // Maps original filename to prefixed filename

      // Save images with quiz name prefix
      for (const [originalFilename, imageBuffer] of imageMap.entries()) {
        const ext = path.extname(originalFilename);
        const baseName = path.basename(originalFilename, ext);
        const prefixedFilename = `${name}_${baseName}${ext}`.replace(/\s+/g, '_').toLowerCase();

        const imagePath = path.join(imagesDir, prefixedFilename);
        fs.writeFileSync(imagePath, imageBuffer);
        imageFilenameMap.set(originalFilename, prefixedFilename);
      }

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

        // Map image filename if provided
        let imageFilename: string | null = null;
        if (round.imageFilename && imageFilenameMap.has(round.imageFilename)) {
          imageFilename = imageFilenameMap.get(round.imageFilename) || null;
        }

        // Create question
        const questionResult = await db
          .insert(questions)
          .values({
            questionTypeId,
            questionText: round.questionText,
            questionDisplaySeconds: round.questionDisplaySeconds || 5,
            answerTimeSeconds: round.answerTimeSeconds || 30,
            answerRevealSeconds: round.answerRevealSeconds || 5,
            imageFilename: imageFilename,
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

// PATCH /api/quiz-templates/:id/hide - Hide a quiz template (admin only)
router.patch(
  "/:id/hide",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }

      // Check if template exists
      const template = await db
        .select()
        .from(quizTemplates)
        .where(eq(quizTemplates.id, templateId))
        .limit(1);

      if (template.length === 0) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Update template status to hidden (status_id = 2)
      await db
        .update(quizTemplates)
        .set({ statusId: 2 })
        .where(eq(quizTemplates.id, templateId));

      res.json({
        message: "Quiz template hidden successfully",
        templateId,
        name: template[0].name,
        status: "hidden"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PATCH /api/quiz-templates/:id/show - Unhide a quiz template (admin only)
router.patch(
  "/:id/show",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }

      // Check if template exists
      const template = await db
        .select()
        .from(quizTemplates)
        .where(eq(quizTemplates.id, templateId))
        .limit(1);

      if (template.length === 0) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Update template status to active (status_id = 1)
      await db
        .update(quizTemplates)
        .set({ statusId: 1 })
        .where(eq(quizTemplates.id, templateId));

      res.json({
        message: "Quiz template shown successfully",
        templateId,
        name: template[0].name,
        status: "active"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
