import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { UserService } from '../../../services/user.service';
import { OptimizedClickService } from '../../../services/optimized-click.service';
import { User, ServiceStatus, ServiceType } from '../../../models/user.model';

@Component({
  selector: 'app-user-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserList implements OnInit {
  private userService = inject(UserService);
  private optimizedClickService = inject(OptimizedClickService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  users: User[] = [];
  filteredUsers: User[] = [];
  isLoadingUsers$!: Observable<boolean>;
  
  searchControl = new FormControl('');
  displayedColumns: string[] = ['user', 'company', 'contact', 'services', 'status', 'actions'];

  ngOnInit(): void {
    // Inicializar observables de estado
    this.isLoadingUsers$ = this.optimizedClickService.isProcessing$('load-users');
    
    this.loadUsers();
    this.setupSearch();
  }

  // ===== CARGA DE DATOS =====
  private loadUsers(): void {
    // Usar servicio optimizado para cargar usuarios
    this.optimizedClickService.handleDataLoad(
      'load-users',
      () => this.userService.getUsers()
    ).subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.filterUsers(searchTerm || '');
      });
  }

  private filterUsers(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredUsers = this.users;
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.rut.toLowerCase().includes(term) ||
      (user.company && user.company.toLowerCase().includes(term)) ||
      user.profession.toLowerCase().includes(term) ||
      user.city.toLowerCase().includes(term) ||
      user.phone.includes(term)
    );
  }

  // ===== NAVEGACIÓN =====
  addNewUser(): void {
    this.router.navigate(['/users/new']);
  }

  viewUserDetail(userId: string): void {
    this.router.navigate(['/users', userId]);
  }

  editUser(userId: string): void {
    this.router.navigate(['/users', userId]);
  }

  // ===== CRUD OPERATIONS =====
  
  /**
   * Duplicar un usuario existente
   */
  duplicateUser(originalUser: User): void {
    const newUserData = {
      ...originalUser,
      name: `${originalUser.name} (Copia)`,
      email: `copia.${originalUser.email}`,
      rut: '', // El RUT debe ser único
      services: [] // No duplicar servicios
    };

    delete (newUserData as any).id;
    delete (newUserData as any).createdAt;
    delete (newUserData as any).updatedAt;

    this.userService.createUser(newUserData).subscribe({
      next: (newUser) => {
        this.loadUsers(); // Recargar lista
        this.snackBar.open(`Usuario ${newUser.name} duplicado exitosamente`, 'Cerrar', { 
          duration: 3000 
        });
      },
      error: (error) => {
        console.error('Error duplicando usuario:', error);
        this.snackBar.open('Error al duplicar usuario', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Cambiar estado activo/inactivo del usuario
   */
  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activar' : 'desactivar';

    if (!newStatus) {
      // Confirmar desactivación
      const confirm = window.confirm(
        `¿Estás seguro de que quieres ${action} a ${user.name} ${user.lastName}?`
      );
      if (!confirm) return;
    }

    this.userService.updateUser(user.id, { isActive: newStatus }).subscribe({
      next: (updatedUser) => {
        // Actualizar en la lista local
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
          this.filterUsers(this.searchControl.value || '');
        }
        
        this.snackBar.open(
          `Usuario ${updatedUser.name} ${newStatus ? 'activado' : 'desactivado'} exitosamente`, 
          'Cerrar', 
          { duration: 3000 }
        );
      },
      error: (error) => {
        console.error(`Error al ${action} usuario:`, error);
        this.snackBar.open(`Error al ${action} usuario`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Eliminar usuario con confirmación
   */
  deleteUser(user: User): void {
    const pendingServices = this.getPendingServices(user);
    
    let confirmMessage = `¿Estás seguro de que quieres eliminar a ${user.name} ${user.lastName}?`;
    
    if (pendingServices > 0) {
      confirmMessage += `\n\nATENCIÓN: Este usuario tiene ${pendingServices} servicio(s) pendiente(s) que también se eliminarán.`;
    }

    const confirmed = window.confirm(confirmMessage);
    
    if (!confirmed) return;

    // Usar servicio optimizado para eliminar usuario
    this.optimizedClickService.handleSubmit(
      `delete-user-${user.id}`,
      () => this.userService.deleteUser(user.id)
    ).subscribe({
      next: () => {
        // Remover de la lista local
        this.users = this.users.filter(u => u.id !== user.id);
        this.filterUsers(this.searchControl.value || '');
        
        this.snackBar.open(
          `Usuario ${user.name} ${user.lastName} eliminado exitosamente`, 
          'Cerrar', 
          { duration: 3000 }
        );
      },
      error: (error) => {
        console.error('Error eliminando usuario:', error);
        this.snackBar.open('Error al eliminar usuario', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Verificar si un usuario está siendo eliminado
  isDeletingUser(userId: string): Observable<boolean> {
    return this.optimizedClickService.isProcessing$(`delete-user-${userId}`);
  }

  /**
   * Agregar servicio a un usuario
   */
  addServiceToUser(user: User): void {
    this.router.navigate(['/users', user.id, 'services', 'new']);
  }

  // ===== MÉTODOS DE UTILIDAD =====

  getTotalServices(user?: User): number {
    if (user) {
      return user.services.length;
    }
    return this.users.reduce((total, user) => total + user.services.length, 0);
  }

  getPendingServices(user: User): number {
    return user.services.filter(service => 
      service.status === ServiceStatus.PENDING || 
      service.status === ServiceStatus.OVERDUE
    ).length;
  }

  getPendingServicesCount(): number {
    return this.users.reduce((total, user) => total + this.getPendingServices(user), 0);
  }

  getOverdueServices(user: User): number {
    const now = new Date();
    return user.services.filter(service => 
      service.status === ServiceStatus.PENDING && 
      new Date(service.dueDate) < now
    ).length;
  }

  getUserStatusChipColor(user: User): string {
    const pendingCount = this.getPendingServices(user);
    const overdueCount = this.getOverdueServices(user);
    
    if (overdueCount > 0) return 'warn';
    if (pendingCount > 0) return 'accent';
    return 'primary';
  }

  getUserStatusText(user: User): string {
    const pendingCount = this.getPendingServices(user);
    const overdueCount = this.getOverdueServices(user);
    
    if (overdueCount > 0) return `${overdueCount} Vencido${overdueCount > 1 ? 's' : ''}`;
    if (pendingCount > 0) return `${pendingCount} Pendiente${pendingCount > 1 ? 's' : ''}`;
    return 'Al día';
  }

  getServiceTypesSummary(user: User): string {
    if (user.services.length === 0) return 'Sin servicios';
    
    const types = user.services.map(s => s.type);
    const uniqueTypes = [...new Set(types)];
    
    if (uniqueTypes.length <= 2) {
      return uniqueTypes.join(', ');
    }
    
    return `${uniqueTypes.slice(0, 2).join(', ')} y ${uniqueTypes.length - 2} más`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getUserInitials(user: User): string {
    return user.name.charAt(0).toUpperCase() + user.lastName.charAt(0).toUpperCase();
  }

  // ===== MÉTODOS DE FILTRADO Y ORDENAMIENTO =====

  /**
   * Ordenar usuarios por diferentes criterios
   */
  sortUsers(criteria: 'name' | 'email' | 'services' | 'updated'): void {
    this.filteredUsers.sort((a, b) => {
      switch (criteria) {
        case 'name':
          return `${a.name} ${a.lastName}`.localeCompare(`${b.name} ${b.lastName}`);
        
        case 'email':
          return a.email.localeCompare(b.email);
        
        case 'services':
          return b.services.length - a.services.length;
        
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        
        default:
          return 0;
      }
    });
  }

  /**
   * Filtrar usuarios por estado
   */
  filterByStatus(status: 'all' | 'active' | 'inactive'): void {
    let filtered = this.users;
    
    switch (status) {
      case 'active':
        filtered = this.users.filter(user => user.isActive);
        break;
      case 'inactive':
        filtered = this.users.filter(user => !user.isActive);
        break;
      default:
        filtered = this.users;
    }
    
    this.filteredUsers = filtered;
    
    // Aplicar búsqueda si existe
    const searchTerm = this.searchControl.value;
    if (searchTerm) {
      this.filterUsers(searchTerm);
    }
  }

  /**
   * Filtrar usuarios con servicios pendientes
   */
  filterUsersWithPendingServices(): void {
    this.filteredUsers = this.users.filter(user => this.getPendingServices(user) > 0);
  }

  /**
   * Refrescar la lista de usuarios
   */
  refreshUsers(): void {
    this.optimizedClickService.clearProcessing('load-users');
    this.loadUsers();
    this.snackBar.open('Lista de usuarios actualizada', 'Cerrar', { duration: 2000 });
  }
}
