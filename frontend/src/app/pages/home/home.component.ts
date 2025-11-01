import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(private router: Router, private http: HttpClient) {}

  navigateToQuestions() {
    this.router.navigate(['/questions']);
  }

  navigateToCourses() {
    this.router.navigate(['/courses']);
  }

  navigateToRandomQuestion() {
    // Load questions index and navigate to random question
    this.http.get<any>('/questions/index.json').subscribe({
      next: (data) => {
        if (data.questions && data.questions.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.questions.length);
          const randomQuestion = data.questions[randomIndex];
          this.router.navigate(['/questions', randomQuestion.filename]);
        } else {
          this.router.navigate(['/questions']);
        }
      },
      error: () => {
        // Fallback to questions page if index can't be loaded
        this.router.navigate(['/questions']);
      }
    });
  }

  navigateToRandomCourse() {
    // Load courses index and navigate to random course
    this.http.get<any>('/courses/index.json').subscribe({
      next: (data) => {
        if (data.courses && data.courses.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.courses.length);
          const randomCourse = data.courses[randomIndex];
          this.router.navigate(['/courses', randomCourse.filename]);
        } else {
          this.router.navigate(['/courses']);
        }
      },
      error: () => {
        // Fallback to courses page if index can't be loaded
        this.router.navigate(['/courses']);
      }
    });
  }
}
