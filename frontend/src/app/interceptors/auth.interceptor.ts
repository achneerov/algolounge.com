import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { environment } from "../../environments/environment";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Add API URL only to API requests (requests starting with /api)
  if (!req.url.startsWith("http") && req.url.startsWith("/api")) {
    req = req.clone({
      url: environment.apiUrl + req.url,
    });
  }

  // Add JWT token to requests
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
