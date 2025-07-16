import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AccountingServiceService } from '../../../services/accounting-service.service';
import { UserService } from '../../../services/user.service';
import { 
  AccountingService, 
  ServiceType, 
  ServiceStatus, 
  ServicePriority,
  SERVICE_TYPE_CONFIG,
  SERVICE_STATUS_CONFIG 
} from '../../../models/service.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="service-form-container">
      <div class="header">
        <div class="title-section">
          <h1>
            <mat-icon>{{isEditing ? 'edit' : 'add'}}</mat-icon>
            {{isEditing ? 'Editar' : 'Crear'}} Servicio
          </h1>
          <p>{{isEditing ? 'Modifica los datos del servicio' : 'Completa la información del nuevo servicio'}}</p>
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
        </div>
      </div>

      <form [formGroup]="serviceForm" (ngSubmit)="onSubmit()">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Información del Servicio</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-grid">
              <!-- Tipo de Servicio -->
              <mat-form-field>
                <mat-label>Tipo de Servicio</mat-label>
                <mat-select formControlName="type" required>
                  <mat-option *ngFor="let type of serviceTypes" [value]="type.value">
                    <div class="service-type-option">
                      <mat-icon [style.color]="type.color">{{type.icon}}</mat-icon>
                      <span>{{type.label}}</span>
                    </div>
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="serviceForm.get('type')?.hasError('required')">
                  El tipo de servicio es requerido
                </mat-error>
              </mat-form-field>

              <!-- Título -->
              <mat-form-field>
                <mat-label>Título del Servicio</mat-label>
                <input matInput formControlName="title" required>
                <mat-error *ngIf="serviceForm.get('title')?.hasError('required')">
                  El título es requerido
                </mat-error>
              </mat-form-field>

              <!-- Usuario Asignado -->
              <mat-form-field>
                <mat-label>Usuario Asignado</mat-label>
                <mat-select formControlName="userId" required>
                  <mat-option *ngFor="let user of users$ | async" [value]="user.id">
                    {{user.name}} {{user.lastName}} - {{user.email}}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="serviceForm.get('userId')?.hasError('required')">
                  Debes asignar un usuario
                </mat-error>
              </mat-form-field>

              <!-- Estado -->
              <mat-form-field>
                <mat-label>Estado</mat-label>
                <mat-select formControlName="status" required>
                  <mat-option *ngFor="let status of serviceStatuses" [value]="status.value">
                    <div class="service-status-option">
                      <mat-icon [style.color]="status.color">{{status.icon}}</mat-icon>
                      <span>{{status.label}}</span>
                    </div>
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Prioridad -->
              <mat-form-field>
                <mat-label>Prioridad</mat-label>
                <mat-select formControlName="priority" required>
                  <mat-option value="baja">Baja</mat-option>
                  <mat-option value="media">Media</mat-option>
                  <mat-option value="alta">Alta</mat-option>
                  <mat-option value="urgente">Urgente</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Fecha Límite -->
              <mat-form-field>
                <mat-label>Fecha Límite</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="dueDate" required>
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="serviceForm.get('dueDate')?.hasError('required')">
                  La fecha límite es requerida
                </mat-error>
              </mat-form-field>

              <!-- Horas Estimadas -->
              <mat-form-field>
                <mat-label>Horas Estimadas</mat-label>
                <input matInput type="number" formControlName="estimatedHours" min="0">
              </mat-form-field>

              <!-- Precio -->
              <mat-form-field>
                <mat-label>Precio (CLP)</mat-label>
                <input matInput type="number" formControlName="price" min="0">
                <span matPrefix>$&nbsp;</span>
              </mat-form-field>

              <!-- Pagado -->
              <div class="checkbox-field">
                <mat-checkbox formControlName="isPaid">Servicio Pagado</mat-checkbox>
              </div>
            </div>

            <!-- Descripción -->
            <mat-form-field class="full-width">
              <mat-label>Descripción del Servicio</mat-label>
              <textarea matInput formControlName="description" rows="4" required></textarea>
              <mat-error *ngIf="serviceForm.get('description')?.hasError('required')">
                La descripción es requerida
              </mat-error>
            </mat-form-field>

            <!-- Notas -->
            <mat-form-field class="full-width">
              <mat-label>Notas Adicionales</mat-label>
              <textarea matInput formControlName="notes" rows="3"></textarea>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <!-- Botones de Acción -->
        <div class="form-actions">
          <button mat-stroked-button type="button" (click)="goBack()">
            <mat-icon>cancel</mat-icon>
            Cancelar
          </button>
          <button mat-raised-button color="primary" type="submit" [disabled]="serviceForm.invalid || isSaving">
            <mat-icon>{{isEditing ? 'save' : 'add'}}</mat-icon>
            {{isEditing ? 'Actualizar' : 'Crear'}} Servicio
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrl: './service-form.scss'
})
export class ServiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accountingService = inject(AccountingServiceService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  serviceForm!: FormGroup;
  users$ = this.userService.users$;
  isEditing = false;
  serviceId?: string;
  isSaving = false;

  serviceTypes = Object.entries(SERVICE_TYPE_CONFIG).map(([key, config]) => ({
    value: key as ServiceType,
    label: config.label,
    icon: config.icon,
    color: config.color
  }));

  serviceStatuses = Object.entries(SERVICE_STATUS_CONFIG).map(([key, config]) => ({
    value: key as ServiceStatus,
    label: config.label,
    icon: config.icon,
    color: config.color
  }));

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.serviceForm = this.fb.group({
      type: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      userId: ['', Validators.required],
      status: [ServiceStatus.PENDIENTE, Validators.required],
      priority: [ServicePriority.MEDIA, Validators.required],
      dueDate: [tomorrow, Validators.required],
      estimatedHours: [0, [Validators.min(0)]],
      price: [0, [Validators.min(0)]],
      isPaid: [false],
      notes: ['']
    });

    // Auto-complete título cuando se selecciona tipo
    this.serviceForm.get('type')?.valueChanges.subscribe(type => {
      if (type && !this.isEditing) {
        const config = SERVICE_TYPE_CONFIG[type as ServiceType];
        const currentTitle = this.serviceForm.get('title')?.value;
        if (!currentTitle) {
          this.serviceForm.patchValue({
            title: config.label,
            dueDate: this.calculateDueDate(config.defaultDays)
          });
        }
      }
    });

    // Auto-complete userName y userEmail cuando se selecciona usuario
    this.serviceForm.get('userId')?.valueChanges.subscribe(userId => {
      if (userId) {
        this.users$.subscribe(users => {
          const selectedUser = users.find(u => u.id === userId);
          if (selectedUser) {
            this.serviceForm.patchValue({
              userName: `${selectedUser.name} ${selectedUser.lastName}`,
              userEmail: selectedUser.email
            });
          }
        });
      }
    });
  }

  private calculateDueDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.serviceId = id;
      this.loadService(id);
    }
  }

  private loadService(id: string): void {
    this.accountingService.getServiceById(id).subscribe({
      next: (service) => {
        if (service) {
          this.serviceForm.patchValue({
            type: service.type,
            title: service.title,
            description: service.description,
            userId: service.userId,
            status: service.status,
            priority: service.priority,
            dueDate: service.dueDate,
            estimatedHours: service.estimatedHours,
            price: service.price,
            isPaid: service.isPaid,
            notes: service.notes
          });
        }
      },
      error: (error) => {
        console.error('Error cargando servicio:', error);
        this.snackBar.open('Error cargando el servicio', 'Cerrar', { duration: 3000 });
        this.goBack();
      }
    });
  }

  onSubmit(): void {
    if (this.serviceForm.valid) {
      this.isSaving = true;
      const formValue = this.serviceForm.value;

      // Obtener datos del usuario seleccionado
      this.users$.subscribe(users => {
        const selectedUser = users.find(u => u.id === formValue.userId);
        
        const serviceData = {
          ...formValue,
          userName: selectedUser ? `${selectedUser.name} ${selectedUser.lastName}` : '',
          userEmail: selectedUser?.email || '',
          tags: [],
          attachments: []
        };

        if (this.isEditing && this.serviceId) {
          this.updateService(serviceData);
        } else {
          this.createService(serviceData);
        }
      }).unsubscribe();
    }
  }

  private createService(serviceData: any): void {
    this.accountingService.createService(serviceData).subscribe({
      next: (service) => {
        this.snackBar.open('Servicio creado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/services']);
      },
      error: (error) => {
        console.error('Error creando servicio:', error);
        this.snackBar.open('Error creando el servicio', 'Cerrar', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  private updateService(serviceData: any): void {
    this.accountingService.updateService(this.serviceId!, serviceData).subscribe({
      next: (service) => {
        this.snackBar.open('Servicio actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/services']);
      },
      error: (error) => {
        console.error('Error actualizando servicio:', error);
        this.snackBar.open('Error actualizando el servicio', 'Cerrar', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/services']);
  }
}
