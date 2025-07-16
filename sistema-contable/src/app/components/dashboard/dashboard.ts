import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { UserService } from '../../services/user.service';
import { DashboardService } from '../../services/dashboard.service';
import { OptimizedClickService } from '../../services/optimized-click.service';
import { AccountingServiceService } from '../../services/accounting-service.service';
import { DashboardStats, User, Service, ServiceStatus } from '../../models/user.model';
import { FirebaseDiagnosticComponent } from '../firebase-diagnostic/firebase-diagnostic.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTableModule,
    MatBadgeModule,
    MatTooltipModule,
    FirebaseDiagnosticComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private userService = inject(UserService);
  private dashboardService = inject(DashboardService);
  private optimizedClickService = inject(OptimizedClickService);
  private accountingService = inject(AccountingServiceService);
  private router = inject(Router);

  stats$!: Observable<DashboardStats>;
  pendingServices$!: Observable<{user: User, service: Service}[]>;
  isLoadingStats$!: Observable<boolean>;
  isLoadingServices$!: Observable<boolean>;

  displayedColumns: string[] = ['user', 'service', 'amount', 'dueDate', 'status', 'actions'];

  ngOnInit(): void {
    // Inicializar observables de estado de carga
    this.isLoadingStats$ = this.optimizedClickService.isProcessing$('dashboard-stats');
    this.isLoadingServices$ = this.optimizedClickService.isProcessing$('pending-services');
    
    // Cargar datos del dashboard
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Cargar estadísticas usando el servicio optimizado
    this.stats$ = this.optimizedClickService.handleDataLoad(
      'dashboard-stats',
      () => this.dashboardService.getDashboardStatsOptimized()
    );

    // Cargar servicios pendientes usando el servicio optimizado
    this.pendingServices$ = this.optimizedClickService.handleDataLoad(
      'pending-services',
      () => this.userService.getPendingServices()
    );
  }

  getStatusColor(status: ServiceStatus): string {
    switch (status) {
      case ServiceStatus.PENDING:
        return 'primary';
      case ServiceStatus.IN_PROGRESS:
        return 'accent';
      case ServiceStatus.COMPLETED:
        return 'primary';
      case ServiceStatus.OVERDUE:
        return 'warn';
      case ServiceStatus.CANCELLED:
        return '';
      default:
        return '';
    }
  }

  getStatusText(status: ServiceStatus): string {
    switch (status) {
      case ServiceStatus.PENDING:
        return 'Pendiente';
      case ServiceStatus.IN_PROGRESS:
        return 'En Progreso';
      case ServiceStatus.COMPLETED:
        return 'Completado';
      case ServiceStatus.OVERDUE:
        return 'Vencido';
      case ServiceStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  }

  isOverdue(service: Service): boolean {
    return new Date(service.dueDate) < new Date() && service.status === ServiceStatus.PENDING;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-CL');
  }

  navigateToUsers(): void {
    this.router.navigate(['/users']);
  }

  navigateToUserDetail(userId: string): void {
    this.router.navigate(['/users', userId]);
  }

  viewServiceDetail(userId: string, serviceId: string): void {
    this.router.navigate(['/users', userId, 'services', serviceId]);
  }

  getDaysUntilDue(dueDate: Date): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getAbsoluteDays(days: number): number {
    return Math.abs(days);
  }

  getRevenueGrowthIcon(stats: DashboardStats | null): string {
    return stats && stats.revenueGrowthPercentage > 0 ? 'trending_up' : 'trending_down';
  }

  getChipColor(pendingServices: {user: User, service: Service}[]): string {
    const overdueCount = pendingServices.filter(ps => this.isOverdue(ps.service)).length;
    return overdueCount > 0 ? 'warn' : 'primary';
  }

  getUserGrowthIcon(stats: DashboardStats | null): string {
    return stats && stats.userGrowthPercentage > 0 ? 'trending_up' : 'trending_down';
  }

  // Método para refrescar datos manualmente
  refreshDashboard(): void {
    // Limpiar cache y recargar
    this.dashboardService.clearStatsCache();
    this.loadDashboardData();
  }

  // Método para generar datos de prueba
  generateSampleData(): void {
    console.log('🔄 Generando datos de prueba...');
    
    this.userService.users$.subscribe(users => {
      if (users.length === 0) {
        console.log('⚠️ No hay usuarios para generar servicios');
        return;
      }
      
      this.accountingService.generateSampleServices(users);
      console.log('✅ Datos de prueba generados');
    }).unsubscribe();
  }
}
