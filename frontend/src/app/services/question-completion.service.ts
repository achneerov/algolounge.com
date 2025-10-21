import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, map } from 'rxjs';
import { AuthService } from './auth.service';

interface CompletionResponse {
  completed: boolean;
}

interface MarkCompleteResponse {
  message: string;
  completion: any;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionCompletionService {
  private apiUrl = 'http://localhost:3000/api/questions';
  private completedQuestionsCache: { [key: string]: boolean } = {};

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadCompletedQuestionsFromLocalStorage();
  }

  private loadCompletedQuestionsFromLocalStorage(): void {
    const cached = localStorage.getItem('AL_completedQuestions');
    if (cached) {
      try {
        this.completedQuestionsCache = JSON.parse(cached);
      } catch (e) {
        this.completedQuestionsCache = {};
      }
    }
  }

  private saveCompletedQuestionsToLocalStorage(): void {
    localStorage.setItem('AL_completedQuestions', JSON.stringify(this.completedQuestionsCache));
  }

  isQuestionCompleted(questionId: string): Observable<boolean> {
    // If user is not authenticated, check local cache only
    if (!this.authService.isAuthenticated()) {
      return of(this.completedQuestionsCache[questionId] || false);
    }

    // Check cache first
    if (this.completedQuestionsCache.hasOwnProperty(questionId)) {
      return of(this.completedQuestionsCache[questionId]);
    }

    // Fetch from backend
    const headers = this.authService.getAuthHeaders();
    return this.http.get<CompletionResponse>(
      `${this.apiUrl}/completed/${questionId}`,
      { headers }
    ).pipe(
      tap(response => {
        this.completedQuestionsCache[questionId] = response.completed;
        this.saveCompletedQuestionsToLocalStorage();
      }),
      map(response => response.completed)
    );
  }

  markQuestionComplete(questionId: string): Observable<MarkCompleteResponse> {
    // Update cache immediately for optimistic UI
    this.completedQuestionsCache[questionId] = true;
    this.saveCompletedQuestionsToLocalStorage();

    // If user is not authenticated, only update local cache
    if (!this.authService.isAuthenticated()) {
      return of({
        message: 'Question marked as complete locally',
        completion: null
      });
    }

    // Send to backend if authenticated
    const headers = this.authService.getAuthHeaders();
    return this.http.post<MarkCompleteResponse>(
      `${this.apiUrl}/complete`,
      { question_id: questionId },
      { headers }
    );
  }

  getCompletedQuestions(): { [key: string]: boolean } {
    return { ...this.completedQuestionsCache };
  }

  // Fetch all completions from backend (for authenticated users)
  syncCompletionsFromBackend(): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      return of(null);
    }

    const headers = this.authService.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/completions`, { headers }).pipe(
      tap(response => {
        // Update cache with backend data
        response.completions.forEach((completion: any) => {
          this.completedQuestionsCache[completion.question_id] = true;
        });
        this.saveCompletedQuestionsToLocalStorage();
      })
    );
  }
}
