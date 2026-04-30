import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly storageKey = 'favorite_courses';
  private favoritesSubject = new BehaviorSubject<string[]>(this.loadFromStorage());
  public favorites$ = this.favoritesSubject.asObservable();

  getFavorites(): Observable<string[]> {
    return of([...this.favoritesSubject.value]);
  }

  getFavoritesSync(): string[] {
    return [...this.favoritesSubject.value];
  }

  isFavorite(courseFilename: string): boolean {
    return this.favoritesSubject.value.includes(courseFilename);
  }

  addFavorite(courseFilename: string): Observable<void> {
    const current = this.favoritesSubject.value;
    if (current.includes(courseFilename)) {
      return of(void 0);
    }
    const next = [...current, courseFilename];
    this.persist(next);
    this.favoritesSubject.next(next);
    return of(void 0);
  }

  removeFavorite(courseFilename: string): Observable<void> {
    const next = this.favoritesSubject.value.filter((f) => f !== courseFilename);
    this.persist(next);
    this.favoritesSubject.next(next);
    return of(void 0);
  }

  private loadFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private persist(filenames: string[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(filenames));
  }
}
