import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly COMPLETED_QUESTIONS_KEY = 'completed_questions';

  constructor() {}

  getCompletedQuestions(): string[] {
    const stored = localStorage.getItem(this.COMPLETED_QUESTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  addCompletedQuestion(filename: string): void {
    const completed = this.getCompletedQuestions();
    if (!completed.includes(filename)) {
      completed.push(filename);
      localStorage.setItem(this.COMPLETED_QUESTIONS_KEY, JSON.stringify(completed));
    }
  }

  removeCompletedQuestion(filename: string): void {
    const completed = this.getCompletedQuestions();
    const index = completed.indexOf(filename);
    if (index > -1) {
      completed.splice(index, 1);
      localStorage.setItem(this.COMPLETED_QUESTIONS_KEY, JSON.stringify(completed));
    }
  }

  isQuestionCompleted(filename: string): boolean {
    return this.getCompletedQuestions().includes(filename);
  }
}