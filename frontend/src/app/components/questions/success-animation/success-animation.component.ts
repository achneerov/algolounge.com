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
    // Find the IDE component container
    const ideElement = document.querySelector('.ide-wrapper');

    if (!ideElement) {
      // Fallback to bottom center if IDE not found
      this.fireConfetti(0.5, 1);
      return;
    }

    const ideRect = ideElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate positions - centered horizontally, at the bottom vertically
    const originX = (ideRect.left + ideRect.width / 2) / windowWidth;
    const originY = ideRect.bottom / windowHeight;

    // Fire multiple bursts of confetti from the bottom
    this.fireConfetti(originX, originY);

    setTimeout(() => this.fireConfetti(originX - 0.1, originY), 150);
    setTimeout(() => this.fireConfetti(originX + 0.1, originY), 300);
  }

  private fireConfetti(x: number, y: number) {
    const count = 80;
    const defaults = {
      origin: { x, y },
      disableForReducedMotion: true
    };

    confetti({
      ...defaults,
      particleCount: count,
      spread: 60,
      startVelocity: 45,
      scalar: 1.2,
      colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
    });
  }
}
