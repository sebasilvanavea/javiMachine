import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, of, forkJoin, Subject, timer } from 'rxjs';
import { map, switchMap, catchError, take, takeUntil, tap, filter, timeout, distinctUntilChanged, startWith } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Importar servicios reales
import { AccountingService as AccountingServiceOld, JournalEntry, Account } from './accounting.service';
import { AccountingServiceService } from './accounting-service.service';
import { AccountingService, ServiceStatus, ServiceType, ServicePriority } from '../models/service.model';
import { UserService } from './user.service';

// Interfaces para el sistema de reportes
export interface ReportFilter {
  dateFrom?: Date;
  dateTo?: Date;
  serviceTypes?: string[];
  serviceStatus?: string[];
  userIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  priority?: string[];
  category?: string[];
  tags?: string[];
  searchQuery?: string;
}
export interface ReportData {
  id: string;
  entryNumber: string;
  description: string;
  type: 'journal' | 'transaction' | 'adjustment';
  status: 'posted' | 'draft' | 'reversed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'operational' | 'adjustment' | 'closing' | 'opening';
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  postedAt?: Date;
  userName: string;
  userEmail: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  reference: string;
  isPosted: boolean;
  createdBy: string;
}

export interface ReportMetrics {
  totalServices: number;
  completedServices: number;
  pendingServices: number;
  totalRevenue: number;
  averageCompletionTime: number;
  averageRating: number;
  topServiceTypes: { type: string; count: number; revenue: number }[];
  monthlyTrends: { month: string; services: number; revenue: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  priorityDistribution: { priority: string; count: number }[];
  categoryPerformance: { category: string; count: number; avgRating: number; avgHours: number }[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'word';
  includeCharts?: boolean;
  includeMetrics?: boolean;
  includeRawData?: boolean;
  includeFilters?: boolean;
  includeSummary?: boolean;
  includeAnalysis?: boolean;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal' | 'a3';
  fileName?: string;
  
  // Configuraciones específicas por formato
  pdfConfig?: {
    includeImages: boolean;
    includeWatermark: boolean;
    headerText?: string;
    footerText?: string;
    logoUrl?: string;
    colorScheme?: string;
  };
  
  excelConfig?: {
    includeFormulas: boolean;
    multipleSheets: boolean;
    sheetNames?: string[];
    includeFormatting: boolean;
  };
  
  wordConfig?: {
    includeTableOfContents: boolean;
    includePageNumbers: boolean;
    documentTitle?: string;
    author?: string;
    includeHeaderFooter: boolean;
  };
  
  csvConfig?: {
    delimiter: ',' | ';' | '\t';
    includeHeaders: boolean;
    encoding: 'utf-8' | 'latin1';
  };
  
  // Selección de datos específicos
  dataSelection?: {
    columns: string[];
    statusFilter?: string[];
    serviceTypeFilter?: string[];
    clientFilter?: string[];
  };
  
  // Configuración de plantilla
  template?: {
    name: string;
    colorScheme?: 'default' | 'blue' | 'green' | 'corporate';
    logoPosition?: 'header' | 'footer' | 'watermark';
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedReportService implements OnDestroy {
  private filtersSubject = new BehaviorSubject<ReportFilter>({});
  public filters$ = this.filtersSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private destroy$ = new Subject<void>();

  // Cache para mejorar rendimiento
  private dataCache = new BehaviorSubject<ReportData[]>([]);
  public cachedData$ = this.dataCache.asObservable();
  
  private lastCacheUpdate = 0;
  private cacheTimeout = 30000; // 30 segundos de cache

  private accountingServiceOld = inject(AccountingServiceOld);
  private accountingService = inject(AccountingServiceService);
  private userService = inject(UserService);

  constructor() {
    // Estrategia completamente reactiva con precarga de datos
    this.initializeReactiveDataFlow();
    this.preloadDataSources();
  }

  // Nueva estrategia: Flujo de datos completamente reactivo con datos enriquecidos
  private initializeReactiveDataFlow(): void {
    console.log('🚀 Inicializando flujo de datos reactivo...');
    
    // Suscribirse directamente a los cambios de servicios de Firebase
    this.accountingService.services$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => prev?.length === curr?.length),
        tap(services => console.log('📡 Servicios recibidos reactivamente:', services?.length || 0))
      )
      .subscribe({
        next: (services: any) => {
          if (services && Array.isArray(services) && services.length > 0) {
            console.log('✅ Procesando servicios reactivamente:', services.length);
            
            // Usar datos básicos primero, luego enriquecer con datos completos
            const basicReportData = this.convertServicesToReportData(services, [], []);
            
            // Actualizar cache de forma asíncrona para evitar NG0100
            Promise.resolve().then(() => {
              this.dataCache.next(basicReportData);
              this.lastCacheUpdate = Date.now();
              console.log('✅ Cache actualizado reactivamente (básico):', basicReportData.length, 'registros');
            });
          } else {
            console.log('📝 Servicios aún no disponibles...');
          }
        },
        error: (error) => {
          console.error('❌ Error en flujo reactivo:', error);
        }
      });
  }

  // Método para precargar fuentes de datos
  private preloadDataSources(): void {
    console.log('🔄 Precargando fuentes de datos...');
    
    // Forzar la carga inicial de todos los servicios necesarios
    combineLatest([
      this.accountingService.services$,
      this.userService.getUsers(),
      this.accountingServiceOld.getChartOfAccounts()
    ]).pipe(
      takeUntil(this.destroy$),
      filter(([services, users, accounts]) => {
        // Solo proceder cuando todos los datos estén disponibles
        return services && Array.isArray(services) && services.length > 0 &&
               users && Array.isArray(users) && users.length > 0;
      }),
      take(1),
      catchError(error => {
        console.error('❌ Error en precarga:', error);
        return of([[], [], []]);
      })
    ).subscribe({
      next: ([services, users, accounts]) => {
        console.log('✅ Datos precargados exitosamente:', {
          services: services.length,
          users: users.length,
          accounts: accounts?.length || 0
        });
        
        // Convertir y almacenar en cache inmediatamente de forma asíncrona
        const reportData = this.convertServicesToReportData(services, accounts || [], users || []);
        
        // Usar Promise.resolve() para evitar NG0100
        Promise.resolve().then(() => {
          this.dataCache.next(reportData);
          this.lastCacheUpdate = Date.now();
          console.log('🎯 Cache inicializado con datos completos:', reportData.length, 'registros');
        });
      },
      error: (error) => {
        console.error('❌ Error procesando datos precargados:', error);
      }
    });
  }

  // Método de inicialización explícita para componentes - Usando cache precargado
  initializeData(): Observable<ReportData[]> {
    console.log('🔧 Inicialización explícita - verificando cache precargado...');
    
    // Si hay datos válidos en cache, retornarlos inmediatamente
    if (this.isCacheValid()) {
      console.log('✅ Cache precargado válido, retornando datos inmediatamente:', this.dataCache.value.length, 'registros');
      return of(this.dataCache.value);
    }
    
    console.log('📝 Cache vacío, esperando datos precargados de Firebase...');
    
    // Esperar hasta que el cache se llene con datos precargados
    return this.cachedData$.pipe(
      tap(data => console.log('📡 Verificando cache:', data?.length || 0, 'registros')),
      filter((data: ReportData[]) => data && Array.isArray(data) && data.length > 0),
      take(1),
      map((data: ReportData[]) => {
        console.log('✅ Datos del cache confirmados:', data.length, 'registros');
        return data;
      }),
      timeout(30000), // Timeout de 30 segundos para Firebase
      catchError((error) => {
        console.error('❌ Error esperando datos precargados:', error);
        // Fallback: intentar cargar datos directamente
        return this.loadDataDirectly();
      })
    );
  }

  // Método de fallback para cargar datos directamente
  private loadDataDirectly(): Observable<ReportData[]> {
    console.log('� Fallback: cargando datos directamente...');
    
    return this.accountingService.services$.pipe(
      filter((services: any) => services && Array.isArray(services) && services.length > 0),
      take(1),
      map((services: any) => {
        console.log('📊 Servicios cargados directamente:', services.length);
        
        const reportData = this.convertServicesToReportData(services, [], []);
        console.log('✅ Datos convertidos directamente:', reportData.length, 'registros');
        
        // Actualizar cache
        this.dataCache.next(reportData);
        this.lastCacheUpdate = Date.now();
        
        return reportData;
      }),
      catchError((error) => {
        console.error('❌ Error en carga directa:', error);
        return of([]);
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === MÉTODOS DE ESTADO ===

  // Verificar si los datos están listos para usar
  isDataReady(): Observable<boolean> {
    return this.cachedData$.pipe(
      map(data => data && data.length > 0),
      distinctUntilChanged()
    );
  }

  // Obtener el estado actual de carga
  getDataStatus(): { hasData: boolean; count: number; lastUpdate: number } {
    const data = this.dataCache.value;
    return {
      hasData: data && data.length > 0,
      count: data ? data.length : 0,
      lastUpdate: this.lastCacheUpdate
    };
  }

  // Método público para obtener datos del cache directamente
  getCachedData(): ReportData[] {
    return this.dataCache.value;
  }

  // === MÉTODOS DE FILTROS ===
  
  updateFilters(filters: Partial<ReportFilter>): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, ...filters });
  }

  clearFilters(): void {
    console.log('🧹 Limpiando filtros...');
    this.filtersSubject.next({});
    
    // Los datos se cargan automáticamente por el flujo reactivo
    console.log('✅ Filtros limpiados, datos disponibles:', this.dataCache.value.length);
  }

  getFilters(): ReportFilter {
    return this.filtersSubject.value;
  }

  // === OBTENCIÓN DE DATOS ===

  // Método optimizado para obtener datos filtrados del cache precargado
  getFilteredReportData(): Observable<ReportData[]> {
    return combineLatest([
      this.cachedData$,
      this.filters$
    ]).pipe(
      map(([data, filters]) => {
        console.log('🔍 getFilteredReportData - datos:', data.length, 'filtros:', Object.keys(filters).length);
        
        if (data.length === 0) {
          console.log('📝 Sin datos en cache, los datos se cargarán automáticamente...');
          return [];
        }
        
        // Si no hay filtros activos, retornar todos los datos
        const hasActiveFilters = Object.values(filters).some(value => {
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'string') return value.trim().length > 0;
          return value !== undefined && value !== null;
        });
        
        if (!hasActiveFilters) {
          console.log('✅ Sin filtros activos - retornando todos los datos:', data.length);
          return data;
        }
        
        const filtered = this.applyFilters(data, filters);
        console.log('✅ Datos filtrados:', filtered.length, 'de', data.length);
        return filtered;
      }),
      // Inicializar con datos vacíos si es necesario, pero mostrar datos tan pronto como estén disponibles
      startWith([])
    );
  }

  // Método directo optimizado
  getAllReportData(): Observable<ReportData[]> {
    console.log('🔍 getAllReportData() - Verificando cache...');
    
    const now = Date.now();
    if (this.dataCache.value.length > 0 && (now - this.lastCacheUpdate) < this.cacheTimeout) {
      console.log('✅ Retornando datos del cache inmediatamente');
      return of(this.dataCache.value);
    }
    
    // Si no hay cache válido, cargar de forma optimizada
    return this.fetchOptimizedReportData({});
  }

  // Método de carga optimizada que evita operaciones innecesarias
  private fetchOptimizedReportData(filters: ReportFilter): Observable<ReportData[]> {
    console.log('🔍 fetchOptimizedReportData iniciado');
    
    return forkJoin({
      services: this.accountingService.services$.pipe(
        take(1),
        catchError(() => of([]))
      ),
      accounts: this.accountingServiceOld.getChartOfAccounts().pipe(
        take(1),
        catchError(() => of([]))
      ),
      users: this.userService.getUsers().pipe(
        take(1),
        catchError(() => of([]))
      )
    }).pipe(
      map(({ services, accounts, users }) => {
        console.log('📊 Datos obtenidos optimizados:', services?.length || 0, 'servicios');
        
        if (!services || services.length === 0) {
          return [];
        }
        
        const reportData = this.convertServicesToReportData(services, accounts || [], users || []);
        
        // Actualizar cache usando Promise.resolve() para evitar NG0100
        Promise.resolve().then(() => {
          this.dataCache.next(reportData);
          this.lastCacheUpdate = Date.now();
        });
        
        return this.applyFilters(reportData, filters);
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  // Método de diagnóstico optimizado - COMPLETAMENTE REESCRITO
  async testDataSources(): Promise<ReportData[]> {
    console.log('🔍 === DIAGNÓSTICO OPTIMIZADO ===');
    
    // Si hay datos en cache, retornarlos inmediatamente
    if (this.dataCache.value.length > 0) {
      console.log('✅ Retornando datos del cache para diagnóstico');
      return this.dataCache.value;
    }
    
    try {
      const [services, accounts, users] = await Promise.all([
        this.accountingService.services$.pipe(take(1)).toPromise(),
        this.accountingServiceOld.getChartOfAccounts().pipe(take(1)).toPromise(),
        this.userService.getUsers().pipe(take(1)).toPromise()
      ]);
      
      console.log('✅ Diagnóstico:', {
        services: services?.length || 0,
        accounts: accounts?.length || 0,
        users: users?.length || 0
      });
      
      if (services && services.length > 0) {
        const reportData = this.convertServicesToReportData(services, accounts || [], users || []);
        
        // Actualizar cache usando Promise.resolve() para evitar NG0100
        Promise.resolve().then(() => {
          this.dataCache.next(reportData);
          this.lastCacheUpdate = Date.now();
        });
        
        return reportData;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      return [];
    }
  }

  // Forzar actualización del cache - SIN LOADING STATE
  forceDataRefresh(): void {
    console.log('🔄 Forzando actualización del cache...');
    this.lastCacheUpdate = 0; // Invalidar cache
    // El flujo reactivo se encargará de recargar automáticamente
  }

  // Método optimizado de conversión de servicios con datos completos
  private convertServicesToReportData(
    services: AccountingService[], 
    accounts: Account[], 
    users: any[]
  ): ReportData[] {
    if (!services || services.length === 0) {
      console.log('⚠️ No hay servicios para convertir');
      return [];
    }
    
    console.log('🔄 Convirtiendo servicios con datos completos:', {
      services: services.length,
      accounts: accounts.length,
      users: users.length
    });
    
    // Pre-crear mapas para búsquedas rápidas
    const userMap = new Map(users.map(u => [u.id, u]));
    const accountMap = new Map(accounts.map(a => [a.code, a]));
    
    const reportData: ReportData[] = services.map(service => {
      const user = userMap.get(service.userId);
      
      // Mapeo directo y rápido de estados
      const reportStatus = service.status === ServiceStatus.ENTREGADO ? 'posted' : 
                          (service.status === ServiceStatus.VENCIDO || service.status === ServiceStatus.CANCELADO) ? 'reversed' : 'draft';

      const transactionType = service.type === ServiceType.FORMULARIO_21 ? 'journal' : 
                             service.type === ServiceType.OTRO ? 'adjustment' : 'transaction';

      const priority = service.priority === ServicePriority.URGENTE ? 'urgent' :
                      service.priority === ServicePriority.ALTA ? 'high' :
                      service.priority === ServicePriority.BAJA ? 'low' : 'medium';

      const category = service.type === ServiceType.FORMULARIO_21 ? 'closing' :
                      service.type === ServiceType.OTRO ? 'adjustment' : 'operational';

      // Buscar cuenta relacionada si existe
      const accountCode = `SRV-${service.type}`;
      const relatedAccount = accountMap.get(accountCode);

      return {
        id: service.id,
        entryNumber: `SRV-${service.id.substring(0, 8)}`,
        description: service.description || service.title,
        type: transactionType,
        status: reportStatus,
        priority: priority,
        category: category,
        amount: service.price || 0,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        postedAt: service.status === ServiceStatus.ENTREGADO ? service.updatedAt : undefined,
        userName: user?.name || service.userName || 'Usuario Desconocido',
        userEmail: user?.email || service.userEmail || 'sin-email@sistema.com',
        accountCode: accountCode,
        accountName: relatedAccount?.name || `Servicio ${service.type}`,
        debit: service.status === ServiceStatus.ENTREGADO ? service.price || 0 : 0,
        credit: service.status !== ServiceStatus.ENTREGADO ? service.price || 0 : 0,
        reference: `${service.type}-${service.id.substring(0, 8)}`,
        isPosted: service.status === ServiceStatus.ENTREGADO,
        createdBy: service.userId
      };
    });
    
    console.log('✅ Conversión optimizada completada:', reportData.length, 'registros');
    return reportData;
  }

  // Convertir datos contables a formato de reporte
  private convertToReportData(
    journalEntries: JournalEntry[], 
    accounts: Account[], 
    users: any[]
  ): ReportData[] {
    console.log('🔄 Convirtiendo datos:', {
      journalEntries: journalEntries?.length || 0,
      accounts: accounts?.length || 0,
      users: users?.length || 0
    });
    
    if (!journalEntries || journalEntries.length === 0) {
      console.warn('⚠️ No hay asientos contables para convertir');
      return [];
    }
    
    const reportData: ReportData[] = [];
    
    journalEntries.forEach(entry => {
      if (!entry.entries || entry.entries.length === 0) {
        console.warn('⚠️ Asiento sin líneas de detalle:', entry.id);
        return;
      }
      
      entry.entries.forEach(line => {
        const account = accounts.find(a => a.id === line.accountId);
        const user = users.find(u => u.id === entry.createdBy);
        
        reportData.push({
          id: `${entry.id}_${line.id || Math.random()}`,
          entryNumber: entry.number || `AST-${entry.id}`,
          description: line.description || entry.description || 'Sin descripción',
          type: this.determineTransactionType(entry),
          status: entry.isPosted ? 'posted' : 'draft',
          priority: this.determinePriority(entry),
          category: this.determineCategory(account),
          amount: line.debit > 0 ? line.debit : line.credit,
          createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
          postedAt: entry.isPosted && entry.updatedAt ? new Date(entry.updatedAt) : undefined,
          userName: user?.displayName || user?.name || 'Usuario Desconocido',
          userEmail: user?.email || 'sin-email@sistema.com',
          accountCode: line.accountCode || account?.code || 'N/A',
          accountName: line.accountName || account?.name || 'Cuenta no especificada',
          debit: line.debit || 0,
          credit: line.credit || 0,
          reference: entry.reference || '',
          isPosted: entry.isPosted || false,
          createdBy: entry.createdBy || 'system'
        });
      });
    });
    
    console.log('✅ Conversión completada:', reportData.length, 'registros generados');
    return reportData;
  }

  private determineTransactionType(entry: JournalEntry): 'journal' | 'transaction' | 'adjustment' {
    if (entry.reference?.includes('ADJ')) return 'adjustment';
    if (entry.description.toLowerCase().includes('ajuste')) return 'adjustment';
    return 'journal';
  }

  private determinePriority(entry: JournalEntry): 'low' | 'medium' | 'high' | 'urgent' {
    const amount = Math.max(entry.totalDebit, entry.totalCredit);
    if (amount > 10000000) return 'urgent';
    if (amount > 1000000) return 'high';
    if (amount > 100000) return 'medium';
    return 'low';
  }

  private determineCategory(account?: Account): 'operational' | 'adjustment' | 'closing' | 'opening' {
    if (!account) return 'operational';
    if (account.name.toLowerCase().includes('apertura')) return 'opening';
    if (account.name.toLowerCase().includes('cierre')) return 'closing';
    if (account.name.toLowerCase().includes('ajuste')) return 'adjustment';
    return 'operational';
  }

  // === MÉTRICAS Y ANÁLISIS ===

  getReportMetrics(data: ReportData[]): ReportMetrics {
    const totalServices = data.length;
    const completedServices = data.filter(d => d.status === 'posted').length;
    const pendingServices = data.filter(d => d.status === 'draft').length;
    const totalRevenue = data.reduce((sum, d) => sum + d.amount, 0);

    // Cálculo del tiempo promedio de procesamiento
    const postedData = data.filter(d => d.postedAt && d.createdAt);
    const averageCompletionTime = postedData.length > 0 
      ? postedData.reduce((sum, d) => {
          const days = Math.ceil((d.postedAt!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / postedData.length
      : 0;

    // Rating promedio (basado en prioridad)
    const priorityWeights = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 };
    const averageRating = data.length > 0
      ? data.reduce((sum, d) => sum + priorityWeights[d.priority], 0) / data.length
      : 0;

    // Top tipos de transacción
    const transactionTypesMap = new Map<string, { count: number; revenue: number }>();
    data.forEach(d => {
      const current = transactionTypesMap.get(d.type) || { count: 0, revenue: 0 };
      transactionTypesMap.set(d.type, {
        count: current.count + 1,
        revenue: current.revenue + d.amount
      });
    });

    const topServiceTypes = Array.from(transactionTypesMap.entries())
      .map(([type, stats]) => ({ type, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Tendencias mensuales
    const monthlyMap = new Map<string, { services: number; revenue: number }>();
    data.forEach(d => {
      const monthKey = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(monthKey) || { services: 0, revenue: 0 };
      monthlyMap.set(monthKey, {
        services: current.services + 1,
        revenue: current.revenue + d.amount
      });
    });

    const monthlyTrends = Array.from(monthlyMap.entries())
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Distribución de estados
    const statusMap = new Map<string, number>();
    data.forEach(d => {
      statusMap.set(d.status, (statusMap.get(d.status) || 0) + 1);
    });

    const statusDistribution = Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / totalServices) * 100)
      }));

    // Distribución de prioridades
    const priorityMap = new Map<string, number>();
    data.forEach(d => {
      priorityMap.set(d.priority, (priorityMap.get(d.priority) || 0) + 1);
    });

    const priorityDistribution = Array.from(priorityMap.entries())
      .map(([priority, count]) => ({ priority, count }));

    // Performance por categoría
    const categoryMap = new Map<string, { count: number; totalAmount: number; avgAmount: number }>();
    data.forEach(d => {
      const current = categoryMap.get(d.category) || { count: 0, totalAmount: 0, avgAmount: 0 };
      current.count++;
      current.totalAmount += d.amount;
      current.avgAmount = current.totalAmount / current.count;
      
      categoryMap.set(d.category, current);
    });

    const categoryPerformance = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        avgRating: Math.round((priorityWeights[data.find(d => d.category === category)?.priority || 'low']) * 10) / 10,
        avgHours: Math.round(stats.avgAmount / 100000 * 10) / 10 // Estimación basada en monto
      }));

    return {
      totalServices,
      completedServices,
      pendingServices,
      totalRevenue,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      averageRating: Math.round(averageRating * 10) / 10,
      topServiceTypes,
      monthlyTrends,
      statusDistribution,
      priorityDistribution,
      categoryPerformance
    };
  }

  // === DATOS PARA GRÁFICOS ===

  getChartData(data: ReportData[], type: 'status' | 'priority' | 'monthly' | 'category' | 'revenue'): ChartData {
    switch (type) {
      case 'status':
        return this.getStatusChartData(data);
      case 'priority':
        return this.getPriorityChartData(data);
      case 'monthly':
        return this.getMonthlyChartData(data);
      case 'category':
        return this.getCategoryChartData(data);
      case 'revenue':
        return this.getRevenueChartData(data);
      default:
        return { labels: [], datasets: [] };
    }
  }

  private getStatusChartData(data: ReportData[]): ChartData {
    const statusMap = new Map<string, number>();
    data.forEach(d => {
      statusMap.set(d.status, (statusMap.get(d.status) || 0) + 1);
    });

    const labels = Array.from(statusMap.keys());
    const values = Array.from(statusMap.values());
    
    return {
      labels,
      datasets: [{
        label: 'Servicios por Estado',
        data: values,
        backgroundColor: [
          '#3B82F6', // pendiente - azul
          '#F59E0B', // en-proceso - amarillo
          '#10B981', // completado - verde
          '#EF4444', // cancelado - rojo
          '#6B7280'  // pausado - gris
        ]
      }]
    };
  }

  private getPriorityChartData(data: ReportData[]): ChartData {
    const priorityMap = new Map<string, number>();
    data.forEach(d => {
      priorityMap.set(d.priority, (priorityMap.get(d.priority) || 0) + 1);
    });

    const labels = Array.from(priorityMap.keys());
    const values = Array.from(priorityMap.values());
    
    return {
      labels,
      datasets: [{
        label: 'Servicios por Prioridad',
        data: values,
        backgroundColor: [
          '#10B981', // baja - verde
          '#F59E0B', // media - amarillo
          '#F97316', // alta - naranja
          '#EF4444'  // urgente - rojo
        ]
      }]
    };
  }

  private getMonthlyChartData(data: ReportData[]): ChartData {
    const monthlyMap = new Map<string, { services: number; revenue: number }>();
    
    data.forEach(d => {
      const monthKey = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(monthKey) || { services: 0, revenue: 0 };
      monthlyMap.set(monthKey, {
        services: current.services + 1,
        revenue: current.revenue + d.amount
      });
    });

    const sortedEntries = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const labels = sortedEntries.map(([month]) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Número de Servicios',
          data: sortedEntries.map(([, stats]) => stats.services),
          backgroundColor: '#3B82F6',
          borderColor: '#1E40AF',
          borderWidth: 2
        },
        {
          label: 'Ingresos (CLP)',
          data: sortedEntries.map(([, stats]) => stats.revenue),
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 2
        }
      ]
    };
  }

  private getCategoryChartData(data: ReportData[]): ChartData {
    const categoryMap = new Map<string, number>();
    data.forEach(d => {
      categoryMap.set(d.category, (categoryMap.get(d.category) || 0) + 1);
    });

    const labels = Array.from(categoryMap.keys());
    const values = Array.from(categoryMap.values());
    
    return {
      labels,
      datasets: [{
        label: 'Servicios por Categoría',
        data: values,
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
          '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
        ]
      }]
    };
  }

  private getRevenueChartData(data: ReportData[]): ChartData {
    const monthlyRevenue = new Map<string, number>();
    
    data.forEach(d => {
      const monthKey = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) || 0) + d.amount);
    });

