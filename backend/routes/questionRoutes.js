const express = require('express');
const { body } = require('express-validator');
const QuestionController = require('../controllers/questionController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const markCompleteValidation = [
  body('question_id')
    .notEmpty()
    .withMessage('Question ID is required')
];

// Routes
router.post('/complete', authenticate, markCompleteValidation, QuestionController.markComplete);
router.get('/completed/:question_id', optionalAuth, QuestionController.isQuestionCompleted);
router.get('/completions', authenticate, QuestionController.getUserCompletions);
router.delete('/complete/:question_id', authenticate, QuestionController.deleteCompletion);

module.exports = router;
