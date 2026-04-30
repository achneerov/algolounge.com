import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CompletionService {
  private readonly storageKey = 'completed_questions';
  private completionsSubject = new BehaviorSubject<string[]>(this.loadFromStorage());
  public completions$ = this.completionsSubject.asObservable();

  getCompletions(): Observable<string[]> {
    return of([...this.completionsSubject.value]);
  }

  getCompletionsSync(): string[] {
    return [...this.completionsSubject.value];
  }

  isCompleted(questionFilename: string): boolean {
    return this.completionsSubject.value.includes(questionFilename);
  }

  markCompleted(questionFilename: string): Observable<void> {
    const current = this.completionsSubject.value;
    if (current.includes(questionFilename)) {
      return of(void 0);
    }
    const next = [...current, questionFilename];
    this.persist(next);
    this.completionsSubject.next(next);
    return of(void 0);
  }

  private loadFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private persist(filenames: string[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(filenames));
  }
}