    const sortedEntries = Array.from(monthlyRevenue.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const labels = sortedEntries.map(([month]) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    });
    
    return {
      labels,
      datasets: [{
        label: 'Ingresos Mensuales (CLP)',
        data: sortedEntries.map(([, revenue]) => revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3B82F6',
        borderWidth: 3,
        // fill: true
      }]
    };
  }

  // === EXPORTACIÓN ===

  async exportReport(data: ReportData[], metrics: ReportMetrics, options: ExportOptions): Promise<void> {
    switch (options.format) {
      case 'pdf':
        await this.exportToPDF(data, metrics, options);
        break;
      case 'excel':
        await this.exportToExcel(data, metrics, options);
        break;
      case 'csv':
        await this.exportToCSV(data, options);
        break;
    }
  }

  private async exportToPDF(data: ReportData[], metrics: ReportMetrics, options: ExportOptions): Promise<void> {
    const doc = new jsPDF({
      orientation: options.orientation || 'landscape',
      unit: 'mm',
      format: options.pageSize || 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Configurar fuentes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);

    // Título
    doc.text('Reporte de Servicios Contables', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 35, { align: 'center' });

    let yPosition = 50;

    // Métricas principales si están habilitadas
    if (options.includeMetrics) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Métricas Principales', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      const metricsData = [
        ['Total de Servicios', metrics.totalServices.toString()],
        ['Servicios Completados', metrics.completedServices.toString()],
        ['Servicios Pendientes', metrics.pendingServices.toString()],
        ['Ingresos Totales', `$${metrics.totalRevenue.toLocaleString('es-CL')}`],
        ['Tiempo Promedio de Completación', `${metrics.averageCompletionTime} días`],
        ['Rating Promedio', `${metrics.averageRating}/5`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: metricsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: margin, right: margin },
        tableWidth: 'auto'
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Datos principales si están habilitados
    if (options.includeRawData) {
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Datos Detallados', margin, yPosition);
      yPosition += 10;

      const tableData = data.map(item => [
        item.entryNumber,
        item.description,
        item.type,
        item.status,
        item.accountCode,
        `$${item.amount.toLocaleString('es-CL')}`,
        item.userName,
        item.createdAt.toLocaleDateString('es-ES')
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['N° Asiento', 'Descripción', 'Tipo', 'Estado', 'Cuenta', 'Monto', 'Usuario', 'Fecha']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20 },
          3: { cellWidth: 18 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 30 },
          7: { cellWidth: 20 }
        }
      });
    }

