import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-live-code-demo',
  imports: [CommonModule],
  templateUrl: './live-code-demo.component.html',
  styleUrl: './live-code-demo.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class LiveCodeDemoComponent implements OnInit, OnDestroy {
  displayedCode = signal('');
  testResults = signal<{text: string, passed: boolean}[]>([]);
  isTyping = signal(true);

  private typingInterval: any;
  private loopTimeout: any;

  private readonly fullCode = `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`;

  private readonly tests = [
    { text: 'Test 1: [2,7,11,15], target=9', passed: true },
    { text: 'Test 2: [3,2,4], target=6', passed: true },
    { text: 'Test 3: [3,3], target=6', passed: true }
  ];

  ngOnInit() {
    this.startDemo();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private cleanup() {
    if (this.typingInterval) clearInterval(this.typingInterval);
    if (this.loopTimeout) clearTimeout(this.loopTimeout);
  }

  private startDemo() {
    this.displayedCode.set('');
    this.testResults.set([]);
    this.isTyping.set(true);

    let currentIndex = 0;
    const typingSpeed = 30; // ms per character

    this.typingInterval = setInterval(() => {
      if (currentIndex < this.fullCode.length) {
        this.displayedCode.set(this.fullCode.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(this.typingInterval);
        this.isTyping.set(false);
        this.runTests();
      }
    }, typingSpeed);
  }

  private runTests() {
    // Show tests one by one
    this.tests.forEach((test, index) => {
      setTimeout(() => {
        this.testResults.update(results => [...results, test]);

        // Restart loop after last test
        if (index === this.tests.length - 1) {
          this.loopTimeout = setTimeout(() => {
            this.startDemo();
          }, 3000); // Wait 3s before restarting
        }
      }, (index + 1) * 600); // 600ms between each test
    });
  }
}
