import { Component, Output, EventEmitter, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-success-animation',
  imports: [CommonModule],
  templateUrl: './success-animation.component.html',
  styleUrl: './success-animation.component.scss'
})
export class SuccessAnimationComponent implements OnInit, AfterViewInit {
  @Output() animationComplete = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // Remove component after 3 seconds (matching the animation duration)
    setTimeout(() => {
      this.animationComplete.emit();
    }, 3000);
  }

  ngAfterViewInit() {
    // Trigger confetti animation in the IDE area
    this.launchConfetti();
  }

  private launchConfetti() {
    // Launch confetti from bottom-left corner
    this.fireConfetti(0, 1);

    // Launch confetti from bottom-right corner
    setTimeout(() => this.fireConfetti(1, 1), 150);

    // Extra burst from bottom center
    setTimeout(() => this.fireConfetti(0.5, 1), 300);
  }

  private fireConfetti(x: number, y: number) {
    const count = 100;
    const defaults = {
      origin: { x, y },
      disableForReducedMotion: true
    };

    confetti({
      ...defaults,
      particleCount: count,
      spread: 120,
      startVelocity: 70,
      scalar: 1.5,
      colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
    });
  }
}
