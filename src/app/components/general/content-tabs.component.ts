import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DescriptionComponent } from './description/description.component';
import { SolutionComponent } from './solution/solution.component';
import { Tag } from '../../services/tag.service';

@Component({
  selector: 'app-content-tabs',
  standalone: true,
  imports: [CommonModule, DescriptionComponent, SolutionComponent],
  template: `
    <div class="container">
      <!-- Tab Navigation -->
      <div class="tab-navigation">
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
          [isCompleted]="isCompleted"
          [questionTags]="questionTags">
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
      padding: 0 0.5rem;
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
  @Input() questionTags: Tag[] = [];

  activeTab: 'description' | 'solution' = 'description';

  ngOnInit(): void {
    // Component initialization if needed
  }
}
