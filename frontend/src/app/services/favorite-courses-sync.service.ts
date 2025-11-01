import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { LocalStorageService } from './local-storage.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoriteCoursesSyncService {
  private readonly API_URL = '/api/favorites';
  favoriteCourses = signal<string[]>([]);
  private isSyncing = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private localStorageService: LocalStorageService
  ) {
    // Initialize from local storage
    this.favoriteCourses.set(localStorageService.getFavoriteCourses());

    // Whenever user logs in, fetch favorites from backend
    effect(async () => {
      if (this.authService.isAuthenticated() && !this.isSyncing) {
        await this.syncFromBackend();
      }
    });
  }

  /**
   * Fetch favorites from backend and update local storage
   */
  async syncFromBackend(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.isSyncing = true;
    try {
      const response = await firstValueFrom(
        this.http.get<{ favorites: string[] }>(this.API_URL)
      );
      this.favoriteCourses.set(response.favorites);
      // Update local storage with backend data
      response.favorites.forEach((course) => {
        this.localStorageService.addFavoriteCourse(course);
      });
    } catch (error) {
      console.error('Failed to sync favorites from backend:', error);
      // Fallback to local storage
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Add a course to favorites (syncs with backend if authenticated)
   */
  async addFavorite(courseFilename: string): Promise<void> {
    // Update local storage immediately
    this.localStorageService.addFavoriteCourse(courseFilename);
    this.favoriteCourses.set(this.localStorageService.getFavoriteCourses());

    // Sync with backend if authenticated
    if (this.authService.isAuthenticated()) {
      try {
        await firstValueFrom(
          this.http.post<{ success: boolean }>(this.API_URL, {
            courseFilename
          })
        );
      } catch (error) {
        console.error('Failed to add favorite to backend:', error);
      }
    }
  }

  /**
   * Remove a course from favorites (syncs with backend if authenticated)
   */
  async removeFavorite(courseFilename: string): Promise<void> {
    // Update local storage immediately
    this.localStorageService.removeFavoriteCourse(courseFilename);
    this.favoriteCourses.set(this.localStorageService.getFavoriteCourses());

    // Sync with backend if authenticated
    if (this.authService.isAuthenticated()) {
      try {
        await firstValueFrom(
          this.http.delete<{ success: boolean }>(this.API_URL, {
            body: { courseFilename }
          })
        );
      } catch (error) {
        console.error('Failed to remove favorite from backend:', error);
      }
    }
  }

  /**
   * Toggle favorite status (returns true if now favorited, false if unfavorited)
   */
  async toggleFavorite(courseFilename: string): Promise<boolean> {
    if (this.isFavorite(courseFilename)) {
      await this.removeFavorite(courseFilename);
      return false;
    } else {
      await this.addFavorite(courseFilename);
      return true;
    }
  }

  /**
   * Check if a course is in favorites
   */
  isFavorite(courseFilename: string): boolean {
    return this.favoriteCourses().includes(courseFilename);
  }

  /**
   * Get all favorite courses
   */
  getFavoriteCourses(): string[] {
    return this.favoriteCourses();
  }
}
