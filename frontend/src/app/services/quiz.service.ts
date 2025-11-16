import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface QuizTemplate {
  id: number;
  name: string;
  description: string;
  startingCountdownSeconds: number;
  transitionSeconds: number;
  createdAt: number;
}

export interface QuizEvent {
  id: number;
  quizTemplateId: number;
  roomCode: string;
  createdByUserId: number;
  status: 'waiting' | 'in_progress' | 'completed';
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  participants?: { id: number; username: string }[];
  rounds?: QuizEventRound[];
  activeRound?: QuizEventRound;
  template?: QuizTemplate;
}

export interface QuizEventRound {
  id: number;
  quizEventId: number;
  quizTemplateRoundId: number;
  roundNumber: number;
  status: 'pending' | 'active' | 'completed';
  startedAt?: number;
  endedAt?: number;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  score: number;
}

export interface Question {
  id: number;
  questionTypeId: number;
  questionText: string;
  timeLimitSeconds: number;
  createdAt: number;
  options?: any; // Will contain type-specific data
}

export interface SubmitAnswerResponse {
  submitted: boolean;
  submittedAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private currentEventSubject = new BehaviorSubject<QuizEvent | null>(null);
  public currentEvent$ = this.currentEventSubject.asObservable();

  private leaderboardSubject = new BehaviorSubject<LeaderboardEntry[]>([]);
  public leaderboard$ = this.leaderboardSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all quiz templates (admin only)
  getTemplates(): Observable<QuizTemplate[]> {
    return this.http.get<QuizTemplate[]>(`${environment.apiUrl}/api/quiz-templates`);
  }

  // Create a new quiz event (admin only)
  createEvent(templateId: number): Observable<QuizEvent> {
    return this.http.post<QuizEvent>(`${environment.apiUrl}/api/quiz-events`, {
      quiz_template_id: templateId
    }).pipe(
      tap(event => this.currentEventSubject.next(event))
    );
  }

  // Get quiz event by room code
  getEventByRoomCode(roomCode: string): Observable<QuizEvent> {
    return this.http.get<QuizEvent>(`${environment.apiUrl}/api/quiz-events/${roomCode}`).pipe(
      tap(event => this.currentEventSubject.next(event))
    );
  }

  // Join a quiz event
  joinEvent(eventId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/quiz-events/${eventId}/join`, {});
  }

  // Start a quiz event (creator only)
  startEvent(eventId: number): Observable<QuizEvent> {
    return this.http.post<QuizEvent>(`${environment.apiUrl}/api/quiz-events/${eventId}/start`, {}).pipe(
      tap(event => this.currentEventSubject.next(event))
    );
  }

  // Advance to next round (creator only)
  advanceRound(eventId: number): Observable<{
    completed: boolean;
    nextRound: QuizEventRound | null;
    leaderboard: LeaderboardEntry[];
  }> {
    return this.http.post<any>(`${environment.apiUrl}/api/quiz-events/${eventId}/advance`, {}).pipe(
      tap(response => {
        this.leaderboardSubject.next(response.leaderboard);
      })
    );
  }

  // Submit an answer
  submitAnswer(eventId: number, roundId: number, answer: string): Observable<SubmitAnswerResponse> {
    return this.http.post<SubmitAnswerResponse>(
      `${environment.apiUrl}/api/quiz-events/${eventId}/rounds/${roundId}/answer`,
      { answer }
    );
  }

  // Get leaderboard
  getLeaderboard(eventId: number): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${environment.apiUrl}/api/quiz-events/${eventId}/leaderboard`).pipe(
      tap(leaderboard => this.leaderboardSubject.next(leaderboard))
    );
  }

  // Clear current event
  clearCurrentEvent(): void {
    this.currentEventSubject.next(null);
    this.leaderboardSubject.next([]);
  }

  // Update current event (for SSE updates)
  updateCurrentEvent(event: QuizEvent): void {
    this.currentEventSubject.next(event);
  }
}
