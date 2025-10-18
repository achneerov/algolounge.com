import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AltitudeLevel {
  name: string;
  altitude: number;
  color: string;
  position: number; // percentage from bottom
  labelPosition: 'above' | 'below'; // for alternating symmetry
}

@Component({
  selector: 'app-altitude-visualization',
  imports: [CommonModule],
  templateUrl: './altitude-visualization.component.html',
  styleUrl: './altitude-visualization.component.scss'
})
export class AltitudeVisualizationComponent {
  @Output() airplaneClicked = new EventEmitter<void>();

  isHovering = signal(false);
  isTakingOff = signal(false);

  altitudeLevels: AltitudeLevel[] = [
    { name: 'Arrays & Strings', altitude: 100, color: '#10B981', position: 15, labelPosition: 'below' },
    { name: 'Hash Tables & Stacks', altitude: 500, color: '#3B82F6', position: 30, labelPosition: 'above' },
    { name: 'Trees & Graphs', altitude: 1500, color: '#8B5CF6', position: 50, labelPosition: 'below' },
    { name: 'Dynamic Programming', altitude: 3000, color: '#F59E0B', position: 70, labelPosition: 'above' },
    { name: 'Advanced Topics', altitude: 5000, color: '#EF4444', position: 88, labelPosition: 'below' }
  ];

  currentAltitude = signal(30); // Start at Hash Tables level
  isClimbing = signal(false);
  isDipping = signal(false);

  onAirplaneHover(hovering: boolean): void {
    if (!this.isTakingOff()) {
      this.isHovering.set(hovering);
    }
  }

  onAirplaneClick(): void {
    if (this.isTakingOff()) return;

    this.isTakingOff.set(true);

    // Emit event after animation starts
    setTimeout(() => {
      this.airplaneClicked.emit();
    }, 600);
  }

  onLevelClick(level: AltitudeLevel): void {
    if (this.isTakingOff()) return;

    const currentPos = this.currentAltitude();
    const targetPos = level.position;

    if (targetPos > currentPos) {
      // Climbing up
      this.isClimbing.set(true);
      this.isDipping.set(false);

      // Lift animation - subtle overshoot then settle
      setTimeout(() => {
        this.currentAltitude.set(targetPos + 3); // Subtle overshoot
      }, 80);

      setTimeout(() => {
        this.currentAltitude.set(targetPos); // Settle
        this.isClimbing.set(false);
      }, 550);

    } else if (targetPos < currentPos) {
      // Dipping down - subtle dive then stabilize
      this.isDipping.set(true);
      this.isClimbing.set(false);

      // Dip animation - subtle drop then stabilize
      setTimeout(() => {
        this.currentAltitude.set(targetPos - 4); // Subtle dive
      }, 80);

      setTimeout(() => {
        this.currentAltitude.set(targetPos); // Stabilize
        this.isDipping.set(false);
      }, 550);
    }
  }
}
