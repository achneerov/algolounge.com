import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-solution',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solution.component.html',
  styleUrl: './solution.component.scss'
})
export class SolutionComponent {
  @Input() solutionText: string = '';
  @Input() solutionCode: string = '';

  copyCode() {
    if (this.solutionCode) {
      navigator.clipboard.writeText(this.solutionCode).then(() => {
        // Could add a toast notification here
      });
    }
  }
}