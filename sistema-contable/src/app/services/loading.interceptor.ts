import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { LoadingService } from './loading.service';
import { NotificationService } from './notification.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Crear una clave única para esta petición
    const requestKey = `${request.method}_${request.url}_${Date.now()}`;
    
    // Incrementar contador de peticiones activas
    this.activeRequests++;
    this.loadingService.setLoading('global', true);
    this.loadingService.setLoading(requestKey, true);

    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // La petición se completó exitosamente
          console.log('Petición completada:', request.url);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Manejar errores HTTP
        let errorMessage = 'Ha ocurrido un error inesperado';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Mostrar notificación de error
        this.notificationService.showError(
          'Error en la operación',
          errorMessage
        );

        console.error('Error HTTP:', error);
        return throwError(() => error);
      }),
      finalize(() => {
        // Decrementar contador y actualizar estado de carga
        this.activeRequests--;
        this.loadingService.setLoading(requestKey, false);
        
        if (this.activeRequests === 0) {
          this.loadingService.setLoading('global', false);
        }
      })
    );
  }
}
