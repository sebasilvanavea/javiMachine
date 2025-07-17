import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, tap, take } from 'rxjs/operators';

import { 
  AdvancedReportService, 
  ReportFilter, 
  ReportData, 
  ReportMetrics, 
  ExportOptions,
  ChartData
} from '../../services/advanced-report.service';

import { ExportConfigDialogComponent } from './export-config-dialog.component';

// Registrar Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-advanced-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatTableModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatExpansionModule,
    MatTabsModule,
    MatSliderModule,
    MatProgressBarModule,
    MatMenuModule,
    MatBadgeModule,
    MatDialogModule
  ],
  templateUrl: './advanced-reports.component.html',
  styleUrls: ['./advanced-reports.component.scss']
})
export class AdvancedReportsComponent implements OnInit, OnDestroy {
  @ViewChild('statusChart', { static: false }) statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChart', { static: false }) monthlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart', { static: false }) revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart', { static: false }) categoryChartRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  
  // Formularios y filtros
  filterForm!: FormGroup;
  
  // Datos
  reportData: ReportData[] = [];
  filteredData: ReportData[] = [];
  metrics: ReportMetrics | null = null;
  loading = false;
  
  // Configuración de vista
  viewMode: 'table' | 'cards' = 'table';
  selectedTab = 0;
  
  // Gráficos
  chartInstances: Chart[] = [];
  chartData: ChartData[] = [];
  
  // Gráficos
  statusChart: Chart | null = null;
  monthlyChart: Chart | null = null;
  revenueChart: Chart | null = null;
  categoryChart: Chart | null = null;
  
  // Opciones para filtros en español
  serviceTypes = [
    { value: 'journal', label: 'Asientos Contables' },
    { value: 'transaction', label: 'Transacciones' },
    { value: 'adjustment', label: 'Ajustes' }
  ];
  
  serviceStatuses = [
    { value: 'posted', label: 'Contabilizado' },
    { value: 'draft', label: 'Borrador' },
    { value: 'reversed', label: 'Reversado' }
  ];
  
  priorities = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ];
  
  categories = [
    { value: 'operational', label: 'Operacional' },
    { value: 'adjustment', label: 'Ajuste' },
    { value: 'closing', label: 'Cierre' },
    { value: 'opening', label: 'Apertura' }
  ];

  // Columnas para la tabla en español
  displayedColumns: string[] = [
    'entryNumber', 'description', 'status', 'priority', 'amount', 
    'userName', 'createdAt', 'account', 'actions'
  ];

  constructor(
    private reportService: AdvancedReportService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    // Inicializar propiedades explícitamente
    this.reportData = [];
    this.filteredData = [];
    this.metrics = null;
    this.loading = true; // Comenzar en estado de carga
    
    this.initializeForm();
    
    // Verificar inmediatamente si hay datos en cache del servicio
    setTimeout(() => {
      const cachedData = this.reportService.getCachedData();
      if (cachedData && cachedData.length > 0) {
        console.log('🔍 Constructor: Datos encontrados en cache:', cachedData.length);
        this.updateInterfaceWithData(cachedData);
      }
      this.cdr.detectChanges();
      this.cdr.markForCheck();
    }, 0);
  }

  ngOnInit(): void {
    console.log('🚀 Inicializando reportes avanzados...');
    
    // SOLO una suscripción principal a los datos del servicio
    this.subscribeToServiceData();
    
    // Configurar formulario
    this.setupFormSubscriptionsSimple();
    
    // Forzar detección de cambios inicial
    this.cdr.detectChanges();
  }

  // === MÉTODOS DE CONFIGURACIÓN ===

  // Método UNIFICADO para manejar datos del servicio
  private subscribeToServiceData(): void {
    console.log('📡 Configurando suscripción unificada a datos del servicio...');
    
    // Suscribirse a datos en cache del servicio
    this.reportService.cachedData$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => prev.length === curr.length) // Solo procesar si cambia la cantidad
      )
      .subscribe({
        next: (data: ReportData[]) => {
          console.log('📡 Datos recibidos del cache del servicio:', data?.length || 0);
          
          if (data && data.length > 0) {
            console.log('✅ Aplicando datos del cache del servicio');
            this.updateInterfaceWithData(data);
          } else {
            // Si no hay datos, mantener estado de carga y esperar
            console.log('📝 Esperando datos del servicio...');
            this.loading = true;
            this.cdr.detectChanges();
          }
        }
      });
      
    // También suscribirse directamente a los datos filtrados para sincronización
    this.reportService.getFilteredReportData()
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => prev.length === curr.length)
      )
      .subscribe({
        next: (data: ReportData[]) => {
          if (data && data.length > 0 && this.reportData.length === 0) {
            console.log('📡 Datos recibidos desde filtros:', data.length);
            this.updateInterfaceWithData(data);
          }
        }
      });
  }
  
  // Método ÚNICO para actualizar la interfaz con datos
  private updateInterfaceWithData(data: ReportData[]): void {
    console.log('🔄 Actualizando interfaz con datos:', data.length, 'registros');
    
    // Evitar actualizaciones innecesarias si los datos son los mismos
    if (this.reportData.length === data.length && this.reportData.length > 0) {
      console.log('🔄 Datos ya aplicados, saltando actualización duplicada');
      return;
    }
    
    // Actualizar propiedades del componente
    this.reportData = data;
    this.filteredData = data;
    this.loading = false;
    
    // Calcular métricas
    if (data.length > 0) {
      this.metrics = this.reportService.getReportMetrics(data);
    } else {
      this.metrics = this.getEmptyMetrics();
    }
    
    // FORZAR detección de cambios inmediatamente
    this.cdr.detectChanges();
    this.cdr.markForCheck();
    
    // Forzar detección de cambios y actualizar gráficos
    setTimeout(() => {
      this.updateCharts();
      console.log('✅ Interfaz completamente actualizada con', data.length, 'registros');
    }, 50);
  }
  
  // Método para manejar caso sin datos
  private handleEmptyData(): void {
    console.log('📝 Manejando caso sin datos...');
    
    this.reportData = [];
    this.filteredData = [];
    this.metrics = this.getEmptyMetrics();
    this.loading = false;
    
    // FORZAR detección de cambios inmediatamente
    this.cdr.detectChanges();
    this.cdr.markForCheck();
    
    this.snackBar.open(
      'Los servicios se están cargando desde Firebase. La página se actualizará automáticamente.',
      'Entendido',
      { duration: 5000 }
    );
  }

  // Método para carga inmediata de datos - Mejorado
  private loadDataImmediately(): void {
    console.log('⚡ Cargando datos inmediatamente...');
    
    // Primera estrategia: Verificar cache válido
    if (this.reportService.isCacheValid()) {
      console.log('🔍 Cache válido encontrado, cargando datos...');
      
      this.reportService.getAllReportData()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: ReportData[]) => {
            if (data && data.length > 0) {
              console.log('✅ Datos del cache cargados inmediatamente:', data.length, 'registros');
              this.updateInterfaceWithData(data);
              return;
            } else {
              console.log('📝 Cache vacío, procediendo con inicialización...');
              this.executeInitialization();
            }
          }
        });
    } else {
      console.log('📝 No hay cache válido, iniciando carga completa...');
      this.executeInitialization();
    }
  }

  // Método auxiliar para ejecutar la inicialización
  private executeInitialization(): void {
    console.log('🚀 Ejecutando inicialización de datos...');
    
    this.reportService.initializeData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ReportData[]) => {
          console.log('📊 Inicialización completada:', data?.length || 0, 'registros');
          
          if (data && data.length > 0) {
            this.updateInterfaceWithData(data);
          } else {
            console.warn('⚠️ Inicialización sin datos, activando recarga automática...');
            this.activateAutoReload();
          }
        },
        error: (error) => {
          console.error('❌ Error en inicialización:', error);
          console.log('🔄 Activando recarga automática por error...');
          this.activateAutoReload();
        }
      });
  }

  // Método para activar recarga automática
  private activateAutoReload(): void {
    console.log('🔄 Activando sistema de recarga automática...');
    
    // Forzar actualización del servicio
    this.reportService.forceDataRefresh();
    
    // Usar un intervalo para verificar datos cada 2 segundos hasta encontrarlos
    const reloadInterval = setInterval(() => {
      console.log('🔍 Verificando disponibilidad de datos...');
      
      this.reportService.getAllReportData()
        .pipe(take(1))
        .subscribe((data: ReportData[]) => {
          if (data && data.length > 0) {
            console.log('✅ Datos encontrados en recarga automática:', data.length, 'registros');
            this.updateInterfaceWithData(data);
            clearInterval(reloadInterval);
          } else {
            console.log('⏳ Esperando datos...');
          }
        });
    }, 2000);

    // Limpiar intervalo después de 30 segundos máximo
    setTimeout(() => {
      clearInterval(reloadInterval);
      if (this.reportData.length === 0) {
        console.warn('⚠️ Recarga automática agotada, mostrando interfaz vacía');
        this.reportData = [];
        this.filteredData = [];
        this.metrics = this.getEmptyMetrics();
        this.loading = false;
        
        this.snackBar.open(
          'Los datos tardan en cargar. Puede intentar refrescar manualmente.',
          'Recargar',
          { 
            duration: 10000,
            panelClass: ['warning-snackbar']
          }
        ).onAction().subscribe(() => {
          this.forceReload();
        });
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  // Método simplificado para configurar las suscripciones
  private setupFormSubscriptionsSimple(): void {
    console.log('🔧 Configurando suscripciones del formulario...');
    
    // Suscribirse SOLO a cambios del formulario (no a datos iniciales)
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        // Solo procesar cambios después de que tengamos datos iniciales
        tap(filters => console.log('📝 Formulario cambió:', filters))
      )
      .subscribe(filters => {
        // Solo aplicar filtros si ya tenemos datos base
        if (this.reportData.length > 0) {
          console.log('🔍 Aplicando filtros sobre datos existentes');
          this.updateFilters(filters);
        } else {
          console.log('🔍 No hay datos base aún, esperando...');
        }
      });
  }

  // Método para manejar cualquier interacción que requiera datos
  onUserInteraction(): void {
    console.log('👤 Interacción del usuario detectada');
    
    // SIEMPRE forzar detección de cambios en interacciones
    this.cdr.detectChanges();
    this.cdr.markForCheck();
    
    // Si no hay datos, verificar cache del servicio
    if (this.reportData.length === 0) {
      const cachedData = this.reportService.getCachedData();
      if (cachedData && cachedData.length > 0) {
        console.log('👤 Aplicando datos del cache en interacción');
        this.updateInterfaceWithData(cachedData);
      }
    }
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      dateFrom: [null],
      dateTo: [null],
      serviceTypes: [[]],
      serviceStatus: [[]],
      priority: [[]],
      category: [[]],
      minAmount: [null],
      maxAmount: [null],
      searchQuery: ['']
    });
  }

  private setupFormSubscriptions(): void {
    // Inicializar datos explícitamente primero
    console.log('🚀 Inicializando datos del reporte...');
    this.loading = true;
    
    this.reportService.initializeData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ Datos inicializados:', data?.length || 0, 'registros');
          this.reportData = data || [];
          this.filteredData = data || [];
          
          if (data && data.length > 0) {
            this.metrics = this.reportService.getReportMetrics(data);
            this.updateCharts();
            console.log('✅ Métricas calculadas y gráficos actualizados');
          } else {
            console.warn('⚠️ No hay datos para mostrar en el reporte');
            this.metrics = this.getEmptyMetrics();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error en inicialización de datos:', error);
          this.reportData = [];
          this.filteredData = [];
          this.metrics = this.getEmptyMetrics();
          this.loading = false;
        }
      });

    // Actualizar filtros cuando cambie el formulario
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(filters => {
        this.updateFilters(filters);
      });

    // Suscribirse a los datos filtrados DESPUÉS de la inicialización
    this.reportService.getFilteredReportData()
      .pipe(
        takeUntil(this.destroy$),
        // Ignorar el primer valor vacío durante la inicialización
        tap((data: ReportData[]) => console.log('🔍 Datos filtrados recibidos:', data?.length || 0))
      )
      .subscribe({
        next: (data) => {
          // Solo actualizar si no estamos en proceso de carga inicial
          if (!this.loading && data) {
            console.log('� Aplicando datos filtrados:', data.length, 'registros');
            this.reportData = data;
            this.filteredData = data;
            
            if (data.length > 0) {
              this.metrics = this.reportService.getReportMetrics(data);
              this.updateCharts();
            } else {
              this.metrics = this.getEmptyMetrics();
            }
          }
        },
        error: (error) => {
          console.error('❌ Error en datos filtrados:', error);
        }
      });

    // Suscribirse al estado de carga
    this.reportService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        // Solo actualizar loading si no estamos en el proceso de inicialización manual
        if (!this.loading) {
          this.loading = loading;
        }
      });
  }

  private loadData(): void {
    console.log('🚀 Iniciando carga de datos del reporte...');
    
    // Forzar carga inmediata de datos
    this.loading = true;
    
    // Ejecutar diagnóstico automático después de más tiempo para que se carguen los servicios
    setTimeout(() => {
      console.log('⏰ Ejecutando diagnóstico después de esperar...');
      this.testDataConnection();
    }, 3000); // Aumentar a 3 segundos
    
    // La carga automática se maneja por el servicio
    this.reportService.updateFilters({});
    console.log('✅ Filtros actualizados para cargar datos');
  }

  // Método para actualizar filtros
  private updateFilters(filters: any): void {
    console.log('🔍 Actualizando filtros:', filters);
    
    const reportFilter: ReportFilter = {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      serviceTypes: filters.serviceTypes,
      serviceStatus: filters.serviceStatus,
      priority: filters.priority,
      category: filters.category,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      searchQuery: filters.searchQuery
    };
    
    // Actualizar filtros en el servicio
    this.reportService.updateFilters(reportFilter);
    
    // Obtener datos filtrados y actualizar inmediatamente
    this.reportService.getFilteredReportData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ReportData[]) => {
          console.log('� Datos filtrados recibidos:', data?.length || 0);
          this.filteredData = data || [];
          
          if (data && data.length > 0) {
            this.metrics = this.reportService.getReportMetrics(data);
            this.updateCharts();
          } else {
            this.metrics = this.getEmptyMetrics();
          }
        },
        error: (error) => {
          console.error('❌ Error aplicando filtros:', error);
        }
      });
  }

  // === MÉTODOS DE VISTA ===

  clearFilters(): void {
    console.log('🧹 Limpiando filtros desde el componente...');
    
    this.filterForm.reset({
      dateFrom: null,
      dateTo: null,
      serviceTypes: [],
      serviceStatus: [],
      priority: [],
      category: [],
      minAmount: null,
      maxAmount: null,
      searchQuery: ''
    });
    
    // Limpiar filtros en el servicio
    this.reportService.clearFilters();
    
    // Forzar actualización inmediata de datos
    this.reportService.getAllReportData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ReportData[]) => {
          console.log('✅ Datos recargados después de limpiar filtros:', data?.length || 0);
          this.reportData = data || [];
          this.filteredData = data || [];
          
          if (data && data.length > 0) {
            this.metrics = this.reportService.getReportMetrics(data);
            this.updateCharts();
          } else {
            this.metrics = this.getEmptyMetrics();
          }
        },
        error: (error) => {
          console.error('❌ Error al recargar datos:', error);
        }
      });
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    if (index === 1) { // Tab de gráficos
      setTimeout(() => this.updateCharts(), 100);
    }
  }

  private getEmptyMetrics(): ReportMetrics {
    return {
      totalServices: 0,
      completedServices: 0,
      pendingServices: 0,
      totalRevenue: 0,
      averageCompletionTime: 0,
      averageRating: 0,
      topServiceTypes: [],
      monthlyTrends: [],
      statusDistribution: [],
      priorityDistribution: [],
      categoryPerformance: []
    };
  }

  // === MÉTODOS DE TRADUCCIÓN ===

  // Traducir estados al español
  translateStatus(status: string): string {
    const translations: Record<string, string> = {
      'posted': 'Contabilizado',
      'draft': 'Borrador',
      'reversed': 'Reversado'
    };
    return translations[status] || status;
  }

  // Traducir prioridades al español
  translatePriority(priority: string): string {
    const translations: Record<string, string> = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'urgent': 'Urgente'
    };
    return translations[priority] || priority;
  }

  // Traducir tipos al español
  translateType(type: string): string {
    const translations: Record<string, string> = {
      'journal': 'Asiento Contable',
      'transaction': 'Transacción',
      'adjustment': 'Ajuste'
    };
    return translations[type] || type;
  }

  // Traducir categorías al español
  translateCategory(category: string): string {
    const translations: Record<string, string> = {
      'operational': 'Operacional',
      'adjustment': 'Ajuste',
      'closing': 'Cierre',
      'opening': 'Apertura'
    };
    return translations[category] || category;
  }

  // === MÉTODOS DE GRÁFICOS ===

  private updateCharts(): void {
    if (!this.reportData.length) return;

    setTimeout(() => {
      this.createStatusChart();
      this.createMonthlyChart();
      this.createRevenueChart();
      this.createCategoryChart();
    }, 100);
  }

  private createStatusChart(): void {
    if (!this.statusChartRef?.nativeElement) return;

    this.destroyChart('status');

    const chartData = this.reportService.getChartData(this.reportData, 'status');
    
    this.statusChart = new Chart(this.statusChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Distribución por Estado'
          }
        }
      }
    });
  }

  private createMonthlyChart(): void {
    if (!this.monthlyChartRef?.nativeElement) return;

    this.destroyChart('monthly');

    const chartData = this.reportService.getChartData(this.reportData, 'monthly');
    
    this.monthlyChart = new Chart(this.monthlyChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Tendencias Mensuales'
          }
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
        }
      }
    });
  }

  private createRevenueChart(): void {
    if (!this.revenueChartRef?.nativeElement) return;

    this.destroyChart('revenue');

    const chartData = this.reportService.getChartData(this.reportData, 'revenue');
    
    this.revenueChart = new Chart(this.revenueChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Evolución de Ingresos'
          }
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
        }
      }
    });
  }

  private createCategoryChart(): void {
    if (!this.categoryChartRef?.nativeElement) return;

    this.destroyChart('category');

    const chartData = this.reportService.getChartData(this.reportData, 'category');
    
    this.categoryChart = new Chart(this.categoryChartRef.nativeElement, {
      type: 'polarArea',
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Servicios por Categoría'
          }
        }
      }
    });
  }

  private destroyChart(chartType: 'status' | 'monthly' | 'revenue' | 'category'): void {
    switch (chartType) {
      case 'status':
        if (this.statusChart) {
          this.statusChart.destroy();
          this.statusChart = null;
        }
        break;
      case 'monthly':
        if (this.monthlyChart) {
          this.monthlyChart.destroy();
          this.monthlyChart = null;
        }
        break;
      case 'revenue':
        if (this.revenueChart) {
          this.revenueChart.destroy();
          this.revenueChart = null;
        }
        break;
      case 'category':
        if (this.categoryChart) {
          this.categoryChart.destroy();
          this.categoryChart = null;
        }
        break;
    }
  }

  private destroyCharts(): void {
    this.destroyChart('status');
    this.destroyChart('monthly');
    this.destroyChart('revenue');
    this.destroyChart('category');
  }

  // === MÉTODOS DE EXPORTACIÓN ===

  async exportToPDF(): Promise<void> {
    if (!this.reportData.length || !this.metrics) {
      this.showMessage('No hay datos para exportar', 'warning');
      return;
    }

    try {
      const options: ExportOptions = {
        format: 'pdf',
        includeCharts: false,
        includeMetrics: true,
        includeRawData: true,
        orientation: 'landscape',
        pageSize: 'a4',
        fileName: `reporte-servicios-${new Date().toISOString().split('T')[0]}.pdf`
      };

      await this.reportService.exportReport(this.reportData, this.metrics, options);
      this.showMessage('Reporte PDF exportado exitosamente', 'success');
    } catch (error) {
      this.showMessage('Error al exportar PDF', 'error');
      console.error('Error exportando PDF:', error);
    }
  }

  async exportToExcel(): Promise<void> {
    if (!this.reportData.length || !this.metrics) {
      this.showMessage('No hay datos para exportar', 'warning');
      return;
    }

    try {
      const options: ExportOptions = {
        format: 'excel',
        includeMetrics: true,
        includeRawData: true,
        fileName: `reporte-servicios-${new Date().toISOString().split('T')[0]}.xlsx`
      };

      await this.reportService.exportReport(this.reportData, this.metrics, options);
      this.showMessage('Reporte Excel exportado exitosamente', 'success');
    } catch (error) {
      this.showMessage('Error al exportar Excel', 'error');
      console.error('Error exportando Excel:', error);
    }
  }

  async exportToCSV(): Promise<void> {
    if (!this.reportData.length || !this.metrics) {
      this.showMessage('No hay datos para exportar', 'warning');
      return;
    }

    try {
      const options: ExportOptions = {
        format: 'csv',
        includeRawData: true,
        fileName: `reporte-servicios-${new Date().toISOString().split('T')[0]}.csv`
      };

      await this.reportService.exportReport(this.reportData, this.metrics, options);
      this.showMessage('Reporte CSV exportado exitosamente', 'success');
    } catch (error) {
      this.showMessage('Error al exportar CSV', 'error');
      console.error('Error exportando CSV:', error);
    }
  }

  // === MÉTODOS DE UTILIDAD ===

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'pendiente': 'schedule',
      'en-proceso': 'cached',
      'completado': 'check_circle',
      'cancelado': 'cancel',
      'pausado': 'pause_circle_filled'
    };
    return icons[status] || 'help';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pendiente': 'primary',
      'en-proceso': 'accent',
      'completado': 'success',
      'cancelado': 'warn',
      'pausado': 'disabled'
    };
    return colors[status] || 'primary';
  }

  getPriorityIcon(priority: string): string {
    const icons: { [key: string]: string } = {
      'baja': 'keyboard_arrow_down',
      'media': 'remove',
      'alta': 'keyboard_arrow_up',
      'urgente': 'priority_high'
    };
    return icons[priority] || 'help';
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'baja': '#10B981',
      'media': '#F59E0B',
      'alta': '#F97316',
      'urgente': '#EF4444'
    };
    return colors[priority] || '#6B7280';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: type === 'error' ? 5000 : 3000,
      panelClass: [`snackbar-${type}`]
    });
  }

  // === MÉTODOS DE INTERACCIÓN ===

  onFilterChange(): void {
    // Los cambios se manejan automáticamente por el formulario reactivo
  }

  refreshData(): void {
    console.log('🔄 Refrescando datos manualmente...');
    this.loading = true;
    this.reportService.forceDataRefresh();
  }

  // Método específico para el botón "Recargar"
  forceReload(): void {
    console.log('🔄 Forzando recarga completa...');
    this.loading = true;
    
    // Limpiar datos actuales
    this.reportData = [];
    this.filteredData = [];
    this.metrics = this.getEmptyMetrics();
    
    // Invalidar cache del servicio
    this.reportService.invalidateCache();
    
    // Cargar datos desde cero
    this.reportService.forceDataRefresh();
  }

  resetFilters(): void {
    this.clearFilters();
  }

  // === GETTERS PARA TEMPLATE ===

  get hasData(): boolean {
    return this.reportData.length > 0;
  }

  get hasFilters(): boolean {
    const filters = this.reportService.getFilters();
    return Object.keys(filters).some(key => {
      const value = (filters as any)[key];
      return value !== null && value !== undefined && value !== '' && 
             (Array.isArray(value) ? value.length > 0 : true);
    });
  }

  get totalFiltered(): number {
    return this.filteredData.length;
  }

  get totalOriginal(): number {
    return this.reportData.length;
  }

  // === EXPORTACIÓN AVANZADA ===

  openAdvancedExportDialog(): void {
    const defaultOptions = this.reportService.getDefaultExportOptions();
    
    const dialogData = {
      defaultOptions,
      availableData: this.filteredData,
      availableColumns: this.getAvailableColumns(),
      availableClients: this.getUniqueClients(),
      availableServiceTypes: this.getUniqueServiceTypes(),
      availableStatuses: this.getUniqueStatuses()
    };

    const dialogRef = this.dialog.open(ExportConfigDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'export') {
        this.executeAdvancedExport(result.options);
      } else if (result && result.action === 'preview') {
        this.showExportPreview(result.options);
      }
    });
  }

  private async executeAdvancedExport(options: ExportOptions): Promise<void> {
    try {
      // Usar setTimeout para evitar NG0100 al cambiar loading state
      setTimeout(() => this.loading = true, 0);
      
      // Mostrar notificación de inicio después de un pequeño delay
      setTimeout(() => {
        this.snackBar.open(
          `Generando reporte en formato ${options.format.toUpperCase()}...`,
          'Cerrar',
          { duration: 3000 }
        );
      }, 100);

      // Ejecutar exportación avanzada
      await this.reportService.exportAdvancedReport(
        this.filteredData,
        this.metrics!,
        this.chartData,
        options
      );

      // Mostrar notificación de éxito con delay
      setTimeout(() => {
        this.snackBar.open(
          `Reporte ${options.format.toUpperCase()} generado exitosamente`,
          'Cerrar',
          { 
            duration: 5000,
            panelClass: ['success-snackbar']
          }
        );
      }, 200);

    } catch (error) {
      console.error('Error al exportar reporte avanzado:', error);
      
      // Mostrar error con delay para evitar NG0100
      setTimeout(() => {
        this.snackBar.open(
          'Error al generar el reporte. Intente nuevamente.',
          'Cerrar',
          { 
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }, 200);
    } finally {
      // Usar setTimeout para evitar NG0100 al cambiar loading state
      setTimeout(() => this.loading = false, 300);
    }
  }

  private showExportPreview(options: ExportOptions): void {
    const filteredCount = this.getFilteredDataCount(options);
    const selectedColumns = options.dataSelection?.columns?.length || 0;
    
    let contentSummary = [];
    if (options.includeMetrics) contentSummary.push('Métricas');
    if (options.includeCharts) contentSummary.push('Gráficos');
    if (options.includeRawData) contentSummary.push('Datos');
    if (options.includeSummary) contentSummary.push('Resumen');
    if (options.includeAnalysis) contentSummary.push('Análisis');

    const message = `
      Vista Previa del Reporte:
      
      📊 Formato: ${options.format.toUpperCase()}
      📋 Registros: ${filteredCount} de ${this.filteredData.length}
      📝 Columnas: ${selectedColumns}
      📑 Contenido: ${contentSummary.join(', ')}
      📄 Archivo: ${options.fileName}
      
      ¿Desea continuar con la exportación?
    `;

    // Aquí podrías mostrar un diálogo de confirmación con la vista previa
    this.snackBar.open(
      'Vista previa generada. Verifique la configuración.',
      'Cerrar',
      { duration: 5000 }
    );
  }

  private getFilteredDataCount(options: ExportOptions): number {
    let data = [...this.filteredData];
    
    if (options.dataSelection) {
      const selection = options.dataSelection;
      
      if (selection.statusFilter && selection.statusFilter.length > 0) {
        data = data.filter(d => selection.statusFilter!.includes(d.status));
      }
      
      if (selection.serviceTypeFilter && selection.serviceTypeFilter.length > 0) {
        data = data.filter(d => selection.serviceTypeFilter!.includes(d.type));
      }
      
      if (selection.clientFilter && selection.clientFilter.length > 0) {
        data = data.filter(d => selection.clientFilter!.includes(d.userName));
      }
    }
    
    return data.length;
  }

  private getAvailableColumns(): string[] {
    return [
      'Cliente',
      'Email',
      'Servicio',
      'Tipo',
      'Estado',
      'Prioridad',
      'Monto',
      'Progreso',
      'Fecha Inicio',
      'Fecha Actualización',
      'Horas Estimadas',
      'Horas Reales',
      'Calificación',
      'Asignado a'
    ];
  }

  private getUniqueClients(): string[] {
    const clients = new Set(this.filteredData.map(d => d.userName));
    return Array.from(clients).sort();
  }

  private getUniqueServiceTypes(): string[] {
    const types = new Set(this.filteredData.map(d => d.type));
    return Array.from(types).sort();
  }

  private getUniqueStatuses(): string[] {
    const statuses = new Set(this.filteredData.map(d => d.status));
    return Array.from(statuses).sort();
  }

  // Exportación rápida con configuración predeterminada
  async quickExport(format: 'pdf' | 'excel' | 'csv' | 'word'): Promise<void> {
    const defaultOptions = this.reportService.getDefaultExportOptions();
    defaultOptions.format = format;
    
    await this.executeAdvancedExport(defaultOptions);
  }

  // Método de prueba para diagnóstico
  async testSimpleExport(): Promise<void> {
    try {
      console.log('🚀 Iniciando test de exportación simple...');
      
      // Test básico de descarga CSV
      const csvData = 'Nombre,Valor\nTest,123\nEjemplo,456';
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-simple.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      this.snackBar.open('✅ Test de exportación exitoso - Revisa tu carpeta de descargas', 'Cerrar', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      console.error('❌ Error en test simple:', error);
      this.snackBar.open('❌ Error en test de exportación', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // Método de diagnóstico de datos
  async testDataConnection(): Promise<void> {
    console.log('🔍 === INICIANDO DIAGNÓSTICO DE CONEXIÓN DE DATOS ===');
    
    try {
      this.loading = true;
      
      // Llamar al método de diagnóstico del servicio
      const testData = await this.reportService.testDataSources();
      
      if (testData && testData.length > 0) {
        console.log('✅ Datos obtenidos exitosamente:', testData.length, 'registros');
        
        // Forzar actualización de la vista
        this.reportData = testData;
        this.filteredData = testData;
        this.metrics = this.reportService.getReportMetrics(testData);
        this.loading = false;
        
        this.snackBar.open(`✅ Datos cargados: ${testData.length} registros`, 'Cerrar', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        
        // Actualizar gráficos
        this.updateCharts();
        
      } else {
        console.warn('⚠️ No se obtuvieron datos');
        this.loading = false;
        this.snackBar.open('⚠️ No se encontraron datos en la base de datos', 'Cerrar', {
          duration: 5000,
          panelClass: ['warning-snackbar']
        });
      }
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      this.loading = false;
      this.snackBar.open('❌ Error al conectar con la base de datos', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // Método para crear datos de prueba si no existen
  async createSampleData(): Promise<void> {
    console.log('🔍 === CREANDO DATOS DE PRUEBA ===');
    
    try {
      this.loading = true;
      this.snackBar.open('🔄 Verificando y creando datos de prueba...', '', {
        duration: 0
      });
      
      await this.reportService.createSampleDataIfNeeded();
      
      // Esperar un momento para que se procesen los datos
      setTimeout(async () => {
        // Ejecutar diagnóstico después de crear datos
        await this.testDataConnection();
        
        this.snackBar.dismiss();
        this.snackBar.open('✅ Datos de prueba procesados correctamente', 'Cerrar', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error creando datos de prueba:', error);
      this.loading = false;
      this.snackBar.dismiss();
      this.snackBar.open('❌ Error creando datos de prueba', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

}
