import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService, QuizEvent, QuizEventRound, LeaderboardEntry } from '../../../services/quiz.service';
import { AuthService } from '../../../services/auth.service';
import { SSEService } from '../../../services/sse.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Subject, takeUntil } from 'rxjs';

type QuizState = 'waiting' | 'question_display' | 'answering' | 'answer_reveal' | 'transitioning' | 'final_results';

interface QuestionData {
  id: number;
  questionTypeId: number;
  questionText: string;
  imageFilename?: string;
  questionDisplaySeconds: number;
  answerTimeSeconds: number;
  answerRevealSeconds: number;
  options?: any;
}

@Component({
  selector: 'app-quiz-play',
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-play.component.html',
  styleUrl: './quiz-play.component.scss'
})
export class QuizPlayComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private sseService = inject(SSEService);
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();

  roomCode = '';
  event: QuizEvent | null = null;
  currentRound: QuizEventRound | null = null;
  currentQuestion: QuestionData | null = null;
  questionImageUrl: string | null = null;

  state: QuizState = 'waiting';
  countdown = 0;
  isCreator = false;

  // Answer submission
  userAnswer: string = '';
  hasSubmitted = false;
  isSubmitting = false;

  // Answer reveal
  correctAnswer: any = null;

  // Results
  leaderboard: LeaderboardEntry[] = [];
  showLeaderboard = false;

  // Music
  backgroundMusic: HTMLAudioElement | null = null;
  musicUrl: string | null = null;

  // Timer management
  private timerInterval: any = null;

  ngOnInit() {
    this.roomCode = this.route.snapshot.paramMap.get('roomCode') || '';

    if (!this.roomCode) {
      this.router.navigate(['/quiz']);
      return;
    }

    this.initializeQuiz();
  }

  async initializeQuiz() {
    // Load event
    this.quizService.getEventByRoomCode(this.roomCode).subscribe({
      next: (event) => {
        this.event = event;

        // Initialize background music if available
        if (event.template?.musicFilename) {
          this.initializeMusic(event.template.musicFilename);
        }

        // Check if user is creator
        this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
          if (user && event.createdByUserId === user.id) {
            this.isCreator = true;
          }
        });

        // Connect to SSE
        this.sseService.connect(event.id);

        // Listen for SSE events
        this.sseService.events$.pipe(takeUntil(this.destroy$)).subscribe(sseEvent => {
          if (sseEvent.type === 'round_started') {
            this.handleRoundStarted(sseEvent.data);
          } else if (sseEvent.type === 'round_ended') {
            this.handleRoundEnded(sseEvent.data);
          } else if (sseEvent.type === 'quiz_ended') {
            this.handleQuizEnded(sseEvent.data);
          }
        });

        // Get active round
        if (event.activeRound) {
          this.currentRound = event.activeRound;
          // Load question and start from question display
          this.loadQuestion(() => {
            this.showQuestionSequence();
          });
        } else {
          // Wait for round_started event
          this.state = 'waiting';
        }
      },
      error: (error) => {
        console.error('Failed to load quiz:', error);
        this.router.navigate(['/quiz']);
      }
    });
  }

  handleRoundStarted(data: any) {
    this.currentRound = data as QuizEventRound;
    this.hasSubmitted = false;
    this.userAnswer = '';
    this.correctAnswer = null;
    this.questionImageUrl = null;

    // Clear any existing timer from previous round
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Reload event to get round details
    this.quizService.getEventByRoomCode(this.roomCode).subscribe({
      next: (event) => {
        this.event = event;
        const round = event.rounds?.find(r => r.id === data.roundId);
        if (round) {
          this.currentRound = round;
          // Load question FIRST, then start sequence when it's loaded
          this.loadQuestion(() => {
            this.showQuestionSequence();
          });
        }
      }
    });
  }

  showQuestionSequence() {
    // Show question text (no preview, just the question)
    this.state = 'question_display';
    this.countdown = this.currentQuestion?.questionDisplaySeconds || 5;

    const displayInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(displayInterval);
        // Show answer options
        this.state = 'answering';
        this.countdown = this.currentQuestion?.answerTimeSeconds || 30;
        this.startAnswerTimer();
      }
    }, 1000);
  }

  startAnswerTimer() {
    this.timerInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;

        // Time's up - submit empty answer if they haven't answered
        if (!this.hasSubmitted && !this.isCreator) {
          this.submitAnswer(); // Will submit empty/current answer
        }

        // Mark as submitted to lock UI
        this.hasSubmitted = true;

        // Show answer reveal screen
        this.showAnswerReveal();
      }
    }, 1000);
  }

  showAnswerReveal() {
    this.state = 'answer_reveal';
    this.countdown = this.currentQuestion?.answerRevealSeconds || 5;

    // Get correct answer based on question type
    this.setCorrectAnswer();

    const revealInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(revealInterval);

        // Auto-advance to next round (only admin triggers this)
        if (this.isCreator) {
          this.advanceRound();
        }
      }
    }, 1000);
  }

  setCorrectAnswer() {
    if (!this.currentQuestion) return;

    const typeId = this.currentQuestion.questionTypeId;
    const options = this.currentQuestion.options;

    if (typeId === 1 || typeId === 2 || typeId === 3) {
      // Multiple choice - get correct option
      const correctIndex = options?.correctOptionIndex || 0;
      this.correctAnswer = {
        type: 'multiple_choice',
        correctIndex: correctIndex,
        correctText: options?.[`option${correctIndex + 1}`] || ''
      };
    } else if (typeId === 4) {
      // True/False
      this.correctAnswer = {
        type: 'true_false',
        correct: options?.correctAnswer ? 'True' : 'False'
      };
    } else if (typeId === 5) {
      // Typed answer
      this.correctAnswer = {
        type: 'typed',
        answer: options?.correctAnswer || ''
      };
    }
  }

  loadQuestion(callback?: () => void) {
    if (!this.currentRound || !this.event) {
      if (callback) callback();
      return;
    }

    // Fetch question data from backend
    this.http.get<any>(`${environment.apiUrl}/api/quiz-events/${this.event.id}/rounds/${this.currentRound.id}/question`).subscribe({
      next: (question) => {
        this.currentQuestion = question;

        // Set image URL if question has an image
        if (question.imageFilename) {
          this.questionImageUrl = `${environment.apiUrl}/assets/quizy-images/${question.imageFilename}`;
        } else {
          this.questionImageUrl = null;
        }

        if (callback) callback();
      },
      error: (error) => {
        console.error('Failed to load question:', error);
        if (callback) callback();
      }
    });
  }

  submitAnswer() {
    if (!this.event || !this.currentRound || this.hasSubmitted) return;

    this.isSubmitting = true;

    this.quizService.submitAnswer(this.event.id, this.currentRound.id, this.userAnswer).subscribe({
      next: () => {
        this.hasSubmitted = true;
        this.isSubmitting = false;
        // Timer continues running after submission
      },
      error: (error) => {
        console.error('Failed to submit answer:', error);
        this.isSubmitting = false;
      }
    });
  }

  advanceRound() {
    if (!this.event || !this.isCreator) return;

    this.quizService.advanceRound(this.event.id).subscribe({
      next: () => {
        // SSE will handle the transition
      },
      error: (error) => {
        console.error('Failed to advance round:', error);
      }
    });
  }

  handleRoundEnded(data: any) {
    this.leaderboard = data.leaderboard;
    this.state = 'transitioning';
    this.countdown = this.event?.template?.transitionSeconds || 3;

    const transitionInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(transitionInterval);
        // Wait for next round or quiz end
      }
    }, 1000);
  }

  handleQuizEnded(data: any) {
    this.leaderboard = data.leaderboard;
    this.state = 'final_results';
    this.showLeaderboard = true;
  }

  getQuestionTypeLabel(): string {
    if (!this.currentQuestion) return '';

    const types: { [key: number]: string } = {
      1: 'Multiple Choice (2 options)',
      2: 'Multiple Choice (3 options)',
      3: 'Multiple Choice (4 options)',
      4: 'True or False',
      5: 'Type your answer'
    };

    return types[this.currentQuestion.questionTypeId] || 'Question';
  }

  private initializeMusic(musicFilename: string) {
    // Create audio element for background music
    this.backgroundMusic = new Audio();
    this.backgroundMusic.src = `${environment.apiUrl}/assets/quizy-images/${musicFilename}`;
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.3; // Set volume to 30%

    // Start playing when user joins
    this.backgroundMusic.play().catch(err => {
      console.log('Music autoplay prevented:', err);
      // Some browsers require user interaction to play audio
      // Music will start on first user interaction
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.sseService.disconnect();

    // Clean up timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Stop background music
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic = null;
    }
  }
}
