import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { ExportOptions, ReportData } from '../../services/advanced-report.service';

interface ExportDialogData {
  defaultOptions: ExportOptions;
  availableData: ReportData[];
  availableColumns: string[];
  availableClients: string[];
  availableServiceTypes: string[];
  availableStatuses: string[];
}

@Component({
  selector: 'app-export-config-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTabsModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule
  ],
  template: `
    <div class="export-config-dialog">
      <h2 mat-dialog-title>
        <mat-icon>file_download</mat-icon>
        Configurar Exportación Avanzada
      </h2>

      <mat-dialog-content>
        <form [formGroup]="exportForm" class="export-form">
          
          <!-- Configuración Principal -->
          <mat-tab-group class="config-tabs">
            
            <!-- Tab: Formato y Contenido -->
            <mat-tab label="Formato y Contenido">
              <div class="tab-content">
                
                <!-- Formato de exportación -->
                <div class="config-section">
                  <h3>
                    <mat-icon>description</mat-icon>
                    Formato de Exportación
                  </h3>
                  
                  <mat-radio-group formControlName="format" class="format-options">
                    <mat-radio-button value="pdf" class="format-option">
                      <div class="format-card">
                        <mat-icon>picture_as_pdf</mat-icon>
                        <div class="format-info">
                          <strong>PDF</strong>
                          <span>Documento profesional con gráficos</span>
                        </div>
                      </div>
                    </mat-radio-button>
                    
                    <mat-radio-button value="excel" class="format-option">
                      <div class="format-card">
                        <mat-icon>table_chart</mat-icon>
                        <div class="format-info">
                          <strong>Excel</strong>
                          <span>Hojas de cálculo con fórmulas</span>
                        </div>
                      </div>
                    </mat-radio-button>
                    
                    <mat-radio-button value="word" class="format-option">
                      <div class="format-card">
                        <mat-icon>article</mat-icon>
                        <div class="format-info">
                          <strong>Word</strong>
                          <span>Documento editable completo</span>
                        </div>
                      </div>
                    </mat-radio-button>
                    
                    <mat-radio-button value="csv" class="format-option">
                      <div class="format-card">
                        <mat-icon>grid_on</mat-icon>
                        <div class="format-info">
                          <strong>CSV</strong>
                          <span>Datos tabulares simples</span>
                        </div>
                      </div>
                    </mat-radio-button>
                  </mat-radio-group>
                </div>

                <mat-divider></mat-divider>

                <!-- Contenido a incluir -->
                <div class="config-section">
                  <h3>
                    <mat-icon>checklist</mat-icon>
                    Contenido a Incluir
                  </h3>
                  
                  <div class="content-options">
                    <mat-slide-toggle formControlName="includeMetrics">
                      <div class="toggle-content">
                        <mat-icon>analytics</mat-icon>
                        <div>
                          <strong>Métricas Principales</strong>
                          <small>KPIs y estadísticas generales</small>
                        </div>
                      </div>
                    </mat-slide-toggle>

                    <mat-slide-toggle formControlName="includeCharts">
                      <div class="toggle-content">
                        <mat-icon>pie_chart</mat-icon>
                        <div>
                          <strong>Gráficos y Visualizaciones</strong>
                          <small>Gráficos de barras, dona y líneas</small>
                        </div>
                      </div>
                    </mat-slide-toggle>

                    <mat-slide-toggle formControlName="includeRawData">
                      <div class="toggle-content">
                        <mat-icon>table_view</mat-icon>
                        <div>
                          <strong>Datos Detallados</strong>
                          <small>Tabla completa de servicios</small>
                        </div>
                      </div>
                    </mat-slide-toggle>

                    <mat-slide-toggle formControlName="includeSummary">
                      <div class="toggle-content">
                        <mat-icon>summarize</mat-icon>
                        <div>
                          <strong>Resumen Ejecutivo</strong>
                          <small>Análisis y conclusiones</small>
                        </div>
                      </div>
                    </mat-slide-toggle>

                    <mat-slide-toggle formControlName="includeFilters">
                      <div class="toggle-content">
                        <mat-icon>filter_list</mat-icon>
                        <div>
                          <strong>Filtros Aplicados</strong>
                          <small>Criterios de selección usados</small>
                        </div>
                      </div>
                    </mat-slide-toggle>

                    <mat-slide-toggle formControlName="includeAnalysis">
                      <div class="toggle-content">
                        <mat-icon>insights</mat-icon>
                        <div>
                          <strong>Análisis Avanzado</strong>
                          <small>Tendencias y comparativas</small>
                        </div>
                      </div>
                    </mat-slide-toggle>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Tab: Configuración por Formato -->
            <mat-tab label="Configuración Específica">
              <div class="tab-content">
                
                <!-- Configuración PDF -->
                <mat-expansion-panel *ngIf="exportForm.value.format === 'pdf'" expanded>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>picture_as_pdf</mat-icon>
                      Configuración PDF
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  <div class="pdf-config">
                    <div class="config-row">
                      <mat-form-field>
                        <mat-label>Orientación</mat-label>
                        <mat-select formControlName="orientation">
                          <mat-option value="portrait">Vertical</mat-option>
                          <mat-option value="landscape">Horizontal</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field>
                        <mat-label>Tamaño de Página</mat-label>
                        <mat-select formControlName="pageSize">
                          <mat-option value="a4">A4</mat-option>
                          <mat-option value="letter">Carta</mat-option>
                          <mat-option value="legal">Legal</mat-option>
                          <mat-option value="a3">A3</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>

                    <div class="config-row">
                      <mat-form-field class="full-width">
                        <mat-label>Texto del Encabezado</mat-label>
                        <input matInput formControlName="headerText" placeholder="Sistema Contable Contabilium">
                      </mat-form-field>
                    </div>

                    <div class="config-row">
                      <mat-form-field class="full-width">
                        <mat-label>Texto del Pie de Página</mat-label>
                        <input matInput formControlName="footerText" placeholder="Reporte generado automáticamente">
                      </mat-form-field>
                    </div>

                    <div class="config-toggles">
                      <mat-slide-toggle formControlName="includeImages">Incluir Gráficos como Imágenes</mat-slide-toggle>
                      <mat-slide-toggle formControlName="includeWatermark">Incluir Marca de Agua</mat-slide-toggle>
                    </div>
                  </div>
                </mat-expansion-panel>

                <!-- Configuración Excel -->
                <mat-expansion-panel *ngIf="exportForm.value.format === 'excel'" expanded>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>table_chart</mat-icon>
                      Configuración Excel
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  <div class="excel-config">
                    <div class="config-toggles">
                      <mat-slide-toggle formControlName="multipleSheets">Múltiples Hojas de Cálculo</mat-slide-toggle>
                      <mat-slide-toggle formControlName="includeFormatting">Incluir Formato y Colores</mat-slide-toggle>
                      <mat-slide-toggle formControlName="includeFormulas">Incluir Fórmulas de Cálculo</mat-slide-toggle>
                    </div>

                    <mat-form-field class="full-width" *ngIf="exportForm.value.multipleSheets">
                      <mat-label>Nombres de las Hojas</mat-label>
                      <mat-select formControlName="sheetNames" multiple>
                        <mat-option value="Métricas">Métricas</mat-option>
                        <mat-option value="Datos">Datos Detallados</mat-option>
                        <mat-option value="Análisis">Análisis</mat-option>
                        <mat-option value="Resumen">Resumen Ejecutivo</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <!-- Configuración Word -->
                <mat-expansion-panel *ngIf="exportForm.value.format === 'word'" expanded>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>article</mat-icon>
                      Configuración Word
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  <div class="word-config">
                    <div class="config-row">
                      <mat-form-field class="full-width">
                        <mat-label>Título del Documento</mat-label>
                        <input matInput formControlName="documentTitle" placeholder="Reporte de Servicios Contables">
                      </mat-form-field>
                    </div>

                    <div class="config-row">
                      <mat-form-field class="full-width">
                        <mat-label>Autor</mat-label>
                        <input matInput formControlName="author" placeholder="Sistema Contabilium">
                      </mat-form-field>
                    </div>

                    <div class="config-toggles">
                      <mat-slide-toggle formControlName="includeTableOfContents">Tabla de Contenidos</mat-slide-toggle>
                      <mat-slide-toggle formControlName="includePageNumbers">Numeración de Páginas</mat-slide-toggle>
                      <mat-slide-toggle formControlName="includeHeaderFooter">Encabezado y Pie de Página</mat-slide-toggle>
                    </div>
                  </div>
                </mat-expansion-panel>

                <!-- Configuración CSV -->
                <mat-expansion-panel *ngIf="exportForm.value.format === 'csv'" expanded>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>grid_on</mat-icon>
                      Configuración CSV
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  <div class="csv-config">
                    <div class="config-row">
                      <mat-form-field>
                        <mat-label>Delimitador</mat-label>
                        <mat-select formControlName="delimiter">
                          <mat-option value=",">, (Coma)</mat-option>
                          <mat-option value=";">; (Punto y coma)</mat-option>
                          <mat-option value="	">Tab</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field>
                        <mat-label>Codificación</mat-label>
                        <mat-select formControlName="encoding">
                          <mat-option value="utf-8">UTF-8</mat-option>
                          <mat-option value="latin1">Latin-1</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>

                    <div class="config-toggles">
                      <mat-slide-toggle formControlName="includeHeaders">Incluir Encabezados</mat-slide-toggle>
                    </div>
                  </div>
                </mat-expansion-panel>

              </div>
            </mat-tab>

            <!-- Tab: Filtros de Datos -->
            <mat-tab label="Selección de Datos">
              <div class="tab-content">
                
                <div class="config-section">
                  <h3>
                    <mat-icon>filter_alt</mat-icon>
                    Filtrar Datos a Exportar
                  </h3>
                  
                  <div class="filter-grid">
                    <mat-form-field>
                      <mat-label>Estados</mat-label>
                      <mat-select formControlName="statusFilter" multiple>
                        <mat-option *ngFor="let status of data.availableStatuses" [value]="status">
                          {{status | titlecase}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field>
                      <mat-label>Tipos de Servicio</mat-label>
                      <mat-select formControlName="serviceTypeFilter" multiple>
                        <mat-option *ngFor="let type of data.availableServiceTypes" [value]="type">
                          {{type}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field>
                      <mat-label>Clientes</mat-label>
                      <mat-select formControlName="clientFilter" multiple>
                        <mat-option *ngFor="let client of data.availableClients" [value]="client">
                          {{client}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field>
                      <mat-label>Columnas a Incluir</mat-label>
                      <mat-select formControlName="columns" multiple>
                        <mat-option *ngFor="let column of data.availableColumns" [value]="column">
                          {{column}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="data-preview">
                    <h4>Vista Previa de Datos</h4>
                    <div class="preview-stats">
                      <div class="stat">
                        <span class="stat-value">{{getFilteredDataCount()}}</span>
                        <span class="stat-label">Registros seleccionados</span>
                      </div>
                      <div class="stat">
                        <span class="stat-value">{{getSelectedColumnsCount()}}</span>
                        <span class="stat-label">Columnas incluidas</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </mat-tab>

            <!-- Tab: Configuración General -->
            <mat-tab label="General">
              <div class="tab-content">
                
                <div class="config-section">
                  <h3>
                    <mat-icon>settings</mat-icon>
                    Configuración General
                  </h3>
                  
                  <div class="config-row">
                    <mat-form-field class="full-width">
                      <mat-label>Nombre del Archivo</mat-label>
                      <input matInput formControlName="fileName" placeholder="reporte-servicios">
                      <mat-hint>Se agregará automáticamente la fecha y extensión</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="config-row">
                    <mat-form-field class="full-width">
                      <mat-label>Plantilla de Diseño</mat-label>
                      <mat-select formControlName="templateName">
                        <mat-option value="default">Estándar - Diseño profesional balanceado</mat-option>
                        <mat-option value="executive">Ejecutivo - Enfoque en métricas clave</mat-option>
                        <mat-option value="detailed">Detallado - Análisis completo</mat-option>
                        <mat-option value="minimal">Minimalista - Solo datos esenciales</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="config-row">
                    <mat-form-field class="full-width">
                      <mat-label>Esquema de Colores</mat-label>
                      <mat-select formControlName="colorScheme">
                        <mat-option value="default">Predeterminado - Azul corporativo</mat-option>
                        <mat-option value="blue">Azul - Profesional y confiable</mat-option>
                        <mat-option value="green">Verde - Financiero y ecológico</mat-option>
                        <mat-option value="corporate">Corporativo - Gris y negro</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>

              </div>
            </mat-tab>

          </mat-tab-group>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        
        <button mat-button (click)="onPreview()" [disabled]="!exportForm.valid">
          <mat-icon>preview</mat-icon>
          Vista Previa
        </button>
        
        <button mat-raised-button color="primary" (click)="onExport()" [disabled]="!exportForm.valid">
          <mat-icon>file_download</mat-icon>
          Exportar Ahora
        </button>
      </mat-dialog-actions>

    </div>
  `,
  styleUrl: './export-config-dialog.component.scss'
})
export class ExportConfigDialogComponent implements OnInit {
  exportForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ExportConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) {
    this.exportForm = this.createForm();
  }

  ngOnInit() {
    // Inicializar valores por defecto
    this.exportForm.patchValue(this.data.defaultOptions);
    
    // Configurar valores específicos por formato
    this.setupFormatSpecificValues();
    
    // Escuchar cambios en el formato
    this.exportForm.get('format')?.valueChanges.subscribe(() => {
      this.setupFormatSpecificValues();
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Configuración principal
      format: ['pdf'],
      includeCharts: [true],
      includeMetrics: [true],
      includeRawData: [true],
      includeFilters: [false],
      includeSummary: [true],
      includeAnalysis: [false],
      
      // Configuración general
      orientation: ['portrait'],
      pageSize: ['a4'],
      fileName: [`reporte-${new Date().toISOString().split('T')[0]}`],
      
      // Configuración PDF
      headerText: ['Sistema Contable Contabilium'],
      footerText: ['Reporte generado automáticamente'],
      includeImages: [true],
      includeWatermark: [false],
      
      // Configuración Excel
      multipleSheets: [true],
      includeFormatting: [true],
      includeFormulas: [false],
      sheetNames: [['Métricas', 'Datos', 'Análisis']],
      
      // Configuración Word
      documentTitle: ['Reporte de Servicios Contables'],
      author: ['Sistema Contabilium'],
      includeTableOfContents: [false],
      includePageNumbers: [true],
      includeHeaderFooter: [true],
      
      // Configuración CSV
      delimiter: [','],
      encoding: ['utf-8'],
      includeHeaders: [true],
      
      // Filtros de datos
      statusFilter: [[]],
      serviceTypeFilter: [[]],
      clientFilter: [[]],
      columns: [this.data.availableColumns],
      
      // Plantilla
      templateName: ['default'],
      colorScheme: ['default']
    });
  }

  private setupFormatSpecificValues() {
    const format = this.exportForm.get('format')?.value;
    
    // Configurar valores específicos según el formato
    switch (format) {
      case 'pdf':
        this.exportForm.patchValue({
          includeCharts: true,
          includeImages: true
        });
        break;
      case 'excel':
        this.exportForm.patchValue({
          multipleSheets: true,
          includeFormatting: true
        });
        break;
      case 'word':
        this.exportForm.patchValue({
          includePageNumbers: true,
          includeHeaderFooter: true
        });
        break;
      case 'csv':
        this.exportForm.patchValue({
          includeCharts: false,
          includeHeaders: true
        });
        break;
    }
  }

  getFilteredDataCount(): number {
    let count = this.data.availableData.length;
    
    const statusFilter = this.exportForm.get('statusFilter')?.value || [];
    const serviceTypeFilter = this.exportForm.get('serviceTypeFilter')?.value || [];
    const clientFilter = this.exportForm.get('clientFilter')?.value || [];
    
    if (statusFilter.length > 0) {
      count = this.data.availableData.filter(d => statusFilter.includes(d.status)).length;
    }
    
    return count;
  }

  getSelectedColumnsCount(): number {
    const columns = this.exportForm.get('columns')?.value || [];
    return columns.length;
  }

  onPreview() {
    const options = this.buildExportOptions();
    this.dialogRef.close({ action: 'preview', options });
  }

  onExport() {
    const options = this.buildExportOptions();
    this.dialogRef.close({ action: 'export', options });
  }

  onCancel() {
    this.dialogRef.close({ action: 'cancel' });
  }

  private buildExportOptions(): ExportOptions {
    const formValue = this.exportForm.value;
    
    const options: ExportOptions = {
      format: formValue.format,
      includeCharts: formValue.includeCharts,
      includeMetrics: formValue.includeMetrics,
      includeRawData: formValue.includeRawData,
      includeFilters: formValue.includeFilters,
      includeSummary: formValue.includeSummary,
      includeAnalysis: formValue.includeAnalysis,
      orientation: formValue.orientation,
      pageSize: formValue.pageSize,
      fileName: formValue.fileName,
      
      pdfConfig: {
        includeImages: formValue.includeImages,
        includeWatermark: formValue.includeWatermark,
        headerText: formValue.headerText,
        footerText: formValue.footerText,
        colorScheme: formValue.colorScheme
      },
      
      excelConfig: {
        includeFormulas: formValue.includeFormulas,
        multipleSheets: formValue.multipleSheets,
        sheetNames: formValue.sheetNames,
        includeFormatting: formValue.includeFormatting
      },
      
      wordConfig: {
        includeTableOfContents: formValue.includeTableOfContents,
        includePageNumbers: formValue.includePageNumbers,
        documentTitle: formValue.documentTitle,
        author: formValue.author,
        includeHeaderFooter: formValue.includeHeaderFooter
      },
      
      csvConfig: {
        delimiter: formValue.delimiter,
        includeHeaders: formValue.includeHeaders,
        encoding: formValue.encoding
      },
      
      dataSelection: {
        columns: formValue.columns,
        statusFilter: formValue.statusFilter,
        serviceTypeFilter: formValue.serviceTypeFilter,
        clientFilter: formValue.clientFilter
      },
      
      template: {
        name: formValue.templateName,
        colorScheme: formValue.colorScheme,
        logoPosition: 'header'
      }
    };
    
    return options;
  }
}
