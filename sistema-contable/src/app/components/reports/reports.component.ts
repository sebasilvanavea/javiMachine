import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { ReportService, ReportFilter } from '../../services/report.service';
import { AccountingServiceService } from '../../services/accounting-service.service';
import { UserService } from '../../services/user.service';
import { ServiceType as AccountingServiceType, ServiceStatus as AccountingServiceStatus } from '../../models/service.model';
import { ServiceType, ServiceStatus } from '../../models/user.model';
import { User } from '../../models/user.model';
import { FileSizePipe } from '../../pipes/file-size.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    MatTooltipModule
    // FileSizePipe - Comentado hasta implementar
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private accountingService = inject(AccountingServiceService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  // Filtros para reportes
  filter: ReportFilter = {
    startDate: new Date(new Date().getFullYear(), 0, 1), // Inicio del año
    endDate: new Date(),
    includeDetails: true
  };

  // Datos para selects
  serviceTypes = Object.values(ServiceType);
  serviceStatuses = Object.values(ServiceStatus);
  users$: Observable<User[]> = this.userService.getUsers();

  // Estados de carga
  isGeneratingReport = false;
  isExporting = false;

  // Nuevas propiedades para el diseño Contabilium
  userDateRange = {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  };

  serviceFilters = {
    status: [] as ServiceStatus[],
    type: [] as ServiceType[]
  };

  financialPeriod = 'monthly';

  productivityMetrics = {
    completionRate: true,
    averageTime: false,
    clientSatisfaction: false
  };

  // Historial de reportes mock
  reportHistory = [
    {
      id: '1',
      name: 'Reporte de Usuarios - Enero 2025',
      type: 'Usuarios',
      generatedAt: new Date('2025-01-15T10:30:00'),
      fileSize: 1024 * 1024 * 2.5, // 2.5 MB
      status: 'Completado'
    },
    {
      id: '2',
      name: 'Análisis Financiero - Q4 2024',
      type: 'Financiero',
      generatedAt: new Date('2025-01-10T14:20:00'),
      fileSize: 1024 * 1024 * 8.2, // 8.2 MB
      status: 'Completado'
    }
  ];

  historyColumns = ['name', 'date', 'size', 'status', 'actions'];

  // Estadísticas rápidas
  quickStats$ = combineLatest([
    this.accountingService.services$,
    this.userService.getUsers()
  ]).pipe(
    map(([services, users]) => ({
      totalServices: services.length,
      totalUsers: users.length,
      totalRevenue: services.reduce((sum, s) => sum + (s.price || 0), 0),
      pendingServices: services.filter(s => s.status === 'pendiente').length,
      completedServices: services.filter(s => s.status === 'entregado').length
    }))
  );

  ngOnInit(): void {
    // Componente inicializado
  }

  // === EXPORTACIONES RÁPIDAS ===

  async exportAllServices(): Promise<void> {
    this.isExporting = true;
    try {
      const services = await this.accountingService.services$.pipe(map(s => s)).toPromise();
      const users = await this.userService.getUsers().pipe(map(u => u)).toPromise();
      
      if (services && users) {
        // Convertir a formato compatible
        const convertedServices = services.map(s => ({
          id: s.id,
          userId: s.userId,
          type: this.mapServiceType(s.type),
          description: s.title,
          amount: s.price || 0,
          status: this.mapServiceStatus(s.status),
          dueDate: s.dueDate,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        }));

        this.reportService.exportServicesToCSV(convertedServices as any[], users);
        this.showSuccess('Reporte de servicios exportado exitosamente');
      }
    } catch (error) {
      this.showError('Error al exportar servicios');
    } finally {
      this.isExporting = false;
    }
  }

  async exportAllUsers(): Promise<void> {
    this.isExporting = true;
    try {
      const users = await this.userService.getUsers().pipe(map(u => u)).toPromise();
      if (users) {
        this.reportService.exportUsersToCSV(users);
        this.showSuccess('Reporte de usuarios exportado exitosamente');
      }
    } catch (error) {
      this.showError('Error al exportar usuarios');
    } finally {
      this.isExporting = false;
    }
  }

  async generateFinancialReport(): Promise<void> {
    this.isGeneratingReport = true;
    try {
      const year = this.filter.startDate?.getFullYear() || new Date().getFullYear();
      const report = await this.reportService.generateFinancialReport(year).toPromise();
      if (report) {
        this.reportService.exportFinancialReportToTXT(report);
        this.showSuccess('Reporte financiero generado exitosamente');
      }
    } catch (error) {
      this.showError('Error al generar reporte financiero');
    } finally {
      this.isGeneratingReport = false;
    }
  }

  async generateServiceReport(): Promise<void> {
    this.isGeneratingReport = true;
    try {
      const report = await this.reportService.generateServiceReport(this.filter).toPromise();
      if (report) {
        // Generar reporte de texto con estadísticas
        const content = [
          '=== REPORTE DE SERVICIOS ===',
          `Período: ${this.formatDate(this.filter.startDate!)} - ${this.formatDate(this.filter.endDate!)}`,
          `Fecha de generación: ${new Date().toLocaleString('es-CL')}`,
          '',
          '--- ESTADÍSTICAS GENERALES ---',
          `Total de servicios: ${report.services.length}`,
          `Servicios completados: ${report.completedServices}`,
          `Servicios pendientes: ${report.pendingServices}`,
          `Servicios vencidos: ${report.overdueServices}`,
          `Ingresos totales: $${report.totalRevenue.toLocaleString('es-CL')}`,
          `Tiempo promedio de completación: ${report.averageCompletionTime} días`,
          '',
          '--- TIPOS DE SERVICIOS MÁS POPULARES ---',
          ...report.topServiceTypes.map(type => 
            `${type.type}: ${type.count} servicios, $${type.revenue.toLocaleString('es-CL')} en ingresos`
          )
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_servicios_${this.formatDateForFilename(new Date())}.txt`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showSuccess('Reporte de servicios generado exitosamente');
      }
    } catch (error) {
      this.showError('Error al generar reporte de servicios');
    } finally {
      this.isGeneratingReport = false;
    }
  }

  // === MÉTODOS AUXILIARES ===

  private mapServiceType(type: string): ServiceType {
    const typeMap: Record<string, ServiceType> = {
      'formulario_21': ServiceType.FORM_21,
      'declaracion_iva': ServiceType.TAX_DECLARATION,
      'declaracion_renta': ServiceType.TAX_DECLARATION,
      'contabilidad_mensual': ServiceType.ACCOUNTING,
      'constitucion_empresa': ServiceType.CONSULTING,
      'modificacion_empresa': ServiceType.CONSULTING,
      'finiquito': ServiceType.PAYROLL,
      'certificados': ServiceType.OTHER,
      'otro': ServiceType.OTHER
    };
    return typeMap[type] || ServiceType.OTHER;
  }

  private mapServiceStatus(status: string): ServiceStatus {
    const statusMap: Record<string, ServiceStatus> = {
      'pendiente': ServiceStatus.PENDING,
      'en_proceso': ServiceStatus.IN_PROGRESS,
      'entregado': ServiceStatus.COMPLETED,
      'vencido': ServiceStatus.OVERDUE,
      'cancelado': ServiceStatus.CANCELLED
    };
    return statusMap[status] || ServiceStatus.PENDING;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-CL');
  }

  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // === MÉTODOS DE FORMATO PARA LA VISTA ===

  getServiceTypeLabel(type: ServiceType): string {
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

  getServiceStatusLabel(status: ServiceStatus): string {
    const labels: Record<ServiceStatus, string> = {
      [ServiceStatus.PENDING]: 'Pendiente',
      [ServiceStatus.IN_PROGRESS]: 'En Proceso',
      [ServiceStatus.COMPLETED]: 'Completado',
      [ServiceStatus.OVERDUE]: 'Vencido',
      [ServiceStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status;
  }

  // === MÉTODOS PARA EL NUEVO DISEÑO CONTABILIUM ===

  generateAllReports(): void {
    this.showSuccess('Generando todos los reportes...');
    // Implementar lógica para generar todos los reportes
  }

  exportUserReport(format: 'pdf' | 'excel'): void {
    this.showSuccess(`Exportando reporte de usuarios en formato ${format.toUpperCase()}`);
    // Implementar exportación de usuarios
  }

  exportServiceReport(format: 'pdf' | 'excel'): void {
    this.showSuccess(`Exportando reporte de servicios en formato ${format.toUpperCase()}`);
    // Implementar exportación de servicios
  }

  exportFinancialReport(format: 'pdf' | 'excel'): void {
    this.showSuccess(`Exportando reporte financiero en formato ${format.toUpperCase()}`);
    // Implementar exportación financiera
  }

  exportProductivityReport(format: 'pdf' | 'excel'): void {
    this.showSuccess(`Exportando reporte de productividad en formato ${format.toUpperCase()}`);
    // Implementar exportación de productividad
  }

  refreshHistory(): void {
    this.showSuccess('Actualizando historial de reportes...');
    // Implementar actualización del historial
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status.toLowerCase()) {
      case 'completado':
        return 'primary';
      case 'en progreso':
        return 'accent';
      case 'error':
        return 'warn';
      default:
        return 'primary';
    }
  }

  downloadReport(report: any): void {
    this.showSuccess(`Descargando ${report.name}...`);
    // Implementar descarga de reporte
  }

  deleteReport(report: any): void {
    this.showSuccess(`Eliminando ${report.name}...`);
    // Implementar eliminación de reporte
    const index = this.reportHistory.findIndex(r => r.id === report.id);
    if (index > -1) {
      this.reportHistory.splice(index, 1);
    }
  }
}
