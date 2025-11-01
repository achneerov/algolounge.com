import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Add backend URL for /api routes in development
  if (req.url.startsWith('/api/') && environment.apiUrl) {
    const apiUrl = `${environment.apiUrl}${req.url}`;
    req = req.clone({ url: apiUrl });
  }

  // Add auth token if available
  const token = authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
