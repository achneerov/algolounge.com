import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DescriptionComponent } from './description/description.component';
import { SolutionComponent } from './solution/solution.component';

@Component({
  selector: 'app-content-tabs',
  standalone: true,
  imports: [CommonModule, DescriptionComponent, SolutionComponent],
  template: `
    <div class="content-tabs">
      <div class="tab-header">
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
      
      <div class="tab-content">
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
      border-bottom: 1px solid #e1e5e9;
      background-color: #f8f9fa;
      flex-shrink: 0;
      width: 100%;
      min-width: 0;
      
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
    
    .tab-content {
      flex: 1;
      overflow: hidden;
      background-color: white;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
  `]
})
export class ContentTabsComponent {
  @Input() description: string = '';
  @Input() solutionText: string = '';
  @Input() solutionCode: string = '';
  
  activeTab: 'description' | 'solution' = 'description';
}