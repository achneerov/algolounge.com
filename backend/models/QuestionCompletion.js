const db = require('../config/database');

class QuestionCompletion {
  static async create({ user_id, question_id }) {
    try {
      const [id] = await db('question_completions').insert({
        user_id,
        question_id
      });
      return this.findById(id);
    } catch (error) {
      // Handle unique constraint violation (user already completed this question)
      if (error.code === 'SQLITE_CONSTRAINT') {
        return this.findByUserAndQuestion(user_id, question_id);
      }
      throw error;
    }
  }

  static async findById(id) {
    return db('question_completions').where({ id }).first();
  }

  static async findByUserAndQuestion(user_id, question_id) {
    return db('question_completions')
      .where({ user_id, question_id })
      .first();
  }

  static async isQuestionCompleted(user_id, question_id) {
    const completion = await this.findByUserAndQuestion(user_id, question_id);
    return !!completion;
  }

  static async getUserCompletions(user_id) {
    return db('question_completions')
      .where({ user_id })
      .orderBy('completed_at', 'desc');
  }

  static async delete(user_id, question_id) {
    return db('question_completions')
      .where({ user_id, question_id })
      .delete();
  }
}

module.exports = QuestionCompletion;
