import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-animation',
  imports: [CommonModule],
  templateUrl: './success-animation.component.html',
  styleUrl: './success-animation.component.scss'
})
export class SuccessAnimationComponent implements OnInit {
  @Output() animationComplete = new EventEmitter<void>();

  ngOnInit() {
    // Remove component after 3 seconds (matching the animation duration)
    setTimeout(() => {
      this.animationComplete.emit();
    }, 3000);
  }
}
