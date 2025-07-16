import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseErrorService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  constructor() {
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    // Manejar errores de autenticación
    authState(this.auth).subscribe({
      error: (error) => {
        console.error('Firebase Auth Error:', error);
        this.handleAuthError(error);
      }
    });

    // Si estamos en desarrollo, configurar emuladores si están disponibles
    if (!environment.production) {
      this.setupDevelopmentMode();
    }
  }

  private handleAuthError(error: any): void {
    switch (error.code) {
      case 'auth/api-key-not-valid':
        console.error('❌ API Key de Firebase no válida. Verifica environment.ts');
        break;
      case 'auth/network-request-failed':
        console.error('❌ Error de red. Verifica tu conexión a internet');
        break;
      case 'auth/too-many-requests':
        console.error('❌ Demasiadas peticiones. Espera un momento antes de volver a intentar');
        break;
      default:
        console.error('❌ Error de Firebase Auth:', error.message);
    }
  }

  handleFirestoreError(error: any): void {
    switch (error.code) {
      case 'permission-denied':
        console.error('❌ Permisos denegados en Firestore. Revisa las reglas de seguridad');
        console.info('📝 Ve a Firebase Console > Firestore > Rules para configurar permisos');
        break;
      case 'unauthenticated':
        console.error('❌ Usuario no autenticado. Inicia sesión primero');
        break;
      case 'unavailable':
        console.error('❌ Firestore no disponible. Problema de conexión');
        break;
      case 'failed-precondition':
        console.error('❌ Condición previa fallida en Firestore');
        break;
      default:
        console.error('❌ Error de Firestore:', error.message);
    }
  }

  private setupDevelopmentMode(): void {
    console.log('🔧 Modo desarrollo activado');
    
    // Configurar logging detallado en desarrollo
    if (typeof window !== 'undefined') {
      (window as any).firebase_debug = true;
    }

    // Mostrar información de configuración
    console.log('🔥 Firebase Config:', {
      projectId: this.firestore.app.options.projectId,
      authDomain: this.firestore.app.options.authDomain,
      apiKey: this.firestore.app.options.apiKey?.substring(0, 10) + '...'
    });
  }

  // Método para verificar el estado de la conexión
  checkFirebaseConnection(): void {
    console.log('🔍 Verificando conexión Firebase...');
    
    // Verificar Auth
    if (this.auth.currentUser) {
      console.log('✅ Usuario autenticado:', this.auth.currentUser.email);
    } else {
      console.log('⚠️ No hay usuario autenticado');
    }

    // Verificar Firestore
    try {
      console.log('✅ Firestore configurado:', this.firestore.app.name);
    } catch (error) {
      console.error('❌ Error de configuración Firestore:', error);
    }
  }

  // Método para mostrar guía de solución
  showTroubleshootingGuide(): void {
    console.group('🔧 Guía de Solución de Problemas Firebase');
    console.log('1. ✅ Verifica que las reglas de Firestore permitan acceso');
    console.log('2. ✅ Confirma que la autenticación Google está habilitada');
    console.log('3. ✅ Revisa que los dominios estén autorizados');
    console.log('4. ✅ Verifica la configuración en environment.ts');
    console.log('5. ✅ Consulta FIRESTORE-RULES-SETUP.md para más detalles');
    console.groupEnd();
  }
}
