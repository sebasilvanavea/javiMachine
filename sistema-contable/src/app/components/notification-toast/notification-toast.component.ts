import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Observable, Subscription } from 'rxjs';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ],
  template: `
    <div class="toast-container" [@slideInOut]>
      @for (notification of visibleNotifications; track notification.id) {
        <div class="toast-item" 
             [@fadeInOut]
             [class]="'toast-' + notification.type"
             (click)="markAsRead(notification.id)">
          <div class="toast-content">
            <div class="toast-icon">
              <mat-icon>{{getIcon(notification.type)}}</mat-icon>
            </div>
            <div class="toast-message">
              <h4>{{notification.title}}</h4>
              <p>{{notification.message}}</p>
              <small>{{formatTime(notification.timestamp)}}</small>
            </div>
            <button mat-icon-button 
                    class="close-button"
                    (click)="dismissNotification(notification.id); $event.stopPropagation()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          @if (notification.autoHide && notification.duration) {
            <div class="progress-bar" 
                 [style.animation-duration.ms]="notification.duration"></div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 2000;
      max-width: 400px;
      width: 100%;
    }

    .toast-item {
      margin-bottom: 12px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      cursor: pointer;
      position: relative;
      background: white;
      border-left: 4px solid;
      
      &.toast-success {
        border-left-color: #4caf50;
        
        .toast-icon mat-icon {
          color: #4caf50;
        }
      }
      
      &.toast-error {
        border-left-color: #f44336;
        
        .toast-icon mat-icon {
          color: #f44336;
        }
      }
      
      &.toast-warning {
        border-left-color: #ff9800;
        
        .toast-icon mat-icon {
          color: #ff9800;
        }
      }
      
      &.toast-info {
        border-left-color: #2196f3;
        
        .toast-icon mat-icon {
          color: #2196f3;
        }
      }
      
      &:hover {
        transform: translateX(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }
    }

    .toast-content {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 12px;
    }

    .toast-icon {
      flex-shrink: 0;
      
      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .toast-message {
      flex: 1;
      
      h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }
      
      p {
        margin: 0 0 4px 0;
        font-size: 13px;
        color: #666;
        line-height: 1.4;
      }
      
      small {
        font-size: 11px;
        color: #999;
      }
    }

    .close-button {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #999;
      }
      
      &:hover mat-icon {
        color: #666;
      }
    }

    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #2196f3, #64b5f6);
      animation: countdown linear;
      animation-fill-mode: forwards;
    }

    @keyframes countdown {
      from { width: 100%; }
      to { width: 0%; }
    }

    @media (max-width: 768px) {
      .toast-container {
        right: 16px;
        left: 16px;
        max-width: none;
      }
      
      .toast-content {
        padding: 12px;
      }
      
      .toast-message {
        h4 {
          font-size: 13px;
        }
        
        p {
          font-size: 12px;
        }
      }
    }
  `],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  
  visibleNotifications: Notification[] = [];
  private subscription?: Subscription;
  private autoHideTimers: Map<string, number> = new Map();

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(notifications => {
      // Mostrar solo las notificaciones no leídas y recientes
      this.visibleNotifications = notifications
        .filter(n => !n.read && this.isRecent(n.timestamp))
        .slice(0, 5); // Máximo 5 notificaciones visibles
      
      // Configurar auto-hide para notificaciones nuevas
      this.setupAutoHide();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    // Limpiar timers
    this.autoHideTimers.forEach(timer => clearTimeout(timer));
    this.autoHideTimers.clear();
  }

  private isRecent(timestamp: Date): boolean {
    const now = new Date().getTime();
    const notificationTime = new Date(timestamp).getTime();
    const tenMinutes = 10 * 60 * 1000; // 10 minutos en milisegundos
    return (now - notificationTime) < tenMinutes;
  }

  private setupAutoHide(): void {
    this.visibleNotifications.forEach(notification => {
      if (notification.autoHide && notification.duration && !this.autoHideTimers.has(notification.id)) {
        const timer = window.setTimeout(() => {
          this.dismissNotification(notification.id);
          this.autoHideTimers.delete(notification.id);
        }, notification.duration);
        
        this.autoHideTimers.set(notification.id, timer);
      }
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'notifications';
    }
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    return time.toLocaleDateString('es-CL');
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  dismissNotification(notificationId: string): void {
    // Remover timer si existe
    const timer = this.autoHideTimers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      this.autoHideTimers.delete(notificationId);
    }
    
    // Marcar como leída
    this.markAsRead(notificationId);
  }
}
