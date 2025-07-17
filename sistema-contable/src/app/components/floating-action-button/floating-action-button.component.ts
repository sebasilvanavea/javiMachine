import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

@Component({
  selector: 'app-floating-action-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="fab-container">
      <!-- Botón principal -->
      <button mat-fab 
              color="primary" 
              [matMenuTriggerFor]="fabMenu"
              matTooltip="Acciones rápidas"
              class="main-fab">
        <mat-icon>add</mat-icon>
      </button>

      <!-- Menú de opciones -->
      <mat-menu #fabMenu="matMenu" xPosition="before" yPosition="above">
        <button mat-menu-item (click)="navigateToNewUser()">
          <mat-icon>person_add</mat-icon>
          <span>Nuevo Usuario</span>
        </button>
        
        <button mat-menu-item (click)="navigateToNewService()">
          <mat-icon>work</mat-icon>
          <span>Nuevo Servicio</span>
        </button>
        
        <button mat-menu-item (click)="navigateToForm21()">
          <mat-icon>description</mat-icon>
          <span>Formulario 21</span>
        </button>
        
        <button mat-menu-item (click)="navigateToReports()">
          <mat-icon>assessment</mat-icon>
          <span>Ver Reportes</span>
        </button>
        
        <button mat-menu-item (click)="quickBackup()">
          <mat-icon>backup</mat-icon>
          <span>Respaldo Rápido</span>
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
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
      }
    }

    ::ng-deep .mat-mdc-menu-panel {
      min-width: 200px !important;
    }

    ::ng-deep .mat-mdc-menu-item {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      
      mat-icon {
        margin-right: 0 !important;
        color: #666;
      }
      
      span {
        font-weight: 500;
      }
      
      &:hover mat-icon {
        color: #3f51b5;
      }
    }

    @media (max-width: 768px) {
      .fab-container {
        bottom: 16px;
        right: 16px;
      }
      
      .main-fab {
        width: 48px;
        height: 48px;
        
        mat-icon {
          font-size: 20px;
        }
      }
    }
  `]
})
export class FloatingActionButtonComponent {
  private router = inject(Router);

  navigateToNewUser(): void {
    this.router.navigate(['/users/new']);
  }

  navigateToNewService(): void {
    this.router.navigate(['/services/create']);
  }

  navigateToForm21(): void {
    this.router.navigate(['/form21']);
  }

  navigateToReports(): void {
    this.router.navigate(['/reports']);
  }

  quickBackup(): void {
    console.log('🔄 Iniciando respaldo rápido...');
    // Implementar funcionalidad de respaldo
    const data = {
      users: localStorage.getItem('sistema_contable_users'),
      services: localStorage.getItem('sistema_contable_services'),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sistema-contable-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
