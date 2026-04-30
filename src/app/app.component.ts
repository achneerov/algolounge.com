import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalHeaderComponent } from './components/general/global-header/global-header.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalHeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'algolounge';

  // Inject ThemeService to ensure it initializes early and applies saved theme preference
  private themeService = inject(ThemeService);
}
