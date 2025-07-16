import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public online$ = this.onlineSubject.asObservable();

  constructor() {
    // Escuchar cambios en el estado de la conexión
    merge(
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).pipe(
      map(() => navigator.onLine),
      startWith(navigator.onLine)
    ).subscribe(isOnline => {
      this.onlineSubject.next(isOnline);
      console.log('Estado de conexión:', isOnline ? 'Online' : 'Offline');
    });
  }

  get isOnline(): boolean {
    return this.onlineSubject.value;
  }

  get isOffline(): boolean {
    return !this.onlineSubject.value;
  }

  // Simular delay de red para testing
  networkDelay<T>(source$: Observable<T>, delay: number = 0): Observable<T> {
    if (!this.isOnline) {
      // Si no hay conexión, devolver error o datos en cache
      console.warn('Sin conexión a internet - usando datos en cache');
    }
    
    // En desarrollo, simular delay de red
    const networkDelay = this.isOnline ? delay : 0;
    
    return source$.pipe(
      // Aquí podrías agregar lógica de delay si fuera necesario
    );
  }

  // Verificar si una operación requiere conexión
  requiresConnection(operation: string): boolean {
    if (this.isOffline) {
      console.warn(`Operación "${operation}" requiere conexión a internet`);
      return false;
    }
    return true;
  }
}
