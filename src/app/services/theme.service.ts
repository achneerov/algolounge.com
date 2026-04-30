import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Current theme preference (what user selected)
  private themePreference = signal<Theme>('system');

  // Actual active theme (resolved from system if preference is 'system')
  public activeTheme = signal<'light' | 'dark'>('light');

  private readonly THEME_STORAGE_KEY = 'algolounge-theme-preference';

  constructor() {
    // Load saved preference from localStorage
    this.loadThemePreference();

    // Listen for system theme changes
    this.watchSystemTheme();

    // Apply theme whenever it changes
    effect(() => {
      this.applyTheme(this.activeTheme());
    });
  }

  /**
   * Get current theme preference (what user selected)
   */
  getThemePreference(): Theme {
    return this.themePreference();
  }

  /**
   * Set theme preference and save to localStorage
   */
  setTheme(theme: Theme): void {
    this.themePreference.set(theme);
    localStorage.setItem(this.THEME_STORAGE_KEY, theme);
    this.updateActiveTheme();
  }

  /**
   * Toggle between light and dark (if currently on system, switch to opposite of current system theme)
   */
  toggleTheme(): void {
    const current = this.themePreference();

    if (current === 'system') {
      // If on system, toggle to opposite of current system theme
      const systemTheme = this.getSystemTheme();
      this.setTheme(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Toggle between light and dark
      this.setTheme(current === 'light' ? 'dark' : 'light');
    }
  }

  /**
   * Load theme preference from localStorage
   */
  private loadThemePreference(): void {
    const saved = localStorage.getItem(this.THEME_STORAGE_KEY) as Theme;

    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      this.themePreference.set(saved);
    } else {
      // Default to system preference
      this.themePreference.set('system');
    }

    this.updateActiveTheme();
  }

  /**
   * Watch for system theme changes
   */
  private watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', () => {
      if (this.themePreference() === 'system') {
        this.updateActiveTheme();
      }
    });
  }

  /**
   * Get system theme preference
   */
  private getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Update active theme based on preference
   */
  private updateActiveTheme(): void {
    const preference = this.themePreference();

    if (preference === 'system') {
      this.activeTheme.set(this.getSystemTheme());
    } else {
      this.activeTheme.set(preference);
    }
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    const htmlElement = document.documentElement;

    // Remove both classes
    htmlElement.classList.remove('light-mode', 'dark-mode');

    // Add the active class
    htmlElement.classList.add(`${theme}-mode`);
  }
}
