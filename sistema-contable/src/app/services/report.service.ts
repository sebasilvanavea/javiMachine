import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User, Service, ServiceStatus, ServiceType, Form21Data } from '../models/user.model';

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  serviceType?: ServiceType;
  serviceStatus?: ServiceStatus;
  userId?: string;
  includeDetails?: boolean;
}

export interface ServiceReport {
  services: Service[];
  totalRevenue: number;
  completedServices: number;
  pendingServices: number;
  overdueServices: number;
  averageCompletionTime: number; // en días
  topServiceTypes: Array<{type: ServiceType, count: number, revenue: number}>;
}

export interface UserReport {
  user: User;
  totalServices: number;
  completedServices: number;
  totalRevenue: number;
  averageServiceValue: number;
  lastServiceDate: Date;
  services: Service[];
}

export interface FinancialReport {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  taxesOwed: number;
  monthlyBreakdown: Array<{
    month: string;
    revenue: number;
    expenses: number;
    netIncome: number;
  }>;
  topClients: Array<{
    userName: string;
    revenue: number;
    servicesCount: number;
  }>;
}

export interface TaxReport {
  period: string;
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxesOwed: number;
  form21Summary: Array<{
    userId: string;
    userName: string;
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    tax: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor() {}

  generateServiceReport(filter: ReportFilter = {}): Observable<ServiceReport> {
    const users = this.getUsersFromStorage();
    let allServices = users.flatMap(user => user.services);

    // Aplicar filtros
    if (filter.startDate) {
      allServices = allServices.filter(service => 
        new Date(service.createdAt) >= filter.startDate!
      );
    }

    if (filter.endDate) {
      allServices = allServices.filter(service => 
        new Date(service.createdAt) <= filter.endDate!
      );
    }

    if (filter.serviceType) {
      allServices = allServices.filter(service => 
        service.type === filter.serviceType
      );
    }

    if (filter.serviceStatus) {
      allServices = allServices.filter(service => 
        service.status === filter.serviceStatus
      );
    }

    if (filter.userId) {
      allServices = allServices.filter(service => 
        service.userId === filter.userId
      );
    }

    // Calcular métricas
    const completedServices = allServices.filter(s => s.status === ServiceStatus.COMPLETED);
    const pendingServices = allServices.filter(s => s.status === ServiceStatus.PENDING);
    const overdueServices = allServices.filter(s => s.status === ServiceStatus.OVERDUE);
    
    const totalRevenue = completedServices.reduce((sum, service) => sum + service.amount, 0);

    // Calcular tiempo promedio de completación
    const averageCompletionTime = this.calculateAverageCompletionTime(completedServices);

    // Top tipos de servicios
    const serviceTypeCounts = this.getServiceTypeBreakdown(allServices);

    const report: ServiceReport = {
      services: allServices,
      totalRevenue,
      completedServices: completedServices.length,
      pendingServices: pendingServices.length,
      overdueServices: overdueServices.length,
      averageCompletionTime,
      topServiceTypes: serviceTypeCounts
    };

    return of(report).pipe(delay(800));
  }

  generateUserReport(userId: string): Observable<UserReport> {
    const users = this.getUsersFromStorage();
    const user = users.find(u => u.id === userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const completedServices = user.services.filter(s => s.status === ServiceStatus.COMPLETED);
    const totalRevenue = completedServices.reduce((sum, service) => sum + service.amount, 0);
    const averageServiceValue = completedServices.length > 0 ? totalRevenue / completedServices.length : 0;
    
    const lastServiceDate = user.services.length > 0 
      ? new Date(Math.max(...user.services.map(s => new Date(s.updatedAt).getTime())))
      : new Date();

    const report: UserReport = {
      user,
      totalServices: user.services.length,
      completedServices: completedServices.length,
      totalRevenue,
      averageServiceValue,
      lastServiceDate,
      services: user.services
    };

    return of(report).pipe(delay(600));
  }

  generateFinancialReport(year: number): Observable<FinancialReport> {
    const users = this.getUsersFromStorage();
    const allServices = users.flatMap(user => user.services);
    
    // Filtrar servicios del año especificado
    const yearServices = allServices.filter(service => {
      const serviceDate = new Date(service.updatedAt);
      return serviceDate.getFullYear() === year && service.status === ServiceStatus.COMPLETED;
    });

    const totalRevenue = yearServices.reduce((sum, service) => sum + service.amount, 0);
    
    // Simular gastos (en una implementación real vendría de otra fuente)
    const totalExpenses = totalRevenue * 0.3; // 30% de gastos estimados
    const netIncome = totalRevenue - totalExpenses;
    const taxesOwed = netIncome * 0.25; // 25% de impuestos estimados

    // Desglose mensual
    const monthlyBreakdown = this.getMonthlyBreakdown(yearServices, year);

    // Top clientes
    const topClients = this.getTopClientsByRevenue(users, year);

    const report: FinancialReport = {
      period: year.toString(),
      totalRevenue,
      totalExpenses,
      netIncome,
      taxesOwed,
      monthlyBreakdown,
      topClients
    };

    return of(report).pipe(delay(1000));
  }

  generateTaxReport(year: number): Observable<TaxReport> {
    const users = this.getUsersFromStorage();
    const forms21 = this.getForms21FromStorage();
    
    // Filtrar formularios del año especificado
    const yearForms = forms21.filter(form => form.year === year);
    
    const totalIncome = yearForms.reduce((sum, form) => sum + form.totalIncome, 0);
    const totalDeductions = yearForms.reduce((sum, form) => sum + form.totalExpenses, 0);
    const taxableIncome = totalIncome - totalDeductions;
    const taxesOwed = yearForms.reduce((sum, form) => sum + form.tax, 0);

    // Resumen por usuario
    const form21Summary = yearForms.map(form => {
      const user = users.find(u => u.services.some(s => s.id === form.serviceId));
      return {
        userId: user?.id || '',
        userName: user ? `${user.name} ${user.lastName}` : 'Usuario no encontrado',
        totalIncome: form.totalIncome,
        totalExpenses: form.totalExpenses,
        netIncome: form.netIncome,
        tax: form.tax
      };
    });

    const report: TaxReport = {
      period: year.toString(),
      totalIncome,
      totalDeductions,
      taxableIncome,
      taxesOwed,
      form21Summary
    };

    return of(report).pipe(delay(800));
  }

  exportReportToPDF(reportData: any, reportType: string): Observable<Blob> {
    // Simular generación de PDF
    const pdfContent = this.generatePDFContent(reportData, reportType);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    
    return of(blob).pipe(delay(2000));
  }

  exportReportToExcel(reportData: any, reportType: string): Observable<Blob> {
    // Simular generación de Excel
    const excelContent = this.generateExcelContent(reportData, reportType);
    const blob = new Blob([excelContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    return of(blob).pipe(delay(1500));
  }

  getAvailableReportTypes(): Array<{value: string, label: string}> {
    return [
      { value: 'services', label: 'Reporte de Servicios' },
      { value: 'financial', label: 'Reporte Financiero' },
      { value: 'tax', label: 'Reporte de Impuestos' },
      { value: 'users', label: 'Reporte de Usuarios' },
      { value: 'form21', label: 'Reporte Formulario 21' }
    ];
  }

  scheduleReport(reportType: string, filter: ReportFilter, frequency: 'daily' | 'weekly' | 'monthly'): Observable<boolean> {
    // Simular programación de reporte
    const scheduledReport = {
      id: this.generateId(),
      reportType,
      filter,
      frequency,
      nextRun: this.calculateNextRun(frequency),
      createdAt: new Date()
    };

    // En una implementación real, esto se guardaría en el backend
    console.log('Reporte programado:', scheduledReport);
    
    return of(true).pipe(delay(500));
  }

  private getUsersFromStorage(): User[] {
    const usersStr = localStorage.getItem('sistema_contable_users');
    if (usersStr) {
      try {
        return JSON.parse(usersStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  private getForms21FromStorage(): Form21Data[] {
    const formsStr = localStorage.getItem('sistema_contable_form21');
    if (formsStr) {
      try {
        return JSON.parse(formsStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  private calculateAverageCompletionTime(services: Service[]): number {
    if (services.length === 0) return 0;
    
    const completionTimes = services.map(service => {
      const created = new Date(service.createdAt);
      const updated = new Date(service.updatedAt);
      return Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    });

    return Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length);
  }

  private getServiceTypeBreakdown(services: Service[]): Array<{type: ServiceType, count: number, revenue: number}> {
    const breakdown: { [key in ServiceType]?: {count: number, revenue: number} } = {};

    services.forEach(service => {
      if (!breakdown[service.type]) {
        breakdown[service.type] = { count: 0, revenue: 0 };
      }
      breakdown[service.type]!.count++;
      if (service.status === ServiceStatus.COMPLETED) {
        breakdown[service.type]!.revenue += service.amount;
      }
    });

    return Object.entries(breakdown).map(([type, data]) => ({
      type: type as ServiceType,
      count: data.count,
      revenue: data.revenue
    })).sort((a, b) => b.revenue - a.revenue);
  }

  private getMonthlyBreakdown(services: Service[], year: number) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return months.map((month, index) => {
      const monthServices = services.filter(service => {
        const serviceDate = new Date(service.updatedAt);
        return serviceDate.getMonth() === index;
      });

      const revenue = monthServices.reduce((sum, service) => sum + service.amount, 0);
      const expenses = revenue * 0.3; // Simular gastos
      const netIncome = revenue - expenses;

      return {
        month,
        revenue,
        expenses,
        netIncome
      };
    });
  }

  private getTopClientsByRevenue(users: User[], year: number) {
    return users.map(user => {
      const yearServices = user.services.filter(service => {
        const serviceDate = new Date(service.updatedAt);
        return serviceDate.getFullYear() === year && service.status === ServiceStatus.COMPLETED;
      });

      const revenue = yearServices.reduce((sum, service) => sum + service.amount, 0);

      return {
        userName: `${user.name} ${user.lastName}`,
        revenue,
        servicesCount: yearServices.length
      };
    })
    .filter(client => client.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  }

  private generatePDFContent(reportData: any, reportType: string): string {
    // Simular contenido PDF
    return `PDF Report - ${reportType}\n${JSON.stringify(reportData, null, 2)}`;
  }

  private generateExcelContent(reportData: any, reportType: string): string {
    // Simular contenido Excel
    return `Excel Report - ${reportType}\n${JSON.stringify(reportData, null, 2)}`;
  }

  private calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.setDate(now.getDate() + 1));
      case 'weekly':
        return new Date(now.setDate(now.getDate() + 7));
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      default:
        return new Date(now.setDate(now.getDate() + 1));
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // === MÉTODOS DE EXPORTACIÓN ===

  // Exportar servicios a CSV
  exportServicesToCSV(services: Service[], users: User[]): void {
    const headers = [
      'ID',
      'Usuario',
      'Email',
      'Tipo',
      'Descripción',
      'Monto',
      'Estado',
      'Fecha Creación',
      'Fecha Límite',
      'Fecha Actualización'
    ];

    const csvContent = [
      headers.join(','),
      ...services.map(service => {
        const user = users.find(u => u.id === service.userId);
        return [
          service.id,
          user ? `"${user.name} ${user.lastName}"` : 'Usuario no encontrado',
          user ? user.email : '',
          this.getServiceTypeLabel(service.type),
          `"${service.description}"`,
          service.amount,
          this.getServiceStatusLabel(service.status),
          this.formatDate(service.createdAt),
          this.formatDate(service.dueDate),
          this.formatDate(service.updatedAt)
        ].join(',');
      })
    ].join('\n');

    this.downloadCSV(csvContent, `servicios_${this.formatDateForFilename(new Date())}.csv`);
  }

  // Exportar usuarios a CSV
  exportUsersToCSV(users: User[]): void {
    const headers = [
      'ID',
      'Nombre',
      'Apellido',
      'Email',
      'RUT',
      'Teléfono',
      'Dirección',
      'Ciudad',
      'Región',
      'Empresa',
      'Profesión',
      'Activo',
      'Fecha Creación',
      'Total Servicios'
    ];

    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user.id,
        `"${user.name}"`,
        `"${user.lastName}"`,
        user.email,
        user.rut,
        user.phone,
        `"${user.address}"`,
        `"${user.city}"`,
        `"${user.region}"`,
        user.company ? `"${user.company}"` : '',
        `"${user.profession}"`,
        user.isActive ? 'Sí' : 'No',
        this.formatDate(user.createdAt),
        user.services?.length || 0
      ].join(','))
    ].join('\n');

    this.downloadCSV(csvContent, `usuarios_${this.formatDateForFilename(new Date())}.csv`);
  }

  // Exportar reporte financiero
  exportFinancialReportToTXT(report: FinancialReport): void {
    const content = [
      '=== REPORTE FINANCIERO ===',
      `Período: ${report.period}`,
      `Fecha de generación: ${new Date().toLocaleString('es-CL')}`,
      '',
      '--- RESUMEN GENERAL ---',
      `Ingresos totales: $${report.totalRevenue.toLocaleString('es-CL')}`,
      `Gastos totales: $${report.totalExpenses.toLocaleString('es-CL')}`,
      `Ingresos netos: $${report.netIncome.toLocaleString('es-CL')}`,
      `Impuestos estimados: $${report.taxesOwed.toLocaleString('es-CL')}`,
      '',
      '--- DESGLOSE MENSUAL ---',
      ...report.monthlyBreakdown.map(month => 
        `${month.month}: Ingresos $${month.revenue.toLocaleString('es-CL')}, Gastos $${month.expenses.toLocaleString('es-CL')}, Neto $${month.netIncome.toLocaleString('es-CL')}`
      ),
      '',
      '--- PRINCIPALES CLIENTES ---',
      ...report.topClients.map(client => 
        `${client.userName}: $${client.revenue.toLocaleString('es-CL')} (${client.servicesCount} servicios)`
      )
    ].join('\n');

    this.downloadTXT(content, `reporte_financiero_${this.formatDateForFilename(new Date())}.txt`);
  }

  // Métodos auxiliares de exportación
  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename);
  }

  private downloadTXT(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    this.downloadFile(blob, filename);
  }

  private downloadFile(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private getServiceTypeLabel(type: ServiceType): string {
    const labels: Record<ServiceType, string> = {
      [ServiceType.FORM_21]: 'Formulario 21',
      [ServiceType.TAX_DECLARATION]: 'Declaración de Impuestos',
      [ServiceType.ACCOUNTING]: 'Contabilidad',
      [ServiceType.PAYROLL]: 'Nómina',
      [ServiceType.CONSULTING]: 'Consultoría',
      [ServiceType.OTHER]: 'Otro'
    };
    return labels[type] || type;
  }

  private getServiceStatusLabel(status: ServiceStatus): string {
    const labels: Record<ServiceStatus, string> = {
      [ServiceStatus.PENDING]: 'Pendiente',
      [ServiceStatus.IN_PROGRESS]: 'En Proceso',
      [ServiceStatus.COMPLETED]: 'Completado',
      [ServiceStatus.OVERDUE]: 'Vencido',
      [ServiceStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-CL');
  }

  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }
}
