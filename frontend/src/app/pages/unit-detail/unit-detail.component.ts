import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService } from '../../services/local-storage.service';
import { TagService } from '../../services/tag.service';
import { QuestionSearchService } from '../../services/question-search.service';

interface CourseTag {
  text: string;
  color: string;
}

interface CourseUrl {
  url: string;
  tooltip: string;
  color: string;
  visibleString?: string;
}

interface CourseQuestion {
  filename: string;
  title: string;
  urls?: CourseUrl[];
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
    private localStorageService: LocalStorageService,
    private tagService: TagService,
    private questionSearchService: QuestionSearchService
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
          let courseQuestion: CourseQuestion;

          if (typeof question === 'string') {
            // Old format: just string filename
            courseQuestion = {
              filename: question,
              title: this.formatQuestionTitle(question)
            };
          } else if (typeof question === 'object' && question.filename) {
            // New format: object with filename and optional attributes
            courseQuestion = {
              filename: question.filename,
              title: this.formatQuestionTitle(question.filename),
              urls: question.urls
            };
          } else {
            continue;
          }

          // Enrich with tags from question index
          this.unit.questions.push(this.enrichQuestionData(courseQuestion));
        }
      }
    } else {
      // Unit not found, redirect to course
      this.router.navigate(['/courses', this.courseName]);
    }
  }

  /**
   * Enrich question data with tags from the question index
   */
  private enrichQuestionData(question: CourseQuestion): CourseQuestion {
    const allQuestions = this.questionSearchService.getAllQuestions();
    const questionData = allQuestions.find(q => q.filename === question.filename);

    if (questionData) {
      const tags: CourseTag[] = [];

      // Add difficulty tag
      tags.push(this.tagService.getDifficultyTag(questionData.difficulty));

      // Add other tags
      if (questionData.tags.length > 0) {
        tags.push(...this.tagService.getTags(questionData.tags));
      }

      return {
        ...question,
        tags: tags
      };
    }

    return question;
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

  onUrlClick(event: Event, url: string) {
    event.stopPropagation(); // Prevent the question click from firing
    window.open(url, '_blank');
  }

  goBackToCourse() {
    this.router.navigate(['/courses', this.courseName]);
  }

  isQuestionCompleted(questionFilename: string): boolean {
    return this.localStorageService.isQuestionCompleted(questionFilename);
  }
}
