import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { QuizService, QuizTemplate } from '../../../services/quiz.service';
import { AuthService } from '../../../services/auth.service';
import { QuizUploadService } from '../../../services/quiz-upload.service';

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
  private uploadService = inject(QuizUploadService);

  @ViewChild('fileInput') fileInput!: ElementRef;

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

  // Upload quiz (admin only)
  isUploading = false;
  uploadError = '';
  uploadSuccess = '';
  jsonContent = '';

  // Hidden templates (admin only)
  hiddenTemplates: QuizTemplate[] = [];
  showHiddenSection = false;

  ngOnInit() {
    // Check if user is admin
    this.authService.currentUser$.subscribe(user => {
      if (user && (user as any).roleId === 1) {
        this.isAdmin = true;
        this.loadTemplates();
        this.loadHiddenTemplates();
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

  uploadQuiz() {
    this.uploadError = '';
    this.uploadSuccess = '';

    // Validate JSON
    const validation = this.uploadService.validateQuizJson(this.jsonContent);
    if (!validation.valid) {
      this.uploadError = validation.error || 'Invalid quiz JSON';
      return;
    }

    this.isUploading = true;
    this.quizService.uploadQuiz(validation.data).subscribe({
      next: (response) => {
        this.uploadSuccess = `Quiz "${response.name}" uploaded successfully with ${response.roundCount} rounds!`;
        this.jsonContent = '';
        this.isUploading = false;

        // Reload templates after a short delay
        setTimeout(() => {
          this.loadTemplates();
          this.uploadSuccess = '';
        }, 2000);
      },
      error: (error) => {
        this.uploadError = error.error?.error || 'Failed to upload quiz';
        this.isUploading = false;
      }
    });
  }

  downloadSamples() {
    this.uploadService.downloadSampleQuizzes();
  }

  openFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.jsonContent = e.target.result;
      };
      reader.readAsText(file);
    }
  }

  loadHiddenTemplates() {
    this.quizService.getHiddenTemplates().subscribe({
      next: (templates) => {
        this.hiddenTemplates = templates;
      },
      error: (error) => {
        console.error('Failed to load hidden templates:', error);
      }
    });
  }

  hideTemplate(templateId: number) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;

    this.quizService.hideTemplate(templateId).subscribe({
      next: () => {
        this.createError = '';
        this.uploadSuccess = `Quiz "${template.name}" hidden successfully!`;
        this.loadTemplates();
        this.loadHiddenTemplates();
        setTimeout(() => {
          this.uploadSuccess = '';
        }, 2000);
      },
      error: (error) => {
        this.createError = error.error?.error || 'Failed to hide quiz';
      }
    });
  }

  showTemplate(templateId: number) {
    const template = this.hiddenTemplates.find(t => t.id === templateId);
    if (!template) return;

    this.quizService.showTemplate(templateId).subscribe({
      next: () => {
        this.uploadSuccess = `Quiz "${template.name}" restored successfully!`;
        this.loadTemplates();
        this.loadHiddenTemplates();
        setTimeout(() => {
          this.uploadSuccess = '';
        }, 2000);
      },
      error: (error) => {
        this.createError = error.error?.error || 'Failed to show quiz';
      }
    });
  }

  toggleHiddenSection() {
    this.showHiddenSection = !this.showHiddenSection;
  }
}
