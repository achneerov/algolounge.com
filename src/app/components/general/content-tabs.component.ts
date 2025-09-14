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
        <div class="completion-indicator" *ngIf="isCompleted">✅</div>
        <app-description
          *ngIf="activeTab === 'description'"
          [content]="description">
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
      background: var(--surface-card, #ffffff);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .search-section {
      padding: 8px 16px;
      margin-right: 16px;
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
      padding: 4px 0;
    }

    .search-title {
      flex: 1;
      font-size: 14px;
    }

    .completion-status {
      margin-left: 8px;
      font-size: 12px;
    }

    .tab-navigation {
      display: flex;
      align-items: center;
      background-color: #f8f9fa;
      border-radius: 7px 7px 0px 0px;
      border-bottom: 1px solid #e1e5e9;
      position: relative;
      z-index: 10;
      flex-shrink: 0;
      margin: 0;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
      min-width: 0;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
    }

    .tab-navigation::-webkit-scrollbar {
      display: none; /* Chrome, Safari and Opera */
    }

    .tab-button {
      background: none;
      border: none;
      padding: 14px 20px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #6c757d;
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
      flex-shrink: 0;
      white-space: nowrap;

      &:hover {
        color: #495057;
        background-color: #e9ecef;
      }

      &.active {
        color: #007bff;
        border-bottom-color: #007bff;
        background-color: white;
      }
    }

    .completion-indicator {
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 16px;
      z-index: 100;
    }

    .tab-content-area {
      flex: 1;
      overflow: auto;
      background-color: white;
      position: relative;
      z-index: 1;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .container {
        background: var(--surface-card, #1f1f1f);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .tab-navigation {
        background-color: var(--surface-200, #2d2d2d);
        border-bottom-color: var(--surface-border, #555);
      }


      .tab-button {
        color: var(--text-color-secondary, #cccccc);

        &:hover {
          color: var(--text-color, #ffffff);
          background-color: var(--surface-300, #444);
        }

        &.active {
          color: var(--primary-300, #66ccff);
          border-bottom-color: var(--primary-300, #66ccff);
          background-color: var(--surface-card, #1f1f1f);
        }
      }

      .tab-content-area {
        background-color: var(--surface-card, #1f1f1f);
      }
    }

    :host-context(.dark-mode) .container {
      background: var(--surface-card, #1f1f1f) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    :host-context(.dark-mode) .tab-navigation {
      background-color: var(--surface-200, #2d2d2d) !important;
      border-bottom-color: var(--surface-border, #555) !important;
    }

    :host-context(.dark-mode) .tab-button {
      color: var(--text-color-secondary, #cccccc) !important;
    }

    :host-context(.dark-mode) .tab-button:hover {
      color: var(--text-color, #ffffff) !important;
      background-color: var(--surface-300, #444) !important;
    }

    :host-context(.dark-mode) .tab-button.active {
      color: var(--primary-300, #66ccff) !important;
      border-bottom-color: var(--primary-300, #66ccff) !important;
      background-color: var(--surface-card, #1f1f1f) !important;
    }

    :host-context(.dark-mode) .tab-content-area {
      background-color: var(--surface-card, #1f1f1f) !important;
    }
  `]
})
export class ContentTabsComponent implements OnInit {
  @Input() description: string = '';
  @Input() solutionText: string = '';
  @Input() solutionCode: string = '';
  @Input() isCompleted: boolean = false;
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
    this.selectedQuestion = null;
    this.go.emit(question.filename);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.searchResults.length > 0) {
        const topResult = this.searchResults[0];
        this.selectedQuestion = null;
        this.go.emit(topResult.filename);
      }
    }
  }

  isQuestionCompleted(filename: string): boolean {
    return this.localStorageService.isQuestionCompleted(filename);
  }
}
