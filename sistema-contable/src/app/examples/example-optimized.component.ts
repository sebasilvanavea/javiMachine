// Ejemplo de implementación en un componente para evitar el doble click

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { LoadingService } from '../services/loading.service';
import { UiStateService } from '../services/ui-state.service';
import { NotificationService } from '../services/notification.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-example-optimized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <!-- Loading indicator -->
      @if (isLoading$ | async) {
        <div class="loading-overlay">
          <div class="spinner">Cargando...</div>
        </div>
      }

      <!-- User list -->
      <div class="user-list">
        @for (user of users$ | async; track user.id) {
          <button 
            class="user-item"
            [disabled]="isButtonDisabled(user.id)"
            [class.loading]="isButtonLoading(user.id)"
            (click)="handleUserClick(user.id)">
            {{ user.name }} {{ user.lastName }}
            @if (isButtonLoading(user.id)) {
              <span class="loading-spinner">⏳</span>
            }
          </button>
        }
      </div>

      <!-- Actions -->
      <div class="actions">
        <button 
          id="refresh-btn"
          [disabled]="uiStateService.isElementDisabled('refresh-btn')"
          (click)="refreshUsers()">
          Actualizar Lista
        </button>
        
        <button 
          id="create-btn"
          [disabled]="uiStateService.isElementDisabled('create-btn')"
          (click)="createNewUser()">
          Crear Usuario
        </button>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .user-item {
      display: block;
      width: 100%;
      padding: 10px;
      margin: 5px 0;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .user-item:hover:not(:disabled) {
      background: #f5f5f5;
    }

    .user-item:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .user-item.loading {
      background: #e3f2fd;
    }

    .loading-spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .actions {
      margin-top: 20px;
    }

    .actions button {
      margin-right: 10px;
      padding: 10px 20px;
    }
  `]
})
export class ExampleOptimizedComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  users$: Observable<User[]>;
  isLoading$: Observable<boolean>;

  constructor(
    private userService: UserService,
    private loadingService: LoadingService,
    public uiStateService: UiStateService,
    private notificationService: NotificationService
  ) {
    this.users$ = this.userService.getUsers();
    this.isLoading$ = this.loadingService.isLoading('global');
  }

  ngOnInit(): void {
    // Cargar usuarios al inicializar
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.uiStateService.clearAllStates();
  }

  private loadUsers(): void {
    this.users$ = this.loadingService.withLoading(
      'users',
      this.userService.getUsers()
    ).pipe(
      takeUntil(this.destroy$)
    );
  }

  // Manejo optimizado de clicks en usuarios
  handleUserClick(userId: string): void {
    const elementId = `user-${userId}`;
    
    this.uiStateService.withImmediateFeedback(
      elementId,
      () => this.userService.getUserById(userId)
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user) => {
        if (user) {
          this.notificationService.showSuccess(
            'Usuario seleccionado',
            `Has seleccionado a ${user.name} ${user.lastName}`
          );
          console.log('Usuario seleccionado:', user);
        }
      },
      error: (error) => {
        this.notificationService.showError(
          'Error',
          'No se pudo cargar la información del usuario'
        );
        console.error('Error al cargar usuario:', error);
      }
    });
  }

  // Verificar si un botón específico está cargando
  isButtonLoading(userId: string): boolean {
    return this.uiStateService.isElementDisabled(`user-${userId}`);
  }

  // Verificar si un botón específico está deshabilitado
  isButtonDisabled(userId: string): boolean {
    return this.uiStateService.isElementDisabled(`user-${userId}`);
  }

  // Actualizar lista de usuarios
  refreshUsers(): void {
    this.uiStateService.withImmediateFeedback(
      'refresh-btn',
      () => {
        // Recargar usuarios sin cache
        return this.userService.getUsers();
      }
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (users) => {
        this.notificationService.showSuccess(
          'Lista actualizada',
          `Se han cargado ${users.length} usuarios`
        );
        this.loadUsers();
      },
      error: (error) => {
        this.notificationService.showError(
          'Error',
          'No se pudo actualizar la lista de usuarios'
        );
      }
    });
  }

  // Crear nuevo usuario
  createNewUser(): void {
    this.uiStateService.withImmediateFeedback(
      'create-btn',
      () => {
        // Simular creación de usuario
        const newUserData = {
          email: 'nuevo@email.com',
          name: 'Nuevo',
          lastName: 'Usuario',
          rut: '12345678-9',
          phone: '+56912345678',
          address: 'Dirección de prueba',
          city: 'Santiago',
          region: 'Metropolitana',
          profession: 'Profesión de prueba',
          isActive: true
        };
        
        return this.userService.createUser(newUserData);
      }
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (newUser) => {
        this.notificationService.showSuccess(
          'Usuario creado',
          `Se ha creado el usuario ${newUser.name} ${newUser.lastName}`
        );
        this.loadUsers(); // Recargar lista
      },
      error: (error) => {
        this.notificationService.showError(
          'Error',
          'No se pudo crear el usuario'
        );
      }
    });
  }
}

/*
INSTRUCCIONES DE USO:

1. Este ejemplo muestra cómo implementar correctamente los servicios optimizados
2. Usa UiStateService para prevenir doble clicks
3. Implementa loading states apropiados
4. Maneja errores y muestra notificaciones
5. Limpia recursos en ngOnDestroy

PATRONES IMPLEMENTADOS:

✅ Prevención de doble click
✅ Estados de carga visuales
✅ Cache inteligente
✅ Manejo de errores
✅ Feedback inmediato al usuario
✅ Limpieza de recursos
✅ Observables optimizados

Para usar en otros componentes:
1. Inyecta UiStateService y LoadingService
2. Usa withImmediateFeedback() para operaciones críticas
3. Implementa estados de loading visual
4. Limpia estados en ngOnDestroy
*/