    // Guardar el PDF
    const fileName = options.fileName || `reporte-servicios-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  private async exportToExcel(data: ReportData[], metrics: ReportMetrics, options: ExportOptions): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Hoja de métricas
    if (options.includeMetrics) {
      const metricsData = [
        ['Métrica', 'Valor'],
        ['Total de Servicios', metrics.totalServices],
        ['Servicios Completados', metrics.completedServices],
        ['Servicios Pendientes', metrics.pendingServices],
        ['Ingresos Totales', metrics.totalRevenue],
        ['Tiempo Promedio de Completación (días)', metrics.averageCompletionTime],
        ['Rating Promedio', metrics.averageRating],
        [],
        ['Top Tipos de Servicio', ''],
        ['Tipo', 'Cantidad', 'Ingresos'],
        ...metrics.topServiceTypes.map(t => [t.type, t.count, t.revenue])
      ];

      const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Métricas');
    }

    // Hoja de datos principales
    if (options.includeRawData) {
      const dataForExcel = data.map(item => ({
        'ID': item.id,
        'N° Asiento': item.entryNumber,
        'Descripción': item.description,
        'Tipo': item.type,
        'Estado': item.status,
        'Prioridad': item.priority,
        'Categoría': item.category,
        'Cuenta': item.accountCode,
        'Nombre Cuenta': item.accountName,
        'Monto': item.amount,
        'Débito': item.debit,
        'Crédito': item.credit,
        'Usuario': item.userName,
        'Email Usuario': item.userEmail,
        'Fecha Creación': item.createdAt.toLocaleDateString('es-ES'),
        'Fecha Actualización': item.updatedAt.toLocaleDateString('es-ES'),
        'Fecha Contabilización': item.postedAt?.toLocaleDateString('es-ES') || '',
        'Referencia': item.reference || '',
        'Creado Por': item.createdBy,
        'Contabilizado': item.isPosted ? 'Sí' : 'No'
      }));

      const dataSheet = XLSX.utils.json_to_sheet(dataForExcel);
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'Datos');
    }

    // Hoja de distribución por estado
    const statusData = [
      ['Estado', 'Cantidad', 'Porcentaje'],
      ...metrics.statusDistribution.map(s => [s.status, s.count, `${s.percentage}%`])
    ];
    const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
    XLSX.utils.book_append_sheet(workbook, statusSheet, 'Estados');

    // Guardar el archivo
    const fileName = options.fileName || `reporte-servicios-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private async exportToCSV(data: ReportData[], options: ExportOptions): Promise<void> {
    const csvData = data.map(item => ({
      ID: item.id,
      'N° Asiento': item.entryNumber,
      Descripción: item.description,
      Tipo: item.type,
      Estado: item.status,
      Prioridad: item.priority,
      Categoría: item.category,
      Cuenta: item.accountCode,
      'Nombre Cuenta': item.accountName,
      Monto: item.amount,
      Débito: item.debit,
      Crédito: item.credit,
      Usuario: item.userName,
      'Email Usuario': item.userEmail,
      'Fecha Creación': item.createdAt.toLocaleDateString('es-ES'),
      'Referencia': item.reference || '',
      'Contabilizado': item.isPosted ? 'Sí' : 'No'
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const fileName = options.fileName || `reporte-servicios-${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
  }

  // === FILTROS Y UTILIDADES ===

  private applyFilters(data: ReportData[], filters: ReportFilter): ReportData[] {
    let filteredData = [...data];

    if (filters.dateFrom) {
      filteredData = filteredData.filter(d => d.createdAt >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filteredData = filteredData.filter(d => d.createdAt <= filters.dateTo!);
    }

    if (filters.serviceTypes && filters.serviceTypes.length > 0) {
      filteredData = filteredData.filter(d => filters.serviceTypes!.includes(d.type));
    }

    if (filters.serviceStatus && filters.serviceStatus.length > 0) {
      filteredData = filteredData.filter(d => filters.serviceStatus!.includes(d.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      filteredData = filteredData.filter(d => filters.priority!.includes(d.priority));
    }

    if (filters.category && filters.category.length > 0) {
      filteredData = filteredData.filter(d => filters.category!.includes(d.category));
    }

    if (filters.minAmount !== undefined) {
      filteredData = filteredData.filter(d => d.amount >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      filteredData = filteredData.filter(d => d.amount <= filters.maxAmount!);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredData = filteredData.filter(d => 
        d.description.toLowerCase().includes(query) ||
        d.entryNumber.toLowerCase().includes(query) ||
        d.accountName.toLowerCase().includes(query) ||
        d.accountCode.toLowerCase().includes(query) ||
        (d.reference && d.reference.toLowerCase().includes(query))
      );
    }

    return filteredData;
  }

  // === EXPORTACIÓN AVANZADA ===

  // Método principal de exportación avanzada - CORREGIDO PARA NG0100
  async exportAdvancedReport(
    data: ReportData[], 
    metrics: ReportMetrics, 
    chartData: ChartData[], 
    options: ExportOptions
  ): Promise<void> {
    console.log('🚀 Iniciando exportAdvancedReport:', {
      format: options.format,
      dataCount: data.length,
      options: options
    });
    
    // Manejar loading state de forma asíncrona para evitar NG0100
    Promise.resolve().then(() => this.loadingSubject.next(true));
    
    try {
      switch (options.format) {
        case 'pdf':
          console.log('📄 Generando PDF...');
          await this.generateAdvancedPDF(data, metrics, chartData, options);
          break;
        case 'excel':
          console.log('📊 Generando Excel...');
          await this.generateAdvancedExcel(data, metrics, chartData, options);
          break;
        case 'word':
          console.log('📝 Generando Word...');
          await this.generateAdvancedWord(data, metrics, chartData, options);
          break;
        case 'csv':
          console.log('📋 Generando CSV...');
          await this.generateAdvancedCSV(data, options);
          break;
        default:
          throw new Error('Formato de exportación no soportado');
      }
      
      console.log('✅ Exportación completada exitosamente');
    } catch (error) {
      console.error('❌ Error en exportación avanzada:', error);
      throw error;
    } finally {
      // Usar Promise.resolve() para evitar NG0100 al actualizar loading state
      Promise.resolve().then(() => this.loadingSubject.next(false));
    }
  }

  // Filtrar datos según configuración de exportación
  private filterDataForExport(data: ReportData[], options: ExportOptions): ReportData[] {
    let filteredData = [...data];

    if (options.dataSelection) {
      const selection = options.dataSelection;

      if (selection.statusFilter && selection.statusFilter.length > 0) {
        filteredData = filteredData.filter(d => selection.statusFilter!.includes(d.status));
      }

      if (selection.serviceTypeFilter && selection.serviceTypeFilter.length > 0) {
        filteredData = filteredData.filter(d => selection.serviceTypeFilter!.includes(d.type));
      }

      if (selection.clientFilter && selection.clientFilter.length > 0) {
        filteredData = filteredData.filter(d => selection.clientFilter!.includes(d.userName));
      }
    }

    return filteredData;
  }

  // Generar PDF avanzado
  private async generateAdvancedPDF(
    data: ReportData[], 
    metrics: ReportMetrics, 
    chartData: ChartData[], 
    options: ExportOptions
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.pageSize || 'a4'
    });

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header personalizado
    if (options.pdfConfig?.headerText) {
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text(options.pdfConfig.headerText, pageWidth / 2, 10, { align: 'center' });
    }

    // Título del reporte
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text('Reporte Avanzado de Servicios', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Fecha y hora de generación
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    const now = new Date();
    doc.text(`Generado el: ${now.toLocaleDateString()} a las ${now.toLocaleTimeString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Métricas (si se incluyen)
    if (options.includeMetrics) {
      // Verificar espacio en la página
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(51, 51, 51);
      doc.text('Métricas Principales', 20, yPosition);
      yPosition += 10;

      const metricsData = [
        ['Total de Servicios', metrics.totalServices.toString()],
        ['Servicios Completados', metrics.completedServices.toString()],
        ['Servicios Pendientes', metrics.pendingServices.toString()],
        ['Ingresos Totales', `$${metrics.totalRevenue.toLocaleString()}`],
        ['Tiempo Promedio', `${metrics.averageCompletionTime.toFixed(1)} días`],
        ['Calificación Promedio', `${metrics.averageRating.toFixed(1)}/5`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: metricsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Datos tabulares (si se incluyen)
    if (options.includeRawData) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(51, 51, 51);
      doc.text('Datos Detallados', 20, yPosition);
      yPosition += 10;

      const filteredData = this.filterDataForExport(data, options);
      
      // Preparar columnas según configuración
      const columns = ['Cliente', 'N° Asiento', 'Descripción', 'Cuenta', 'Monto', 'Estado'];
      const tableData = filteredData.map(item => [
        item.userName,
        item.entryNumber,
        item.description,
        `${item.accountCode} - ${item.accountName}`,
        `$${item.amount.toLocaleString()}`,
        item.status
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [columns],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Resumen ejecutivo (si se incluye)
    if (options.includeSummary) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(51, 51, 51);
      doc.text('Resumen Ejecutivo', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setTextColor(75, 85, 99);
      
      const filteredData = this.filterDataForExport(data, options);
      const totalServices = filteredData.length;
      const completedServices = filteredData.filter(d => d.status === 'posted').length;
      const totalRevenue = filteredData.reduce((sum, d) => sum + d.amount, 0);
      const completionRate = totalServices > 0 ? (completedServices / totalServices * 100).toFixed(1) : '0';

      const summaryText = [
        `Durante el período analizado se procesaron ${totalServices} asientos contables,`,
        `de los cuales ${completedServices} fueron contabilizados exitosamente,`,
        `representando una tasa de procesamiento del ${completionRate}%.`,
        ``,
        `El ingreso total generado fue de $${totalRevenue.toLocaleString()},`,
        `con un promedio de $${(totalRevenue / totalServices).toLocaleString()} por servicio.`,
        ``,
        `La calificación promedio otorgada por los clientes fue de`,
        `${metrics.averageRating.toFixed(1)} de 5 estrellas.`
      ];

      summaryText.forEach(line => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });
    }

    // Footer personalizado
    if (options.pdfConfig?.footerText) {
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(options.pdfConfig.footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Guardar el archivo
    const fileName = options.fileName || `reporte-avanzado-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Generar Excel avanzado
  private async generateAdvancedExcel(
    data: ReportData[], 
    metrics: ReportMetrics, 
    chartData: ChartData[], 
    options: ExportOptions
  ): Promise<void> {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    // Hoja de métricas (si se incluyen)
    if (options.includeMetrics) {
      const metricsData = [
        ['Métrica', 'Valor'],
        ['Total de Servicios', metrics.totalServices],
        ['Servicios Completados', metrics.completedServices],
        ['Servicios Pendientes', metrics.pendingServices],
        ['Ingresos Totales', metrics.totalRevenue],
        ['Tiempo Promedio (días)', metrics.averageCompletionTime],
        ['Calificación Promedio', metrics.averageRating]
      ];

      const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Métricas');
    }

    // Hoja de datos (si se incluyen)
    if (options.includeRawData) {
      const filteredData = this.filterDataForExport(data, options);
      const dataForSheet = filteredData.map(item => ({
        'Cliente': item.userName,
        'Email': item.userEmail,
        'N° Asiento': item.entryNumber,
        'Descripción': item.description,
        'Cuenta': item.accountCode,
        'Nombre Cuenta': item.accountName,
        'Tipo': item.type,
        'Estado': item.status,
        'Prioridad': item.priority,
        'Categoría': item.category,
        'Monto': item.amount,
        'Débito': item.debit,
        'Crédito': item.credit,
        'Fecha': item.createdAt.toLocaleDateString(),
        'Actualizado': item.updatedAt.toLocaleDateString(),
        'Referencia': item.reference || '',
        'Contabilizado': item.isPosted ? 'Sí' : 'No'
      }));

      const dataSheet = XLSX.utils.json_to_sheet(dataForSheet);
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'Datos Detallados');
    }

    // Hoja de análisis (si se incluye)
    if (options.includeAnalysis) {
      const analysisData = [
        ['Tipo de Análisis', 'Resultado'],
        ['Servicios por Estado', ''],
        ...metrics.statusDistribution.map(item => [item.status, `${item.count} (${item.percentage}%)`]),
        ['', ''],
        ['Top Tipos de Servicio', ''],
        ...metrics.topServiceTypes.slice(0, 5).map(item => [item.type, `${item.count} servicios - $${item.revenue.toLocaleString()}`]),
        ['', ''],
        ['Distribución por Prioridad', ''],
        ...metrics.priorityDistribution.map(item => [item.priority, item.count])
      ];

      const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
      XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Análisis');
    }

    // Guardar el archivo
    const fileName = options.fileName || `reporte-avanzado-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  // Generar Word avanzado
  private async generateAdvancedWord(
    data: ReportData[], 
    metrics: ReportMetrics, 
    chartData: ChartData[], 
    options: ExportOptions
  ): Promise<void> {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel } = await import('docx');
    
    const children: any[] = [];

    // Título del documento
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: options.wordConfig?.documentTitle || 'Reporte Avanzado de Servicios',
            bold: true,
            size: 32,
            color: '3B82F6'
          })
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER
      })
    );

    // Información del reporte
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generado el: ${new Date().toLocaleDateString()}`,
            italics: true,
            size: 20
          })
        ],
        alignment: AlignmentType.CENTER
      })
    );

    if (options.wordConfig?.author) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Autor: ${options.wordConfig.author}`,
              italics: true,
              size: 20
            })
          ],
          alignment: AlignmentType.CENTER
        })
      );
    }

    children.push(new Paragraph({ text: '' })); // Espacio

    // Resumen ejecutivo (si se incluye)
    if (options.includeSummary) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Resumen Ejecutivo',
              bold: true,
              size: 20
            })
          ],
          heading: HeadingLevel.HEADING_1
        })
      );

      const filteredData = this.filterDataForExport(data, options);
      const totalServices = filteredData.length;
      const completedServices = filteredData.filter(d => d.status === 'posted').length;
      const totalRevenue = filteredData.reduce((sum, d) => sum + d.amount, 0);

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Este reporte analiza ${totalServices} asientos contables del sistema, de los cuales ${completedServices} han sido contabilizados exitosamente. El monto total procesado durante el período es de $${totalRevenue.toLocaleString()}, reflejando la actividad contable registrada en el sistema.`
            })
          ]
        })
      );

      children.push(new Paragraph({ text: '' }));
    }

    // Métricas (si se incluyen)
    if (options.includeMetrics) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Métricas Principales',
              bold: true,
              size: 20
            })
          ],
          heading: HeadingLevel.HEADING_1
        })
      );

      const metricsTable = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: 'Métrica', bold: true })] })]
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: 'Valor', bold: true })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Total de Servicios')] }),
              new TableCell({ children: [new Paragraph(metrics.totalServices.toString())] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Servicios Completados')] }),
              new TableCell({ children: [new Paragraph(metrics.completedServices.toString())] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Ingresos Totales')] }),
              new TableCell({ children: [new Paragraph(`$${metrics.totalRevenue.toLocaleString()}`)] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Calificación Promedio')] }),
              new TableCell({ children: [new Paragraph(`${metrics.averageRating.toFixed(1)}/5`)] })
            ]
          })
        ]
      });

      children.push(metricsTable);
      children.push(new Paragraph({ text: '' }));
    }

    // Datos detallados (si se incluyen y limitados para Word)
    if (options.includeRawData) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Datos Detallados (Primeros 25 registros)',
              bold: true,
              size: 20
            })
          ],
          heading: HeadingLevel.HEADING_1
        })
      );

      const filteredData = this.filterDataForExport(data, options);
      const dataRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Cliente', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Servicio', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Estado', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Monto', bold: true })] })] })
          ]
        })
      ];

      filteredData.slice(0, 25).forEach(item => {
        dataRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(item.userName)] }),
              new TableCell({ children: [new Paragraph(item.entryNumber)] }),
              new TableCell({ children: [new Paragraph(item.description)] }),
              new TableCell({ children: [new Paragraph(item.accountCode)] }),
              new TableCell({ children: [new Paragraph(item.status)] }),
              new TableCell({ children: [new Paragraph(`$${item.amount.toLocaleString()}`)] })
            ]
          })
        );
      });

      const dataTable = new Table({ rows: dataRows });
      children.push(dataTable);
    }

    // Crear el documento
    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    // Generar y descargar usando blob directamente (compatible con navegador)
    try {
      const blob = await Packer.toBlob(doc);
      const fileName = options.fileName || `reporte-avanzado-${new Date().toISOString().split('T')[0]}.docx`;
      
      const { saveAs } = await import('file-saver');
      saveAs(blob, fileName);
      console.log('✅ Documento Word generado exitosamente');
    } catch (error) {
      console.error('❌ Error al generar Word con toBlob, intentando alternativa:', error);
      
      // Fallback: generar usando base64 si toBlob falla
      const base64 = await Packer.toBase64String(doc);
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      const fileName = options.fileName || `reporte-avanzado-${new Date().toISOString().split('T')[0]}.docx`;
      const { saveAs } = await import('file-saver');
      saveAs(blob, fileName);
      console.log('✅ Documento Word generado exitosamente usando fallback');
    }
  }

  // Generar CSV avanzado
  private async generateAdvancedCSV(data: ReportData[], options: ExportOptions): Promise<void> {
    console.log('📋 generateAdvancedCSV iniciado:', {
      dataLength: data.length,
      delimiter: options.csvConfig?.delimiter || ',',
      includeHeaders: options.csvConfig?.includeHeaders !== false
    });
    
    const filteredData = this.filterDataForExport(data, options);
    console.log('📋 Datos filtrados:', filteredData.length, 'registros');
    
    const delimiter = options.csvConfig?.delimiter || ',';
    const includeHeaders = options.csvConfig?.includeHeaders !== false;

    let csvContent = '';
    
    // Headers (si se incluyen)
    if (includeHeaders) {
      const headers = [
        'Cliente',
        'Email',
        'N° Asiento',
        'Descripción',
        'Cuenta',
        'Nombre Cuenta',
        'Tipo',
        'Estado',
        'Prioridad',
        'Categoría',
        'Monto',
        'Débito',
        'Crédito',
        'Fecha',
        'Actualizado',
        'Referencia',
        'Contabilizado'
      ];
      csvContent += headers.join(delimiter) + '\n';
    }

    // Datos
    filteredData.forEach(item => {
      const row = [
        `"${item.userName}"`,
        `"${item.userEmail}"`,
        `"${item.entryNumber}"`,
        `"${item.description}"`,
        `"${item.accountCode}"`,
        `"${item.accountName}"`,
        `"${item.type}"`,
        `"${item.status}"`,
        `"${item.priority}"`,
        `"${item.category}"`,
        item.amount,
        item.debit,
        item.credit,
        `"${item.createdAt.toLocaleDateString()}"`,
        `"${item.updatedAt.toLocaleDateString()}"`,
        `"${item.reference || ''}"`,
        `"${item.isPosted ? 'Sí' : 'No'}"`
      ];
      csvContent += row.join(delimiter) + '\n';
    });

    // Crear y descargar el archivo
    console.log('📋 Creando blob CSV, tamaño:', csvContent.length, 'caracteres');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = options.fileName || `reporte-avanzado-${new Date().toISOString().split('T')[0]}.csv`;
    console.log('📋 Nombre de archivo:', fileName);
    
    try {
      const { saveAs } = await import('file-saver');
      console.log('📋 file-saver importado, ejecutando descarga...');
      saveAs(blob, fileName);
      console.log('✅ CSV descargado exitosamente');
    } catch (error) {
      console.error('❌ Error al importar file-saver o ejecutar descarga:', error);
      
      // Fallback manual
      console.log('📋 Intentando descarga manual...');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      console.log('✅ Descarga manual completada');
    }
  }

  // Invalidar cache cuando sea necesario
  invalidateCache(): void {
    this.lastCacheUpdate = 0;
    this.dataCache.next([]);
  }

  // Verificar si el cache es válido
  isCacheValid(): boolean {
    const now = Date.now();
    return this.dataCache.value.length > 0 && (now - this.lastCacheUpdate) < this.cacheTimeout;
  }

  // Obtener plantillas disponibles
  getAvailableTemplates(): Array<{name: string, description: string}> {
    return [
      { name: 'default', description: 'Plantilla estándar con diseño profesional' },
      { name: 'executive', description: 'Plantilla ejecutiva con métricas destacadas' },
      { name: 'detailed', description: 'Plantilla detallada con análisis completo' },
      { name: 'minimal', description: 'Plantilla minimalista con datos esenciales' }
    ];
  }

  // Obtener configuración predeterminada
  getDefaultExportOptions(): ExportOptions {
    return {
      format: 'pdf',
      includeCharts: true,
      includeMetrics: true,
      includeRawData: true,
      includeFilters: true,
      includeSummary: true,
      includeAnalysis: false,
      orientation: 'portrait',
      pageSize: 'a4',
      fileName: `reporte-${new Date().toISOString().split('T')[0]}`,
      pdfConfig: {
        includeImages: true,
        includeWatermark: false,
        headerText: 'Sistema Contable Contabilium',
        footerText: 'Reporte generado automáticamente',
        colorScheme: 'default'
      },
      excelConfig: {
        includeFormulas: false,
        multipleSheets: true,
        sheetNames: ['Métricas', 'Datos', 'Análisis'],
        includeFormatting: true
      },
      wordConfig: {
        includeTableOfContents: false,
        includePageNumbers: true,
        documentTitle: 'Reporte de Servicios Contables',
        author: 'Sistema Contabilium',
        includeHeaderFooter: true
      },
      csvConfig: {
        delimiter: ',',
        includeHeaders: true,
        encoding: 'utf-8'
      },
      template: {
        name: 'default',
        colorScheme: 'default',
        logoPosition: 'header'
      }
    };
  }

  // Método temporal para crear datos de prueba si no existen
  async createSampleDataIfNeeded(): Promise<void> {
    try {
      console.log('🔍 Verificando si existen datos de prueba...');
      
      const services = await this.accountingService.services$.pipe(take(1)).toPromise();
      const users = await this.userService.getUsers().pipe(take(1)).toPromise();
      
      if (!services || services.length === 0) {
        console.log('📝 No hay servicios. Creando datos de prueba...');
        
        if (!users || users.length === 0) {
          console.warn('⚠️ No hay usuarios disponibles para crear servicios de prueba');
          return;
        }

        // Crear algunos servicios de prueba usando el método del servicio
        (this.accountingService as any).generateSampleServices(users);
        console.log('✅ Datos de prueba creados');
      } else {
        console.log('✅ Ya existen', services.length, 'servicios en la base de datos');
      }
    } catch (error) {
      console.error('❌ Error creando datos de prueba:', error);
    }
  }
}

