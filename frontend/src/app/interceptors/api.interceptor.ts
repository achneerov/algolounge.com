import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // In development, add the backend URL for /api routes
    // In production, /api routes stay relative (same server serves both frontend and backend)
    if (request.url.startsWith('/api/') && !this.isProduction()) {
      const apiUrl = `http://localhost:3000${request.url}`;
      request = request.clone({ url: apiUrl });
    }

    // Add auth token if available
    const token = this.authService.getToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }

  private isProduction(): boolean {
    return !window.location.hostname.includes('localhost');
  }
}
