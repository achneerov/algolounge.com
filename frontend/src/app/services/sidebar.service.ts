import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private static readonly STORAGE_KEY = 'sidebar_visible';
  private sidebarVisible = new BehaviorSubject<boolean>(this.getInitialState());
  sidebarVisible$ = this.sidebarVisible.asObservable();

  private getInitialState(): boolean {
    const stored = localStorage.getItem(SidebarService.STORAGE_KEY);
    return stored !== null ? stored === 'true' : true; // Default to open
  }

  private saveState(visible: boolean): void {
    localStorage.setItem(SidebarService.STORAGE_KEY, String(visible));
  }

  toggle() {
    const newValue = !this.sidebarVisible.value;
    this.sidebarVisible.next(newValue);
    this.saveState(newValue);
  }

  open() {
    this.setVisible(true);
  }

  close() {
    this.setVisible(false);
  }

  setVisible(visible: boolean) {
    this.sidebarVisible.next(visible);
    this.saveState(visible);
  }
}
