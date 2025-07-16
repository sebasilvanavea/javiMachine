import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map, catchError, of, from, switchMap, combineLatest } from 'rxjs';
import { User, Service, ServiceType, ServiceStatus } from '../models/user.model';
import { AccountingServiceService } from './accounting-service.service';
import { ServiceType as AccountingServiceType, ServiceStatus as AccountingServiceStatus } from '../models/service.model';
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
  docData
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);
  private firebaseErrorService = inject(FirebaseErrorService);
  private accountingService = inject(AccountingServiceService);
  private usersCollection = collection(this.firestore, 'users');
  private servicesCollection = collection(this.firestore, 'services');
  
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor() {
    this.loadUsers();
  }

  private loadUsers(): void {
    console.log('🔄 Cargando usuarios desde Firestore...');
    
    // Cargar usuarios desde Firestore en tiempo real
    const usersQuery = query(this.usersCollection, orderBy('createdAt', 'desc'));
    collectionData(usersQuery, { idField: 'id' }).subscribe({
      next: (users) => {
        console.log('✅ Usuarios cargados desde Firestore:', users.length);
        this.usersSubject.next(users as User[]);
        
        // Si no hay usuarios en Firestore, mostrar mensaje
        if (users.length === 0) {
          console.log('📝 No hay usuarios en Firestore. Base de datos vacía.');
        }
      },
      error: (error) => {
        console.error('❌ Error cargando usuarios desde Firestore:', error);
        console.error('🔍 Detalles del error:', error.code, error.message);
        
        // Verificar si es un problema de permisos
        if (error.code === 'permission-denied') {
          console.error('🚫 Error de permisos - Verifica las reglas de Firestore');
        }
        
        this.firebaseErrorService.handleFirestoreError(error);
        
        // NO cargar datos mock - mantener array vacío para indicar problema real
        this.usersSubject.next([]);
      }
    });
  }

  getUsers(): Observable<User[]> {
    return this.users$;
  }

  getUserById(id: string): Observable<User | null> {
    // Intentar desde Firestore
    const userDoc = doc(this.firestore, 'users', id);
    return from(getDoc(userDoc)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as User;
        }
        return null;
      }),
      catchError(() => {
        // Fallback a datos locales
        return this.users$.pipe(
          map(users => users.find(user => user.id === id) || null)
        );
      })
    );
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'services'>): Observable<User> {
    console.log('🔄 Creando usuario en Firestore...', userData);
    
    const newUser: Omit<User, 'id'> = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      services: []
    };

    // Intentar guardar en Firestore
    return from(addDoc(this.usersCollection, newUser)).pipe(
      map(docRef => {
        console.log('✅ Usuario creado exitosamente en Firestore con ID:', docRef.id);
        const user = { id: docRef.id, ...newUser } as User;
        return user;
      }),
      catchError(error => {
        console.error('❌ ERROR creando usuario en Firestore:', error);
        console.error('🔍 Código de error:', error.code);
        console.error('🔍 Mensaje:', error.message);
        
        if (error.code === 'permission-denied') {
          console.error('🚫 PROBLEMA: Las reglas de Firestore están bloqueando la escritura');
          console.error('💡 SOLUCIÓN: Configura las reglas de Firestore para permitir escritura');
        }
        
        // NO crear usuario local - lanzar el error para que el usuario sepa que falló
        throw error;
      })
    );
  }

  updateUser(id: string, userData: Partial<User>): Observable<User> {
    const updateData = {
      ...userData,
      updatedAt: new Date()
    };

    // Intentar actualizar en Firestore
    const userDoc = doc(this.firestore, 'users', id);
    return from(updateDoc(userDoc, updateData)).pipe(
      switchMap(() => this.getUserById(id)),
      map(user => user!),
      catchError(error => {
        console.error('Error actualizando usuario en Firestore:', error);
        // Fallback a datos locales
        const currentUsers = this.usersSubject.value;
        const userIndex = currentUsers.findIndex(u => u.id === id);
        if (userIndex !== -1) {
          const updatedUser = { ...currentUsers[userIndex], ...updateData };
          currentUsers[userIndex] = updatedUser;
          this.usersSubject.next([...currentUsers]);
          return of(updatedUser);
        }
        throw error;
      })
    );
  }

  deleteUser(id: string): Observable<boolean> {
    // Intentar eliminar de Firestore
    const userDoc = doc(this.firestore, 'users', id);
    return from(deleteDoc(userDoc)).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error eliminando usuario de Firestore:', error);
        // Fallback a datos locales
        const currentUsers = this.usersSubject.value;
        const filteredUsers = currentUsers.filter(u => u.id !== id);
        this.usersSubject.next(filteredUsers);
        return of(true);
      })
    );
  }

  // Servicios
  createService(userId: string, serviceData: Omit<Service, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'documents'>): Observable<Service> {
    const newService: Omit<Service, 'id'> = {
      ...serviceData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      documents: []
    };

    // Intentar guardar en Firestore
    return from(addDoc(this.servicesCollection, newService)).pipe(
      map(docRef => ({ id: docRef.id, ...newService } as Service)),
      catchError(error => {
        console.error('Error creando servicio en Firestore:', error);
        // Fallback a datos locales
        const localService: Service = {
          id: this.generateId(),
          ...newService
        };
        
        // Actualizar usuario local
        const currentUsers = this.usersSubject.value;
        const userIndex = currentUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          currentUsers[userIndex].services.push(localService);
          this.usersSubject.next([...currentUsers]);
        }
        
        return of(localService);
      })
    );
  }

  updateService(serviceId: string, serviceData: Partial<Service>): Observable<Service> {
    const updateData = {
      ...serviceData,
      updatedAt: new Date()
    };

    // Intentar actualizar en Firestore
    const serviceDoc = doc(this.firestore, 'services', serviceId);
    return from(updateDoc(serviceDoc, updateData)).pipe(
      switchMap(() => from(getDoc(serviceDoc))),
      map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Service)),
      catchError(error => {
        console.error('Error actualizando servicio en Firestore:', error);
        // Fallback a datos locales
        const currentUsers = this.usersSubject.value;
        for (const user of currentUsers) {
          const serviceIndex = user.services.findIndex(s => s.id === serviceId);
          if (serviceIndex !== -1) {
            user.services[serviceIndex] = { ...user.services[serviceIndex], ...updateData };
            this.usersSubject.next([...currentUsers]);
            return of(user.services[serviceIndex]);
          }
        }
        throw error;
      })
    );
  }

  getPendingServices(): Observable<{user: User, service: Service}[]> {
    // Ahora usamos directamente los datos del AccountingService
    return combineLatest([
      this.users$,
      this.accountingService.services$
    ]).pipe(
      map(([users, accountingServices]) => {
        const pendingServices: {user: User, service: Service}[] = [];
        
        // Filtrar servicios pendientes o vencidos del AccountingService
        accountingServices
          .filter((service: any) => 
            service.status === 'pendiente' || 
            service.status === 'vencido'
          )
          .forEach((accountingService: any) => {
            // Buscar el usuario asociado
            const user = users.find((u: any) => u.id === accountingService.userId);
            
            if (user) {
              // Convertir AccountingService a Service para compatibilidad
              const service: Service = {
                id: accountingService.id,
                userId: accountingService.userId,
                type: this.mapAccountingServiceType(accountingService.type),
                description: accountingService.title,
                amount: accountingService.price || 0,
                status: this.mapAccountingServiceStatus(accountingService.status),
                dueDate: accountingService.dueDate,
                createdAt: accountingService.createdAt,
                updatedAt: accountingService.updatedAt,
                documents: [] // Agregar campo requerido
              };
              
              pendingServices.push({ user, service });
            }
          });
        
        return pendingServices.sort((a, b) => 
          new Date(a.service.dueDate).getTime() - new Date(b.service.dueDate).getTime()
        );
      })
    );
  }

  private mapAccountingServiceType(accountingType: AccountingServiceType): ServiceType {
    switch (accountingType) {
      case 'formulario_21':
        return ServiceType.FORM_21;
      case 'declaracion_iva':
        return ServiceType.TAX_DECLARATION;
      case 'declaracion_renta':
        return ServiceType.TAX_DECLARATION;
      case 'contabilidad_mensual':
        return ServiceType.ACCOUNTING;
      case 'constitucion_empresa':
        return ServiceType.CONSULTING;
      case 'modificacion_empresa':
        return ServiceType.CONSULTING;
      case 'finiquito':
        return ServiceType.PAYROLL;
      case 'certificados':
        return ServiceType.OTHER;
      default:
        return ServiceType.OTHER;
    }
  }

  private mapAccountingServiceStatus(accountingStatus: AccountingServiceStatus): ServiceStatus {
    switch (accountingStatus) {
      case 'pendiente':
        return ServiceStatus.PENDING;
      case 'en_proceso':
        return ServiceStatus.IN_PROGRESS;
      case 'entregado':
        return ServiceStatus.COMPLETED;
      case 'vencido':
        return ServiceStatus.OVERDUE;
      case 'cancelado':
        return ServiceStatus.CANCELLED;
      default:
        return ServiceStatus.PENDING;
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}
