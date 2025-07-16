import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // en milisegundos
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // Limpiar cache expirado cada 10 minutos
    setInterval(() => {
      this.cleanExpiredCache();
    }, 10 * 60 * 1000);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar si el cache ha expirado
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    console.log(`Cache hit para: ${key}`);
    return item.data;
  }

  set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_CACHE_TIME): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn
    };

    this.cache.set(key, item);
    console.log(`Cache guardado para: ${key}`);
  }

  delete(key: string): void {
    this.cache.delete(key);
    console.log(`Cache eliminado para: ${key}`);
  }

  clear(): void {
    this.cache.clear();
    console.log('Cache completamente limpiado');
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Verificar si ha expirado
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Wrapper para observables con cache automático
  getOrSet<T>(
    key: string, 
    sourceObservable: Observable<T>, 
    expiresIn: number = this.DEFAULT_CACHE_TIME
  ): Observable<T> {
    const cachedData = this.get<T>(key);
    
    if (cachedData !== null) {
      return of(cachedData);
    }

    return sourceObservable.pipe(
      tap(data => {
        this.set(key, data, expiresIn);
      })
    );
  }

  // Invalidar cache por patrón
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    console.log(`Cache invalidado para patrón: ${pattern}, ${keysToDelete.length} elementos eliminados`);
  }

  // Obtener información del cache
  getCacheInfo(): {size: number, keys: string[]} {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.expiresIn) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.log(`Cache expirado limpiado: ${expiredKeys.length} elementos eliminados`);
    }
  }

  // Métodos específicos para el sistema contable
  invalidateUserCache(): void {
    this.invalidatePattern('user');
    this.invalidatePattern('dashboard');
  }

  invalidateServiceCache(): void {
    this.invalidatePattern('service');
    this.invalidatePattern('dashboard');
  }

  invalidateDocumentCache(): void {
    this.invalidatePattern('document');
  }

  invalidateDashboardCache(): void {
    this.invalidatePattern('dashboard');
    this.invalidatePattern('stats');
    this.invalidatePattern('chart');
  }
}
