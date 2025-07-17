import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';

@Component({
  selector: 'app-floating-action-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="fab-container">
      <button mat-fab 
              class="main-fab"
              [matMenuTriggerFor]="fabMenu"
              matTooltip="Acciones Rápidas"
              matTooltipPosition="left">
        <mat-icon>add</mat-icon>
      </button>

      <mat-menu #fabMenu="matMenu" class="fab-menu">
        <button mat-menu-item (click)="navigateToCreateService()">
          <mat-icon>assignment_add</mat-icon>
          <span>Nuevo Servicio</span>
        </button>
        
        <button mat-menu-item (click)="navigateToCreateUser()">
          <mat-icon>person_add</mat-icon>
          <span>Nuevo Usuario</span>
        </button>
        
        <button mat-menu-item (click)="navigateToReports()">
          <mat-icon>assessment</mat-icon>
          <span>Generar Reporte</span>
        </button>
        
        <button mat-menu-item (click)="navigateToServices()">
          <mat-icon>list</mat-icon>
          <span>Ver Servicios</span>
        </button>

        <mat-divider></mat-divider>

        <button mat-menu-item (click)="navigateToUsers()">
          <mat-icon>people</mat-icon>
          <span>Gestionar Usuarios</span>
        </button>
        
        <button mat-menu-item (click)="navigateToDashboard()">
          <mat-icon>dashboard</mat-icon>
          <span>Dashboard</span>
        </button>
      </mat-menu>
    </div>
  `,
  styles: [`
    .fab-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
    }

    .main-fab {
      background: linear-gradient(45deg, #2196F3, #21CBF3) !important;
      color: white !important;
      box-shadow: 0 4px 16px rgba(33, 150, 243, 0.3) !important;
      transition: transform 0.2s, box-shadow 0.2s !important;
    }

    .main-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4) !important;
    }

    .fab-menu {
      transform: translateY(-8px);
    }

    @media (max-width: 768px) {
      .fab-container {
        bottom: 16px;
        right: 16px;
      }
    }
  `]
})
export class FloatingActionButtonComponent {
  private router = inject(Router);

  navigateToCreateService(): void {
    this.router.navigate(['/services/create']);
  }

  navigateToCreateUser(): void {
    this.router.navigate(['/users/create']);
  }

  navigateToReports(): void {
    this.router.navigate(['/reports']);
  }

  navigateToServices(): void {
    this.router.navigate(['/services']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/users']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/']);
  }
}
