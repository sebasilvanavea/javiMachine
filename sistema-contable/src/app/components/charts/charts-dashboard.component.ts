import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Observable, combineLatest, Subscription } from 'rxjs';
import { map, distinctUntilChanged, debounceTime, startWith } from 'rxjs/operators';

import { AccountingServiceService } from '../../services/accounting-service.service';
import { UserService } from '../../services/user.service';
import { DashboardService } from '../../services/dashboard.service';

// Registrar componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-charts-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="charts-container">
      <!-- Gráfico de Servicios por Estado -->
      <div class="chart-card">
        <h3>Servicios por Estado</h3>
        <canvas #statusChart width="400" height="200"></canvas>
      </div>

      <!-- Gráfico de Servicios por Tipo -->
      <div class="chart-card">
        <h3>Servicios por Tipo</h3>
        <canvas #typeChart width="400" height="200"></canvas>
      </div>

      <!-- Gráfico de Ingresos Mensuales -->
      <div class="chart-card">
        <h3>Ingresos Mensuales</h3>
        <canvas #revenueChart width="400" height="200"></canvas>
      </div>

      <!-- Gráfico de Tendencias -->
      <div class="chart-card">
        <h3>Tendencia de Servicios</h3>
        <canvas #trendChart width="400" height="200"></canvas>
      </div>
    </div>
  `,
  styles: [`
    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      padding: 24px;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 20px;
      border: 1px solid #e0e0e0;
      position: relative;
      min-height: 350px; /* Altura mínima fija */
      max-height: 450px; /* Altura máxima fija */
      overflow: hidden;
    }

    .chart-card h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 1.2rem;
      font-weight: 600;
      text-align: center;
      height: 30px; /* Altura fija para el título */
    }

    canvas {
      max-width: 100% !important;
      max-height: 300px !important; /* Altura máxima del canvas */
      width: 100% !important;
      height: auto !important;
    }

    @media (max-width: 768px) {
      .charts-container {
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 16px;
      }
      
      .chart-card {
        padding: 16px;
        min-height: 300px;
        max-height: 400px;
      }

      canvas {
        max-height: 250px !important;
      }
    }

    @media (max-width: 480px) {
      .chart-card {
        min-height: 250px;
        max-height: 350px;
      }

      canvas {
        max-height: 200px !important;
      }
    }
  `]
})
export class ChartsDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusChart', { static: true }) statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeChart', { static: true }) typeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart', { static: true }) revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart', { static: true }) trendChartRef!: ElementRef<HTMLCanvasElement>;

  private accountingService = inject(AccountingServiceService);
  private userService = inject(UserService);
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  private statusChart!: Chart;
  private typeChart!: Chart;
  private revenueChart!: Chart;
  private trendChart!: Chart;

  private chartsInitialized = false;
  private dataSubscription?: Subscription;
  private resizeObserver?: ResizeObserver;

  chartData$ = combineLatest([
    this.accountingService.services$,
    this.userService.getUsers()
  ]).pipe(
    debounceTime(300), // Evitar actualizaciones muy frecuentes
    map(([services, users]) => this.processChartData(services, users)),
    distinctUntilChanged((prev, curr) => {
      // Comparación más eficiente
      if (!prev || !curr) return false;
      return (
        prev.statusData.pendiente === curr.statusData.pendiente &&
        prev.statusData.en_proceso === curr.statusData.en_proceso &&
        prev.statusData.entregado === curr.statusData.entregado &&
        prev.statusData.vencido === curr.statusData.vencido &&
        prev.statusData.cancelado === curr.statusData.cancelado
      );
    }),
    startWith(null) // Comenzar con null para cargar datos iniciales
  );

  ngOnInit(): void {
    // Componente inicializado
  }

  ngAfterViewInit(): void {
    // Esperar un poco para que los elementos estén disponibles
    setTimeout(() => {
      this.initializeCharts();
      this.setupResizeObserver();
    }, 200);
  }

  ngOnDestroy(): void {
    // Limpiar suscripción
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    
    // Limpiar resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Limpiar gráficos
    this.destroyCharts();
  }

  private destroyCharts(): void {
    if (this.statusChart) {
      this.statusChart.destroy();
      this.statusChart = null as any;
    }
    if (this.typeChart) {
      this.typeChart.destroy();
      this.typeChart = null as any;
    }
    if (this.revenueChart) {
      this.revenueChart.destroy();
      this.revenueChart = null as any;
    }
    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = null as any;
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chartsInitialized) {
          setTimeout(() => {
            this.resizeCharts();
          }, 100);
        }
      });

      // Observar cambios en los contenedores
      const containers = [
        this.statusChartRef.nativeElement.parentElement,
        this.typeChartRef.nativeElement.parentElement,
        this.revenueChartRef.nativeElement.parentElement,
        this.trendChartRef.nativeElement.parentElement
      ];

      containers.forEach(container => {
        if (container) {
          this.resizeObserver!.observe(container);
        }
      });
    }
  }

  private resizeCharts(): void {
    if (this.statusChart) this.statusChart.resize();
    if (this.typeChart) this.typeChart.resize();
    if (this.revenueChart) this.revenueChart.resize();
    if (this.trendChart) this.trendChart.resize();
  }

  private initializeCharts(): void {
    this.dataSubscription = this.chartData$.subscribe(data => {
      if (!data) return; // Ignorar datos null/undefined

      if (!this.chartsInitialized) {
        // Crear gráficos por primera vez
        this.createStatusChart(data);
        this.createTypeChart(data);
        this.createRevenueChart(data);
        this.createTrendChart(data);
        this.chartsInitialized = true;
        this.cdr.markForCheck(); // Marcar para detección de cambios
      } else {
        // Actualizar datos existentes
        this.updateChartData(data);
      }
    });
  }

  private updateChartData(data: any): void {
    try {
      // Actualizar gráfico de estado
      if (this.statusChart && this.statusChart.data.datasets[0]) {
        this.statusChart.data.datasets[0].data = [
          data.statusData.pendiente,
          data.statusData.en_proceso,
          data.statusData.entregado,
          data.statusData.vencido,
          data.statusData.cancelado
        ];
        this.statusChart.update('none'); // Sin animación para mejor performance
      }

      // Actualizar gráfico de tipos
      if (this.typeChart && this.typeChart.data.datasets[0]) {
        this.typeChart.data.datasets[0].data = data.typeData.values;
        this.typeChart.update('none');
      }

      // Actualizar gráfico de ingresos
      if (this.revenueChart && this.revenueChart.data.datasets[0]) {
        this.revenueChart.data.datasets[0].data = data.revenueData.values;
        this.revenueChart.update('none');
      }

      // Actualizar gráfico de tendencias
      if (this.trendChart && this.trendChart.data.datasets[0] && this.trendChart.data.datasets[1]) {
        this.trendChart.data.datasets[0].data = data.trendData.created;
        this.trendChart.data.datasets[1].data = data.trendData.completed;
        this.trendChart.update('none');
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
      // En caso de error, reinicializar gráficos
      this.chartsInitialized = false;
      this.destroyCharts();
      setTimeout(() => {
        this.createStatusChart(data);
        this.createTypeChart(data);
        this.createRevenueChart(data);
        this.createTrendChart(data);
        this.chartsInitialized = true;
      }, 100);
    }
  }

  private createStatusChart(data: any): void {
    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'En Proceso', 'Entregados', 'Vencidos', 'Cancelados'],
        datasets: [{
          data: [
            data.statusData.pendiente,
            data.statusData.en_proceso,
            data.statusData.entregado,
            data.statusData.vencido,
            data.statusData.cancelado
          ],
          backgroundColor: [
            '#FFC107', // Amarillo - Pendientes
            '#2196F3', // Azul - En Proceso
            '#4CAF50', // Verde - Entregados
            '#F44336', // Rojo - Vencidos
            '#9E9E9E'  // Gris - Cancelados
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true, // Mantener ratio fijo
        aspectRatio: 1.5, // Ratio más controlado
        animation: {
          duration: 0 // Desactivar animaciones
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              boxWidth: 12
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index'
          }
        },
        layout: {
          padding: 10
        }
      }
    });
  }

  private createTypeChart(data: any): void {
    const ctx = this.typeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.typeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.typeData.labels,
        datasets: [{
          label: 'Cantidad de Servicios',
          data: data.typeData.values,
          backgroundColor: [
            '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', 
            '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0'
          ],
          borderColor: '#1976D2',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.8,
        animation: {
          duration: 0
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            mode: 'index'
          }
        },
        layout: {
          padding: 10
        }
      }
    });
  }

  private createRevenueChart(data: any): void {
    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.revenueData.labels,
        datasets: [{
          label: 'Ingresos ($)',
          data: data.revenueData.values,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#4CAF50',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString('es-CL');
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Ingresos: $' + context.parsed.y.toLocaleString('es-CL');
              }
            }
          }
        }
      }
    });
  }

  private createTrendChart(data: any): void {
    const ctx = this.trendChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.trendData.labels,
        datasets: [
          {
            label: 'Servicios Creados',
            data: data.trendData.created,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: false,
            tension: 0.4
          },
          {
            label: 'Servicios Completados',
            data: data.trendData.completed,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  private processChartData(services: any[], users: any[]) {
    // Procesar datos para gráfico de estados
    const statusData = {
      pendiente: services.filter(s => s.status === 'pendiente').length,
      en_proceso: services.filter(s => s.status === 'en_proceso').length,
      entregado: services.filter(s => s.status === 'entregado').length,
      vencido: services.filter(s => s.status === 'vencido').length,
      cancelado: services.filter(s => s.status === 'cancelado').length
    };

    // Procesar datos para gráfico de tipos
    const typeLabels = ['Formulario 21', 'IVA', 'Renta', 'Contabilidad', 'Constitución', 'Modificación', 'Finiquito', 'Certificados', 'Otro'];
    const typeValues = [
      services.filter(s => s.type === 'formulario_21').length,
      services.filter(s => s.type === 'declaracion_iva').length,
      services.filter(s => s.type === 'declaracion_renta').length,
      services.filter(s => s.type === 'contabilidad_mensual').length,
      services.filter(s => s.type === 'constitucion_empresa').length,
      services.filter(s => s.type === 'modificacion_empresa').length,
      services.filter(s => s.type === 'finiquito').length,
      services.filter(s => s.type === 'certificados').length,
      services.filter(s => s.type === 'otro').length
    ];

    // Procesar datos de ingresos por mes
    const currentYear = new Date().getFullYear();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const revenueValues = months.map((_, index) => {
      return services
        .filter(service => {
          const serviceDate = new Date(service.deliveredAt || service.updatedAt);
          return service.status === 'entregado' &&
                 service.isPaid &&
                 serviceDate.getMonth() === index &&
                 serviceDate.getFullYear() === currentYear;
        })
        .reduce((sum, service) => sum + (service.price || 0), 0);
    });

    // Procesar datos de tendencias (últimos 6 meses)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        label: date.toLocaleString('es-CL', { month: 'short' }),
        month: date.getMonth(),
        year: date.getFullYear()
      };
    });

    const trendCreated = last6Months.map(period => {
      return services.filter(service => {
        const serviceDate = new Date(service.createdAt);
        return serviceDate.getMonth() === period.month &&
               serviceDate.getFullYear() === period.year;
      }).length;
    });

    const trendCompleted = last6Months.map(period => {
      return services.filter(service => {
        const serviceDate = new Date(service.deliveredAt || service.updatedAt);
        return service.status === 'entregado' &&
               serviceDate.getMonth() === period.month &&
               serviceDate.getFullYear() === period.year;
      }).length;
    });

    return {
      statusData,
      typeData: {
        labels: typeLabels,
        values: typeValues
      },
      revenueData: {
        labels: months,
        values: revenueValues
      },
      trendData: {
        labels: last6Months.map(m => m.label),
        created: trendCreated,
        completed: trendCompleted
      }
    };
  }
}
