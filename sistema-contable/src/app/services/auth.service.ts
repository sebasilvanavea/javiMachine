import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, from } from 'rxjs';
import { AuthUser, LoginRequest, LoginResponse } from '../models/auth.model';
import { SocialAuthService, GoogleLoginProvider, SocialUser } from '@abacritt/angularx-social-login';
import { delay, map, catchError } from 'rxjs/operators';
import { Auth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, user, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FirebaseErrorService } from './firebase-error.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  
  private auth = inject(Auth);
  private router = inject(Router);
  private socialAuthService = inject(SocialAuthService);
  private firebaseErrorService = inject(FirebaseErrorService);
  
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Escuchar cambios en Firebase Auth
    user(this.auth).subscribe((firebaseUser: User | null) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || '',
          role: 'admin',
          photoUrl: firebaseUser.photoURL || undefined,
          provider: 'google'
        };
        this.setCurrentUser(authUser);
      } else {
        this.setCurrentUser(null);
      }
    });

    // Escuchar cambios en la autenticación social
    this.socialAuthService.authState.subscribe((user: SocialUser) => {
      if (user) {
        this.handleSocialLogin(user);
      }
    });
  }

  private setCurrentUser(user: AuthUser | null): void {
    this.currentUserSubject.next(user);
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.TOKEN_KEY, user.token || 'firebase-token');
    } else {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  private getUserFromStorage(): AuthUser | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  get currentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.auth.currentUser || !!this.currentUserValue;
  }

  // Login con email y contraseña usando Firebase
  loginWithEmailAndPassword(credentials: LoginRequest): Observable<LoginResponse> {
    return from(signInWithEmailAndPassword(this.auth, credentials.email, credentials.password))
      .pipe(
        map(userCredential => {
          const user = userCredential.user;
          const authUser: AuthUser = {
            id: user.uid,
            email: user.email!,
            name: user.displayName || credentials.email,
            provider: 'email',
            role: 'admin'
          };
          return {
            user: authUser,
            token: 'firebase-token',
            refreshToken: 'firebase-refresh-token'
          };
        }),
        catchError(error => {
          console.error('Error en login:', error);
          return throwError(() => new Error('Error al iniciar sesión: ' + error.message));
        })
      );
  }

  // Login con Google usando Firebase
  loginWithGoogle(): Observable<AuthUser> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider))
      .pipe(
        map(result => {
          const user = result.user;
          const authUser: AuthUser = {
            id: user.uid,
            email: user.email!,
            name: user.displayName || '',
            photoUrl: user.photoURL || undefined,
            provider: 'google',
            role: 'admin'
          };
          this.setCurrentUser(authUser);
          return authUser;
        }),
        catchError(error => {
          console.error('Error en login con Google:', error);
          return throwError(() => new Error('Error al iniciar sesión con Google: ' + error.message));
        })
      );
  }

  // Método legacy para compatibilidad (simulación)
  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Para demo, usar datos de prueba
    if (credentials.email === 'admin@sistema-contable.com' && credentials.password === 'admin123') {
      return of({
        user: {
          id: 'demo-user',
          email: credentials.email,
          name: 'Usuario Demo',
          provider: 'email' as const,
          token: 'demo-token',
          role: 'admin' as const
        },
        token: 'demo-token',
        refreshToken: 'demo-refresh-token'
      }).pipe(
        delay(1000),
        map(response => {
          this.setCurrentUser(response.user);
          return response;
        })
      );
    }
    
    return throwError(() => new Error('Credenciales inválidas'));
  }

  private handleSocialLogin(socialUser: SocialUser): void {
    const authUser: AuthUser = {
      id: socialUser.id,
      email: socialUser.email,
      name: socialUser.name,
      photoUrl: socialUser.photoUrl,
      provider: 'google',
      token: socialUser.idToken,
      role: 'admin'
    };

    this.setCurrentUser(authUser);
  }

  logout(): Observable<boolean> {
    return from(signOut(this.auth)).pipe(
      map(() => {
        this.socialAuthService.signOut();
        this.setCurrentUser(null);
        this.router.navigate(['/login']);
        return true;
      }),
      catchError(error => {
        console.error('Error en logout:', error);
        this.setCurrentUser(null);
        this.router.navigate(['/login']);
        return of(true);
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    // Implementar refresh token si es necesario
    const currentUser = this.currentUserValue;
    if (currentUser) {
      return of({
        user: currentUser,
        token: 'new-token',
        refreshToken: 'new-refresh-token'
      });
    }
    return throwError(() => new Error('No hay usuario activo'));
  }
}