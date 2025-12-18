import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface QuestionSearchResult {
  filename: string;
  title: string;
  difficulty: string;
  tags: string[];
  keywords: string[];
  score: number;
}

interface QuestionsIndex {
  questions: {
    filename: string;
    title: string;
    difficulty: string;
    tags: string[];
    keywords: string[];
  }[];
  lastUpdated: string;
  totalQuestions: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionSearchService {
  private questionsIndex: QuestionsIndex | null = null;
  private indexLoaded = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadQuestionsIndex();
  }

  private loadQuestionsIndex(): void {
    this.http.get<QuestionsIndex>('/questions/index.json').subscribe({
      next: (data) => {
        this.questionsIndex = data;
        this.indexLoaded.next(true);
      },
      error: (error) => {
        console.error('Failed to load questions index:', error);
      }
    });
  }

  searchQuestions(query: string): QuestionSearchResult[] {
    if (!this.questionsIndex || !query.trim()) {
      return this.getAllQuestions();
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results: QuestionSearchResult[] = [];

    for (const question of this.questionsIndex.questions) {
      const score = this.calculateScore(question, normalizedQuery);
      if (score > 0) {
        results.push({
          ...question,
          score
        });
      }
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  private calculateScore(question: any, query: string): number {
    let score = 0;

    // Exact filename match gets highest score
    if (question.filename.toLowerCase() === query) {
      score += 100;
    }

    // Filename contains query
    if (question.filename.toLowerCase().includes(query)) {
      score += 50;
    }

    // Title exact match
    if (question.title.toLowerCase() === query) {
      score += 80;
    }

    // Title contains query
    if (question.title.toLowerCase().includes(query)) {
      score += 30;
    }

    // Keyword exact matches
    for (const keyword of question.keywords) {
      if (keyword.toLowerCase() === query) {
        score += 20;
      } else if (keyword.toLowerCase().includes(query)) {
        score += 10;
      }
    }

    // Partial word matches in filename (for hyphenated names)
    const filenameParts = question.filename.split('-');
    for (const part of filenameParts) {
      if (part.toLowerCase().startsWith(query)) {
        score += 15;
      }
    }

    return score;
  }

  getAllQuestions(): QuestionSearchResult[] {
    if (!this.questionsIndex) {
      return [];
    }

    return this.questionsIndex.questions.map(q => ({
      ...q,
      score: 0
    }));
  }

  isIndexLoaded(): Observable<boolean> {
    return this.indexLoaded.asObservable();
  }
}