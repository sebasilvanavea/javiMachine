import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';

import { Form21Service } from '../../services/form21.service';
import { NotificationService } from '../../services/notification.service';
import { Form21Data } from '../../models/user.model';

export type Form21Status = 'borrador' | 'enviado' | 'procesado' | 'aprobado' | 'rechazado';

@Component({
  selector: 'app-form21',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatStepperModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <div class="form21-container">
      <div class="form21-header">
        <h1>
          <mat-icon>description</mat-icon>
          Formulario 21 - Declaración de Impuesto Anual
        </h1>
        <p>Completa tu declaración de impuesto anual a la renta</p>
      </div>

      <!-- Indicador de Progreso -->
      @if (isLoading) {
        <mat-card>
          <mat-card-content>
            <div class="loading-container">
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
              <p>Procesando formulario...</p>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Stepper de Formulario -->
      <mat-stepper [linear]="true" #stepper>
        <!-- Paso 1: Datos Contribuyente -->
        <mat-step [stepControl]="contribuyenteForm" label="Datos del Contribuyente">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Información del Contribuyente</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="contribuyenteForm" class="form21-form">
                <div class="form-row">
                  <mat-form-field>
                    <mat-label>RUT</mat-label>
                    <input matInput formControlName="rut" placeholder="12.345.678-9">
                    <mat-error *ngIf="contribuyenteForm.get('rut')?.hasError('required')">
                      RUT es requerido
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>Nombres</mat-label>
                    <input matInput formControlName="nombres" placeholder="Juan Carlos">
                    <mat-error *ngIf="contribuyenteForm.get('nombres')?.hasError('required')">
                      Nombres son requeridos
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field>
                    <mat-label>Apellido Paterno</mat-label>
                    <input matInput formControlName="apellidoPaterno" placeholder="González">
                    <mat-error *ngIf="contribuyenteForm.get('apellidoPaterno')?.hasError('required')">
                      Apellido paterno es requerido
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>Apellido Materno</mat-label>
                    <input matInput formControlName="apellidoMaterno" placeholder="López">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field>
                    <mat-label>Dirección</mat-label>
                    <input matInput formControlName="direccion" placeholder="Av. Providencia 123">
                    <mat-error *ngIf="contribuyenteForm.get('direccion')?.hasError('required')">
                      Dirección es requerida
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>Comuna</mat-label>
                    <mat-select formControlName="comuna">
                      <mat-option value="santiago">Santiago</mat-option>
                      <mat-option value="providencia">Providencia</mat-option>
                      <mat-option value="las-condes">Las Condes</mat-option>
                      <mat-option value="vitacura">Vitacura</mat-option>
                      <mat-option value="nunoa">Ñuñoa</mat-option>
                      <mat-option value="la-florida">La Florida</mat-option>
                    </mat-select>
                    <mat-error *ngIf="contribuyenteForm.get('comuna')?.hasError('required')">
                      Comuna es requerida
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field>
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email" placeholder="juan@ejemplo.com">
                    <mat-error *ngIf="contribuyenteForm.get('email')?.hasError('required')">
                      Email es requerido
                    </mat-error>
                    <mat-error *ngIf="contribuyenteForm.get('email')?.hasError('email')">
                      Email debe ser válido
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>Teléfono</mat-label>
                    <input matInput formControlName="telefono" placeholder="+56 9 1234 5678">
                  </mat-form-field>
                </div>
              </form>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" 
                      matStepperNext 
                      [disabled]="!contribuyenteForm.valid">
                Siguiente
              </button>
            </mat-card-actions>
          </mat-card>
        </mat-step>

        <!-- Paso 2: Ingresos -->
        <mat-step [stepControl]="ingresosForm" label="Ingresos">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Ingresos del Año Tributario</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="ingresosForm" class="form21-form">
                <div class="form-row">
                  <mat-form-field>
                    <mat-label>Sueldo Anual Bruto</mat-label>
                    <input matInput type="number" formControlName="sueldoBruto" placeholder="0">
                    <span matSuffix>CLP</span>
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>Honorarios</mat-label>
                    <input matInput type="number" formControlName="honorarios" placeholder="0">
                    <span matSuffix>CLP</span>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field>
                    <mat-label>Arriendos</mat-label>
                    <input matInput type="number" formControlName="arriendos" placeholder="0">
                    <span matSuffix>CLP</span>
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>Otros Ingresos</mat-label>
                    <input matInput type="number" formControlName="otrosIngresos" placeholder="0">
                    <span matSuffix>CLP</span>
                  </mat-form-field>
                </div>

                <mat-divider></mat-divider>

                <div class="total-section">
                  <h3>Total Ingresos: {{formatCurrency(getTotalIngresos())}}</h3>
                </div>
              </form>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button matStepperPrevious>Anterior</button>
              <button mat-raised-button color="primary" matStepperNext>Siguiente</button>
            </mat-card-actions>
          </mat-card>
        </mat-step>

        <!-- Paso 3: Deducciones -->
        <mat-step [stepControl]="deduccionesForm" label="Deducciones">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Deducciones Permitidas</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="deduccionesForm" class="form21-form">
                <div class="form-row">
                  <mat-form-field>
                    <mat-label>APV (Ahorro Previsional Voluntario)</mat-label>
                    <input matInput type="number" formControlName="apv" placeholder="0">
                    <span matSuffix>CLP</span>
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>Cotizaciones Adicionales</mat-label>
                    <input matInput type="number" formControlName="cotizaciones" placeholder="0">
                    <span matSuffix>CLP</span>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field>
                    <mat-label>Dividendos Hipotecarios</mat-label>
                    <input matInput type="number" formControlName="dividendos" placeholder="0">
                    <span matSuffix>CLP</span>
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>Gastos Médicos</mat-label>
                    <input matInput type="number" formControlName="gastosMedicos" placeholder="0">
                    <span matSuffix>CLP</span>
                  </mat-form-field>
                </div>

                <mat-divider></mat-divider>

                <div class="total-section">
                  <h3>Total Deducciones: {{formatCurrency(getTotalDeducciones())}}</h3>
                </div>
              </form>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button matStepperPrevious>Anterior</button>
              <button mat-raised-button color="primary" matStepperNext>Siguiente</button>
            </mat-card-actions>
          </mat-card>
        </mat-step>

        <!-- Paso 4: Resumen y Envío -->
        <mat-step label="Resumen">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Resumen de la Declaración</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="summary-section">
                <div class="summary-item">
                  <span class="label">Total Ingresos:</span>
                  <span class="value positive">{{formatCurrency(getTotalIngresos())}}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Total Deducciones:</span>
                  <span class="value negative">-{{formatCurrency(getTotalDeducciones())}}</span>
                </div>
                <mat-divider></mat-divider>
                <div class="summary-item total">
                  <span class="label">Base Imponible:</span>
                  <span class="value">{{formatCurrency(getBaseImponible())}}</span>
                </div>
                <div class="summary-item total">
                  <span class="label">Impuesto Calculado:</span>
                  <span class="value">{{formatCurrency(getImpuestoCalculado())}}</span>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="action-section">
                <h3>¿Qué deseas hacer?</h3>
                <div class="action-buttons">
                  <button mat-raised-button color="primary" 
                          (click)="submitForm()" 
                          [disabled]="isLoading">
                    <mat-icon>send</mat-icon>
                    Enviar Declaración
                  </button>
                  <button mat-stroked-button (click)="saveAsDraft()">
                    <mat-icon>save</mat-icon>
                    Guardar Borrador
                  </button>
                  <button mat-stroked-button (click)="generatePDF()">
                    <mat-icon>picture_as_pdf</mat-icon>
                    Generar PDF
                  </button>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button matStepperPrevious>Anterior</button>
              <button mat-button (click)="resetForm()" color="warn">
                <mat-icon>refresh</mat-icon>
                Reiniciar
              </button>
            </mat-card-actions>
          </mat-card>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .form21-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .form21-header {
      margin-bottom: 32px;
      text-align: center;
      
      h1 {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin: 0 0 8px 0;
        font-size: 32px;
        font-weight: 300;
        color: #333;
        
        mat-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
          color: #3f51b5;
        }
      }
      
      p {
        margin: 0;
        color: #666;
        font-size: 16px;
      }
    }

    .loading-container {
      text-align: center;
      padding: 40px 0;
      
      mat-progress-bar {
        margin-bottom: 16px;
      }
    }

    .form21-form {
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
        
        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }
    }

    .total-section {
      text-align: center;
      padding: 16px 0;
      
      h3 {
        margin: 0;
        color: #3f51b5;
        font-size: 18px;
        font-weight: 500;
      }
    }

    .summary-section {
      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        
        .label {
          font-weight: 500;
        }
        
        .value {
          font-weight: 600;
          
          &.positive { color: #4caf50; }
          &.negative { color: #f44336; }
        }
        
        &.total {
          font-size: 18px;
          border-bottom: 2px solid #3f51b5;
          margin-top: 8px;
          
          .value {
            color: #3f51b5;
          }
        }
      }
    }

    .action-section {
      margin-top: 24px;
      
      h3 {
        margin-bottom: 16px;
        color: #333;
      }
      
      .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
        
        button {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }

    mat-stepper {
      margin-top: 24px;
    }

    mat-card {
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .form21-container {
        padding: 16px;
      }
      
      .action-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class Form21Component implements OnInit {
  private fb = inject(FormBuilder);
  private form21Service = inject(Form21Service);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  contribuyenteForm!: FormGroup;
  ingresosForm!: FormGroup;
  deduccionesForm!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.contribuyenteForm = this.fb.group({
      rut: ['', [Validators.required]],
      nombres: ['', [Validators.required]],
      apellidoPaterno: ['', [Validators.required]],
      apellidoMaterno: [''],
      direccion: ['', [Validators.required]],
      comuna: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['']
    });

    this.ingresosForm = this.fb.group({
      sueldoBruto: [0, [Validators.min(0)]],
      honorarios: [0, [Validators.min(0)]],
      arriendos: [0, [Validators.min(0)]],
      otrosIngresos: [0, [Validators.min(0)]]
    });

    this.deduccionesForm = this.fb.group({
      apv: [0, [Validators.min(0)]],
      cotizaciones: [0, [Validators.min(0)]],
      dividendos: [0, [Validators.min(0)]],
      gastosMedicos: [0, [Validators.min(0)]]
    });
  }

  getTotalIngresos(): number {
    const ingresos = this.ingresosForm.value;
    return (ingresos.sueldoBruto || 0) + 
           (ingresos.honorarios || 0) + 
           (ingresos.arriendos || 0) + 
           (ingresos.otrosIngresos || 0);
  }

  getTotalDeducciones(): number {
    const deducciones = this.deduccionesForm.value;
    return (deducciones.apv || 0) + 
           (deducciones.cotizaciones || 0) + 
           (deducciones.dividendos || 0) + 
           (deducciones.gastosMedicos || 0);
  }

  getBaseImponible(): number {
    return Math.max(0, this.getTotalIngresos() - this.getTotalDeducciones());
  }

  getImpuestoCalculado(): number {
    const base = this.getBaseImponible();
    // Cálculo simplificado del impuesto (tabla de tramos)
    if (base <= 8670000) return 0; // Exento
    if (base <= 19320000) return (base - 8670000) * 0.04;
    if (base <= 32220000) return 426000 + (base - 19320000) * 0.08;
    if (base <= 45060000) return 1458000 + (base - 32220000) * 0.135;
    if (base <= 60450000) return 3191400 + (base - 45060000) * 0.23;
    if (base <= 80610000) return 6730000 + (base - 60450000) * 0.304;
    return 12857640 + (base - 80610000) * 0.35;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  submitForm(): void {
    if (!this.isFormValid()) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.isLoading = true;
    
    const form21Data: Partial<Form21Data> = {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalIncome: this.getTotalIngresos(),
      totalExpenses: this.getTotalDeducciones(),
      netIncome: this.getBaseImponible(),
      tax: this.getImpuestoCalculado(),
      details: [],
      submittedAt: new Date()
    };

    // Simular envío del formulario
    setTimeout(() => {
      this.isLoading = false;
      this.notificationService.showSuccess('Formulario 21 enviado', 'El formulario ha sido enviado exitosamente');
      this.router.navigate(['/dashboard']);
    }, 2000);
  }

  saveAsDraft(): void {
    const form21Data: Partial<Form21Data> = {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalIncome: this.getTotalIngresos(),
      totalExpenses: this.getTotalDeducciones(),
      netIncome: this.getBaseImponible(),
      tax: this.getImpuestoCalculado(),
      details: []
    };

    // Simular guardado de borrador
    setTimeout(() => {
      this.notificationService.showSuccess('Borrador guardado', 'El borrador ha sido guardado exitosamente');
    }, 1000);
  }

  generatePDF(): void {
    console.log('🔄 Generando PDF...');
    this.notificationService.showInfo('Generando PDF', 'Se está generando el PDF de la declaración');
    // Implementar generación de PDF
  }

  resetForm(): void {
    this.initializeForms();
    this.snackBar.open('Formulario reiniciado', 'Cerrar', {
      duration: 2000
    });
  }

  private isFormValid(): boolean {
    return this.contribuyenteForm.valid && 
           this.ingresosForm.valid && 
           this.deduccionesForm.valid;
  }
}
