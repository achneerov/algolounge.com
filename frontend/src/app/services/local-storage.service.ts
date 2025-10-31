import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly COMPLETED_QUESTIONS_KEY = 'completed_questions';
  private readonly FAVORITE_COURSES_KEY = 'favorite_courses';

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

  getFavoriteCourses(): string[] {
    const stored = localStorage.getItem(this.FAVORITE_COURSES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  addFavoriteCourse(filename: string): void {
    const favorites = this.getFavoriteCourses();
    if (!favorites.includes(filename)) {
      favorites.push(filename);
      localStorage.setItem(this.FAVORITE_COURSES_KEY, JSON.stringify(favorites));
    }
  }

  removeFavoriteCourse(filename: string): void {
    const favorites = this.getFavoriteCourses();
    const index = favorites.indexOf(filename);
    if (index > -1) {
      favorites.splice(index, 1);
      localStorage.setItem(this.FAVORITE_COURSES_KEY, JSON.stringify(favorites));
    }
  }

  isCourseInFavorites(filename: string): boolean {
    return this.getFavoriteCourses().includes(filename);
  }

  toggleFavoriteCourse(filename: string): boolean {
    if (this.isCourseInFavorites(filename)) {
      this.removeFavoriteCourse(filename);
      return false;
    } else {
      this.addFavoriteCourse(filename);
      return true;
    }
  }
}