import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reports-demo',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="demo-container">
      <h1>Sistema de Reportes Avanzados</h1>
      <p class="subtitle">Reportes completos con exportación PDF, Excel y visualizaciones interactivas</p>
      
      <div class="demo-actions">
        <button mat-raised-button color="primary" (click)="showFullDemo = !showFullDemo">
          <mat-icon>{{ showFullDemo ? 'visibility_off' : 'visibility' }}</mat-icon>
          {{ showFullDemo ? 'Ocultar Demo' : 'Ver Demo Completo' }}
        </button>
      </div>

      <!-- Características principales -->
      <div class="features-grid" *ngIf="!showFullDemo">
        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>file_download</mat-icon>
            <mat-card-title>Exportación Múltiple</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            PDF profesional, Excel con formato, CSV para análisis
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>filter_list</mat-icon>
            <mat-card-title>Filtros Avanzados</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            Por fecha, tipo, estado, cliente con búsqueda en tiempo real
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>analytics</mat-icon>
            <mat-card-title>Visualizaciones</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            Gráficos interactivos con Chart.js, múltiples tipos de vista
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>dashboard</mat-icon>
            <mat-card-title>Métricas en Tiempo Real</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            KPIs, tendencias y análisis automático de datos
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Demo completo -->
      <div class="full-demo" *ngIf="showFullDemo">
        <p class="demo-note">
          <mat-icon>info</mat-icon>
          El componente completo de reportes se ha implementado y está disponible en la ruta /reports
        </p>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: #2563eb;
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .subtitle {
      color: #6b7280;
      font-size: 1.1rem;
      text-align: center;
      margin-bottom: 2rem;
    }

    .demo-actions {
      text-align: center;
      margin-bottom: 2rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }

    .feature-card {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }

    .feature-card mat-icon[mat-card-avatar] {
      background: #3b82f6;
      color: white;
    }

    .demo-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f0f9ff;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
      font-weight: 500;
    }

    .full-demo {
      margin-top: 2rem;
    }
  `]
})
export class ReportsDemoComponent {
  showFullDemo = false;
}
