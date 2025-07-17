import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, from } from 'rxjs';
import { AuthUser, LoginRequest, LoginResponse } from '../models/auth.model';
import { SocialAuthService, GoogleLoginProvider, SocialUser } from '@abacritt/angularx-social-login';
import { delay, map, catchError, take, switchMap } from 'rxjs/operators';
import { Auth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, user, User, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  
  private auth = inject(Auth);
  private router = inject(Router);
  private socialAuthService = inject(SocialAuthService);
  private notificationService = inject(NotificationService);
  
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private authStateInitialized = false;

  constructor() {
    // Deferimos la inicialización para evitar problemas de contexto de inyección
    setTimeout(() => this.initializeAuthState(), 0);
  }

  /**
   * Inicializa el estado de autenticación y configura los listeners
   */
  private initializeAuthState(): void {
    // Escuchar cambios en Firebase Auth
    onAuthStateChanged(this.auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!,
          role: 'admin',
          photoUrl: firebaseUser.photoURL || undefined,
          provider: this.detectProvider(firebaseUser),
          token: 'firebase-token'
        };
        this.setCurrentUser(authUser);
        
        // Redireccionar al dashboard si estamos en login
        if (this.router.url === '/login' || this.router.url === '/') {
          this.router.navigate(['/dashboard']);
        }
      } else {
        // Solo limpiar usuario si ya estaba inicializado
        if (this.authStateInitialized) {
          this.setCurrentUser(null);
        }
      }
      this.authStateInitialized = true;
    });

    // Escuchar cambios en la autenticación social (backup) con manejo de errores
    try {
      this.socialAuthService.authState.subscribe({
        next: (user: SocialUser) => {
          if (user && !this.auth.currentUser) {
            this.handleSocialLogin(user);
          }
        },
        error: (error) => {
          console.warn('⚠️ Social Auth State Error (non-critical):', error);
        }
      });
    } catch (error) {
      console.warn('⚠️ Error inicializando Social Auth (non-critical):', error);
    }
  }

  /**
   * Detecta el proveedor de autenticación basado en la información del usuario
   */
  private detectProvider(user: User): 'google' | 'email' {
    if (user.providerData && user.providerData.length > 0) {
      const providerId = user.providerData[0].providerId;
      return providerId === 'google.com' ? 'google' : 'email';
    }
    return 'email';
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

  /**
   * Login con Google usando Firebase Auth con popup
   */
  loginWithGoogle(): Observable<AuthUser> {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    return from(signInWithPopup(this.auth, provider))
      .pipe(
        map(result => {
          const user = result.user;
          const authUser: AuthUser = {
            id: user.uid,
            email: user.email!,
            name: user.displayName || user.email!,
            photoUrl: user.photoURL || undefined,
            provider: 'google',
            role: 'admin',
            token: 'firebase-token'
          };
          
          this.notificationService.showSuccess('Inicio de sesión exitoso', `¡Bienvenido ${authUser.name}!`);
          return authUser;
        }),
        catchError(error => {
          console.error('Error en login con Google:', error);
          
          // Manejar errores específicos
          let errorMessage = 'Error al iniciar sesión con Google';
          
          if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Inicio de sesión cancelado por el usuario';
          } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup bloqueado por el navegador. Por favor, permite popups para este sitio';
          } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Error de conexión. Verifica tu conexión a internet';
          }
          
          this.notificationService.showError('Error de autenticación', errorMessage);
          return throwError(() => new Error(errorMessage));
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

  /**
   * Cierra la sesión del usuario
   */
  logout(): Observable<boolean> {
    return from(signOut(this.auth)).pipe(
      map(() => {
        // Cerrar sesión social también
        this.socialAuthService.signOut().catch(error => {
          console.warn('Error al cerrar sesión social:', error);
        });
        
        this.setCurrentUser(null);
        this.notificationService.showSuccess('Sesión cerrada', 'Has cerrado sesión correctamente');
        this.router.navigate(['/login']);
        return true;
      }),
      catchError(error => {
        console.error('Error en logout:', error);
        // Forzar limpieza local aunque falle Firebase
        this.setCurrentUser(null);
        this.router.navigate(['/login']);
        return of(true);
      })
    );
  }

  /**
   * Verifica si hay una sesión activa y válida
   */
  checkAuthState(): Observable<AuthUser | null> {
    return this.currentUser$.pipe(take(1));
  }

  /**
   * Obtiene el token del usuario actual
   */
  async getAuthToken(): Promise<string | null> {
    if (this.auth.currentUser) {
      return await this.auth.currentUser.getIdToken();
    }
    return null;
  }

  /**
   * Refresca el token del usuario actual
   */
  async refreshAuthToken(): Promise<string | null> {
    if (this.auth.currentUser) {
      return await this.auth.currentUser.getIdToken(true);
    }
    return null;
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