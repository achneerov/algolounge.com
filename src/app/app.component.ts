import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { GlobalHeaderComponent } from './components/general/global-header/global-header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalHeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'algolounge';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupDarkMode();
    }
  }

  private setupDarkMode(): void {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateDarkMode = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    };

    // Set initial state
    updateDarkMode(darkModeQuery);
    
    // Listen for changes
    darkModeQuery.addEventListener('change', updateDarkMode);
  }
}
