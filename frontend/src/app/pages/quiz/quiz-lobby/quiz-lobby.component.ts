import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { QuizService, QuizEvent } from '../../../services/quiz.service';
import { AuthService } from '../../../services/auth.service';
import { SSEService } from '../../../services/sse.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-quiz-lobby',
  imports: [CommonModule, RouterModule],
  templateUrl: './quiz-lobby.component.html',
  styleUrl: './quiz-lobby.component.scss'
})
export class QuizLobbyComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private sseService = inject(SSEService);
  private destroy$ = new Subject<void>();

  roomCode = '';
  event: QuizEvent | null = null;
  isCreator = false;
  isStarting = false;
  error = '';
  private sseConnected = false;

  ngOnInit() {
    this.roomCode = this.route.snapshot.paramMap.get('roomCode') || '';

    if (!this.roomCode) {
      this.router.navigate(['/quiz']);
      return;
    }

    this.loadEvent(true);
  }

  loadEvent(isInitialLoad = false) {
    this.quizService.getEventByRoomCode(this.roomCode).subscribe({
      next: (event) => {
        this.event = event;

        // Check if current user is the creator
        if (isInitialLoad) {
          this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
            if (user && event.createdByUserId === user.id) {
              this.isCreator = true;
            }
          });

          // Connect to SSE for real-time updates (only once)
          if (!this.sseConnected) {
            this.sseConnected = true;
            this.sseService.connect(event.id);

            // Listen for SSE events
            this.sseService.events$.pipe(takeUntil(this.destroy$)).subscribe(sseEvent => {
              console.log('SSE Event received:', sseEvent);
              if (sseEvent.type === 'player_joined') {
                // Reload event to get updated participant list
                this.loadEvent(false);
              }
            });
          }
        }
      },
      error: (error) => {
        this.error = error.error?.error || 'Failed to load quiz';
      }
    });
  }

  startQuiz() {
    if (!this.event) return;

    this.isStarting = true;
    this.quizService.startEvent(this.event.id).subscribe({
      next: () => {
        // Navigate to play page (not implemented yet)
        alert('Quiz started! (Play page not implemented yet)');
      },
      error: (error) => {
        this.error = error.error?.error || 'Failed to start quiz';
        this.isStarting = false;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.sseService.disconnect();
  }
}
