import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Guard que previene el acceso a rutas cuando el usuario está autenticado
 * Útil para páginas como login que no deben ser accesibles cuando ya hay sesión activa
 */
export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user) {
        // Usuario autenticado, redirigir al dashboard
        router.navigate(['/dashboard']);
        return false;
      } else {
        // Usuario no autenticado, permitir acceso
        return true;
      }
    })
  );
};
