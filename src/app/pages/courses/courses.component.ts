import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { CourseSearchService, CourseSearchResult } from '../../services/course-search.service';

@Component({
  selector: 'app-courses',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss'
})
export class CoursesComponent implements OnInit {
  searchTerm = '';
  displayResults: CourseSearchResult[] = [];

  constructor(private courseSearchService: CourseSearchService, private router: Router) {}

  ngOnInit() {
    this.courseSearchService.isIndexLoaded().subscribe(loaded => {
      if (loaded) {
        this.displayResults = this.courseSearchService.getAllCourses();
      }
    });
  }

  onSearchChange(event: any) {
    const query = event.target.value;
    this.searchTerm = query;
    this.displayResults = this.courseSearchService.searchCourses(query);
  }

  onSelect(course: CourseSearchResult) {
    this.router.navigate(['/courses', course.filename]);
  }
}
