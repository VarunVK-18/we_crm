import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError((err) => {
      // 401 Unauthorized occurs when the user is not found in the DB (stale local session)
      if (err.status === 401) {
        console.warn('Unauthorized request detected. Clearing session and redirecting to login.', err);
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
