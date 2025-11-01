import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class FavoritesService {
  private favoritesKey = "favorites_courses";
  private favoritesSubject = new BehaviorSubject<string[]>(this.loadLocal());
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get favorites from backend
  getFavorites(): Observable<{ favorites: string[] }> {
    return this.http.get<{ favorites: string[] }>("/api/favorites").pipe(
      tap((response) => {
        this.setLocal(response.favorites);
      })
    );
  }

  // Add favorite to backend
  addFavorite(courseFilename: string): Observable<any> {
    return this.http
      .post("/api/favorites", { courseFilename })
      .pipe(
        tap(() => this.addLocal(courseFilename))
      );
  }

  // Remove favorite from backend
  removeFavorite(courseFilename: string): Observable<any> {
    return this.http
      .delete("/api/favorites", {
        body: { courseFilename },
      })
      .pipe(
        tap(() => this.removeLocal(courseFilename))
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

  // Local storage helpers
  private loadLocal(): string[] {
    const stored = localStorage.getItem(this.favoritesKey);
    return stored ? JSON.parse(stored) : [];
  }

  private setLocal(favorites: string[]): void {
    localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
    this.favoritesSubject.next(favorites);
  }

  private addLocal(courseFilename: string): void {
    const current = this.favoritesSubject.value;
    if (!current.includes(courseFilename)) {
      const updated = [...current, courseFilename];
      this.setLocal(updated);
    }
  }

  private removeLocal(courseFilename: string): void {
    const current = this.favoritesSubject.value;
    const updated = current.filter((f) => f !== courseFilename);
    this.setLocal(updated);
  }
}
