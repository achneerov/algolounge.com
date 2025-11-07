import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CompletionsResponse {
  completedQuestions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CompletionService {
  private completionsSubject = new BehaviorSubject<string[]>([]);
  public completions$ = this.completionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all completed questions for the current user
   */
  getCompletions(): Observable<string[]> {
    return this.http
      .get<CompletionsResponse>(`${environment.apiUrl}/api/question-completions`)
      .pipe(
        tap((response) => {
          this.completionsSubject.next(response.completedQuestions);
        }),
        map((response) => response.completedQuestions)
      );
  }

  /**
   * Get current completions synchronously
   */
  getCompletionsSync(): string[] {
    return this.completionsSubject.value;
  }

  /**
   * Check if a question is completed
   */
  isCompleted(questionFilename: string): boolean {
    return this.completionsSubject.value.includes(questionFilename);
  }

  /**
   * Mark a question as completed
   */
  markCompleted(questionFilename: string): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/api/question-completions`, { questionFilename })
      .pipe(
        tap(() => {
          const current = this.completionsSubject.value;
          if (!current.includes(questionFilename)) {
            this.completionsSubject.next([...current, questionFilename]);
          }
        })
      );
  }
}
