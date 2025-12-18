import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QuestionSearchService, QuestionSearchResult } from '../../../services/question-search.service';
import { LocalStorageService } from '../../../services/local-storage.service';
import { TagService } from '../../../services/tag.service';

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
  selectedTags: Set<string> = new Set(); // Track selected tags
  availableTags: string[] = []; // All unique tags from questions

  constructor(
    private questionSearchService: QuestionSearchService,
    private localStorageService: LocalStorageService,
    private tagService: TagService
  ) {}

  ngOnInit(): void {
    this.questionSearchService.isIndexLoaded().subscribe(loaded => {
      if (loaded) {
        this.questions = this.questionSearchService.getAllQuestions();
        this.availableTags = this.getAllUniqueTags();
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

    // Tag filter - question must have ALL selected tags
    if (this.selectedTags.size > 0) {
      result = result.filter(q => {
        return Array.from(this.selectedTags).every(selectedTag =>
          q.tags.some(qTag => qTag.toLowerCase() === selectedTag.toLowerCase())
        );
      });
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

  toggleTag(tag: string): void {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
    this.filterQuestions();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.has(tag);
  }

  getAllUniqueTags(): string[] {
    const tagSet = new Set<string>();
    this.questions.forEach(q => {
      q.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  isQuestionCompleted(filename: string): boolean {
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
}
