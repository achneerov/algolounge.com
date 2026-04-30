import { Component, computed, inject } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';
import { SidebarService } from '../../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-global-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './global-header.component.html',
  styleUrl: './global-header.component.scss'
})
export class GlobalHeaderComponent {
  private themeService = inject(ThemeService);
  private sidebarService = inject(SidebarService);
  private router = inject(Router);

  isDarkMode = computed(() => this.themeService.activeTheme() === 'dark');

  sidebarVisible$ = this.sidebarService.sidebarVisible$;

  isQuestionsPage$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(() => this.router.url.startsWith('/questions/')),
    startWith(this.router.url.startsWith('/questions/'))
  );

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }
}
