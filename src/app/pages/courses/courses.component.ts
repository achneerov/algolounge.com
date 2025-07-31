import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Router } from '@angular/router';
import { CourseSearchService, CourseSearchResult } from '../../services/course-search.service';

@Component({
  selector: 'app-courses',
  imports: [CommonModule, FormsModule, HttpClientModule, AutoCompleteModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss'
})
export class CoursesComponent implements OnInit {
  selectedCourse: any = null;
  searchResults: CourseSearchResult[] = [];
  displayResults: CourseSearchResult[] = [];
  lastQuery = '';

  constructor(private courseSearchService: CourseSearchService, private router: Router) {}

  ngOnInit() {
    this.courseSearchService.isIndexLoaded().subscribe(loaded => {
      if (loaded) {
        this.displayResults = this.courseSearchService.getAllCourses();
        this.searchResults = this.displayResults;
      }
    });
  }

  onSearch(event: any) {
    const query = event.query || '';
    this.searchResults = this.courseSearchService.searchCourses(query);
    this.displayResults = this.searchResults;
    this.lastQuery = query;
  }

  onSelect(course: CourseSearchResult) {
    this.router.navigate(['/courses', course.filename]);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.searchResults.length > 0) {
        this.onSelect(this.searchResults[0]);
      }
    }
  }
}
