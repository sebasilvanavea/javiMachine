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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { UserService } from '../../services/user.service';
import { DashboardService } from '../../services/dashboard.service';
import { OptimizedClickService } from '../../services/optimized-click.service';
import { AccountingServiceService } from '../../services/accounting-service.service';
import { DashboardStats, User, Service, ServiceStatus } from '../../models/user.model';
// Componentes comentados temporalmente hasta que se usen en el template
// import { ChartsDashboardComponent } from '../charts/charts-dashboard.component';
// import { AdvancedStatsComponent } from '../stats/advanced-stats.component';
// import { RealTimeMetricsComponent } from '../metrics/real-time-metrics.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTableModule,
    MatBadgeModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatDividerModule
    // ChartsDashboardComponent,
    // AdvancedStatsComponent,
    // RealTimeMetricsComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard-contabilium.scss'
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

  // Propiedades para el nuevo diseño
  systemStatus = {
    database: true,
    services: true,
    api: true
  };

  hasMoreServices = false;
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

  // Nuevos métodos para el diseño mejorado
  getLastUpdateTime(): string {
    return new Date().toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  exportReport(): void {
    // Implementar exportación de reportes en formato PDF o Excel
    const stats$ = this.stats$;
    if (stats$) {
      stats$.subscribe(stats => {
        console.log('Exportando reporte con datos:', stats);
        // Aquí se implementaría la lógica real de exportación
        // Por ejemplo, generar PDF con jsPDF o Excel con ExcelJS
      });
    }
  }

  changePeriod(event: any): void {
    const period = event.value;
    console.log('Cambiando período a:', period);
    // Recargar datos según el período seleccionado
  }

  getUserProgressPercentage(stats: DashboardStats): number {
    // Calcular porcentaje de progreso basado en meta de usuarios
    const target = 100; // Meta ejemplo
    return Math.min((stats.totalUsers / target) * 100, 100);
  }

  getRevenueProgress(stats: DashboardStats): number {
    // Calcular progreso de ingresos vs meta
    const target = stats.monthlyRevenue * 1.2; // Meta 20% más alta
    return Math.min((stats.monthlyRevenue / target) * 100, 100);
  }

  viewPendingServices(): void {
    this.router.navigate(['/services/pending']);
  }

  filterPendingServices(): void {
    console.log('Aplicando filtros...');
    // Implementar lógica de filtros
  }

  viewReports(): void {
    this.router.navigate(['/reports']);
  }

  getOverdueCount(services: {user: User, service: Service}[]): number {
    return services.filter(item => this.isOverdue(item.service)).length;
  }

  getDueSoonCount(services: {user: User, service: Service}[]): number {
    return services.filter(item => this.isDueSoon(item.service)).length;
  }

  getNormalCount(services: {user: User, service: Service}[]): number {
    return services.filter(item => 
      !this.isOverdue(item.service) && !this.isDueSoon(item.service)
    ).length;
  }

  isDueSoon(service: Service): boolean {
    const daysUntilDue = this.getDaysUntilDue(service.dueDate);
    return daysUntilDue <= 3 && daysUntilDue > 0;
  }

  getUserColor(user: User): string {
    // Generar color basado en el nombre del usuario
    const colors = ['#E3F2FD', '#F3E5F5', '#E8F5E8', '#FFF3E0', '#FCE4EC'];
    const index = user.name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  getStatusClass(service: Service): string {
    if (this.isOverdue(service)) return 'overdue';
    if (this.isDueSoon(service)) return 'due-soon';
    return 'normal';
  }

  getStatusIcon(service: Service): string {
    switch (service.status) {
      case ServiceStatus.PENDING:
        return this.isOverdue(service) ? 'warning' : 'schedule';
      case ServiceStatus.IN_PROGRESS:
        return 'sync';
      case ServiceStatus.COMPLETED:
        return 'check_circle';
      case ServiceStatus.OVERDUE:
        return 'error';
      case ServiceStatus.CANCELLED:
        return 'cancel';
      default:
        return 'help';
    }
  }

  markAsCompleted(serviceId: string): void {
    console.log('Marcando servicio como completado:', serviceId);
    // Implementar lógica para marcar como completado
  }

  loadMoreServices(): void {
    console.log('Cargando más servicios...');
    // Implementar paginación
  }

  createNewService(): void {
    this.router.navigate(['/services/new']);
  }

  generateReport(): void {
    this.router.navigate(['/reports/generate']);
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
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
