import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseErrorService } from '../../services/firebase-error.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-firebase-diagnostic',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diagnostic-panel">
      <h3>🔧 Diagnóstico Firebase</h3>
      
      <div class="status-section">
        <h4>Estado de Servicios</h4>
        <div class="status-item" [class.success]="authStatus" [class.error]="!authStatus">
          <span>Firebase Auth:</span>
          <span>{{ authStatus ? '✅ Conectado' : '❌ Desconectado' }}</span>
        </div>
        
        <div class="status-item" [class.success]="firestoreStatus" [class.error]="!firestoreStatus">
          <span>Firestore:</span>
          <span>{{ firestoreStatus ? '✅ Conectado' : '❌ Desconectado' }}</span>
        </div>
        
        <div class="status-item" [class.success]="userServiceStatus" [class.error]="!userServiceStatus">
          <span>UserService:</span>
          <span>{{ userServiceStatus ? '✅ Funcionando' : '❌ Con errores' }}</span>
        </div>
      </div>

      <div class="config-section">
        <h4>Configuración</h4>
        <div class="config-item">
          <span>Project ID:</span>
          <code>{{ projectId }}</code>
        </div>
        <div class="config-item">
          <span>Auth Domain:</span>
          <code>{{ authDomain }}</code>
        </div>
        <div class="config-item">
          <span>API Key:</span>
          <code>{{ apiKeyMasked }}</code>
        </div>
      </div>

      <div class="actions-section">
        <h4>Acciones</h4>
        <button class="btn btn-primary" (click)="runDiagnostic()">
          🔍 Ejecutar Diagnóstico
        </button>
        <button class="btn btn-secondary" (click)="showTroubleshooting()">
          📖 Ver Guía de Solución
        </button>
        <button class="btn btn-info" (click)="testFirestore()">
          🧪 Probar Firestore
        </button>
        <button class="btn btn-success" (click)="testCompleteFlow()">
          🚀 Prueba Completa CRUD
        </button>
      </div>

      <div class="console-section" *ngIf="diagnosticResults.length > 0">
        <h4>Resultados del Diagnóstico</h4>
        <div class="console-output">
          <div *ngFor="let result of diagnosticResults" 
               [class]="'console-line ' + result.type">
            {{ result.message }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .diagnostic-panel {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      font-family: monospace;
    }

    .status-section, .config-section, .actions-section, .console-section {
      margin-bottom: 20px;
    }

    .status-item, .config-item {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      margin: 4px 0;
      border-radius: 4px;
      background: white;
    }

    .status-item.success {
      background: #d4edda;
      border-left: 4px solid #28a745;
    }

    .status-item.error {
      background: #f8d7da;
      border-left: 4px solid #dc3545;
    }

    .config-item code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .actions-section {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-primary { background: #007bff; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    .btn-info { background: #17a2b8; color: white; }

    .btn-success { background: #28a745; color: white; }

    .console-output {
      background: #000;
      color: #00ff00;
      padding: 10px;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
    }

    .console-line {
      margin: 2px 0;
    }

    .console-line.error { color: #ff6b6b; }
    .console-line.success { color: #51cf66; }
    .console-line.warning { color: #ffd43b; }
    .console-line.info { color: #74c0fc; }

    h3, h4 {
      margin-top: 0;
    }
  `]
})
export class FirebaseDiagnosticComponent implements OnInit {
  private firebaseErrorService = inject(FirebaseErrorService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  authStatus = false;
  firestoreStatus = false;
  userServiceStatus = false;
  
  projectId = '';
  authDomain = '';
  apiKeyMasked = '';

  diagnosticResults: Array<{type: string, message: string}> = [];

  ngOnInit() {
    this.checkInitialStatus();
    this.loadConfiguration();
  }

  private checkInitialStatus(): void {
    // Verificar Auth
    try {
      this.authStatus = !!this.auth;
    } catch (error) {
      this.authStatus = false;
    }

    // Verificar Firestore
    try {
      this.firestoreStatus = !!this.firestore;
    } catch (error) {
      this.firestoreStatus = false;
    }

    // Verificar UserService
    this.userService.users$.subscribe({
      next: () => this.userServiceStatus = true,
      error: () => this.userServiceStatus = false
    });
  }

  private loadConfiguration(): void {
    try {
      const app = this.firestore.app;
      this.projectId = app.options.projectId || 'No configurado';
      this.authDomain = app.options.authDomain || 'No configurado';
      this.apiKeyMasked = app.options.apiKey ? 
        app.options.apiKey.substring(0, 10) + '...' : 
        'No configurado';
    } catch (error) {
      this.addResult('error', 'Error cargando configuración Firebase');
    }
  }

  runDiagnostic(): void {
    this.diagnosticResults = [];
    this.addResult('info', '🔍 Iniciando diagnóstico completo de Firebase...');

    // 1. Verificar conexión básica
    this.firebaseErrorService.checkFirebaseConnection();

    // 2. Verificar servicios
    this.checkServices();

    // 3. Verificar configuración
    this.checkConfiguration();

    // 4. Verificar permisos de Firestore
    this.checkFirestorePermissions();
  }

  private checkFirestorePermissions(): void {
    this.addResult('info', '🔒 Verificando permisos de Firestore...');
    
    // Intentar leer la colección de usuarios
    this.userService.users$.subscribe({
      next: (users) => {
        this.addResult('success', `✅ Lectura OK: ${users.length} usuarios encontrados`);
        
        if (users.length === 0) {
          this.addResult('warning', '⚠️ No hay usuarios en la base de datos');
          this.addResult('info', '💡 Esto es normal si es la primera vez');
        }
      },
      error: (error) => {
        this.addResult('error', `❌ Error de lectura: ${error.message}`);
        if (error.code === 'permission-denied') {
          this.addResult('error', '🚫 PROBLEMA: Reglas de Firestore muy restrictivas');
          this.addResult('info', '💡 Ve a Firebase Console > Firestore > Rules');
        }
      }
    });
  }

  private checkServices(): void {
    this.addResult('info', '📡 Verificando servicios...');

    if (this.authStatus) {
      this.addResult('success', '✅ Firebase Auth: OK');
    } else {
      this.addResult('error', '❌ Firebase Auth: Error de conexión');
    }

    if (this.firestoreStatus) {
      this.addResult('success', '✅ Firestore: OK');
    } else {
      this.addResult('error', '❌ Firestore: Error de conexión');
    }

    if (this.userServiceStatus) {
      this.addResult('success', '✅ UserService: OK');
    } else {
      this.addResult('warning', '⚠️ UserService: Problemas detectados');
    }
  }

  private checkConfiguration(): void {
    this.addResult('info', '⚙️ Verificando configuración...');

    if (this.projectId && this.projectId !== 'No configurado') {
      this.addResult('success', `✅ Project ID: ${this.projectId}`);
    } else {
      this.addResult('error', '❌ Project ID no configurado');
    }

    if (this.authDomain && this.authDomain !== 'No configurado') {
      this.addResult('success', `✅ Auth Domain: ${this.authDomain}`);
    } else {
      this.addResult('error', '❌ Auth Domain no configurado');
    }

    if (this.apiKeyMasked && this.apiKeyMasked !== 'No configurado') {
      this.addResult('success', `✅ API Key: ${this.apiKeyMasked}`);
    } else {
      this.addResult('error', '❌ API Key no configurado');
    }
  }

  showTroubleshooting(): void {
    this.firebaseErrorService.showTroubleshootingGuide();
    this.addResult('info', '📖 Guía de solución mostrada en consola');
  }

  testFirestore(): void {
    this.addResult('info', '🧪 Probando conexión a Firestore...');
    
    // Intentar crear un usuario de prueba
    const testUser = {
      name: 'Test',
      lastName: 'Firebase',
      email: 'test.firebase@ejemplo.com',
      rut: '11111111-1',
      phone: '+56912345678',
      address: 'Dirección de prueba',
      city: 'Santiago',
      region: 'Metropolitana',
      company: 'Test Company',
      profession: 'Tester',
      isActive: true
    };

    this.addResult('info', '📝 Intentando crear usuario de prueba...');
    
    this.userService.createUser(testUser).subscribe({
      next: (newUser) => {
        this.addResult('success', `✅ Usuario creado en Firestore con ID: ${newUser.id}`);
        this.addResult('success', `🎉 ¡Firebase está funcionando correctamente!`);
        this.addResult('info', `👀 Ve a Firebase Console para ver el usuario`);
      },
      error: (error) => {
        this.addResult('error', `❌ Error creando usuario: ${error.message}`);
        if (error.code === 'permission-denied') {
          this.addResult('warning', `⚠️ Error de permisos - Revisa las reglas de Firestore`);
        }
        this.firebaseErrorService.handleFirestoreError(error);
      }
    });

    // También revisar usuarios existentes
    this.userService.users$.subscribe({
      next: (users) => {
        this.addResult('info', `📊 Usuarios actuales en memoria: ${users.length}`);
      },
      error: (error) => {
        this.addResult('error', `❌ Error leyendo usuarios: ${error.message}`);
      }
    });
  }

  private addResult(type: string, message: string): void {
    this.diagnosticResults.push({
      type,
      message: `[${new Date().toLocaleTimeString()}] ${message}`
    });
  }

  testCompleteFlow(): void {
    this.addResult('info', '🚀 Iniciando prueba completa de CRUD...');
    
    const testUser = {
      name: 'Test',
      lastName: 'CRUD',
      email: `test.crud.${Date.now()}@ejemplo.com`,
      rut: '11111111-1',
      phone: '+56912345678',
      address: 'Dirección de prueba CRUD',
      city: 'Santiago',
      region: 'Metropolitana',
      company: 'Test CRUD Company',
      profession: 'Tester CRUD',
      isActive: true
    };

    this.addResult('info', '📝 Paso 1: Crear usuario...');
    
    this.userService.createUser(testUser).subscribe({
      next: (newUser) => {
        this.addResult('success', `✅ Paso 1 OK: Usuario creado con ID ${newUser.id}`);
        this.addResult('info', '🔍 Paso 2: Verificar que aparece en la lista...');
        
        // Verificar que el usuario aparece en la lista
        setTimeout(() => {
          this.userService.users$.subscribe(users => {
            const foundUser = users.find(u => u.id === newUser.id);
            if (foundUser) {
              this.addResult('success', '✅ Paso 2 OK: Usuario aparece en la lista');
              this.addResult('success', '🎉 ¡CRUD FUNCIONANDO CORRECTAMENTE!');
              this.addResult('info', '👀 Ve a Firebase Console para confirmar');
            } else {
              this.addResult('error', '❌ Paso 2 FALLO: Usuario no aparece en la lista');
            }
          });
        }, 1000);
      },
      error: (error) => {
        this.addResult('error', `❌ Paso 1 FALLO: ${error.message}`);
        if (error.code === 'permission-denied') {
          this.addResult('error', '🚫 PROBLEMA: Reglas de Firestore bloqueando escritura');
          this.addResult('info', '💡 SOLUCIÓN: Configura las reglas en Firebase Console');
        }
      }
    });
  }
}
