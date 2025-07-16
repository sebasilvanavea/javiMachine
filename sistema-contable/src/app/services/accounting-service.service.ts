import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map, catchError, of, from, switchMap, combineLatest } from 'rxjs';
import { 
  AccountingService, 
  ServiceStatus, 
  ServiceType, 
  ServicePriority,
  ServiceStats,
  ServiceFilters,
  ServicesByStatus,
  ServicesByType,
  ServicesByUser,
  SERVICE_TYPE_CONFIG 
} from '../models/service.model';
import { User } from '../models/user.model';
import { FirebaseErrorService } from './firebase-error.service';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  collectionData,
  docData,
  Timestamp
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AccountingServiceService {
  private firestore = inject(Firestore);
  private firebaseErrorService = inject(FirebaseErrorService);
  private servicesCollection = collection(this.firestore, 'services');
  
  private servicesSubject = new BehaviorSubject<AccountingService[]>([]);
  public services$ = this.servicesSubject.asObservable();

  private statsSubject = new BehaviorSubject<ServiceStats>({
    totalServices: 0,
    pendingServices: 0,
    inProgressServices: 0,
    deliveredServices: 0,
    overdueServices: 0,
    urgentServices: 0,
    thisMonthServices: 0,
    completionRate: 0,
    averageCompletionTime: 0,
    totalRevenue: 0,
    pendingRevenue: 0
  });
  public stats$ = this.statsSubject.asObservable();

  constructor() {
    this.loadServices();
  }

  private loadServices(): void {
    console.log('🔄 Cargando servicios desde Firestore...');
    
    const servicesQuery = query(this.servicesCollection, orderBy('createdAt', 'desc'));
    collectionData(servicesQuery, { idField: 'id' }).subscribe({
      next: (services) => {
        const processedServices = services.map(service => this.processService(service));
        console.log('✅ Servicios cargados desde Firestore:', processedServices.length);
        this.servicesSubject.next(processedServices as AccountingService[]);
        this.calculateStats(processedServices as AccountingService[]);
      },
      error: (error) => {
        console.error('❌ Error cargando servicios desde Firestore:', error);
        this.firebaseErrorService.handleFirestoreError(error);
        this.servicesSubject.next([]);
      }
    });
  }

  private processService(service: any): AccountingService {
    const now = new Date();
    const dueDate = service.dueDate?.toDate ? service.dueDate.toDate() : new Date(service.dueDate);
    const createdAt = service.createdAt?.toDate ? service.createdAt.toDate() : new Date(service.createdAt);
    
    // Calcular si está vencido
    const isOverdue = now > dueDate && service.status !== ServiceStatus.ENTREGADO;
    
    // Calcular días de retraso
    const daysOverdue = isOverdue ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Calcular si es urgente (menos de 3 días para vencer)
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0 && service.status !== ServiceStatus.ENTREGADO;

    return {
      ...service,
      createdAt,
      dueDate,
      updatedAt: service.updatedAt?.toDate ? service.updatedAt.toDate() : new Date(service.updatedAt),
      deliveredAt: service.deliveredAt?.toDate ? service.deliveredAt.toDate() : null,
      isUrgent,
      daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
      status: isOverdue && service.status === ServiceStatus.PENDIENTE ? ServiceStatus.VENCIDO : service.status
    };
  }

  private calculateStats(services: AccountingService[]): void {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const stats: ServiceStats = {
      totalServices: services.length,
      pendingServices: services.filter(s => s.status === ServiceStatus.PENDIENTE).length,
      inProgressServices: services.filter(s => s.status === ServiceStatus.EN_PROCESO).length,
      deliveredServices: services.filter(s => s.status === ServiceStatus.ENTREGADO).length,
      overdueServices: services.filter(s => s.status === ServiceStatus.VENCIDO || s.daysOverdue).length,
      urgentServices: services.filter(s => s.isUrgent).length,
      thisMonthServices: services.filter(s => s.createdAt >= thisMonth).length,
      completionRate: services.length > 0 ? (services.filter(s => s.status === ServiceStatus.ENTREGADO).length / services.length) * 100 : 0,
      averageCompletionTime: this.calculateAverageCompletionTime(services),
      totalRevenue: services.filter(s => s.isPaid).reduce((sum, s) => sum + (s.price || 0), 0),
      pendingRevenue: services.filter(s => !s.isPaid).reduce((sum, s) => sum + (s.price || 0), 0)
    };

    this.statsSubject.next(stats);
  }

  private calculateAverageCompletionTime(services: AccountingService[]): number {
    const completedServices = services.filter(s => s.status === ServiceStatus.ENTREGADO && s.deliveredAt);
    if (completedServices.length === 0) return 0;

    const totalDays = completedServices.reduce((sum, service) => {
      const startDate = service.createdAt;
      const endDate = service.deliveredAt!;
      const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / completedServices.length);
  }

  createService(serviceData: Omit<AccountingService, 'id' | 'createdAt' | 'updatedAt' | 'isUrgent' | 'daysOverdue'>): Observable<AccountingService> {
    console.log('🔄 Creando servicio en Firestore...', serviceData);
    
    const newService = {
      ...serviceData,
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: serviceData.attachments || [],
      tags: serviceData.tags || [],
      notes: serviceData.notes || '',
      estimatedHours: serviceData.estimatedHours || 0,
      isPaid: serviceData.isPaid || false
    };

    return from(addDoc(this.servicesCollection, newService)).pipe(
      map(docRef => {
        console.log('✅ Servicio creado exitosamente en Firestore con ID:', docRef.id);
        return { id: docRef.id, ...newService } as AccountingService;
      }),
      catchError(error => {
        console.error('❌ ERROR creando servicio en Firestore:', error);
        this.firebaseErrorService.handleFirestoreError(error);
        throw error;
      })
    );
  }

  updateService(id: string, serviceData: Partial<AccountingService>): Observable<AccountingService> {
    const updateData = {
      ...serviceData,
      updatedAt: new Date()
    };

    const serviceDoc = doc(this.firestore, 'services', id);
    return from(updateDoc(serviceDoc, updateData)).pipe(
      map(() => {
        console.log('✅ Servicio actualizado exitosamente:', id);
        const currentServices = this.servicesSubject.value;
        const updatedServices = currentServices.map(service => 
          service.id === id ? { ...service, ...updateData } : service
        );
        this.servicesSubject.next(updatedServices);
        return updatedServices.find(s => s.id === id)!;
      }),
      catchError(error => {
        console.error('❌ Error actualizando servicio:', error);
        this.firebaseErrorService.handleFirestoreError(error);
        throw error;
      })
    );
  }

  deleteService(id: string): Observable<void> {
    const serviceDoc = doc(this.firestore, 'services', id);
    return from(deleteDoc(serviceDoc)).pipe(
      map(() => {
        console.log('✅ Servicio eliminado exitosamente:', id);
        const currentServices = this.servicesSubject.value;
        const filteredServices = currentServices.filter(service => service.id !== id);
        this.servicesSubject.next(filteredServices);
      }),
      catchError(error => {
        console.error('❌ Error eliminando servicio:', error);
        this.firebaseErrorService.handleFirestoreError(error);
        throw error;
      })
    );
  }

  getServiceById(id: string): Observable<AccountingService | null> {
    const serviceDoc = doc(this.firestore, 'services', id);
    return docData(serviceDoc, { idField: 'id' }).pipe(
      map(service => service ? this.processService(service) as AccountingService : null),
      catchError(error => {
        console.error('❌ Error obteniendo servicio:', error);
        return of(null);
      })
    );
  }

  getServicesByUser(userId: string): Observable<AccountingService[]> {
    return this.services$.pipe(
      map(services => services.filter(service => service.userId === userId))
    );
  }

  getServicesByStatus(status: ServiceStatus): Observable<AccountingService[]> {
    return this.services$.pipe(
      map(services => services.filter(service => service.status === status))
    );
  }

  getOverdueServices(): Observable<AccountingService[]> {
    return this.services$.pipe(
      map(services => services.filter(service => 
        service.status === ServiceStatus.VENCIDO || service.daysOverdue
      ))
    );
  }

  getUrgentServices(): Observable<AccountingService[]> {
    return this.services$.pipe(
      map(services => services.filter(service => service.isUrgent))
    );
  }

  filterServices(filters: ServiceFilters): Observable<AccountingService[]> {
    return this.services$.pipe(
      map(services => {
        let filteredServices = [...services];

        if (filters.status && filters.status.length > 0) {
          filteredServices = filteredServices.filter(s => filters.status!.includes(s.status));
        }

        if (filters.type && filters.type.length > 0) {
          filteredServices = filteredServices.filter(s => filters.type!.includes(s.type));
        }

        if (filters.priority && filters.priority.length > 0) {
          filteredServices = filteredServices.filter(s => filters.priority!.includes(s.priority));
        }

        if (filters.userId) {
          filteredServices = filteredServices.filter(s => s.userId === filters.userId);
        }

        if (filters.dateFrom) {
          filteredServices = filteredServices.filter(s => s.createdAt >= filters.dateFrom!);
        }

        if (filters.dateTo) {
          filteredServices = filteredServices.filter(s => s.createdAt <= filters.dateTo!);
        }

        if (filters.isOverdue) {
          filteredServices = filteredServices.filter(s => s.status === ServiceStatus.VENCIDO || s.daysOverdue);
        }

        if (filters.isUrgent) {
          filteredServices = filteredServices.filter(s => s.isUrgent);
        }

        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          filteredServices = filteredServices.filter(s => 
            s.title.toLowerCase().includes(searchTerm) ||
            s.description.toLowerCase().includes(searchTerm) ||
            s.userName?.toLowerCase().includes(searchTerm) ||
            s.userEmail?.toLowerCase().includes(searchTerm)
          );
        }

        return filteredServices;
      })
    );
  }

  // Método para generar datos de ejemplo
  generateSampleServices(users: User[]): void {
    if (users.length === 0) return;

    const sampleServices: Omit<AccountingService, 'id' | 'createdAt' | 'updatedAt' | 'isUrgent' | 'daysOverdue'>[] = [
      {
        type: ServiceType.FORMULARIO_21,
        title: 'Formulario 21 - Empresa ABC',
        description: 'Declaración anual de impuestos para Empresa ABC',
        status: ServiceStatus.EN_PROCESO,
        priority: ServicePriority.ALTA,
        userId: users[0].id,
        userName: users[0].name + ' ' + users[0].lastName,
        userEmail: users[0].email,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        estimatedHours: 8,
        actualHours: 4,
        notes: 'Cliente necesita entregar documentación adicional',
        attachments: [],
        tags: ['urgente', 'anual'],
        price: 250000,
        isPaid: false
      },
      {
        type: ServiceType.DECLARACION_IVA,
        title: 'IVA Diciembre 2024',
        description: 'Declaración mensual de IVA para diciembre',
        status: ServiceStatus.VENCIDO,
        priority: ServicePriority.URGENTE,
        userId: users[0].id,
        userName: users[0].name + ' ' + users[0].lastName,
        userEmail: users[0].email,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
        estimatedHours: 3,
        notes: 'Documentación completa recibida',
        attachments: [],
        tags: ['mensual', 'iva'],
        price: 80000,
        isPaid: true
      }
    ];

    sampleServices.forEach(service => {
      this.createService(service).subscribe({
        next: (created) => console.log('✅ Servicio de ejemplo creado:', created.title),
        error: (error) => console.error('❌ Error creando servicio de ejemplo:', error)
      });
    });
  }
}
