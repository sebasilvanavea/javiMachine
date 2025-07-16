import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { AccountingServiceService } from '../../../services/accounting-service.service';
import { UserService } from '../../../services/user.service';
import { 
  AccountingService, 
  ServiceStatus, 
  ServiceType, 
  ServicePriority,
  ServiceFilters,
  SERVICE_STATUS_CONFIG,
  SERVICE_TYPE_CONFIG 
} from '../../../models/service.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="service-list-container">
      <div class="header">
        <div class="title-section">
          <h1>
            <mat-icon>assignment</mat-icon>
            Servicios Contables
          </h1>
          <p>Gestión y seguimiento de servicios contables</p>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="createService()">
            <mat-icon>add</mat-icon>
            Nuevo Servicio
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <mat-card class="filters-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>filter_list</mat-icon>
            Filtros
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="filters-grid">
            <mat-form-field>
              <mat-label>Buscar</mat-label>
              <input matInput 
                     [(ngModel)]="filters.searchTerm" 
                     (ngModelChange)="applyFilters()"
                     placeholder="Título, descripción, usuario...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Estado</mat-label>
              <mat-select [(ngModel)]="filters.status" 
                         (selectionChange)="applyFilters()" 
                         multiple>
                <mat-option *ngFor="let status of statusOptions" [value]="status.value">
                  <mat-icon [style.color]="status.color">{{status.icon}}</mat-icon>
                  {{status.label}}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Tipo de Servicio</mat-label>
              <mat-select [(ngModel)]="filters.type" 
                         (selectionChange)="applyFilters()" 
                         multiple>
                <mat-option *ngFor="let type of typeOptions" [value]="type.value">
                  <mat-icon [style.color]="type.color">{{type.icon}}</mat-icon>
                  {{type.label}}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Usuario</mat-label>
              <mat-select [(ngModel)]="filters.userId" 
                         (selectionChange)="applyFilters()">
                <mat-option value="">Todos los usuarios</mat-option>
                <mat-option *ngFor="let user of users$ | async" [value]="user.id">
                  {{user.name}} {{user.lastName}}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <div class="filter-toggles">
              <button mat-stroked-button 
                      [color]="filters.isOverdue ? 'warn' : 'basic'"
                      (click)="toggleOverdue()">
                <mat-icon>error</mat-icon>
                Solo Vencidos
              </button>
              <button mat-stroked-button 
                      [color]="filters.isUrgent ? 'accent' : 'basic'"
                      (click)="toggleUrgent()">
                <mat-icon>priority_high</mat-icon>
                Solo Urgentes
              </button>
              <button mat-stroked-button (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Estadísticas rápidas -->
      <div class="stats-grid">
        @if (stats$ | async; as stats) {
          <mat-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{stats.totalServices}}</div>
              <div class="stat-label">Total Servicios</div>
            </div>
            <mat-icon class="stat-icon">assignment</mat-icon>
          </mat-card>

          <mat-card class="stat-card pending">
            <div class="stat-content">
              <div class="stat-number">{{stats.pendingServices}}</div>
              <div class="stat-label">Pendientes</div>
            </div>
            <mat-icon class="stat-icon">schedule</mat-icon>
          </mat-card>

          <mat-card class="stat-card progress">
            <div class="stat-content">
              <div class="stat-number">{{stats.inProgressServices}}</div>
              <div class="stat-label">En Proceso</div>
            </div>
            <mat-icon class="stat-icon">sync</mat-icon>
          </mat-card>

          <mat-card class="stat-card overdue">
            <div class="stat-content">
              <div class="stat-number">{{stats.overdueServices}}</div>
              <div class="stat-label">Vencidos</div>
            </div>
            <mat-icon class="stat-icon">error</mat-icon>
          </mat-card>
        }
      </div>

      <!-- Tabla de servicios -->
      <mat-card class="services-table-card">
        <mat-card-header>
          <mat-card-title>
            Lista de Servicios
            @if (filteredServices$ | async; as services) {
              <mat-chip-set>
                <mat-chip>{{services.length}} servicios</mat-chip>
              </mat-chip-set>
            }
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (isLoading) {
            <div class="loading-container">
              <mat-spinner></mat-spinner>
              <p>Cargando servicios...</p>
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="(filteredServices$ | async) || []" class="services-table">
                <!-- Columna Título -->
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Servicio</th>
                  <td mat-cell *matCellDef="let service">
                    <div class="service-title">
                      <mat-icon [style.color]="getTypeConfig(service.type).color">
                        {{getTypeConfig(service.type).icon}}
                      </mat-icon>
                      <div>
                        <div class="title">{{service.title}}</div>
                        <div class="subtitle">{{getTypeConfig(service.type).label}}</div>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Columna Usuario -->
                <ng-container matColumnDef="user">
                  <th mat-header-cell *matHeaderCellDef>Usuario</th>
                  <td mat-cell *matCellDef="let service">
                    <div class="user-info">
                      <div class="user-name">{{service.userName}}</div>
                      <div class="user-email">{{service.userEmail}}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Columna Estado -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let service">
                    <mat-chip [style.background-color]="getStatusConfig(service.status).color + '20'"
                             [style.color]="getStatusConfig(service.status).color">
                      <mat-icon [style.color]="getStatusConfig(service.status).color">
                        {{getStatusConfig(service.status).icon}}
                      </mat-icon>
                      {{getStatusConfig(service.status).label}}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Columna Fecha Límite -->
                <ng-container matColumnDef="dueDate">
                  <th mat-header-cell *matHeaderCellDef>Fecha Límite</th>
                  <td mat-cell *matCellDef="let service">
                    <div class="due-date" 
                         [class.overdue]="service.daysOverdue"
                         [class.urgent]="service.isUrgent">
                      <div class="date">{{service.dueDate | date:'dd/MM/yyyy'}}</div>
                      @if (service.daysOverdue) {
                        <div class="overdue-badge">
                          <mat-icon>error</mat-icon>
                          {{service.daysOverdue}} días de retraso
                        </div>
                      } @else if (service.isUrgent) {
                        <div class="urgent-badge">
                          <mat-icon>priority_high</mat-icon>
                          Urgente
                        </div>
                      }
                    </div>
                  </td>
                </ng-container>

                <!-- Columna Precio -->
                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef>Precio</th>
                  <td mat-cell *matCellDef="let service">
                    @if (service.price) {
                      <div class="price" [class.paid]="service.isPaid">
                        {{service.price | currency:'CLP':'symbol':'1.0-0'}}
                        <mat-icon *ngIf="service.isPaid" class="paid-icon">check_circle</mat-icon>
                        <mat-icon *ngIf="!service.isPaid" class="unpaid-icon">schedule</mat-icon>
                      </div>
                    } @else {
                      <span class="no-price">-</span>
                    }
                  </td>
                </ng-container>

                <!-- Columna Acciones -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let service">
                    <div class="actions-cell">
                      <button mat-icon-button 
                              (click)="viewService(service.id)"
                              matTooltip="Ver detalles">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button 
                              (click)="editService(service.id)"
                              matTooltip="Editar">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="warn"
                              (click)="deleteService(service.id)"
                              matTooltip="Eliminar">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>

            @if ((filteredServices$ | async)?.length === 0) {
              <div class="no-services">
                <mat-icon>assignment</mat-icon>
                <h3>No hay servicios</h3>
                <p>No se encontraron servicios con los filtros aplicados</p>
                <button mat-raised-button color="primary" (click)="createService()">
                  <mat-icon>add</mat-icon>
                  Crear Primer Servicio
                </button>
              </div>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './service-list.scss'
})
export class ServiceListComponent implements OnInit {
  private accountingService = inject(AccountingServiceService);
  private userService = inject(UserService);
  private router = inject(Router);

