import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CourseSearchService, CourseSearchResult } from '../../services/course-search.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-courses',
  imports: [CommonModule, FormsModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss'
})
export class CoursesComponent implements OnInit, OnDestroy {
  searchTerm = '';
  displayResults: CourseSearchResult[] = [];
  allCourses: CourseSearchResult[] = [];
  favoriteCourses: CourseSearchResult[] = [];
  showingFavorites = false;
  isAuthenticated = false;
  isFavoritesLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private courseSearchService: CourseSearchService,
    private router: Router,
    private favoritesService: FavoritesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check authentication status and load favorites if authenticated
    this.authService.isAuthenticated$.pipe(takeUntil(this.destroy$)).subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        // Load favorites from backend when authenticated
        this.isFavoritesLoading = true;
        this.favoritesService.getFavorites().pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.isFavoritesLoading = false;
            this.updateFavoriteCourses();
          },
          error: () => {
            this.isFavoritesLoading = false;
          }
        });
      } else {
        this.isFavoritesLoading = false;
        this.updateFavoriteCourses();
      }
    });

    // Load courses
    this.courseSearchService.isIndexLoaded().pipe(takeUntil(this.destroy$)).subscribe(loaded => {
      if (loaded) {
        this.allCourses = this.courseSearchService.getAllCourses();
        this.displayResults = this.allCourses;
        this.updateFavoriteCourses();
      }
    });

    // Subscribe to favorites changes if authenticated
    this.favoritesService.favorites$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateFavoriteCourses();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  toggleFavorite(course: CourseSearchResult, event: Event) {
    event.stopPropagation();

    if (this.isAuthenticated && !this.isFavoritesLoading) {
      if (this.favoritesService.isFavorited(course.filename)) {
        this.favoritesService.removeFavorite(course.filename).pipe(takeUntil(this.destroy$)).subscribe({
          error: (err) => console.error('Failed to remove favorite:', err)
        });
      } else {
        this.favoritesService.addFavorite(course.filename).pipe(takeUntil(this.destroy$)).subscribe({
          error: (err) => console.error('Failed to add favorite:', err)
        });
      }
    }
  }

  isFavorite(course: CourseSearchResult): boolean {
    if (this.isAuthenticated) {
      return this.favoritesService.isFavorited(course.filename);
    }
    return false;
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
    if (this.isAuthenticated) {
      const favoriteFilenames = this.favoritesService.getFavoritesSync();
      this.favoriteCourses = this.allCourses.filter(course =>
        favoriteFilenames.includes(course.filename)
      );
    } else {
      this.favoriteCourses = [];
    }
  }
}
