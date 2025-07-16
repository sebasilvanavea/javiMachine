import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { OptimizedClickService } from '../../services/optimized-click.service';
import { DashboardService } from '../../services/dashboard.service';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-optimized-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="optimized-component">
      <h2>Ejemplo de Componente Optimizado</h2>
      
      <!-- Ejemplo 1: Botón con estado de carga -->
      <div class="example-section">
        <h3>1. Botón con Estado de Carga</h3>
        <button 
          class="btn btn-primary"
          [disabled]="isLoadingStats$ | async"
          (click)="loadDashboardStats()">
          @if (isLoadingStats$ | async) {
            <span class="spinner"></span> Cargando...
          } @else {
            Cargar Estadísticas
          }
        </button>
        
        @if (dashboardStats$ | async; as stats) {
          <div class="stats-display">
            <p>Total Documentos: {{ stats.totalDocuments }}</p>
            <p>Usuarios Activos: {{ stats.activeUsers }}</p>
            <p>Ingresos: {{ stats.monthlyRevenue | currency:'CLP' }}</p>
          </div>
        }
      </div>

      <!-- Ejemplo 2: Lista de documentos con búsqueda optimizada -->
      <div class="example-section">
        <h3>2. Búsqueda de Documentos</h3>
        <input 
          type="text" 
          placeholder="Buscar documentos..."
          #searchInput
          (input)="searchDocuments(searchInput.value)">
        
        @if (isLoadingSearch$ | async) {
          <p>Buscando...</p>
        }
        
        @if (searchResults$ | async; as documents) {
          <div class="document-list">
            @for (doc of documents; track doc.id) {
              <div class="document-item">
                <span>{{ doc.name }}</span>
                <button 
                  [disabled]="isProcessingDoc(doc.id) | async"
                  (click)="downloadDocument(doc.id)">
                  @if (isProcessingDoc(doc.id) | async) {
                    Descargando...
                  } @else {
                    Descargar
                  }
                </button>
              </div>
            } @empty {
              <p>No se encontraron documentos</p>
            }
          </div>
        }
      </div>

      <!-- Ejemplo 3: Formulario con submit optimizado -->
      <div class="example-section">
        <h3>3. Formulario Optimizado</h3>
        <form (ngSubmit)="submitForm()">
          <input type="text" placeholder="Nombre del documento" #docName>
          <input type="file" #fileInput (change)="onFileSelected($event)">
          
          <button 
            type="submit"
            [disabled]="isSubmitting$ | async"
            class="btn btn-success">
            @if (isSubmitting$ | async) {
              <span class="spinner"></span> Guardando...
            } @else {
              Guardar Documento
            }
          </button>
        </form>
      </div>

      <!-- Ejemplo 4: Navegación rápida -->
      <div class="example-section">
        <h3>4. Navegación Rápida</h3>
        <div class="quick-nav">
          <button (click)="quickNavigate('dashboard')" class="nav-btn">
            Dashboard
          </button>
          <button (click)="quickNavigate('users')" class="nav-btn">
            Usuarios
          </button>
          <button (click)="quickNavigate('reports')" class="nav-btn">
            Reportes
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .optimized-component {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .example-section {
      margin-bottom: 30px;
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
      margin-bottom: 10px;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-success {
      background-color: #28a745;
      color: white;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s ease-in-out infinite;
      margin-right: 5px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .stats-display {
      margin-top: 15px;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 4px;
    }

    .document-list {
      margin-top: 10px;
    }

    .document-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      border-bottom: 1px solid #eee;
    }

    .quick-nav {
      display: flex;
      gap: 10px;
    }

    .nav-btn {
      padding: 10px 20px;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .nav-btn:hover {
      background-color: #545b62;
    }

    input {
      padding: 8px;
      margin-right: 10px;
      margin-bottom: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 300px;
    }
  `]
})
export class OptimizedComponentExample implements OnInit {
  // Observables para estados de carga
  dashboardStats$!: Observable<any>;
  isLoadingStats$!: Observable<boolean>;
  
  searchResults$!: Observable<any[]>;
  isLoadingSearch$!: Observable<boolean>;
  
  isSubmitting$!: Observable<boolean>;
  
  // Archivo seleccionado
  selectedFile: File | null = null;

  constructor(
    private optimizedClickService: OptimizedClickService,
    private dashboardService: DashboardService,
    private documentService: DocumentService
  ) {}

  ngOnInit() {
    // Inicializar observables de estado
    this.isLoadingStats$ = this.optimizedClickService.isProcessing$('dashboard-stats');
    this.isLoadingSearch$ = this.optimizedClickService.isProcessing$('document-search');
    this.isSubmitting$ = this.optimizedClickService.isProcessing$('form-submit');
  }

  // Método optimizado para cargar estadísticas del dashboard
  loadDashboardStats() {
    this.dashboardStats$ = this.optimizedClickService.handleDataLoad(
      'dashboard-stats',
      () => this.dashboardService.getDashboardStatsOptimized()
    );
  }

  // Búsqueda optimizada de documentos
  searchDocuments(query: string) {
    if (query.trim().length < 2) {
      return;
    }

    this.searchResults$ = this.optimizedClickService.handleDataLoad(
      `document-search-${query}`,
      () => this.documentService.searchDocuments(query)
    );
  }

  // Descarga optimizada de documento
  downloadDocument(documentId: string) {
    this.optimizedClickService.handleSubmit(
      `download-${documentId}`,
      () => this.documentService.downloadDocument(documentId)
    ).subscribe({
      next: (blob) => {
        // Crear URL para descarga
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `documento-${documentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar documento:', error);
        alert('Error al descargar el documento');
      }
    });
  }

  // Verificar si un documento está siendo procesado
  isProcessingDoc(documentId: string): Observable<boolean> {
    return this.optimizedClickService.isProcessing$(`download-${documentId}`);
  }

  // Manejo de selección de archivo
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Submit optimizado del formulario
  submitForm() {
    if (!this.selectedFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    this.optimizedClickService.handleSubmit(
      'form-submit',
      () => this.documentService.uploadDocument(this.selectedFile!, 'general')
    ).subscribe({
      next: (result) => {
        console.log('Documento subido exitosamente:', result);
        alert('Documento guardado correctamente');
        this.selectedFile = null;
      },
      error: (error) => {
        console.error('Error al subir documento:', error);
        alert('Error al guardar el documento');
      }
    });
  }

  // Navegación rápida optimizada
  quickNavigate(route: string) {
    this.optimizedClickService.handleQuickAction(
      `nav-${route}`,
      () => {
        // Simular navegación
        console.log(`Navegando a: ${route}`);
        // Aquí irían las llamadas al router
        // this.router.navigate([route]);
        return new Observable(observer => {
          setTimeout(() => {
            observer.next(true);
            observer.complete();
          }, 100);
        });
      }
    ).subscribe();
  }
}
