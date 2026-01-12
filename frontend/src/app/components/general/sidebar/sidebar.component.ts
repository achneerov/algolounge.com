import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QuestionSearchService, QuestionSearchResult } from '../../../services/question-search.service';
import { LocalStorageService } from '../../../services/local-storage.service';
import { CompletionService } from '../../../services/completion.service';
import { AuthService } from '../../../services/auth.service';
import { TagService } from '../../../services/tag.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() currentQuestionFilename: string = '';
  @Output() selectQuestion = new EventEmitter<string>();

  searchQuery: string = '';
  questions: QuestionSearchResult[] = [];
  filteredQuestions: QuestionSearchResult[] = [];

  // Filters
  selectedDifficulty: string | null = null;
  showCompleted: boolean | null = null; // null = all, true = completed, false = todo
  selectedTag: string | null = null; // Single tag selection
  availableTags: string[] = []; // All unique tags from questions
  showTagsPopover: boolean = false; // Toggle popover visibility

  private destroy$ = new Subject<void>();
  private serverCompletions: string[] = [];

  constructor(
    private questionSearchService: QuestionSearchService,
    private localStorageService: LocalStorageService,
    private completionService: CompletionService,
    private authService: AuthService,
    private tagService: TagService
  ) {}

  ngOnInit(): void {
    this.questionSearchService.isIndexLoaded().pipe(takeUntil(this.destroy$)).subscribe(loaded => {
      if (loaded) {
        this.questions = this.questionSearchService.getAllQuestions();
        this.availableTags = this.getAllUniqueTags();
        this.filterQuestions();
      }
    });

    // Subscribe to completions from server (updates when user completes questions)
    this.completionService.completions$.pipe(takeUntil(this.destroy$)).subscribe(completions => {
      this.serverCompletions = completions;
      this.filterQuestions();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterQuestions(): void {
    let result = this.questions;

    // Search filter
    if (this.searchQuery.trim()) {
      result = this.questionSearchService.searchQuestions(this.searchQuery);
    }

    // Difficulty filter
    if (this.selectedDifficulty) {
      result = result.filter(q => q.difficulty.toLowerCase() === this.selectedDifficulty?.toLowerCase());
    }

    // Tag filter - question must have the selected tag
    if (this.selectedTag) {
      result = result.filter(q =>
        q.tags.some(qTag => qTag.toLowerCase() === this.selectedTag?.toLowerCase())
      );
    }

    // Status filter
    if (this.showCompleted !== null) {
      result = result.filter(q => {
        const isCompleted = this.isQuestionCompleted(q.filename);
        return this.showCompleted ? isCompleted : !isCompleted;
      });
    }

    // Sort by difficulty first, then by tags
    result = this.sortQuestions(result);

    this.filteredQuestions = result;
  }

  private sortQuestions(questions: QuestionSearchResult[]): QuestionSearchResult[] {
    const difficultyOrder: { [key: string]: number } = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    };

    return questions.sort((a, b) => {
      // First sort by difficulty
      const diffA = difficultyOrder[a.difficulty.toLowerCase()] || 999;
      const diffB = difficultyOrder[b.difficulty.toLowerCase()] || 999;

      if (diffA !== diffB) {
        return diffA - diffB;
      }

      // Then sort by first tag alphabetically
      const tagA = a.tags[0]?.toLowerCase() || '';
      const tagB = b.tags[0]?.toLowerCase() || '';

      return tagA.localeCompare(tagB);
    });
  }

  toggleDifficulty(difficulty: string): void {
    if (this.selectedDifficulty === difficulty) {
      this.selectedDifficulty = null;
    } else {
      this.selectedDifficulty = difficulty;
    }
    this.filterQuestions();
  }

  toggleStatus(completed: boolean): void {
    if (this.showCompleted === completed) {
      this.showCompleted = null;
    } else {
      this.showCompleted = completed;
    }
    this.filterQuestions();
  }

  selectTag(tag: string): void {
    this.selectedTag = tag;
    this.showTagsPopover = false;
    this.filterQuestions();
  }

  clearTag(): void {
    this.selectedTag = null;
    this.showTagsPopover = false;
    this.filterQuestions();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTag === tag;
  }

  getAllUniqueTags(): string[] {
    const tagSet = new Set<string>();
    this.questions.forEach(q => {
      q.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  isQuestionCompleted(filename: string): boolean {
    // Use server completions if authenticated, fallback to local storage
    if (this.authService.isAuthenticated()) {
      return this.serverCompletions.includes(filename);
    }
    return this.localStorageService.isQuestionCompleted(filename);
  }

  onSelect(filename: string): void {
    this.selectQuestion.emit(filename);
  }

  getTagColor(tag: string): string {
    return this.tagService.getTagColor(tag);
  }

  getDifficultyLabel(difficulty: string): string {
    if (difficulty.toLowerCase() === 'medium') {
      return 'Med';
    }
    return difficulty;
  }

  toggleTagsPopover(): void {
    this.showTagsPopover = !this.showTagsPopover;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const tagsSection = target.closest('.tags-section');

    if (!tagsSection && this.showTagsPopover) {
      this.showTagsPopover = false;
    }
  }
}
