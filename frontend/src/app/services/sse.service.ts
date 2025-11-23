import { Injectable, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SSEService {
  private authService = inject(AuthService);
  private eventSource: EventSource | null = null;
  private eventsSubject = new Subject<SSEEvent>();
  public events$ = this.eventsSubject.asObservable();

  connect(eventId: number): void {
    if (this.eventSource) {
      this.disconnect();
    }

    // Get auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    const url = `${environment.apiUrl}/api/quiz-events/${eventId}/stream?token=${encodeURIComponent(token)}`;

    this.eventSource = new EventSource(url);

    // Handle connection
    this.eventSource.addEventListener('connected', (event) => {
      console.log('SSE connected:', event.data);
    });

    // Handle player joined
    this.eventSource.addEventListener('player_joined', (event) => {
      const data = JSON.parse(event.data);
      this.eventsSubject.next({
        type: 'player_joined',
        data: data.data,
        timestamp: data.timestamp
      });
    });

    // Handle quiz started
    this.eventSource.addEventListener('quiz_started', (event) => {
      const data = JSON.parse(event.data);
      this.eventsSubject.next({
        type: 'quiz_started',
        data: data.data,
        timestamp: data.timestamp
      });
    });

    // Handle round started
    this.eventSource.addEventListener('round_started', (event) => {
      const data = JSON.parse(event.data);
      this.eventsSubject.next({
        type: 'round_started',
        data: data.data,
        timestamp: data.timestamp
      });
    });

    // Handle round ended
    this.eventSource.addEventListener('round_ended', (event) => {
      const data = JSON.parse(event.data);
      this.eventsSubject.next({
        type: 'round_ended',
        data: data.data,
        timestamp: data.timestamp
      });
    });

    // Handle quiz ended
    this.eventSource.addEventListener('quiz_ended', (event) => {
      const data = JSON.parse(event.data);
      this.eventsSubject.next({
        type: 'quiz_ended',
        data: data.data,
        timestamp: data.timestamp
      });
    });

    // Handle errors
    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.disconnect();
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
