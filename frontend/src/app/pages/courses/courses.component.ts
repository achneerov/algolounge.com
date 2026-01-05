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
  private destroy$ = new Subject<void>();

  constructor(
    private courseSearchService: CourseSearchService,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Load courses
    this.courseSearchService.isIndexLoaded().pipe(takeUntil(this.destroy$)).subscribe(loaded => {
      if (loaded) {
        this.allCourses = this.courseSearchService.getAllCourses();
        this.displayResults = this.allCourses;
      }
    });

    // Load favorites if authenticated
    if (this.authService.isAuthenticated()) {
      this.favoritesService.getFavorites().pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.updateFavoriteCourses();
        },
        error: () => {
          // Silently fail if not authenticated or error occurs
          this.updateFavoriteCourses();
        }
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(event: any) {
    const query = event.target.value;
    this.searchTerm = query;
    if (this.showingFavorites) {
      this.displayResults = this.favoriteCourses.filter(c =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.filename.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      this.displayResults = this.courseSearchService.searchCourses(query);
    }
  }

  onSelect(course: CourseSearchResult) {
    this.router.navigate(['/courses', course.filename]);
  }

  isFavorite(course: CourseSearchResult): boolean {
    return this.favoritesService.isFavorite(course.filename);
  }

  toggleFavorite(course: CourseSearchResult, event: Event) {
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/sign-in']);
      return;
    }

    if (this.isFavorite(course)) {
      this.favoritesService.removeFavorite(course.filename).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.updateFavoriteCourses();
        },
        error: (err) => {
          console.error('Error removing favorite:', err);
        }
      });
    } else {
      this.favoritesService.addFavorite(course.filename).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.updateFavoriteCourses();
        },
        error: (err) => {
          console.error('Error adding favorite:', err);
        }
      });
    }
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
    const favoriteFilenames = this.favoritesService.getFavoritesSync();
    this.favoriteCourses = this.allCourses.filter(course =>
      favoriteFilenames.includes(course.filename)
    );
  }

  getCourseDescription(course: CourseSearchResult): string {
    // Map course filenames to descriptions
    const descriptions: { [key: string]: string } = {
      'algotimefall2025': 'Weekly coding challenges reviewed in live sessions. Updated every week with new problems to sharpen your skills.',
      'helloworld2025': 'Competition problems from the SCS Hello World 2025 event. Perfect for beginners starting their coding journey.',
      'foundations': 'Master essential algorithms and data structures through curated problems. Progress from fundamentals to advanced topics with a proven learning path.'
    };

    return descriptions[course.filename] || 'Explore curated programming challenges and structured learning materials.';
  }

  getCourseMetadata(course: CourseSearchResult): string {
    // Map course filenames to metadata
    const metadata: { [key: string]: string } = {
      'algotimefall2025': 'Updated weekly',
      'helloworld2025': 'Competition • Beginner friendly',
      'foundations': 'Structured Learning Path • 17 categories'
    };

    return metadata[course.filename] || 'Interactive course';
  }

  getEmptyStateTitle(): string {
    if (this.showingFavorites && this.favoriteCourses.length === 0) {
      return 'No Favorites Yet';
    }
    if (this.showingFavorites && this.favoriteCourses.length > 0) {
      return 'No Matches Found';
    }
    return 'No Courses Found';
  }

  getEmptyStateMessage(): string {
    if (this.showingFavorites && this.favoriteCourses.length === 0) {
      return 'Add courses to your favorites by clicking the heart icon. Your favorited courses will appear here for quick access.';
    }
    if (this.showingFavorites && this.favoriteCourses.length > 0) {
      return 'No favorites match your search. Try a different search term.';
    }
    return 'No courses match your search. Try a different search term.';
  }
}
