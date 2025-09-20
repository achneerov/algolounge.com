import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService } from '../../services/local-storage.service';

interface CourseTag {
  text: string;
  color: string;
}

interface CourseQuestion {
  filename: string;
  title: string;
  leetcode_url?: string;
  tags?: CourseTag[];
}

interface CourseUnit {
  title: string;
  description?: string;
  questions: CourseQuestion[];
}

interface Course {
  course_name: string;
  course_description: string;
  [key: string]: any;
}

@Component({
  selector: 'app-unit-detail',
  imports: [CommonModule],
  templateUrl: './unit-detail.component.html',
  styleUrl: './unit-detail.component.scss'
})
export class UnitDetailComponent implements OnInit {
  course: Course | null = null;
  unit: CourseUnit | null = null;
  courseName = '';
  unitKey = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.courseName = params['courseName'];
      this.unitKey = params['unitKey'];
      this.loadCourseAndUnit();
    });
  }

  private loadCourseAndUnit() {
    this.http.get<Course>(`/courses/${this.courseName}.json`).subscribe({
      next: (data) => {
        this.course = data;
        this.extractUnit();
      },
      error: (error) => {
        console.error('Failed to load course:', error);
        this.router.navigate(['/courses']);
      }
    });
  }

  private extractUnit() {
    if (!this.course) return;

    // Look for the specific unit in the course
    const units = this.course['units'];
    if (units && units[this.unitKey]) {
      const unitData = units[this.unitKey];

      this.unit = {
        title: unitData.title || this.formatUnitTitle(this.unitKey),
        description: unitData.description,
        questions: []
      };

      // Extract questions from this unit
      if (unitData.questions && Array.isArray(unitData.questions)) {
        for (const question of unitData.questions) {
          if (typeof question === 'string') {
            // Old format: just string filename
            this.unit.questions.push({
              filename: question,
              title: this.formatQuestionTitle(question)
            });
          } else if (typeof question === 'object' && question.filename) {
            // New format: object with filename and optional attributes
            this.unit.questions.push({
              filename: question.filename,
              title: this.formatQuestionTitle(question.filename),
              leetcode_url: question.leetcode_url,
              tags: question.tags
            });
          }
        }
      }
    } else {
      // Unit not found, redirect to course
      this.router.navigate(['/courses', this.courseName]);
    }
  }

  private formatUnitTitle(key: string): string {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatQuestionTitle(filename: string): string {
    return filename
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  onQuestionClick(question: CourseQuestion) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/questions', question.filename])
    );
    window.open(url, '_blank');
  }

  onLeetCodeClick(event: Event, leetcodeUrl: string) {
    event.stopPropagation(); // Prevent the question click from firing
    window.open(leetcodeUrl, '_blank');
  }

  goBackToCourse() {
    this.router.navigate(['/courses', this.courseName]);
  }

  isQuestionCompleted(questionFilename: string): boolean {
    return this.localStorageService.isQuestionCompleted(questionFilename);
  }
}