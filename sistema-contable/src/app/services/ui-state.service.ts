import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, share, takeUntil, map } from 'rxjs/operators';

export interface ClickEvent {
  elementId: string;
  timestamp: number;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  private clickSubject = new Subject<ClickEvent>();
  private loadingElements = new BehaviorSubject<Set<string>>(new Set());
  private disabledElements = new BehaviorSubject<Set<string>>(new Set());
  
  // Observable para clicks con debounce para prevenir doble click
  public clicks$ = this.clickSubject.pipe(
    debounceTime(300), // Esperar 300ms entre clicks
    distinctUntilChanged((prev, curr) => 
      prev.elementId === curr.elementId && 
      (curr.timestamp - prev.timestamp) < 500 // Ignorar clicks muy seguidos
    ),
    share()
  );

  constructor() {}

  // Registrar un click
  registerClick(elementId: string, data?: any): void {
    const clickEvent: ClickEvent = {
      elementId,
      timestamp: Date.now(),
      data
    };
    
    console.log('Click registrado:', elementId);
    this.clickSubject.next(clickEvent);
  }

  // Marcar elemento como cargando
  setElementLoading(elementId: string, loading: boolean): void {
    const currentLoading = this.loadingElements.value;
    const newLoading = new Set(currentLoading);
    
    if (loading) {
      newLoading.add(elementId);
    } else {
      newLoading.delete(elementId);
    }
    
    this.loadingElements.next(newLoading);
    console.log(`Elemento ${elementId} ${loading ? 'cargando' : 'terminó de cargar'}`);
  }

  // Verificar si un elemento está cargando
  isElementLoading(elementId: string): Observable<boolean> {
    return this.loadingElements.pipe(
      distinctUntilChanged(),
      takeUntil(this.getDestroySignal(elementId)),
      map(loadingSet => loadingSet.has(elementId))
    );
  }

  // Marcar elemento como deshabilitado
  setElementDisabled(elementId: string, disabled: boolean): void {
    const currentDisabled = this.disabledElements.value;
    const newDisabled = new Set(currentDisabled);
    
    if (disabled) {
      newDisabled.add(elementId);
    } else {
      newDisabled.delete(elementId);
    }
    
    this.disabledElements.next(newDisabled);
  }

  // Verificar si un elemento está deshabilitado
  isElementDisabled(elementId: string): boolean {
    return this.disabledElements.value.has(elementId);
  }

  // Prevenir múltiples clicks en un elemento
  preventDoubleClick(elementId: string, action: () => Observable<any>): Observable<any> {
    if (this.isElementDisabled(elementId) || this.loadingElements.value.has(elementId)) {
      console.log(`Acción bloqueada para ${elementId} - elemento ocupado`);
      return new Observable(observer => {
        observer.error('Elemento ocupado, intente nuevamente');
      });
    }

    // Deshabilitar elemento temporalmente
    this.setElementDisabled(elementId, true);
    this.setElementLoading(elementId, true);

    return new Observable(observer => {
      action().subscribe({
        next: (value) => observer.next(value),
        error: (error) => {
          observer.error(error);
          this.setElementDisabled(elementId, false);
          this.setElementLoading(elementId, false);
        },
        complete: () => {
          observer.complete();
          this.setElementDisabled(elementId, false);
          this.setElementLoading(elementId, false);
        }
      });
    });
  }

  // Limpiar estado de un elemento
  clearElementState(elementId: string): void {
    this.setElementLoading(elementId, false);
    this.setElementDisabled(elementId, false);
  }

  // Limpiar todos los estados
  clearAllStates(): void {
    this.loadingElements.next(new Set());
    this.disabledElements.next(new Set());
  }

  // Obtener señal de destrucción para un componente
  private getDestroySignal(elementId: string): Observable<any> {
    // En una implementación real, esto estaría conectado al ciclo de vida del componente
    return new Subject();
  }

  // Wrapper para operaciones que requieren feedback visual inmediato
  withImmediateFeedback<T>(
    elementId: string, 
    operation: () => Observable<T>,
    feedbackMessage?: string
  ): Observable<T> {
    console.log(`Iniciando operación para ${elementId}${feedbackMessage ? ': ' + feedbackMessage : ''}`);
    
    return this.preventDoubleClick(elementId, operation);
  }

  // Obtener estado de todos los elementos cargando
  getAllLoadingElements(): Observable<Set<string>> {
    return this.loadingElements.asObservable();
  }

  // Método helper para componentes que necesitan prevenir doble click
  createClickHandler(elementId: string, handler: () => Observable<any>) {
    return () => {
      this.registerClick(elementId);
      return this.withImmediateFeedback(elementId, handler);
    };
  }
}
