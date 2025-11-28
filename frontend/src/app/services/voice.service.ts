import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VoiceSession {
  id: number;
  name: string;
  createdByUserId: number;
  status: 'active' | 'closed';
  maxParticipants: number;
  createdAt: number;
  closedAt: number | null;
  participantCount?: number;
}

export interface VoiceParticipant {
  id: number;
  voiceSessionId: number;
  userId: number;
  joinedAt: number;
  leftAt: number | null;
  isMuted: number;
  isVideoEnabled: number;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private http = inject(HttpClient);

  private activeSessions$ = new BehaviorSubject<VoiceSession[]>([]);
  private currentSession$ = new BehaviorSubject<VoiceSession | null>(null);

  constructor() {
    this.loadActiveSessions();
  }

  // Load all active sessions
  loadActiveSessions(): void {
    this.getSessions().subscribe({
      next: (sessions) => this.activeSessions$.next(sessions),
      error: (error) => console.error('Failed to load sessions:', error)
    });
  }

  // Get all active voice sessions
  getSessions(): Observable<VoiceSession[]> {
    return this.http.get<VoiceSession[]>(`${environment.apiUrl}/api/voice/sessions`);
  }

  // Create a new voice session
  createSession(name: string): Observable<VoiceSession> {
    return this.http.post<VoiceSession>(`${environment.apiUrl}/api/voice/sessions`, { name });
  }

  // Get session by ID
  getSession(sessionId: number): Observable<VoiceSession> {
    return this.http.get<VoiceSession>(`${environment.apiUrl}/api/voice/sessions/${sessionId}`);
  }

  // Close a voice session
  closeSession(sessionId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/api/voice/sessions/${sessionId}`);
  }

  // Get session participants
  getParticipants(sessionId: number): Observable<VoiceParticipant[]> {
    return this.http.get<VoiceParticipant[]>(`${environment.apiUrl}/api/voice/sessions/${sessionId}/participants`);
  }

  // Get active sessions observable
  getActiveSessions$(): Observable<VoiceSession[]> {
    return this.activeSessions$.asObservable();
  }

  // Get current session observable
  getCurrentSession$(): Observable<VoiceSession | null> {
    return this.currentSession$.asObservable();
  }

  // Set current session
  setCurrentSession(session: VoiceSession | null): void {
    this.currentSession$.next(session);
  }
}
