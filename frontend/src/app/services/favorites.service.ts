import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface FavoritesResponse {
  favorites: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favoritesSubject = new BehaviorSubject<string[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all favorite courses for the current user
   */
  getFavorites(): Observable<string[]> {
    return this.http
      .get<FavoritesResponse>(`${environment.apiUrl}/api/favorites`)
      .pipe(
        tap((response) => {
          this.favoritesSubject.next(response.favorites);
        }),
        map((response) => response.favorites)
      );
  }

  /**
   * Get current favorites synchronously
   */
  getFavoritesSync(): string[] {
    return this.favoritesSubject.value;
  }

  /**
   * Check if a course is favorited
   */
  isFavorite(courseFilename: string): boolean {
    return this.favoritesSubject.value.includes(courseFilename);
  }

  /**
   * Add a course to favorites
   */
  addFavorite(courseFilename: string): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/api/favorites`, { courseFilename })
      .pipe(
        tap(() => {
          const current = this.favoritesSubject.value;
          if (!current.includes(courseFilename)) {
            this.favoritesSubject.next([...current, courseFilename]);
          }
        })
      );
  }

  /**
   * Remove a course from favorites
   */
  removeFavorite(courseFilename: string): Observable<any> {
    return this.http
      .delete(`${environment.apiUrl}/api/favorites`, {
        body: { courseFilename }
      })
      .pipe(
        tap(() => {
          const current = this.favoritesSubject.value;
          this.favoritesSubject.next(
            current.filter((fav) => fav !== courseFilename)
          );
        })
      );
  }
}