  services$ = this.accountingService.services$;
  stats$ = this.accountingService.stats$;
  users$ = this.userService.users$;

  displayedColumns = ['title', 'user', 'status', 'dueDate', 'price', 'actions'];
  
  isLoading = false;

  // Filtros
  private filtersSubject = new BehaviorSubject<ServiceFilters>({});
  filters: ServiceFilters = {};
  
  filteredServices$!: Observable<AccountingService[]>;

  // Opciones para selectores
  statusOptions = Object.entries(SERVICE_STATUS_CONFIG).map(([key, config]) => ({
    value: key as ServiceStatus,
    label: config.label,
    icon: config.icon,
    color: config.color
  }));

  typeOptions = Object.entries(SERVICE_TYPE_CONFIG).map(([key, config]) => ({
    value: key as ServiceType,
    label: config.label,
    icon: config.icon,
    color: config.color
  }));

  ngOnInit() {
    this.filteredServices$ = combineLatest([
      this.services$,
      this.filtersSubject.asObservable()
    ]).pipe(
      map(([services, filters]) => this.applyFiltersToServices(services, filters))
    );
  }

  private applyFiltersToServices(services: AccountingService[], filters: ServiceFilters): AccountingService[] {
    let filtered = [...services];

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(s => filters.status!.includes(s.status));
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(s => filters.type!.includes(s.type));
    }

    if (filters.userId) {
      filtered = filtered.filter(s => s.userId === filters.userId);
    }

    if (filters.isOverdue) {
      filtered = filtered.filter(s => s.status === ServiceStatus.VENCIDO || s.daysOverdue);
    }

    if (filters.isUrgent) {
      filtered = filtered.filter(s => s.isUrgent);
    }

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(searchTerm) ||
        s.description.toLowerCase().includes(searchTerm) ||
        s.userName?.toLowerCase().includes(searchTerm) ||
        s.userEmail?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }

  applyFilters(): void {
    this.filtersSubject.next({ ...this.filters });
  }

  toggleOverdue(): void {
    this.filters.isOverdue = !this.filters.isOverdue;
    if (this.filters.isOverdue) {
      this.filters.isUrgent = false;
    }
    this.applyFilters();
  }

  toggleUrgent(): void {
    this.filters.isUrgent = !this.filters.isUrgent;
    if (this.filters.isUrgent) {
      this.filters.isOverdue = false;
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {};
    this.filtersSubject.next({});
  }

  getStatusConfig(status: ServiceStatus) {
    return SERVICE_STATUS_CONFIG[status];
  }

  getTypeConfig(type: ServiceType) {
    return SERVICE_TYPE_CONFIG[type];
  }

  createService(): void {
    this.router.navigate(['/services/create']);
  }

  viewService(id: string): void {
    this.router.navigate(['/services', id]);
  }

  editService(id: string): void {
    this.router.navigate(['/services', id, 'edit']);
  }

  deleteService(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      this.accountingService.deleteService(id).subscribe({
        next: () => {
          console.log('✅ Servicio eliminado exitosamente');
        },
        error: (error) => {
          console.error('❌ Error eliminando servicio:', error);
        }
      });
    }
  }
}
