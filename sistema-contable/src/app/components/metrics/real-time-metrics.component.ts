import { Component, OnInit, inject, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { interval, Subject } from 'rxjs';
import { takeUntil, switchMap, throttleTime } from 'rxjs/operators';

import { AccountingServiceService } from '../../services/accounting-service.service';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';

interface RealTimeMetrics {
  activeUsers: number;
  servicesInProgress: number;
  pendingPayments: number;
  overdueServices: number;
  todaysRevenue: number;
  thisWeekRevenue: number;
  averageResponseTime: string;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

@Component({
  selector: 'app-real-time-metrics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="real-time-container">
      <mat-card class="metrics-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="pulse">radio_button_checked</mat-icon>
            Métricas en Tiempo Real
          </mat-card-title>
          <mat-card-subtitle>Actualización automática cada 30 segundos</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="metrics-grid">
            <!-- Usuarios Activos -->
            <div class="metric-item">
              <div class="metric-icon active">
                <mat-icon>people</mat-icon>
              </div>
              <div class="metric-info">
                <h3>{{metrics.activeUsers}}</h3>
                <p>Usuarios Activos</p>
              </div>
            </div>

            <!-- Servicios en Progreso -->
            <div class="metric-item">
              <div class="metric-icon progress">
                <mat-icon>work</mat-icon>
              </div>
              <div class="metric-info">
                <h3>{{metrics.servicesInProgress}}</h3>
                <p>En Progreso</p>
              </div>
            </div>

            <!-- Pagos Pendientes -->
            <div class="metric-item">
              <div class="metric-icon pending">
                <mat-icon>payment</mat-icon>
              </div>
              <div class="metric-info">
                <h3>{{metrics.pendingPayments}}</h3>
                <p>Pagos Pendientes</p>
              </div>
            </div>

            <!-- Servicios Vencidos -->
            <div class="metric-item">
              <div class="metric-icon overdue">
                <mat-icon>schedule</mat-icon>
              </div>
              <div class="metric-info">
                <h3>{{metrics.overdueServices}}</h3>
                <p>Vencidos</p>
              </div>
            </div>

            <!-- Ingresos de Hoy -->
            <div class="metric-item">
              <div class="metric-icon revenue">
                <mat-icon>today</mat-icon>
              </div>
              <div class="metric-info">
                <h3>\${{metrics.todaysRevenue.toLocaleString('es-CL')}}</h3>
                <p>Ingresos Hoy</p>
              </div>
            </div>

            <!-- Ingresos de la Semana -->
            <div class="metric-item">
              <div class="metric-icon revenue">
                <mat-icon>date_range</mat-icon>
              </div>
              <div class="metric-info">
                <h3>\${{metrics.thisWeekRevenue.toLocaleString('es-CL')}}</h3>
                <p>Ingresos Semana</p>
              </div>
            </div>

            <!-- Tiempo de Respuesta -->
            <div class="metric-item">
              <div class="metric-icon performance">
                <mat-icon>speed</mat-icon>
              </div>
              <div class="metric-info">
                <h3>{{metrics.averageResponseTime}}</h3>
                <p>Tiempo Respuesta</p>
              </div>
            </div>

            <!-- Estado del Sistema -->
            <div class="metric-item">
              <div class="metric-icon" [class]="'health-' + metrics.systemHealth">
                <mat-icon>{{getHealthIcon(metrics.systemHealth)}}</mat-icon>
              </div>
              <div class="metric-info">
                <h3>{{getHealthText(metrics.systemHealth)}}</h3>
                <p>Estado Sistema</p>
              </div>
            </div>
          </div>

          <!-- Indicadores de Estado -->
          <div class="status-indicators">
            <mat-chip-set>
              <mat-chip 
                [color]="metrics.overdueServices > 0 ? 'warn' : 'primary'"
                [disabled]="metrics.overdueServices === 0">
                <mat-icon>schedule</mat-icon>
                {{metrics.overdueServices}} Vencidos
              </mat-chip>
              
              <mat-chip 
                [color]="metrics.pendingPayments > 0 ? 'accent' : 'primary'"
                [disabled]="metrics.pendingPayments === 0">
                <mat-icon>payment</mat-icon>
                {{metrics.pendingPayments}} Pagos Pendientes
              </mat-chip>
              
              <mat-chip color="primary">
                <mat-icon>trending_up</mat-icon>
                {{metrics.servicesInProgress}} Activos
              </mat-chip>
            </mat-chip-set>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="refreshMetrics()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
          <span class="last-update">
            Última actualización: {{lastUpdate.toLocaleTimeString('es-CL')}}
          </span>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .real-time-container {
      margin-bottom: 24px;
    }

    .metrics-card {
      border-radius: 12px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
    }

    .pulse {
      color: #4CAF50;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-item {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .metric-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .metric-icon.active {
      background: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }

    .metric-icon.progress {
      background: rgba(33, 150, 243, 0.1);
      color: #2196F3;
    }

    .metric-icon.pending {
      background: rgba(255, 193, 7, 0.1);
      color: #FFC107;
    }

    .metric-icon.overdue {
      background: rgba(244, 67, 54, 0.1);
      color: #F44336;
    }

    .metric-icon.revenue {
      background: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }

    .metric-icon.performance {
      background: rgba(156, 39, 176, 0.1);
      color: #9C27B0;
    }

    .metric-icon.health-excellent {
      background: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }

    .metric-icon.health-good {
      background: rgba(139, 195, 74, 0.1);
      color: #8BC34A;
    }

    .metric-icon.health-warning {
      background: rgba(255, 193, 7, 0.1);
      color: #FFC107;
    }

    .metric-icon.health-critical {
      background: rgba(244, 67, 54, 0.1);
      color: #F44336;
    }

    .metric-info h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .metric-info p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 0.9rem;
    }

    .status-indicators {
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .last-update {
      margin-left: auto;
      color: #666;
      font-size: 0.8rem;
    }

    mat-card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
      }

      .metric-item {
        padding: 12px;
      }

      .metric-icon {
        width: 40px;
        height: 40px;
        margin-right: 12px;
      }

      .metric-info h3 {
        font-size: 1.2rem;
      }
    }
  `]
})
export class RealTimeMetricsComponent implements OnInit, OnDestroy {
  private accountingService = inject(AccountingServiceService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  metrics: RealTimeMetrics = {
    activeUsers: 0,
    servicesInProgress: 0,
    pendingPayments: 0,
    overdueServices: 0,
    todaysRevenue: 0,
    thisWeekRevenue: 0,
    averageResponseTime: '0ms',
    systemHealth: 'excellent'
  };

  lastUpdate = new Date();

  ngOnInit(): void {
    // Cargar métricas iniciales
    this.loadMetrics();

    // Configurar actualización automática cada 60 segundos (reducido de 30)
    interval(60000)
      .pipe(
        takeUntil(this.destroy$),
        throttleTime(5000), // Throttle para evitar llamadas excesivas
        switchMap(() => this.loadMetrics())
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMetrics() {
    const startTime = performance.now();

    return new Promise<void>((resolve) => {
      // Cargar datos desde los servicios
      this.accountingService.services$.subscribe(services => {
        this.userService.getUsers().subscribe(users => {
          this.calculateMetrics(services, users);
          
          // Calcular tiempo de respuesta
          const endTime = performance.now();
          this.metrics.averageResponseTime = `${Math.round(endTime - startTime)}ms`;
          
          this.lastUpdate = new Date();
          resolve();
        });
      });
    });
  }

  private calculateMetrics(services: any[], users: any[]): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    // Usuarios activos (con servicios en los últimos 30 días)
    const last30Days = new Date();
    last30Days.setDate(now.getDate() - 30);
    
    const activeUserIds = new Set(
      services
        .filter(s => new Date(s.createdAt) >= last30Days)
        .map(s => s.clientId)
    );
    this.metrics.activeUsers = activeUserIds.size;

    // Servicios en progreso
    this.metrics.servicesInProgress = services.filter(s => 
      s.status === 'pendiente' || s.status === 'en_proceso'
    ).length;

    // Pagos pendientes
    this.metrics.pendingPayments = services.filter(s => 
      s.status === 'entregado' && !s.isPaid
    ).length;

    // Servicios vencidos
    this.metrics.overdueServices = services.filter(s => 
      s.status === 'vencido' || (new Date(s.dueDate) < now && s.status !== 'entregado')
    ).length;

    // Ingresos de hoy
    this.metrics.todaysRevenue = services
      .filter(s => {
        if (s.status !== 'entregado' || !s.isPaid) return false;
        const serviceDate = new Date(s.deliveredAt || s.updatedAt);
        return serviceDate >= today && serviceDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      })
      .reduce((sum, s) => sum + (s.price || 0), 0);

    // Ingresos de la semana
    this.metrics.thisWeekRevenue = services
      .filter(s => {
        if (s.status !== 'entregado' || !s.isPaid) return false;
        const serviceDate = new Date(s.deliveredAt || s.updatedAt);
        return serviceDate >= weekStart;
      })
      .reduce((sum, s) => sum + (s.price || 0), 0);

    // Estado del sistema
    this.metrics.systemHealth = this.calculateSystemHealth();
  }

  private calculateSystemHealth(): 'excellent' | 'good' | 'warning' | 'critical' {
    const { overdueServices, pendingPayments, servicesInProgress } = this.metrics;
    
    if (overdueServices > 5) return 'critical';
    if (overdueServices > 2 || pendingPayments > 10) return 'warning';
    if (pendingPayments > 5 || servicesInProgress > 20) return 'good';
    return 'excellent';
  }

  getHealthIcon(health: string): string {
    switch (health) {
      case 'excellent': return 'check_circle';
      case 'good': return 'verified';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'help';
    }
  }

  getHealthText(health: string): string {
    switch (health) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bueno';
      case 'warning': return 'Advertencia';
      case 'critical': return 'Crítico';
      default: return 'Desconocido';
    }
  }

  refreshMetrics(): void {
    this.loadMetrics();
  }
}
