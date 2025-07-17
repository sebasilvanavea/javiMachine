import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor que agrega automáticamente el token de autenticación a las peticiones HTTP
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // URLs que no requieren autenticación
  const publicUrls = [
    '/login',
    '/register',
    '/forgot-password',
    '/assets/',
    'googleapis.com',
    'gstatic.com'
  ];

  // Verificar si la URL requiere autenticación
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  
  if (isPublicUrl) {
    return next(req);
  }

  // Obtener token y agregarlo a la petición
  return from(authService.getAuthToken()).pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      } else {
        return next(req);
      }
    }),
    catchError(error => {
      console.error('Error en auth interceptor:', error);
      return next(req);
    })
  );
};
