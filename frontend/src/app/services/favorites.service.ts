import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class FavoritesService {
  private favoritesSubject = new BehaviorSubject<string[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get favorites from backend
  getFavorites(): Observable<{ favorites: string[] }> {
    return this.http.get<{ favorites: string[] }>("/api/favorites").pipe(
      tap((response) => {
        this.favoritesSubject.next(response.favorites);
      })
    );
  }

  // Add favorite to backend
  addFavorite(courseFilename: string): Observable<any> {
    return this.http
      .post("/api/favorites", { courseFilename })
      .pipe(
        tap(() => this.updateLocal(courseFilename, 'add'))
      );
  }

  // Remove favorite from backend
  removeFavorite(courseFilename: string): Observable<any> {
    return this.http
      .delete("/api/favorites", {
        body: { courseFilename },
      })
      .pipe(
        tap(() => this.updateLocal(courseFilename, 'remove'))
      );
  }

  // Check if course is favorited
  isFavorited(courseFilename: string): boolean {
    return this.favoritesSubject.value.includes(courseFilename);
  }

  // Get all favorites
  getFavoritesSync(): string[] {
    return this.favoritesSubject.value;
  }

  // Update in-memory state after API call
  private updateLocal(courseFilename: string, action: 'add' | 'remove'): void {
    const current = this.favoritesSubject.value;
    let updated: string[];

    if (action === 'add') {
      if (!current.includes(courseFilename)) {
        updated = [...current, courseFilename];
      } else {
        updated = current;
      }
    } else {
      updated = current.filter((f) => f !== courseFilename);
    }

    this.favoritesSubject.next(updated);
  }
}
