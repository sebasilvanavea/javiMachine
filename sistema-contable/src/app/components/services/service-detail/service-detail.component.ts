import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';

import { AccountingServiceService } from '../../../services/accounting-service.service';
import { 
  AccountingService, 
  SERVICE_TYPE_CONFIG,
  SERVICE_STATUS_CONFIG 
} from '../../../models/service.model';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="service-detail-container">
      @if (service$ | async; as service) {
        <div class="header">
          <div class="title-section">
            <h1>
              <mat-icon [style.color]="getTypeConfig(service.type).color">
                {{getTypeConfig(service.type).icon}}
              </mat-icon>
              {{service.title}}
            </h1>
            <p>{{getTypeConfig(service.type).description}}</p>
          </div>
          <div class="actions">
            <button mat-stroked-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Volver
            </button>
            <button mat-raised-button color="primary" (click)="editService()">
              <mat-icon>edit</mat-icon>
              Editar
            </button>
          </div>
        </div>

        <!-- Status Badge -->
        <div class="status-section">
          <mat-chip [style.background-color]="getStatusConfig(service.status).color + '20'"
                   [style.color]="getStatusConfig(service.status).color"
                   class="status-chip">
            <mat-icon [style.color]="getStatusConfig(service.status).color">
              {{getStatusConfig(service.status).icon}}
            </mat-icon>
            {{getStatusConfig(service.status).label}}
          </mat-chip>

          @if (service.isUrgent) {
            <mat-chip class="urgent-chip">
              <mat-icon>priority_high</mat-icon>
              Urgente
            </mat-chip>
          }

          @if (service.daysOverdue) {
            <mat-chip class="overdue-chip">
              <mat-icon>error</mat-icon>
              {{service.daysOverdue}} días de retraso
            </mat-chip>
          }
        </div>

        <!-- Información Principal -->
        <div class="content-grid">
          <!-- Información del Servicio -->
          <mat-card class="service-info-card">
            <mat-card-header>
              <mat-card-title>Información del Servicio</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <label>Tipo:</label>
                  <span>{{getTypeConfig(service.type).label}}</span>
                </div>
                <div class="info-item">
                  <label>Prioridad:</label>
                  <span class="priority priority-{{service.priority}}">
                    {{service.priority | titlecase}}
                  </span>
                </div>
                <div class="info-item">
                  <label>Fecha de Creación:</label>
                  <span>{{service.createdAt | date:'dd/MM/yyyy HH:mm'}}</span>
                </div>
                <div class="info-item">
                  <label>Fecha Límite:</label>
                  <span [class.overdue]="service.daysOverdue" [class.urgent]="service.isUrgent">
                    {{service.dueDate | date:'dd/MM/yyyy'}}
                  </span>
                </div>
                @if (service.deliveredAt) {
                  <div class="info-item">
                    <label>Fecha de Entrega:</label>
                    <span>{{service.deliveredAt | date:'dd/MM/yyyy HH:mm'}}</span>
                  </div>
                }
                <div class="info-item">
                  <label>Última Actualización:</label>
                  <span>{{service.updatedAt | date:'dd/MM/yyyy HH:mm'}}</span>
                </div>
              </div>

              @if (service.description) {
                <div class="description-section">
                  <h4>Descripción</h4>
                  <p>{{service.description}}</p>
                </div>
              }

              @if (service.notes) {
                <div class="notes-section">
                  <h4>Notas</h4>
                  <p>{{service.notes}}</p>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Información del Usuario -->
          <mat-card class="user-info-card">
            <mat-card-header>
              <mat-card-title>Usuario Asignado</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="user-details">
                <div class="user-avatar">
                  {{getUserInitials(service.userName || '')}}
                </div>
                <div class="user-info">
                  <h3>{{service.userName}}</h3>
                  <p>{{service.userEmail}}</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Información Financiera -->
          @if (service.price) {
            <mat-card class="financial-info-card">
              <mat-card-header>
                <mat-card-title>Información Financiera</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="financial-grid">
                  <div class="price-info">
                    <div class="price-amount">
                      {{service.price | currency:'CLP':'symbol':'1.0-0'}}
                    </div>
                    <div class="payment-status" [class.paid]="service.isPaid" [class.unpaid]="!service.isPaid">
                      <mat-icon>{{service.isPaid ? 'check_circle' : 'schedule'}}</mat-icon>
                      {{service.isPaid ? 'Pagado' : 'Pendiente de Pago'}}
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Información de Tiempo -->
          <mat-card class="time-info-card">
            <mat-card-header>
              <mat-card-title>Información de Tiempo</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="time-grid">
                <div class="time-item">
                  <label>Horas Estimadas:</label>
                  <span>{{service.estimatedHours}} horas</span>
                </div>
                @if (service.actualHours) {
                  <div class="time-item">
                    <label>Horas Reales:</label>
                    <span>{{service.actualHours}} horas</span>
                  </div>
                  <div class="time-item">
                    <label>Diferencia:</label>
                    <span [class.positive]="(service.actualHours || 0) <= service.estimatedHours"
                          [class.negative]="(service.actualHours || 0) > service.estimatedHours">
                      {{((service.actualHours || 0) - service.estimatedHours)}} horas
                    </span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>

      } @else {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Cargando servicio...</p>
        </div>
      }
    </div>
  `,
  styleUrl: './service-detail.scss'
})
export class ServiceDetailComponent implements OnInit {
  private accountingService = inject(AccountingServiceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  service$!: Observable<AccountingService | null>;
  serviceId!: string;

  ngOnInit() {
    this.serviceId = this.route.snapshot.paramMap.get('id')!;
    if (this.serviceId) {
      this.service$ = this.accountingService.getServiceById(this.serviceId);
    } else {
      this.goBack();
    }
  }

  getTypeConfig(type: string) {
    return SERVICE_TYPE_CONFIG[type as keyof typeof SERVICE_TYPE_CONFIG];
  }

  getStatusConfig(status: string) {
    return SERVICE_STATUS_CONFIG[status as keyof typeof SERVICE_STATUS_CONFIG];
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  editService(): void {
    this.router.navigate(['/services', this.serviceId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/services']);
  }
}
