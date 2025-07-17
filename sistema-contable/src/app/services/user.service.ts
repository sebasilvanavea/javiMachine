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
  private initialized = false;

  constructor() {
    // Defer initialization to avoid injection context issues
    setTimeout(() => this.initializeUserService(), 0);
  }

  private initializeUserService(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.loadUsers();
  }

  private loadUsers(): void {
    console.log('🔄 Cargando usuarios desde Firestore...');
    
    try {
      // Simplificar la consulta - sin orderBy que puede causar problemas
      collectionData(this.usersCollection, { idField: 'id' }).subscribe({
        next: (users) => {
          console.log('✅ Usuarios cargados desde Firestore:', users.length);
          
          if (users.length === 0) {
          console.log('📝 No hay usuarios en Firestore. Generando usuarios de prueba...');
          this.generateDemoUsers();
        } else {
          // Usar Promise.resolve() para evitar NG0100
          Promise.resolve().then(() => {
            this.usersSubject.next(users as User[]);
          });
        }
      },
      error: (error) => {
        console.error('❌ Error cargando usuarios desde Firestore:', error);
        console.error('🔍 Detalles del error:', error.code, error.message);
        
        // En caso de error, mostrar usuarios de prueba
        console.log('📊 Cargando usuarios de prueba debido al error...');
        this.generateDemoUsers();
      }
    });
    } catch (error) {
      console.error('❌ Error crítico inicializando usuarios:', error);
      this.generateDemoUsers();
    }
  }

  private generateDemoUsers(): void {
    const demoUsers: User[] = [
      {
        id: '1',
        name: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        rut: '12.345.678-9',
        phone: '+56 9 1234 5678',
        address: 'Av. Principal 123',
        city: 'Santiago',
        region: 'Metropolitana',
        company: 'Empresa ABC',
        profession: 'Gerente General',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        services: [
          {
            id: '1',
            userId: '1',
            type: ServiceType.TAX_DECLARATION,
            status: ServiceStatus.COMPLETED,
            description: 'Declaración de renta 2024',
            amount: 150000,
            dueDate: new Date(2024, 3, 30),
            createdAt: new Date(),
            updatedAt: new Date(),
            documents: []
          }
        ]
      },
      {
        id: '2',
        name: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@email.com',
        rut: '98.765.432-1',
        phone: '+56 9 8765 4321',
        address: 'Calle Comercio 456',
        city: 'Valparaíso',
        region: 'Valparaíso',
        company: 'Consultora XYZ',
        profession: 'Directora Comercial',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        services: [
          {
            id: '2',
            userId: '2',
            type: ServiceType.ACCOUNTING,
            status: ServiceStatus.IN_PROGRESS,
            description: 'Contabilidad mensual',
            amount: 80000,
            dueDate: new Date(2024, 11, 31),
            createdAt: new Date(),
            updatedAt: new Date(),
            documents: []
          }
        ]
      },
      {
        id: '3',
        name: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@email.com',
        rut: '15.555.666-7',
        phone: '+56 9 5555 6666',
        address: 'Av. Innovación 789',
        city: 'Concepción',
        region: 'Bío Bío',
        company: 'Startup Tech',
        profession: 'CEO',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        services: []
      },
      {
        id: '4',
        name: 'Ana',
        lastName: 'Silva',
        email: 'ana.silva@email.com',
        rut: '17.777.888-9',
        phone: '+56 9 7777 8888',
        address: 'Sector Industrial 321',
        city: 'Antofagasta',
        region: 'Antofagasta',
        company: 'Industria Minera',
        profession: 'Contadora',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        services: [
          {
            id: '3',
            userId: '4',
            type: ServiceType.CONSULTING,
            status: ServiceStatus.PENDING,
            description: 'Asesoría en planificación tributaria',
            amount: 200000,
            dueDate: new Date(2024, 11, 15),
            createdAt: new Date(),
            updatedAt: new Date(),
            documents: []
          }
        ]
      }
    ];

    console.log('✅ Usuarios de prueba generados:', demoUsers.length);
    // Usar Promise.resolve() para evitar NG0100
    Promise.resolve().then(() => {
      this.usersSubject.next(demoUsers);
    });
  }

  getUsers(): Observable<User[]> {
    // Si no hay usuarios cargados, forzar la carga inmediata
    if (this.usersSubject.value.length === 0) {
      console.log('🔄 No hay usuarios en cache, forzando carga inmediata...');
      this.loadUsers();
    }
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
          // Usar Promise.resolve() para evitar NG0100
          Promise.resolve().then(() => {
            this.usersSubject.next([...currentUsers]);
          });
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
        // Usar Promise.resolve() para evitar NG0100
        Promise.resolve().then(() => {
          this.usersSubject.next(filteredUsers);
        });
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
          // Usar Promise.resolve() para evitar NG0100
          Promise.resolve().then(() => {
            this.usersSubject.next([...currentUsers]);
          });
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
            // Usar Promise.resolve() para evitar NG0100
            Promise.resolve().then(() => {
              this.usersSubject.next([...currentUsers]);
            });
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
