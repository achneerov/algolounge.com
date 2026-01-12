import { Component, computed, inject, HostListener, ElementRef } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';
import { AuthService } from '../../../services/auth.service';
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
  private authService = inject(AuthService);
  private sidebarService = inject(SidebarService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  // Get current theme
  isDarkMode = computed(() => this.themeService.activeTheme() === 'dark');

  isAuthenticated$ = this.authService.isAuthenticated$;
  currentUser$ = this.authService.currentUser$;
  showUserMenu = false;
  isAdmin = computed(() => {
    const user = this.authService.getCurrentUser();
    return user && (user as any).roleId === 1;
  });

  // Sidebar state
  sidebarVisible$ = this.sidebarService.sidebarVisible$;
  
  // Check if we're on the questions page
  isQuestionsPage$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(() => this.router.url.startsWith('/questions/')),
    startWith(this.router.url.startsWith('/questions/'))
  );

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  logout(): void {
    this.authService.logout();
    this.showUserMenu = false;
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showUserMenu = false;
    }
  }
}
