const { validationResult } = require('express-validator');
const QuestionCompletion = require('../models/QuestionCompletion');

class QuestionController {
  static async markComplete(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { question_id } = req.body;
      const user_id = req.user.id;

      const completion = await QuestionCompletion.create({
        user_id,
        question_id
      });

      res.status(201).json({
        message: 'Question marked as complete',
        completion
      });
    } catch (error) {
      console.error('Mark complete error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async isQuestionCompleted(req, res) {
    try {
      const { question_id } = req.params;

      // If user is not authenticated, return not completed
      if (!req.user) {
        return res.json({ completed: false });
      }

      const user_id = req.user.id;
      const isCompleted = await QuestionCompletion.isQuestionCompleted(user_id, question_id);

      res.json({ completed: isCompleted });
    } catch (error) {
      console.error('Check completion error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getUserCompletions(req, res) {
    try {
      const user_id = req.user.id;
      const completions = await QuestionCompletion.getUserCompletions(user_id);

      res.json({
        completions: completions.map(c => ({
          question_id: c.question_id,
          completed_at: c.completed_at
        }))
      });
    } catch (error) {
      console.error('Get completions error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async deleteCompletion(req, res) {
    try {
      const { question_id } = req.params;
      const user_id = req.user.id;

      await QuestionCompletion.delete(user_id, question_id);

      res.json({ message: 'Completion deleted successfully' });
    } catch (error) {
      console.error('Delete completion error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = QuestionController;
