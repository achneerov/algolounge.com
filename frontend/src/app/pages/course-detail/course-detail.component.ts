import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService } from '../../services/local-storage.service';
import { CompletionService } from '../../services/completion.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { TagService } from '../../services/tag.service';
import { QuestionSearchService } from '../../services/question-search.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface CourseTag {
  text: string;
  color: string;
}

interface CourseUrl {
  url: string;
  tooltip: string;
  color: string;
  visibleString?: string;
}

interface CourseQuestion {
  filename: string;
  title: string;
  urls?: CourseUrl[];
  tags?: CourseTag[];
}

interface CourseSection {
  title: string;
  description?: string;
  questions: CourseQuestion[];
  unitKey: string;
}

interface Course {
  course_name: string;
  course_description: string;
  [key: string]: any;
}

@Component({
  selector: 'app-course-detail',
  imports: [CommonModule],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss'
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private localStorageService = inject(LocalStorageService);
  private completionService = inject(CompletionService);
  private favoritesService = inject(FavoritesService);
  private authService = inject(AuthService);
  private tagService = inject(TagService);
  private questionSearchService = inject(QuestionSearchService);
  private destroy$ = new Subject<void>();

  course: Course | null = null;
  courseSections: CourseSection[] = [];
  courseName = '';
  private questionsIndexLoaded = false;

  ngOnInit() {
    // Wait for questions index to load first
    this.questionSearchService.isIndexLoaded().pipe(takeUntil(this.destroy$)).subscribe(loaded => {
      if (loaded && !this.questionsIndexLoaded) {
        this.questionsIndexLoaded = true;

        // Now load the course
        if (this.courseName) {
          this.loadCourse();
        }
      }
    });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.courseName = params['filename'];

      // Load course if questions index is already loaded
      if (this.questionsIndexLoaded) {
        this.loadCourse();
      }
    });

    // Load favorites and completions if authenticated
    if (this.authService.isAuthenticated()) {
      this.favoritesService.getFavorites().pipe(takeUntil(this.destroy$)).subscribe({
        error: () => {
          // Silently fail if not authenticated or error occurs
        }
      });

      this.completionService.getCompletions().pipe(takeUntil(this.destroy$)).subscribe({
        error: () => {
          // Silently fail if not authenticated or error occurs
        }
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCourse() {
    this.http.get<Course>(`/courses/${this.courseName}.json`).subscribe({
      next: (data) => {
        this.course = data;
        this.extractSections();
      },
      error: (error) => {
        console.error('Failed to load course:', error);
        this.router.navigate(['/courses']);
      }
    });
  }

  private extractSections() {
    if (!this.course) return;
    
    const sections: CourseSection[] = [];
    
    // Iterate through all course properties to find sections
    for (const [key, value] of Object.entries(this.course)) {
      if (key !== 'course_name' && key !== 'course_description' && key !== 'duration' && key !== 'difficulty') {
        if (typeof value === 'object' && value !== null) {
          // This is likely a container for sections (like 'weeks', 'days', 'modules')
          this.extractSectionsFromContainer(value, sections);
        }
      }
    }
    
    this.courseSections = sections;
  }

  private extractSectionsFromContainer(container: any, sections: CourseSection[]) {
    for (const [key, value] of Object.entries(container)) {
      if (typeof value === 'object' && value !== null) {
        const section: CourseSection = {
          title: (value as any).title || this.formatSectionTitle(key),
          description: (value as any).description,
          questions: [],
          unitKey: key
        };
        
        // Extract questions from this section
        if ((value as any).questions && Array.isArray((value as any).questions)) {
          for (const question of (value as any).questions) {
            if (typeof question === 'string') {
              // Old format: just string filename
              section.questions.push(this.enrichQuestionData({
                filename: question,
                title: this.formatQuestionTitle(question)
              }));
            } else if (typeof question === 'object' && question.filename) {
              // New format: object with filename and optional attributes
              // Load tags from question file (via index) instead of using course tags
              section.questions.push(this.enrichQuestionData({
                filename: question.filename,
                title: this.formatQuestionTitle(question.filename),
                urls: question.urls
              }));
            }
          }
        }
        
        sections.push(section);
      }
    }
  }

  private formatSectionTitle(key: string): string {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatQuestionTitle(filename: string): string {
    return filename
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Enrich question data with tags from the question file (via index)
   */
  private enrichQuestionData(question: CourseQuestion): CourseQuestion {
    // Look up question in the index to get difficulty and tags
    const allQuestions = this.questionSearchService.getAllQuestions();
    const questionData = allQuestions.find(q => q.filename === question.filename);

    if (questionData && (questionData.difficulty || questionData.tags)) {
      // Convert difficulty and tags to CourseTag objects with colors
      const tags: CourseTag[] = [];

      // Add difficulty tag first
      if (questionData.difficulty) {
        tags.push(this.tagService.getDifficultyTag(questionData.difficulty));
      }

      // Add other tags
      if (questionData.tags && questionData.tags.length > 0) {
        tags.push(...this.tagService.getTags(questionData.tags));
      }

      return {
        ...question,
        tags: tags
      };
    }

    return question;
  }

  onQuestionClick(question: CourseQuestion) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/questions', question.filename])
    );
    window.open(url, '_blank');
  }

  goBack() {
    this.router.navigate(['/courses']);
  }

  isFavorite(): boolean {
    return this.favoritesService.isFavorite(this.courseName);
  }

  toggleFavorite(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/sign-in']);
      return;
    }

    if (this.isFavorite()) {
      this.favoritesService.removeFavorite(this.courseName).pipe(takeUntil(this.destroy$)).subscribe({
        error: (err) => {
          console.error('Error removing favorite:', err);
        }
      });
    } else {
      this.favoritesService.addFavorite(this.courseName).pipe(takeUntil(this.destroy$)).subscribe({
        error: (err) => {
          console.error('Error adding favorite:', err);
        }
      });
    }
  }

  isQuestionCompleted(questionFilename: string): boolean {
    if (this.authService.isAuthenticated()) {
      return this.completionService.isCompleted(questionFilename);
    } else {
      return this.localStorageService.isQuestionCompleted(questionFilename);
    }
  }

  onUrlClick(event: Event, url: string) {
    event.stopPropagation(); // Prevent the question click from firing
    window.open(url, '_blank');
  }

  onUnitClick(unitKey: string) {
    this.router.navigate(['/courses', this.courseName, unitKey]);
  }
}