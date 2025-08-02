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
    <div class="content-tabs">
      <div class="tab-header">
        <div class="tab-header-left">
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
          >
            <ng-template let-question pTemplate="item">
              <div class="search-item">
                <div class="search-title">{{ question.title }}</div>
                <div class="completion-status" *ngIf="isQuestionCompleted(question.filename)">✅</div>
              </div>
            </ng-template>
          </p-autoComplete>
        </div>
        <div class="tab-buttons">
          <button 
            [class.active]="activeTab === 'description'"
            (click)="activeTab = 'description'"
            type="button">
            Description
          </button>
          <button 
            [class.active]="activeTab === 'solution'"
            (click)="activeTab = 'solution'"
            type="button">
            Solution
          </button>
        </div>
        <div class="tab-header-right">
        </div>
      </div>
      
      <div class="tab-content">
        <span *ngIf="isCompleted" class="completion-check">✅</span>
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
    :host {
      display: block;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      contain: layout;
      background: var(--surface-card, #ffffff);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .content-tabs {
      height: 100%;
      display: flex;
      flex-direction: column;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e1e5e9;
      background-color: #f8f9fa;
      flex-shrink: 0;
      width: 100%;
      min-width: 0;
      padding: 0 1rem;
      overflow-x: auto;
      overflow-y: hidden;
    }
    
    .tab-header-left {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      padding-left: 0.1rem;
      margin-right: 0.5rem;
    }
    
    .tab-header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }
    
    .question-search {
      width: 200px;
    }
    
    .search-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .search-title {
      flex: 1;
    }
    
    .completion-status {
      margin-left: 0.5rem;
    }
    
    .tab-buttons {
      display: flex;
      flex-shrink: 0;
      
      button {
        background: none;
        border: none;
        padding: 12px 24px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: #6c757d;
        border-bottom: 3px solid transparent;
        transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
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
    }
    
    .completion-check {
      position: absolute;
      top: 1rem;
      right: 1rem;
      font-size: 1.2rem;
      z-index: 10;
    }
    
    .tab-content {
      flex: 1;
      overflow: hidden;
      background-color: white;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      position: relative;
    }
    
    // Dark mode overrides
    :host-context(.dark-mode) .tab-header {
      background-color: var(--surface-200, #2d2d2d) !important;
      border-bottom-color: var(--surface-border, #555) !important;
    }
    
    :host-context(.dark-mode) .tab-header button {
      color: var(--text-color-secondary, #cccccc) !important;
    }
    
    :host-context(.dark-mode) .tab-header button:hover {
      color: var(--text-color, #ffffff) !important;
      background-color: var(--surface-300, #444) !important;
    }
    
    :host-context(.dark-mode) .tab-header button.active {
      color: var(--primary-300, #66ccff) !important;
      border-bottom-color: var(--primary-300, #66ccff) !important;
      background-color: var(--surface-card, #1f1f1f) !important;
    }
    
    :host-context(.dark-mode) .tab-content {
      background-color: var(--surface-card, #1f1f1f) !important;
    }
    
    
    :host-context(.dark-mode) {
      background: var(--surface-card, #1f1f1f) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }
    
    @media (prefers-color-scheme: dark) {
      .tab-header {
        background-color: var(--surface-200, #2d2d2d) !important;
        border-bottom-color: var(--surface-border, #555) !important;
      }
      
      .tab-header button {
        color: var(--text-color-secondary, #cccccc) !important;
      }
      
      .tab-header button:hover {
        color: var(--text-color, #ffffff) !important;
        background-color: var(--surface-300, #444) !important;
      }
      
      .tab-header button.active {
        color: var(--primary-300, #66ccff) !important;
        border-bottom-color: var(--primary-300, #66ccff) !important;
        background-color: var(--surface-card, #1f1f1f) !important;
      }
      
      .tab-content {
        background-color: var(--surface-card, #1f1f1f) !important;
      }
      
      
      :host {
        background: var(--surface-card, #1f1f1f) !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
      }
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