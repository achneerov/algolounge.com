import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CourseSearchService, CourseSearchResult } from '../../services/course-search.service';
import { FavoriteCoursesSyncService } from '../../services/favorite-courses-sync.service';

@Component({
  selector: 'app-courses',
  imports: [CommonModule, FormsModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss'
})
export class CoursesComponent implements OnInit {
  searchTerm = '';
  displayResults: CourseSearchResult[] = [];
  allCourses: CourseSearchResult[] = [];
  favoriteCourses: CourseSearchResult[] = [];
  showingFavorites = false;

  constructor(
    private courseSearchService: CourseSearchService,
    private router: Router,
    private favoriteCoursesSyncService: FavoriteCoursesSyncService
  ) {}

  ngOnInit() {
    this.courseSearchService.isIndexLoaded().subscribe(loaded => {
      if (loaded) {
        this.allCourses = this.courseSearchService.getAllCourses();
        this.displayResults = this.allCourses;
        this.updateFavoriteCourses();
      }
    });
  }

  onSearchChange(event: any) {
    const query = event.target.value;
    this.searchTerm = query;
    if (this.showingFavorites) {
      this.displayResults = this.favoriteCourses.filter(course =>
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.filename.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      this.displayResults = this.courseSearchService.searchCourses(query);
    }
  }

  onSelect(course: CourseSearchResult) {
    this.router.navigate(['/courses', course.filename]);
  }

  async toggleFavorite(course: CourseSearchResult, event: Event) {
    event.stopPropagation();
    await this.favoriteCoursesSyncService.toggleFavorite(course.filename);
    this.updateFavoriteCourses();
  }

  isFavorite(course: CourseSearchResult): boolean {
    return this.favoriteCoursesSyncService.isFavorite(course.filename);
  }

  showFavorites() {
    this.showingFavorites = true;
    this.searchTerm = '';
    this.displayResults = this.favoriteCourses;
  }

  showAllCourses() {
    this.showingFavorites = false;
    this.searchTerm = '';
    this.displayResults = this.allCourses;
  }

  private updateFavoriteCourses() {
    const favoriteFilenames = this.favoriteCoursesSyncService.getFavoriteCourses();
    this.favoriteCourses = this.allCourses.filter(course =>
      favoriteFilenames.includes(course.filename)
    );
  }
}
