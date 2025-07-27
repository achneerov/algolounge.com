import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TestResult {
  id: number;
  input: any;
  expectedOutput: any;
  actualOutput: any;
  passed: boolean;
  error?: string;
  output?: string[];
}

export interface ExecutionResult {
  testResults: TestResult[];
  executionTime: number;
  passedCount: number;
  totalCount: number;
  output: string[];
}

@Component({
  selector: 'app-console',
  imports: [CommonModule],
  templateUrl: './console.component.html',
  styleUrl: './console.component.scss'
})
export class ConsoleComponent {
  @Input() result: ExecutionResult | null = null;

  formatValue(value: any): string {
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  }
}
