import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { QuizService, QuizTemplate } from '../../../services/quiz.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-quiz-home',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './quiz-home.component.html',
  styleUrl: './quiz-home.component.scss'
})
export class QuizHomeComponent implements OnInit {
  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;
  isAdmin = false;

  // Join quiz
  roomCode = '';
  joinError = '';
  isJoining = false;

  // Create quiz (admin only)
  templates: QuizTemplate[] = [];
  selectedTemplateId: number | null = null;
  isCreating = false;
  createError = '';

  ngOnInit() {
    // Check if user is admin
    this.authService.currentUser$.subscribe(user => {
      if (user && (user as any).roleId === 1) {
        this.isAdmin = true;
        this.loadTemplates();
      }
    });
  }

  loadTemplates() {
    this.quizService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        if (templates.length > 0) {
          this.selectedTemplateId = templates[0].id;
        }
      },
      error: (error) => {
        console.error('Failed to load templates:', error);
        this.createError = 'Failed to load quiz templates';
      }
    });
  }

  joinQuiz() {
    if (!this.roomCode.trim()) {
      this.joinError = 'Please enter a room code';
      return;
    }

    this.isJoining = true;
    this.joinError = '';

    this.quizService.getEventByRoomCode(this.roomCode).subscribe({
      next: (event) => {
        if (event.status === 'completed') {
          this.joinError = 'This quiz has already ended';
          this.isJoining = false;
          return;
        }

        // Join the event
        this.quizService.joinEvent(event.id).subscribe({
          next: () => {
            // Navigate to quiz lobby
            this.router.navigate(['/quiz', this.roomCode, 'lobby']);
          },
          error: (error) => {
            this.joinError = error.error?.error || 'Failed to join quiz';
            this.isJoining = false;
          }
        });
      },
      error: (error) => {
        this.joinError = error.error?.error || 'Quiz not found';
        this.isJoining = false;
      }
    });
  }

  createQuiz() {
    if (!this.selectedTemplateId) {
      this.createError = 'Please select a quiz template';
      return;
    }

    this.isCreating = true;
    this.createError = '';

    this.quizService.createEvent(this.selectedTemplateId).subscribe({
      next: (event) => {
        // Navigate to lobby as creator
        this.router.navigate(['/quiz', event.roomCode, 'lobby']);
      },
      error: (error) => {
        this.createError = error.error?.error || 'Failed to create quiz';
        this.isCreating = false;
      }
    });
  }
}
