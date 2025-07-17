import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { AccountingServiceService } from './accounting-service.service';
import { UserService } from './user.service';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  read: boolean;
  userId?: string;
  actionUrl?: string;
  autoHide?: boolean;
  duration?: number; // en milisegundos
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly NOTIFICATIONS_KEY = 'sistema_contable_notifications';
  private notificationsSubject = new BehaviorSubject<Notification[]>(this.getNotificationsFromStorage());
  public notifications$ = this.notificationsSubject.asObservable();
  
  private activeToasts: Notification[] = [];
  private accountingService = inject(AccountingServiceService);
  private userService = inject(UserService);

  constructor() {
    this.initializeServiceChecks();
  }

  private getNotificationsFromStorage(): Notification[] {
    const notificationsStr = localStorage.getItem(this.NOTIFICATIONS_KEY);
    if (notificationsStr) {
      try {
        const notifications = JSON.parse(notificationsStr);
        // Convertir timestamp strings de vuelta a Date objects
        return notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  private saveNotificationsToStorage(notifications: Notification[]): void {
    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
    this.notificationsSubject.next(notifications);
  }

  showSuccess(title: string, message: string, autoHide: boolean = true, duration: number = 5000): void {
    this.addNotification({
      title,
      message,
      type: 'success',
      autoHide,
      duration
    });
  }

  showError(title: string, message: string, autoHide: boolean = false): void {
    this.addNotification({
      title,
      message,
      type: 'error',
      autoHide
    });
  }

  showWarning(title: string, message: string, autoHide: boolean = true, duration: number = 7000): void {
    this.addNotification({
      title,
      message,
      type: 'warning',
      autoHide,
      duration
    });
  }

  showInfo(title: string, message: string, autoHide: boolean = true, duration: number = 5000): void {
    this.addNotification({
      title,
      message,
      type: 'info',
      autoHide,
      duration
    });
  }

  private addNotification(notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const notification: Notification = {
      id: this.generateId(),
      timestamp: new Date(),
      read: false,
      ...notificationData
    };

    const notifications = this.getNotificationsFromStorage();
    notifications.unshift(notification); // Agregar al inicio para mostrar primero las más recientes
    
    // Mantener solo las últimas 100 notificaciones
    if (notifications.length > 100) {
      notifications.splice(100);
    }
    
    this.saveNotificationsToStorage(notifications);
    
    // Si es una notificación toast (autoHide), agregarla a la lista de toasts activos
    if (notification.autoHide) {
      this.activeToasts.push(notification);
      
      // Auto-remover después del tiempo especificado
      setTimeout(() => {
        this.removeToast(notification.id);
      }, notification.duration || 5000);
    }
  }

  markAsRead(notificationId: string): Observable<boolean> {
    const notifications = this.getNotificationsFromStorage();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      this.saveNotificationsToStorage(notifications);
      return of(true).pipe(delay(100));
    }
    
    return of(false).pipe(delay(100));
  }

  markAllAsRead(): Observable<boolean> {
    const notifications = this.getNotificationsFromStorage();
    notifications.forEach(n => n.read = true);
    this.saveNotificationsToStorage(notifications);
    return of(true).pipe(delay(200));
  }

  deleteNotification(notificationId: string): Observable<boolean> {
    const notifications = this.getNotificationsFromStorage();
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
      notifications.splice(index, 1);
      this.saveNotificationsToStorage(notifications);
      return of(true).pipe(delay(100));
    }
    
    return of(false).pipe(delay(100));
  }

  getUnreadCount(): Observable<number> {
    const notifications = this.getNotificationsFromStorage();
    const unreadCount = notifications.filter(n => !n.read).length;
    return of(unreadCount).pipe(delay(50));
  }

  getRecentNotifications(limit: number = 5): Observable<Notification[]> {
    const notifications = this.getNotificationsFromStorage();
    return of(notifications.slice(0, limit)).pipe(delay(100));
  }

  getNotificationsByUser(userId: string): Observable<Notification[]> {
    const notifications = this.getNotificationsFromStorage();
    const userNotifications = notifications.filter(n => n.userId === userId);
    return of(userNotifications).pipe(delay(100));
  }

  clearAllNotifications(): Observable<boolean> {
    this.saveNotificationsToStorage([]);
    this.activeToasts = [];
    return of(true).pipe(delay(100));
  }

  getActiveToasts(): Notification[] {
    return this.activeToasts;
  }

  removeToast(notificationId: string): void {
    this.activeToasts = this.activeToasts.filter(toast => toast.id !== notificationId);
  }

  // Métodos para notificaciones específicas del sistema contable
  notifyServiceDueSoon(userName: string, serviceName: string, dueDate: Date): void {
    this.showWarning(
      'Servicio próximo a vencer',
      `El servicio "${serviceName}" para ${userName} vence el ${dueDate.toLocaleDateString('es-ES')}`,
      true,
      10000
    );
  }

  notifyServiceOverdue(userName: string, serviceName: string): void {
    this.showError(
      'Servicio vencido',
      `El servicio "${serviceName}" para ${userName} está vencido`,
      false
    );
  }

  notifyServiceCompleted(userName: string, serviceName: string): void {
    this.showSuccess(
      'Servicio completado',
      `El servicio "${serviceName}" para ${userName} ha sido completado exitosamente`
    );
  }

  notifyNewUser(userName: string): void {
    this.showInfo(
      'Nuevo usuario registrado',
      `${userName} se ha registrado en el sistema`
    );
  }

  notifyDocumentUploaded(documentName: string, userName: string): void {
    this.showSuccess(
      'Documento subido',
      `${userName} ha subido el documento "${documentName}"`
    );
  }

  notifyPaymentReceived(amount: number, userName: string): void {
    this.showSuccess(
      'Pago recibido',
      `Se ha recibido un pago de $${amount.toLocaleString('es-CL')} de ${userName}`
    );
  }

  notifyForm21Submitted(userName: string, period: string): void {
    this.showInfo(
      'Formulario 21 enviado',
      `Se ha enviado el Formulario 21 de ${userName} para el período ${period}`
    );
  }

  notifySystemMaintenance(maintenanceDate: Date): void {
    this.showWarning(
      'Mantenimiento programado',
      `Se realizará mantenimiento del sistema el ${maintenanceDate.toLocaleDateString('es-ES')} a las ${maintenanceDate.toLocaleTimeString('es-ES')}`,
      false
    );
  }

  // === NUEVOS MÉTODOS PARA VERIFICACIÓN DE SERVICIOS ===

  private initializeServiceChecks(): void {
    // Verificar servicios vencidos cada 10 minutos
    setInterval(() => {
      this.checkOverdueServices();
    }, 10 * 60 * 1000);

    // Verificar inmediatamente después de un pequeño delay
    setTimeout(() => {
      this.checkOverdueServices();
    }, 5000);
  }

  private async checkOverdueServices(): Promise<void> {
    try {
      const services = await this.accountingService.services$.pipe(map(s => s)).toPromise();
      const users = await this.userService.getUsers().pipe(map(u => u)).toPromise();

      if (!services || !users) return;

      const currentDate = new Date();
      
      // Servicios vencidos
      const overdueServices = services.filter(service => 
        service.status === 'pendiente' && 
        new Date(service.dueDate) < currentDate
      );

      // Servicios que vencen en los próximos 3 días
      const soonToExpire = services.filter(service => {
        const dueDate = new Date(service.dueDate);
        const diffTime = dueDate.getTime() - currentDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return service.status === 'pendiente' && diffDays > 0 && diffDays <= 3;
      });

      // Notificar servicios vencidos
      overdueServices.forEach(service => {
        const user = users.find(u => u.id === service.userId);
        if (user && !this.hasRecentNotification(service.id, 'vencido')) {
          this.showError(
            'Servicio Vencido',
            `El servicio "${service.title}" para ${user.name} ${user.lastName} está vencido desde el ${new Date(service.dueDate).toLocaleDateString('es-CL')}`
          );
        }
      });

      // Notificar servicios próximos a vencer
      soonToExpire.forEach(service => {
        const user = users.find(u => u.id === service.userId);
        const daysLeft = Math.ceil((new Date(service.dueDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (user && !this.hasRecentNotification(service.id, 'próximo')) {
          this.showWarning(
            'Servicio Próximo a Vencer',
            `El servicio "${service.title}" para ${user.name} ${user.lastName} vence en ${daysLeft} día${daysLeft > 1 ? 's' : ''}`
          );
        }
      });

    } catch (error) {
      console.error('Error verificando servicios:', error);
    }
  }

  private hasRecentNotification(serviceId: string, type: string): boolean {
    const notifications = this.notificationsSubject.value;
    const recent = notifications.find(n => 
      n.message.includes(serviceId) && 
      n.message.includes(type) &&
      (new Date().getTime() - new Date(n.timestamp).getTime()) < (24 * 60 * 60 * 1000) // Últimas 24 horas
    );
    return !!recent;
  }

  // Método público para verificar manualmente
  public checkServicesNow(): void {
    this.checkOverdueServices();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}
