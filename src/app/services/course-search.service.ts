import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface CourseSearchResult {
  filename: string;
  title: string;
  keywords: string[];
  score: number;
}

interface CoursesIndex {
  courses: {
    filename: string;
    title: string;
    keywords: string[];
  }[];
  lastUpdated: string;
  totalCourses: number;
}

@Injectable({
  providedIn: 'root'
})
export class CourseSearchService {
  private coursesIndex: CoursesIndex | null = null;
  private indexLoaded = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadCoursesIndex();
  }

  private loadCoursesIndex(): void {
    this.http.get<CoursesIndex>('/courses/index.json').subscribe({
      next: (data) => {
        this.coursesIndex = data;
        this.indexLoaded.next(true);
      },
      error: (error) => {
        console.error('Failed to load courses index:', error);
      }
    });
  }

  searchCourses(query: string): CourseSearchResult[] {
    if (!this.coursesIndex || !query.trim()) {
      return this.getAllCourses();
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results: CourseSearchResult[] = [];

    for (const course of this.coursesIndex.courses) {
      const score = this.calculateScore(course, normalizedQuery);
      if (score > 0) {
        results.push({
          ...course,
          score
        });
      }
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  private calculateScore(course: any, query: string): number {
    let score = 0;

    // Exact filename match gets highest score
    if (course.filename.toLowerCase() === query) {
      score += 100;
    }

    // Filename contains query
    if (course.filename.toLowerCase().includes(query)) {
      score += 50;
    }

    // Title exact match
    if (course.title.toLowerCase() === query) {
      score += 80;
    }

    // Title contains query
    if (course.title.toLowerCase().includes(query)) {
      score += 30;
    }

    // Keyword exact matches
    for (const keyword of course.keywords) {
      if (keyword.toLowerCase() === query) {
        score += 20;
      } else if (keyword.toLowerCase().includes(query)) {
        score += 10;
      }
    }

    // Partial word matches in filename (for hyphenated names)
    const filenameParts = course.filename.split('-');
    for (const part of filenameParts) {
      if (part.toLowerCase().startsWith(query)) {
        score += 15;
      }
    }

    return score;
  }

  getAllCourses(): CourseSearchResult[] {
    if (!this.coursesIndex) {
      return [];
    }

    return this.coursesIndex.courses.map(c => ({
      ...c,
      score: 0
    }));
  }

  isIndexLoaded(): Observable<boolean> {
    return this.indexLoaded.asObservable();
  }
}