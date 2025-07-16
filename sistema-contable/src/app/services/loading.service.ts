import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface LoadingState {
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({});
  public loading$ = this.loadingSubject.asObservable();

  constructor() {}

  setLoading(key: string, loading: boolean): void {
    const currentState = this.loadingSubject.value;
    this.loadingSubject.next({
      ...currentState,
      [key]: loading
    });
  }

  isLoading(key: string): Observable<boolean> {
    return new Observable(observer => {
      this.loading$.subscribe(state => {
        observer.next(!!state[key]);
      });
    });
  }

  getLoadingState(key: string): boolean {
    return !!this.loadingSubject.value[key];
  }

  // Wrapper para observables que maneja el estado de carga automáticamente
  withLoading<T>(key: string, source$: Observable<T>): Observable<T> {
    this.setLoading(key, true);
    return source$.pipe(
      finalize(() => this.setLoading(key, false))
    );
  }

  // Limpiar estado de carga específico
  clearLoading(key: string): void {
    const currentState = this.loadingSubject.value;
    const newState = { ...currentState };
    delete newState[key];
    this.loadingSubject.next(newState);
  }

  // Limpiar todos los estados de carga
  clearAllLoading(): void {
    this.loadingSubject.next({});
  }
}
