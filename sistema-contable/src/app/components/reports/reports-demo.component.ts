import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

import { AdvancedReportsComponent } from './advanced-reports.component';

@Component({
  selector: 'app-reports-demo',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    AdvancedReportsComponent
  ],
  template: `
    <div class="demo-container">
      <!-- Header de demostración -->
      <div class="demo-header">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>analytics</mat-icon>
              Sistema de Reportes Avanzados - Demo
            </mat-card-title>
            <mat-card-subtitle>
              Funcionalidades completas: Filtros avanzados, exportación PDF/Excel/CSV, gráficos interactivos
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="features-grid">
              <div class="feature-item">
                <mat-icon>filter_alt</mat-icon>
                <h4>Filtros Avanzados</h4>
                <p>Filtrado por fechas, tipos, estados, montos y búsqueda de texto</p>
              </div>
              <div class="feature-item">
                <mat-icon>file_download</mat-icon>
                <h4>Exportación</h4>
                <p>Exporta a PDF, Excel y CSV con métricas completas</p>
              </div>
              <div class="feature-item">
                <mat-icon>bar_chart</mat-icon>
                <h4>Gráficos</h4>
                <p>Visualizaciones interactivas con Chart.js</p>
              </div>
              <div class="feature-item">
                <mat-icon>insights</mat-icon>
                <h4>Métricas</h4>
                <p>KPIs en tiempo real y análisis detallado</p>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="showFullDemo = true" *ngIf="!showFullDemo">
              <mat-icon>play_arrow</mat-icon>
              Ver Demo Completo
            </button>
            <button mat-stroked-button (click)="showFullDemo = false" *ngIf="showFullDemo">
              <mat-icon>keyboard_arrow_up</mat-icon>
              Ocultar Demo
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Demo completo -->
      <div class="full-demo" *ngIf="showFullDemo">
        <app-advanced-reports></app-advanced-reports>
      </div>

      <!-- Instrucciones de implementación -->
      <div class="implementation-guide" *ngIf="!showFullDemo">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>code</mat-icon>
              Guía de Implementación
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-tab-group>
              <mat-tab label="Instalación">
                <div class="tab-content">
                  <h3>Dependencias Requeridas</h3>
                  <pre><code>npm install jspdf jspdf-autotable xlsx file-saver chart.js</code></pre>
                  
                  <h3>Tipos de TypeScript</h3>
                  <pre><code>npm install --save-dev &#64;types/file-saver</code></pre>

                  <h3>Importar en tu módulo</h3>
                  <pre><code>import &#123; AdvancedReportsComponent &#125; from './components/reports/advanced-reports.component';
import &#123; AdvancedReportService &#125; from './services/advanced-report.service';</code></pre>
                </div>
              </mat-tab>

              <mat-tab label="Configuración">
                <div class="tab-content">
                  <h3>Configurar el Servicio</h3>
                  <p>El servicio <code>AdvancedReportService</code> maneja:</p>
                  <ul>
                    <li>Filtros reactivos con RxJS</li>
                    <li>Exportación a múltiples formatos</li>
                    <li>Generación de datos para gráficos</li>
                    <li>Cálculo de métricas automático</li>
                  </ul>

                  <h3>Integrar con tu API</h3>
                  <p>Reemplaza el método <code>fetchReportData()</code> en el servicio para conectar con tu backend:</p>
                  <pre><code>private fetchReportData(filters: ReportFilter): Observable&lt;ReportData[]&gt; &#123;
  return this.http.get&lt;ReportData[]&gt;('/api/reports', &#123; params: filters &#125;);
&#125;</code></pre>
                </div>
              </mat-tab>

              <mat-tab label="Personalización">
                <div class="tab-content">
                  <h3>Personalizar Filtros</h3>
                  <p>Modifica los arrays en el componente:</p>
                  <ul>
                    <li><code>serviceTypes</code> - Tipos de servicios</li>
                    <li><code>serviceStatuses</code> - Estados disponibles</li>
                    <li><code>priorities</code> - Niveles de prioridad</li>
                    <li><code>categories</code> - Categorías de servicio</li>
                  </ul>

                  <h3>Agregar Nuevos Gráficos</h3>
                  <p>Extiende el método <code>getChartData()</code> en el servicio para nuevos tipos de visualización.</p>

                  <h3>Personalizar Exportación</h3>
                  <p>Modifica las opciones de exportación en <code>ExportOptions</code> interface.</p>
                </div>
              </mat-tab>

              <mat-tab label="Estilos">
                <div class="tab-content">
                  <h3>Variables SCSS</h3>
                  <p>Personaliza los colores principales:</p>
                  <pre><code>$primary-color: #3B82F6;
$success-color: #10B981;
$warning-color: #F59E0B;
$error-color: #EF4444;</code></pre>

                  <h3>Clases CSS Disponibles</h3>
                  <ul>
                    <li><code>.metric-card</code> - Tarjetas de métricas</li>
                    <li><code>.chart-card</code> - Contenedores de gráficos</li>
                    <li><code>.filters-card</code> - Panel de filtros</li>
                    <li><code>.service-card</code> - Tarjetas de servicios</li>
                  </ul>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .demo-header {
      margin-bottom: 2rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin: 1.5rem 0;
    }

    .feature-item {
      text-align: center;
      padding: 1rem;
      
      mat-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
        color: #3B82F6;
        margin-bottom: 0.5rem;
      }
      
      h4 {
        margin: 0.5rem 0;
        color: #374151;
        font-weight: 600;
      }
      
      p {
        margin: 0;
        color: #6B7280;
        font-size: 0.9rem;
        line-height: 1.4;
      }
    }

    .implementation-guide {
      margin-top: 2rem;
    }

    .tab-content {
      padding: 2rem;
      
      h3 {
        color: #374151;
        font-weight: 600;
        margin-bottom: 1rem;
        margin-top: 2rem;
        
        &:first-child {
          margin-top: 0;
        }
      }
      
      pre {
        background: #F3F4F6;
        padding: 1rem;
        border-radius: 8px;
        overflow-x: auto;
        margin: 1rem 0;
        
        code {
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 0.9rem;
          color: #374151;
        }
      }
      
      ul {
        margin: 1rem 0;
        padding-left: 1.5rem;
        
        li {
          margin-bottom: 0.5rem;
          color: #6B7280;
        }
      }
      
      p {
        color: #6B7280;
        line-height: 1.6;
        margin: 1rem 0;
      }
      
      code {
        background: #F3F4F6;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 0.9rem;
        color: #374151;
      }
    }

    .full-demo {
      animation: slideInUp 0.5s ease-out;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .demo-container {
        padding: 1rem;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ReportsDemoComponent implements OnInit {
  showFullDemo = false;

  ngOnInit(): void {
    console.log('🚀 Sistema de Reportes Avanzados cargado');
    console.log('📊 Funcionalidades disponibles:');
    console.log('- Filtros avanzados con múltiples criterios');
    console.log('- Exportación a PDF, Excel y CSV');
    console.log('- Gráficos interactivos con Chart.js');
    console.log('- Métricas y KPIs en tiempo real');
    console.log('- Vista de tarjetas y tabla responsive');
    console.log('- Análisis detallado por categorías');
  }
}
