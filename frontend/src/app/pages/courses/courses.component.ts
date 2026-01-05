import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CourseSearchService, CourseSearchResult } from '../../services/course-search.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface CourseStats {
  questionCount: number;
  categoryCount: number;
}

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
  courseStats: Map<string, CourseStats> = new Map();
  private destroy$ = new Subject<void>();

  constructor(
    private courseSearchService: CourseSearchService,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Load courses
    this.courseSearchService.isIndexLoaded().pipe(takeUntil(this.destroy$)).subscribe(loaded => {
      if (loaded) {
        this.allCourses = this.courseSearchService.getAllCourses();
        this.displayResults = this.getSortedCourses(this.allCourses);
        
        // Load stats for each course
        this.allCourses.forEach(course => {
          this.loadCourseStats(course.filename);
        });
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

  clearSearch() {
    this.searchTerm = '';
    if (this.showingFavorites) {
      this.displayResults = this.favoriteCourses;
    } else {
      this.displayResults = this.getSortedCourses(this.allCourses);
    }
  }

  getSearchResultText(): string {
    if (this.showingFavorites) {
      if (this.searchTerm) {
        return `Showing ${this.displayResults.length} of ${this.favoriteCourses.length} favorites`;
      }
      return `${this.favoriteCourses.length} ${this.favoriteCourses.length === 1 ? 'favorite' : 'favorites'}`;
    } else {
      if (this.searchTerm) {
        return `Showing ${this.displayResults.length} of ${this.allCourses.length} courses`;
      }
      return `${this.allCourses.length} ${this.allCourses.length === 1 ? 'course' : 'courses'}`;
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
          if (!this.showingFavorites) {
            this.displayResults = this.getSortedCourses(this.allCourses);
          }
        },
        error: (err) => {
          console.error('Error removing favorite:', err);
        }
      });
    } else {
      this.favoritesService.addFavorite(course.filename).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.updateFavoriteCourses();
          if (!this.showingFavorites) {
            this.displayResults = this.getSortedCourses(this.allCourses);
          }
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
    this.displayResults = this.getSortedCourses(this.allCourses);
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
    if (this.searchTerm) {
      return `No results for "${this.searchTerm}"`;
    }
    return 'No Courses Found';
  }

  getEmptyStateMessage(): string {
    if (this.showingFavorites && this.favoriteCourses.length === 0) {
      return 'Start building your personalized learning path by adding courses to your favorites. Click the heart icon on any course to get started.';
    }
    if (this.showingFavorites && this.favoriteCourses.length > 0) {
      return 'No favorites match your search. Try a different search term or clear the search to see all your favorites.';
    }
    if (this.searchTerm) {
      return 'Try adjusting your search term or browse all available courses.';
    }
    return 'No courses match your search. Try a different search term.';
  }

  private getSortedCourses(courses: CourseSearchResult[]): CourseSearchResult[] {
    const favoriteFilenames = this.favoritesService.getFavoritesSync();
    
    // Separate into favorited and non-favorited
    const favorited = courses.filter(c => favoriteFilenames.includes(c.filename));
    const nonFavorited = courses.filter(c => !favoriteFilenames.includes(c.filename));
    
    // Sort each group alphabetically by title
    favorited.sort((a, b) => a.title.localeCompare(b.title));
    nonFavorited.sort((a, b) => a.title.localeCompare(b.title));
    
    // Return favorited first, then non-favorited
    return [...favorited, ...nonFavorited];
  }

  private loadCourseStats(filename: string) {
    this.http.get<any>(`/courses/${filename}.json`).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        if (data.units) {
          const units = Object.values(data.units);
          const categoryCount = units.length;
          const questionCount = units.reduce((total: number, unit: any) => {
            return total + (unit.questions?.length || 0);
          }, 0);

          this.courseStats.set(filename, { questionCount, categoryCount });
        }
      },
      error: (err) => {
        console.error(`Error loading stats for ${filename}:`, err);
      }
    });
  }

  getCourseType(course: CourseSearchResult): string {
    const typeMap: { [key: string]: string } = {
      'algotimefall2025': 'weekly',
      'helloworld2025': 'competition',
      'foundations': 'structured'
    };
    return typeMap[course.filename] || 'structured';
  }

  getCourseStats(course: CourseSearchResult): string {
    const stats = this.courseStats.get(course.filename);
    if (!stats) return '';

    const { questionCount, categoryCount } = stats;
    const unitLabel = this.getCourseType(course) === 'weekly' ? 'weeks' : 'categories';
    
    return `${questionCount} questions • ${categoryCount} ${unitLabel}`;
  }

  getBadgeText(course: CourseSearchResult): string {
    const badgeMap: { [key: string]: string } = {
      'algotimefall2025': 'Weekly Challenges',
      'helloworld2025': 'Competition',
      'foundations': 'Structured Learning'
    };
    return badgeMap[course.filename] || 'Interactive Course';
  }
}
