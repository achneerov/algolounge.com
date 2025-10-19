import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DescriptionComponent } from './description/description.component';
import { SolutionComponent } from './solution/solution.component';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { QuestionSearchService, QuestionSearchResult } from '../../services/question-search.service';
import { LocalStorageService } from '../../services/local-storage.service';

@Component({
  selector: 'app-content-tabs',
  standalone: true,
  imports: [CommonModule, DescriptionComponent, SolutionComponent, AutoCompleteModule, FormsModule],
  template: `
    <div class="container">
      <!-- Tab Navigation with Search -->
      <div class="tab-navigation">
        <div class="search-section">
          <p-autoComplete
            [(ngModel)]="selectedQuestion"
            [suggestions]="searchResults"
            (completeMethod)="onSearch($event)"
            (onSelect)="onSelect($event)"
            (keydown)="onKeyDown($event)"
            field="title"
            placeholder="Search questions..."
            [forceSelection]="false"
            [dropdown]="true"
            class="question-search"
            [appendTo]="'body'"
          >
            <ng-template let-question pTemplate="item">
              <div class="search-item">
                <div class="search-title">{{ question.title }}</div>
                <div class="completion-status" *ngIf="isQuestionCompleted(question.filename)">✅</div>
              </div>
            </ng-template>
          </p-autoComplete>
        </div>
        <button
          [class.active]="activeTab === 'description'"
          (click)="activeTab = 'description'"
          type="button"
          class="tab-button">
          Description
        </button>
        <button
          [class.active]="activeTab === 'solution'"
          (click)="activeTab = 'solution'"
          type="button"
          class="tab-button">
          Solution
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content-area">
        <app-description
          *ngIf="activeTab === 'description'"
          [content]="description"
          [isCompleted]="isCompleted">
        </app-description>
        <app-solution
          *ngIf="activeTab === 'solution'"
          [solutionText]="solutionText"
          [solutionCode]="solutionCode">
        </app-solution>
      </div>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: var(--color-bg-primary);
      border-radius: 0.75rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      border: 1px solid var(--color-border);
    }

    .search-section {
      padding: 0.5rem 1rem;
      margin-right: 1rem;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      min-width: 250px;
    }

    .question-search {
      width: 250px;
    }

    .search-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 0.25rem 0;
    }

    .search-title {
      flex: 1;
      font-size: 0.875rem;
    }

    .completion-status {
      margin-left: 0.5rem;
      font-size: 0.75rem;
    }

    .tab-navigation {
      display: flex;
      align-items: center;
      background-color: var(--color-bg-secondary);
      border-radius: 0.75rem 0.75rem 0 0;
      border-bottom: 1px solid var(--color-border);
      position: relative;
      z-index: 10;
      flex-shrink: 0;
      margin: 0;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
      min-width: 0;
      scrollbar-width: none;
      -ms-overflow-style: none;
      height: 56px;
      box-sizing: border-box;
    }

    .tab-navigation::-webkit-scrollbar {
      display: none;
    }

    .tab-button {
      background: transparent;
      border: 2px solid transparent;
      border-radius: 0.5rem;
      padding: 0.5rem 1rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
      white-space: nowrap;
      margin: 0.5rem 0.25rem;

      &:hover {
        background: var(--color-bg-primary);
        border-color: var(--color-primary);
        color: var(--color-primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }

      &.active {
        color: var(--color-primary);
        border-color: var(--color-primary);
        background-color: var(--color-bg-primary);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .completion-indicator {
      position: absolute;
      top: 1rem;
      right: 1rem;
      font-size: 1rem;
      z-index: 100;
    }

    .tab-content-area {
      flex: 1;
      overflow: auto;
      background-color: var(--color-bg-primary);
      position: relative;
      z-index: 1;
      border-radius: 0 0 0.75rem 0.75rem;
    }

  `]
})
export class ContentTabsComponent implements OnInit {
  @Input() description: string = '';
  @Input() solutionText: string = '';
  @Input() solutionCode: string = '';
  @Input() isCompleted: boolean = false;
  @Input() currentQuestionFilename: string = '';
  @Output() go = new EventEmitter<string>();

  activeTab: 'description' | 'solution' = 'description';
  searchResults: QuestionSearchResult[] = [];
  selectedQuestion: QuestionSearchResult | null = null;

  constructor(
    private questionSearchService: QuestionSearchService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.questionSearchService.isIndexLoaded().subscribe(loaded => {
      if (loaded) {
        this.onSearch({ query: "" });
        // Set the currently selected question
        if (this.currentQuestionFilename) {
          const allQuestions = this.questionSearchService.getAllQuestions();
          this.selectedQuestion = allQuestions.find(q => q.filename === this.currentQuestionFilename) || null;
        }
      }
    });
  }

  onSearch(event: any): void {
    const query = event.query;
    if (query && query.length > 0) {
      this.searchResults = this.questionSearchService.searchQuestions(query);
    } else {
      this.searchResults = this.questionSearchService.getAllQuestions();
    }
  }

  onSelect(event: any): void {
    const question = event.value as QuestionSearchResult;
    // Keep the selected question displayed in the search bar
    this.selectedQuestion = question;
    this.go.emit(question.filename);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.searchResults.length > 0) {
        const topResult = this.searchResults[0];
        // Keep the selected question displayed in the search bar
        this.selectedQuestion = topResult;
        this.go.emit(topResult.filename);
      }
    }
  }

  isQuestionCompleted(filename: string): boolean {
    return this.localStorageService.isQuestionCompleted(filename);
  }
}
