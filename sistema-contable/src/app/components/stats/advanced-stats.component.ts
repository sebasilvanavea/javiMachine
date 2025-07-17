import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { AccountingServiceService } from '../../services/accounting-service.service';
import { UserService } from '../../services/user.service';

interface AdvancedStats {
  completionRate: number;
  averageProcessingTime: number;
  clientSatisfaction: number;
  monthlyGrowth: number;
  totalRevenue: number;
  averageServiceValue: number;
  productivityIndex: number;
  overduePercentage: number;
  newClientsThisMonth: number;
  repeatClientRate: number;
  peakDayOfWeek: string;
  mostRequestedService: string;
}

@Component({
  selector: 'app-advanced-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="stats-container" *ngIf="stats$ | async as stats">
      <!-- KPIs Principales -->
      <div class="kpi-grid">
        <mat-card class="stat-card kpi-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-info">
              <h3>{{stats.completionRate}}%</h3>
              <p>Tasa de Completación</p>
            </div>
          </div>
          <mat-progress-bar mode="determinate" [value]="stats.completionRate" color="primary"></mat-progress-bar>
        </mat-card>

        <mat-card class="stat-card kpi-card">
          <div class="stat-content">
            <div class="stat-icon info">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="stat-info">
              <h3>{{stats.averageProcessingTime}} días</h3>
              <p>Tiempo Promedio</p>
            </div>
          </div>
          <mat-progress-bar mode="determinate" [value]="getTimeProgress(stats.averageProcessingTime)" color="accent"></mat-progress-bar>
        </mat-card>

        <mat-card class="stat-card kpi-card">
          <div class="stat-content">
            <div class="stat-icon warning">
              <mat-icon>star</mat-icon>
            </div>
            <div class="stat-info">
              <h3>{{stats.clientSatisfaction}}%</h3>
              <p>Satisfacción Cliente</p>
            </div>
          </div>
          <mat-progress-bar mode="determinate" [value]="stats.clientSatisfaction" color="primary"></mat-progress-bar>
        </mat-card>

        <mat-card class="stat-card kpi-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="stat-info">
              <h3>{{stats.monthlyGrowth > 0 ? '+' : ''}}{{stats.monthlyGrowth}}%</h3>
              <p>Crecimiento Mensual</p>
            </div>
          </div>
          <mat-progress-bar mode="determinate" [value]="Math.abs(stats.monthlyGrowth)" 
                           [color]="stats.monthlyGrowth >= 0 ? 'primary' : 'warn'"></mat-progress-bar>
        </mat-card>
      </div>

      <!-- Métricas Financieras -->
      <div class="financial-grid">
        <mat-card class="stat-card financial-card">
          <div class="card-header">
            <h3>Métricas Financieras</h3>
            <mat-icon>attach_money</mat-icon>
          </div>
          <div class="financial-stats">
            <div class="financial-item">
              <span class="label">Ingresos Totales:</span>
              <span class="value">\${{stats.totalRevenue.toLocaleString('es-CL')}}</span>
            </div>
            <div class="financial-item">
              <span class="label">Valor Promedio Servicio:</span>
              <span class="value">\${{stats.averageServiceValue.toLocaleString('es-CL')}}</span>
            </div>
            <div class="financial-item">
              <span class="label">Servicios Vencidos:</span>
              <span class="value">{{stats.overduePercentage}}%</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="stat-card productivity-card">
          <div class="card-header">
            <h3>Productividad</h3>
            <mat-icon>speed</mat-icon>
          </div>
          <div class="productivity-stats">
            <div class="productivity-meter">
              <div class="meter-label">Índice de Productividad</div>
              <div class="meter-value">{{stats.productivityIndex}}%</div>
              <mat-progress-bar mode="determinate" [value]="stats.productivityIndex" 
                               [color]="getProductivityColor(stats.productivityIndex)"></mat-progress-bar>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Análisis de Clientes -->
      <div class="client-grid">
        <mat-card class="stat-card client-card">
          <div class="card-header">
            <h3>Análisis de Clientes</h3>
            <mat-icon>people</mat-icon>
          </div>
          <div class="client-stats">
            <div class="client-metric">
              <div class="metric-icon">
                <mat-icon>person_add</mat-icon>
              </div>
              <div class="metric-info">
                <h4>{{stats.newClientsThisMonth}}</h4>
                <p>Clientes Nuevos</p>
              </div>
            </div>
            <div class="client-metric">
              <div class="metric-icon">
                <mat-icon>repeat</mat-icon>
              </div>
              <div class="metric-info">
                <h4>{{stats.repeatClientRate}}%</h4>
                <p>Clientes Recurrentes</p>
              </div>
            </div>
          </div>
        </mat-card>

        <mat-card class="stat-card insights-card">
          <div class="card-header">
            <h3>Insights del Negocio</h3>
            <mat-icon>insights</mat-icon>
          </div>
          <div class="insights-stats">
            <div class="insight-item">
              <mat-icon>calendar_today</mat-icon>
              <div class="insight-info">
                <p><strong>Día más activo:</strong> {{stats.peakDayOfWeek}}</p>
              </div>
            </div>
            <div class="insight-item">
              <mat-icon>star</mat-icon>
              <div class="insight-info">
                <p><strong>Servicio más solicitado:</strong> {{stats.mostRequestedService}}</p>
              </div>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .stats-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .financial-grid, .client-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      padding: 20px !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.15) !important;
    }

    .kpi-card .stat-content {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .stat-icon.success {
      background: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }

    .stat-icon.info {
      background: rgba(33, 150, 243, 0.1);
      color: #2196F3;
    }

    .stat-icon.warning {
      background: rgba(255, 193, 7, 0.1);
      color: #FFC107;
    }

    .stat-info h3 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 600;
      color: #333;
    }

    .stat-info p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 0.9rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }

    .card-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .card-header mat-icon {
      color: #666;
    }

    .financial-stats, .client-stats, .insights-stats {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .financial-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .financial-item .label {
      color: #666;
      font-size: 0.9rem;
    }

    .financial-item .value {
      color: #333;
      font-weight: 600;
      font-size: 1rem;
    }

    .productivity-meter {
      text-align: center;
    }

    .meter-label {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    .meter-value {
      color: #333;
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .client-metric {
      display: flex;
      align-items: center;
    }

    .client-metric .metric-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(33, 150, 243, 0.1);
      color: #2196F3;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .client-metric .metric-info h4 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .client-metric .metric-info p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 0.9rem;
    }

    .insight-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
    }

    .insight-item mat-icon {
      color: #666;
      margin-right: 12px;
    }

    .insight-info p {
      margin: 0;
      color: #333;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .stats-container {
        padding: 16px;
      }

      .kpi-grid, .financial-grid, .client-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .stat-card {
        padding: 16px !important;
      }

      .stat-info h3 {
        font-size: 1.5rem;
      }

      .meter-value {
        font-size: 1.5rem;
      }
    }
  `]
})
export class AdvancedStatsComponent implements OnInit {
  private accountingService = inject(AccountingServiceService);
  private userService = inject(UserService);

  stats$: Observable<AdvancedStats> = combineLatest([
    this.accountingService.services$,
    this.userService.getUsers()
  ]).pipe(
    map(([services, users]) => this.calculateAdvancedStats(services, users))
  );

  ngOnInit(): void {}

  getTimeProgress(days: number): number {
    // Asumiendo que 15 días es el máximo ideal
    return Math.max(0, Math.min(100, ((15 - days) / 15) * 100));
  }

  getProductivityColor(value: number): 'primary' | 'accent' | 'warn' {
    if (value >= 80) return 'primary';
    if (value >= 60) return 'accent';
    return 'warn';
  }

  Math = Math;

  private calculateAdvancedStats(services: any[], users: any[]): AdvancedStats {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Servicios del mes actual
    const thisMonthServices = services.filter(service => {
      const serviceDate = new Date(service.createdAt);
      return serviceDate.getMonth() === currentMonth && serviceDate.getFullYear() === currentYear;
    });

    // Servicios del mes anterior
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthServices = services.filter(service => {
      const serviceDate = new Date(service.createdAt);
      return serviceDate.getMonth() === lastMonth && serviceDate.getFullYear() === lastMonthYear;
    });

    // Servicios completados
    const completedServices = services.filter(s => s.status === 'entregado');
    const completionRate = services.length > 0 ? (completedServices.length / services.length) * 100 : 0;

    // Tiempo promedio de procesamiento
    const averageProcessingTime = this.calculateAverageProcessingTime(completedServices);

    // Satisfacción del cliente (simulada basada en tiempo de entrega y estado)
    const clientSatisfaction = this.calculateClientSatisfaction(services);

    // Crecimiento mensual
    const monthlyGrowth = lastMonthServices.length > 0 
      ? ((thisMonthServices.length - lastMonthServices.length) / lastMonthServices.length) * 100 
      : thisMonthServices.length > 0 ? 100 : 0;

    // Ingresos totales
    const totalRevenue = services
      .filter(s => s.status === 'entregado' && s.isPaid)
      .reduce((sum, s) => sum + (s.price || 0), 0);

    // Valor promedio del servicio
    const paidServices = services.filter(s => s.price && s.price > 0);
    const averageServiceValue = paidServices.length > 0 
      ? paidServices.reduce((sum, s) => sum + s.price, 0) / paidServices.length 
      : 0;

    // Índice de productividad
    const productivityIndex = this.calculateProductivityIndex(services);

    // Porcentaje de servicios vencidos
    const overdueServices = services.filter(s => s.status === 'vencido');
    const overduePercentage = services.length > 0 ? (overdueServices.length / services.length) * 100 : 0;

    // Clientes nuevos este mes
    const newClientsThisMonth = this.calculateNewClients(users, thisMonthServices);

    // Tasa de clientes recurrentes
    const repeatClientRate = this.calculateRepeatClientRate(services);

    // Día más activo de la semana
    const peakDayOfWeek = this.calculatePeakDay(services);

    // Servicio más solicitado
    const mostRequestedService = this.calculateMostRequestedService(services);

    return {
      completionRate: Math.round(completionRate),
      averageProcessingTime: Math.round(averageProcessingTime),
      clientSatisfaction: Math.round(clientSatisfaction),
      monthlyGrowth: Math.round(monthlyGrowth),
      totalRevenue,
      averageServiceValue: Math.round(averageServiceValue),
      productivityIndex: Math.round(productivityIndex),
      overduePercentage: Math.round(overduePercentage),
      newClientsThisMonth,
      repeatClientRate: Math.round(repeatClientRate),
      peakDayOfWeek,
      mostRequestedService
    };
  }

  private calculateAverageProcessingTime(completedServices: any[]): number {
    if (completedServices.length === 0) return 0;

    const totalDays = completedServices.reduce((sum, service) => {
      const startDate = new Date(service.createdAt);
      const endDate = new Date(service.deliveredAt || service.updatedAt);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);

    return totalDays / completedServices.length;
  }

  private calculateClientSatisfaction(services: any[]): number {
    if (services.length === 0) return 0;

    let satisfactionScore = 0;
    services.forEach(service => {
      let score = 100;
      
      // Penalizar por retrasos
      if (service.status === 'vencido') score -= 30;
      if (service.status === 'cancelado') score -= 50;
      
      // Bonificar por entrega a tiempo
      if (service.status === 'entregado') {
        const createdDate = new Date(service.createdAt);
        const deliveredDate = new Date(service.deliveredAt || service.updatedAt);
        const dueDate = new Date(service.dueDate);
        
        if (deliveredDate <= dueDate) score += 10;
      }
      
      satisfactionScore += Math.max(0, score);
    });

    return satisfactionScore / services.length;
  }

  private calculateProductivityIndex(services: any[]): number {
    if (services.length === 0) return 0;

    const completedOnTime = services.filter(s => {
      if (s.status !== 'entregado') return false;
      const deliveredDate = new Date(s.deliveredAt || s.updatedAt);
      const dueDate = new Date(s.dueDate);
      return deliveredDate <= dueDate;
    }).length;

    const totalCompleted = services.filter(s => s.status === 'entregado').length;
    const overdueCount = services.filter(s => s.status === 'vencido').length;

    if (totalCompleted === 0) return 0;

    const onTimeRate = (completedOnTime / totalCompleted) * 100;
    const overdueRate = (overdueCount / services.length) * 100;

    return Math.max(0, onTimeRate - (overdueRate * 0.5));
  }

  private calculateNewClients(users: any[], thisMonthServices: any[]): number {
    const clientIds = new Set(thisMonthServices.map(s => s.clientId));
    return clientIds.size;
  }

  private calculateRepeatClientRate(services: any[]): number {
    const clientServiceCount = new Map();
    
    services.forEach(service => {
      const clientId = service.clientId;
      clientServiceCount.set(clientId, (clientServiceCount.get(clientId) || 0) + 1);
    });

    const repeatClients = Array.from(clientServiceCount.values()).filter(count => count > 1);
    const totalClients = clientServiceCount.size;

    return totalClients > 0 ? (repeatClients.length / totalClients) * 100 : 0;
  }

  private calculatePeakDay(services: any[]): string {
    const dayCount = new Map();
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    services.forEach(service => {
      const day = new Date(service.createdAt).getDay();
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    });

    let peakDay = 0;
    let maxCount = 0;
    dayCount.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count;
        peakDay = day;
      }
    });

    return dayNames[peakDay];
  }

  private calculateMostRequestedService(services: any[]): string {
    const serviceTypeCount = new Map();
    const serviceTypeNames = {
      'formulario_21': 'Formulario 21',
      'declaracion_iva': 'Declaración IVA',
      'declaracion_renta': 'Declaración Renta',
      'contabilidad_mensual': 'Contabilidad Mensual',
      'constitucion_empresa': 'Constitución Empresa',
      'modificacion_empresa': 'Modificación Empresa',
      'finiquito': 'Finiquito',
      'certificados': 'Certificados',
      'otro': 'Otro'
    };

    services.forEach(service => {
      const type = service.type;
      serviceTypeCount.set(type, (serviceTypeCount.get(type) || 0) + 1);
    });

    let mostRequested = 'otro';
    let maxCount = 0;
    serviceTypeCount.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        mostRequested = type;
      }
    });

    return serviceTypeNames[mostRequested as keyof typeof serviceTypeNames] || 'Otro';
  }
}
