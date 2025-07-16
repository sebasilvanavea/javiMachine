import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { delay, tap, catchError, finalize, map, debounceTime, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OptimizedClickService {
  private processingElements = new BehaviorSubject<Set<string>>(new Set());
  private lastClickTimes = new Map<string, number>();
  private dataCache = new Map<string, { data: any; timestamp: number }>();
  
  private readonly DEBOUNCE_TIME = 300; // milisegundos

  constructor() {}

  // Método principal para manejar clicks optimizados
  handleClick<T>(
    elementId: string, 
    operation: () => Observable<T>,
    options: {
      debounceMs?: number;
      showLoading?: boolean;
      preventMultiple?: boolean;
    } = {}
  ): Observable<T> {
    const { 
      debounceMs = this.DEBOUNCE_TIME, 
      showLoading = true, 
      preventMultiple = true 
    } = options;

    // Verificar si el elemento ya está siendo procesado
    if (preventMultiple && this.isProcessing(elementId)) {
      console.log(`Click ignorado en ${elementId} - ya está procesando`);
      return throwError(() => new Error('Operación en progreso'));
    }

    // Verificar debounce
    const now = Date.now();
    const lastClick = this.lastClickTimes.get(elementId) || 0;
    
    if (now - lastClick < debounceMs) {
      console.log(`Click ignorado en ${elementId} - debounce activo`);
      return throwError(() => new Error('Click muy rápido'));
    }

    // Registrar el click
    this.lastClickTimes.set(elementId, now);
    
    if (showLoading) {
      this.setProcessing(elementId, true);
    }

    console.log(`Procesando click en ${elementId}`);

    return operation().pipe(
      tap(() => {
        console.log(`Click completado en ${elementId}`);
      }),
      catchError((error) => {
        console.error(`Error en click ${elementId}:`, error);
        return throwError(() => error);
      }),
      finalize(() => {
        if (showLoading) {
          this.setProcessing(elementId, false);
        }
      })
    );
  }

  // Verificar si un elemento está siendo procesado
  isProcessing(elementId: string): boolean {
    return this.processingElements.value.has(elementId);
  }

  // Observable para escuchar cambios de estado
  isProcessing$(elementId: string): Observable<boolean> {
    return this.processingElements.pipe(
      map(set => set.has(elementId)),
      delay(0), // Asegurar que se emita en el próximo tick
      tap(isProcessing => console.log(`Estado de ${elementId}:`, isProcessing))
    );
  }

  // Establecer estado de procesamiento
  private setProcessing(elementId: string, processing: boolean): void {
    const current = new Set(this.processingElements.value);
    
    if (processing) {
      current.add(elementId);
    } else {
      current.delete(elementId);
    }
    
    this.processingElements.next(current);
  }

  // Limpiar estados
  clearProcessing(elementId?: string): void {
    if (elementId) {
      this.setProcessing(elementId, false);
      this.lastClickTimes.delete(elementId);
    } else {
      this.processingElements.next(new Set());
      this.lastClickTimes.clear();
    }
  }

  // Métodos de utilidad para diferentes tipos de operaciones
  
  // Para operaciones de envío/guardado
  handleSubmit<T>(elementId: string, submitOperation: () => Observable<T>): Observable<T> {
    return this.handleClick(elementId, submitOperation, {
      debounceMs: 500,
      showLoading: true,
      preventMultiple: true
    });
  }

  // Para operaciones rápidas (como navegación)
  handleQuickAction<T>(elementId: string, quickOperation: () => Observable<T>): Observable<T> {
    return this.handleClick(elementId, quickOperation, {
      debounceMs: 100,
      showLoading: false,
      preventMultiple: false
    });
  }

  // Método para manejar carga de datos con cache y estado
  handleDataLoad<T>(
    cacheKey: string, 
    dataLoader: () => Observable<T>,
    cacheDurationMs: number = 120000 // 2 minutos por defecto
  ): Observable<T> {
    const now = Date.now();
    const cached = this.dataCache.get(cacheKey);
    
    if (cached && (now - cached.timestamp) < cacheDurationMs) {
      return of(cached.data as T);
    }

    return dataLoader().pipe(
      debounceTime(200),
      tap(data => {
        this.dataCache.set(cacheKey, {
          data,
          timestamp: now
        });
      }),
      shareReplay(1)
    );
  }
}
