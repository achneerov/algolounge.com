import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QuestionSearchService, QuestionSearchResult } from '../../../services/question-search.service';
import { LocalStorageService } from '../../../services/local-storage.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() currentQuestionFilename: string = '';
  @Output() selectQuestion = new EventEmitter<string>();

  searchQuery: string = '';
  questions: QuestionSearchResult[] = [];
  filteredQuestions: QuestionSearchResult[] = [];
  
  // Filters
  selectedDifficulty: string | null = null;
  showCompleted: boolean | null = null; // null = all, true = completed, false = todo

  constructor(
    private questionSearchService: QuestionSearchService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.questionSearchService.isIndexLoaded().subscribe(loaded => {
      if (loaded) {
        this.questions = this.questionSearchService.getAllQuestions();
        this.filterQuestions();
      }
    });
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

    // Status filter
    if (this.showCompleted !== null) {
      result = result.filter(q => {
        const isCompleted = this.isQuestionCompleted(q.filename);
        return this.showCompleted ? isCompleted : !isCompleted;
      });
    }

    this.filteredQuestions = result;
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

  isQuestionCompleted(filename: string): boolean {
    return this.localStorageService.isQuestionCompleted(filename);
  }

  onSelect(filename: string): void {
    this.selectQuestion.emit(filename);
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'var(--color-success)';
      case 'medium': return 'var(--color-warning)';
      case 'hard': return 'var(--color-error)';
      default: return 'var(--color-text-secondary)';
    }
  }
}
