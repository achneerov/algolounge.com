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

    // EventSource doesn't support custom headers, so we need to pass the token in the URL
    // For now, we'll use a different approach - set up the connection without auth in URL
    // The backend should validate the token from the Authorization header
    // Since EventSource doesn't support headers, we'll need to handle this differently

    // For SSE with auth, we have a few options:
    // 1. Pass token as query parameter (less secure but works with EventSource)
    // 2. Use fetch with ReadableStream (more complex but supports headers)
    // Let's use option 1 for simplicity

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
