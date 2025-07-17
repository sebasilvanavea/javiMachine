import { Injectable, inject } from '@angular/core';
import { Observable, of, BehaviorSubject, map, combineLatest } from 'rxjs';
import { delay, tap, shareReplay } from 'rxjs/operators';
import { DashboardStats, SimpleChartData, User, Service, ServiceStatus, ServiceType } from '../models/user.model';
import { OptimizedClickService } from './optimized-click.service';
import { UserService } from './user.service';
import { AccountingServiceService } from './accounting-service.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private userService = inject(UserService);
  private accountingService = inject(AccountingServiceService);
  private optimizedClickService = inject(OptimizedClickService);
  
  private dashboardStatsCache$ = new BehaviorSubject<DashboardStats | null>(null);
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

  getDashboardStats(): Observable<DashboardStats> {
    // Verificar si el cache es válido
    const cached = this.dashboardStatsCache$.value;
    const now = Date.now();
    
    if (cached && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return of(cached).pipe(
        tap(() => console.log('Dashboard stats desde cache válido'))
      );
    }

    // Combinar datos de usuarios y servicios contables
    return combineLatest([
      this.userService.getUsers(),
      this.accountingService.services$
    ]).pipe(
      map(([users, accountingServices]) => this.calculateStatsFromRealData(users, accountingServices)),
      tap(stats => {
        this.dashboardStatsCache$.next(stats);
        this.cacheTimestamp = Date.now();
        console.log('Dashboard stats calculadas desde datos reales y guardadas en cache');
      }),
      shareReplay(1)
    );
  }

  getDashboardStatsOptimized(): Observable<DashboardStats> {
    return this.getDashboardStats().pipe(
      delay(800) // Simular latencia de red
    );
  }

  private calculateStats(users: User[]): DashboardStats {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Calcular estadísticas básicas
    const totalUsers = users.length;
    const allServices = users.flatMap(user => user.services || []);
    const totalServices = allServices.length;
    
    const pendingServices = allServices.filter(service => 
      service.status === ServiceStatus.PENDING
    ).length;
    
    const overdueServices = allServices.filter(service => 
      service.status === ServiceStatus.OVERDUE ||
      (service.status === ServiceStatus.PENDING && new Date(service.dueDate) < currentDate)
    ).length;
    
    const completedServicesThisMonth = allServices.filter(service => {
      const serviceDate = new Date(service.updatedAt);
      return service.status === ServiceStatus.COMPLETED &&
             serviceDate.getMonth() === currentMonth &&
             serviceDate.getFullYear() === currentYear;
    }).length;
    
    const completedServicesLastMonth = allServices.filter(service => {
      const serviceDate = new Date(service.updatedAt);
      return service.status === ServiceStatus.COMPLETED &&
             serviceDate.getMonth() === lastMonth &&
             serviceDate.getFullYear() === lastMonthYear;
    }).length;
    
    // Calcular ingresos
    const revenueThisMonth = allServices
      .filter(service => {
        const serviceDate = new Date(service.updatedAt);
        return service.status === ServiceStatus.COMPLETED &&
               serviceDate.getMonth() === currentMonth &&
               serviceDate.getFullYear() === currentYear;
      })
      .reduce((total, service) => total + service.amount, 0);
    
    const revenueLastMonth = allServices
      .filter(service => {
        const serviceDate = new Date(service.updatedAt);
        return service.status === ServiceStatus.COMPLETED &&
               serviceDate.getMonth() === lastMonth &&
               serviceDate.getFullYear() === lastMonthYear;
      })
      .reduce((total, service) => total + service.amount, 0);
    
    // Calcular usuarios nuevos
    const newUsersThisMonth = users.filter(user => {
      const userDate = new Date(user.createdAt);
      return userDate.getMonth() === currentMonth &&
             userDate.getFullYear() === currentYear;
    }).length;
    
    const newUsersLastMonth = users.filter(user => {
      const userDate = new Date(user.createdAt);
      return userDate.getMonth() === lastMonth &&
             userDate.getFullYear() === lastMonthYear;
    }).length;
    
    // Calcular porcentajes de crecimiento
    const revenueGrowthPercentage = revenueLastMonth === 0 ? 100 : 
      ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
    
    const serviceGrowthPercentage = completedServicesLastMonth === 0 ? 100 :
      ((completedServicesThisMonth - completedServicesLastMonth) / completedServicesLastMonth) * 100;
    
    const userGrowthPercentage = newUsersLastMonth === 0 ? 100 :
      ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100;
    
    // Datos para gráficos
    const servicesByStatus = {
      pending: pendingServices,
      inProgress: allServices.filter(s => s.status === ServiceStatus.IN_PROGRESS).length,
      completed: allServices.filter(s => s.status === ServiceStatus.COMPLETED).length,
      overdue: overdueServices
    };
    
    const servicesByType = Object.values(ServiceType).map(type => ({
      type,
      count: allServices.filter(s => s.type === type).length
    }));
    
    const revenueByMonth = this.getRevenueByMonth(allServices, currentYear);
    
    return {
      totalUsers,
      totalServices,
      pendingServices,
      overdueServices,
      completedServicesThisMonth,
      monthlyRevenue: revenueThisMonth,
      revenueThisMonth,
      revenueGrowthPercentage: Math.round(revenueGrowthPercentage * 100) / 100,
      serviceGrowthPercentage: Math.round(serviceGrowthPercentage * 100) / 100,
      userGrowthPercentage: Math.round(userGrowthPercentage * 100) / 100,
      // Nuevas propiedades para el diseño mejorado
      newUsersThisMonth: Math.round(totalUsers * 0.15), // 15% aproximado de nuevos usuarios
      serviceCompletionRate: totalServices > 0 ? Math.round((completedServicesThisMonth / totalServices) * 100) : 0,
      monthlyTarget: revenueThisMonth * 1.2, // Meta 20% más alta que ingresos actuales
      servicesByStatus,
      servicesByType,
      revenueByMonth
    };
  }

  private calculateStatsFromRealData(users: any[], accountingServices: any[]): DashboardStats {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Estadísticas básicas
    const totalUsers = users.length;
    const totalServices = accountingServices.length;
    
    const pendingServices = accountingServices.filter(service => 
      service.status === 'pendiente'
    ).length;
    
    const overdueServices = accountingServices.filter(service => 
      service.status === 'vencido' ||
      (service.status === 'pendiente' && new Date(service.dueDate) < currentDate)
    ).length;
    
    const completedServicesThisMonth = accountingServices.filter(service => {
      const serviceDate = new Date(service.deliveredAt || service.updatedAt);
      return service.status === 'entregado' &&
             serviceDate.getMonth() === currentMonth &&
             serviceDate.getFullYear() === currentYear;
    }).length;
    
    const completedServicesLastMonth = accountingServices.filter(service => {
      const serviceDate = new Date(service.deliveredAt || service.updatedAt);
      return service.status === 'entregado' &&
             serviceDate.getMonth() === lastMonth &&
             serviceDate.getFullYear() === lastMonthYear;
    }).length;
    
    // Calcular ingresos
    const revenueThisMonth = accountingServices
      .filter(service => {
        const serviceDate = new Date(service.deliveredAt || service.updatedAt);
        return service.status === 'entregado' &&
               service.isPaid &&
               serviceDate.getMonth() === currentMonth &&
               serviceDate.getFullYear() === currentYear;
      })
      .reduce((total, service) => total + (service.price || 0), 0);
    
    const revenueLastMonth = accountingServices
      .filter(service => {
        const serviceDate = new Date(service.deliveredAt || service.updatedAt);
        return service.status === 'entregado' &&
               service.isPaid &&
               serviceDate.getMonth() === lastMonth &&
               serviceDate.getFullYear() === lastMonthYear;
      })
      .reduce((total, service) => total + (service.price || 0), 0);
    
    // Calcular usuarios nuevos
    const newUsersThisMonth = users.filter(user => {
      const userDate = new Date(user.createdAt);
      return userDate.getMonth() === currentMonth &&
             userDate.getFullYear() === currentYear;
    }).length;
    
    const newUsersLastMonth = users.filter(user => {
      const userDate = new Date(user.createdAt);
      return userDate.getMonth() === lastMonth &&
             userDate.getFullYear() === lastMonthYear;
    }).length;
    
    // Calcular porcentajes de crecimiento
    const revenueGrowthPercentage = revenueLastMonth === 0 ? 100 : 
      ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
    
    const serviceGrowthPercentage = completedServicesLastMonth === 0 ? 100 :
      ((completedServicesThisMonth - completedServicesLastMonth) / completedServicesLastMonth) * 100;
    
    const userGrowthPercentage = newUsersLastMonth === 0 ? 100 :
      ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100;
    
    // Datos para gráficos usando datos reales
    const servicesByStatus = {
      pending: pendingServices,
      inProgress: accountingServices.filter(s => s.status === 'en_proceso').length,
      completed: accountingServices.filter(s => s.status === 'entregado').length,
      overdue: overdueServices
    };
    
    const serviceTypes = ['formulario_21', 'declaracion_iva', 'declaracion_renta', 'contabilidad_mensual', 'constitucion_empresa', 'modificacion_empresa', 'finiquito', 'certificados', 'otro'];
    const servicesByType = serviceTypes.map(type => ({
      type,
      count: accountingServices.filter(s => s.type === type).length
    }));
    
    const revenueByMonth = this.getRevenueByMonthFromAccountingServices(accountingServices, currentYear);
    
    return {
      totalUsers,
      totalServices,
      pendingServices,
      overdueServices,
      completedServicesThisMonth,
      monthlyRevenue: revenueThisMonth,
      revenueThisMonth,
      revenueGrowthPercentage: Math.round(revenueGrowthPercentage * 100) / 100,
      serviceGrowthPercentage: Math.round(serviceGrowthPercentage * 100) / 100,
      userGrowthPercentage: Math.round(userGrowthPercentage * 100) / 100,
      // Nuevas propiedades para el diseño mejorado
      newUsersThisMonth: Math.round(totalUsers * 0.12), // 12% aproximado de nuevos usuarios
      serviceCompletionRate: totalServices > 0 ? Math.round((completedServicesThisMonth / totalServices) * 100) : 0,
      monthlyTarget: revenueThisMonth * 1.25, // Meta 25% más alta que ingresos actuales
      servicesByStatus,
      servicesByType: servicesByType as any, // Conversión temporal para compatibilidad
      revenueByMonth
    };
  }

  private getRevenueByMonthFromAccountingServices(services: any[], year: number): SimpleChartData[] {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return months.map((month, index) => {
      const revenue = services
        .filter(service => {
          const serviceDate = new Date(service.deliveredAt || service.updatedAt);
          return service.status === 'entregado' &&
                 service.isPaid &&
                 serviceDate.getMonth() === index &&
                 serviceDate.getFullYear() === year;
        })
        .reduce((total, service) => total + (service.price || 0), 0);
      
      return {
        label: month,
        value: revenue
      };
    });
  }
  
  private getRevenueByMonth(services: Service[], year: number): SimpleChartData[] {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return months.map((month, index) => {
      const revenue = services
        .filter(service => {
          const serviceDate = new Date(service.updatedAt);
          return service.status === ServiceStatus.COMPLETED &&
                 serviceDate.getMonth() === index &&
                 serviceDate.getFullYear() === year;
        })
        .reduce((total, service) => total + service.amount, 0);
      
      return {
        label: month,
        value: revenue
      };
    });
  }
  
  clearStatsCache(): void {
    this.dashboardStatsCache$.next(null);
    this.cacheTimestamp = 0;
    console.log('Cache de dashboard limpiado');
  }
  
  refreshStats(): Observable<DashboardStats> {
    this.clearStatsCache();
    return this.getDashboardStats();
  }
}