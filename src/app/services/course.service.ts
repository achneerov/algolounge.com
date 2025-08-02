import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs';

export interface Course {
  filename: string;
  course_name: string;
  course_description: string;
  duration: string;
  difficulty: string;
  [key: string]: any; // For flexible course structure
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  private searchTermSubject = new BehaviorSubject<string>('');
  
  courses$ = this.coursesSubject.asObservable();
  searchTerm$ = this.searchTermSubject.asObservable();
  
  filteredCourses$ = combineLatest([this.courses$, this.searchTerm$]).pipe(
    map(([courses, searchTerm]) => {
      if (!searchTerm) return courses;
      
      const term = searchTerm.toLowerCase();
      return courses.filter(course =>
        course.course_name.toLowerCase().includes(term) ||
        course.course_description.toLowerCase().includes(term) ||
        course.difficulty.toLowerCase().includes(term) ||
        course.duration.toLowerCase().includes(term)
      );
    })
  );

  constructor(private http: HttpClient) {
    this.loadCourses();
  }

  private async loadCourses() {
    const courseFiles = [
      'algotime_summer_2025.json',
      'javascript_interview_prep.json', 
      'data_structures_bootcamp.json',
      'beginner_coding_challenge.json'
    ];

    const courses: Course[] = [];
    
    for (const filename of courseFiles) {
      try {
        const course = await this.http.get<any>(`/courses/${filename}`).toPromise();
        courses.push({
          filename: filename.replace('.json', ''),
          ...course
        });
      } catch (error) {
        console.warn(`Failed to load course: ${filename}`, error);
      }
    }
    
    this.coursesSubject.next(courses);
  }

  searchCourses(term: string) {
    this.searchTermSubject.next(term);
  }

  getCourse(filename: string): Observable<Course> {
    return this.http.get<Course>(`/courses/${filename}.json`);
  }
}
