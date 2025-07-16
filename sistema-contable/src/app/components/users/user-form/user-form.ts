import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-user-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss'
})
export class UserForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  userForm: FormGroup;
  isLoading = false;
  isEditing = false;
  userId: string | null = null;
  
  // Opciones para selects
  regions = [
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    'Metropolitana',
    'O\'Higgins',
    'Maule',
    'Ñuble',
    'Biobío',
    'La Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén',
    'Magallanes'
  ];

  professions = [
    'Contador',
    'Ingeniero',
    'Médico',
    'Abogado',
    'Arquitecto',
    'Profesor',
    'Empresario',
    'Comerciante',
    'Consultor',
    'Otro'
  ];

  constructor() {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEditing = this.userId !== null && this.userId !== 'new';
    
    if (this.isEditing && this.userId) {
      this.loadUser(this.userId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Información personal
      personalInfo: this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        rut: ['', [Validators.required, this.rutValidator]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, this.phoneValidator]]
      }),
      
      // Información de ubicación
      locationInfo: this.fb.group({
        address: ['', Validators.required],
        city: ['', Validators.required],
        region: ['', Validators.required]
      }),
      
      // Información profesional
      professionalInfo: this.fb.group({
        company: [''],
        profession: ['', Validators.required],
        isActive: [true]
      })
    });
  }

  private loadUser(userId: string): void {
    this.isLoading = true;
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        if (user) {
          this.populateForm(user);
        } else {
          this.snackBar.open('Usuario no encontrado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/users']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando usuario:', error);
        this.snackBar.open('Error al cargar usuario', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private populateForm(user: User): void {
    this.userForm.patchValue({
      personalInfo: {
        name: user.name,
        lastName: user.lastName,
        rut: user.rut,
        email: user.email,
        phone: user.phone
      },
      locationInfo: {
        address: user.address,
        city: user.city,
        region: user.region
      },
      professionalInfo: {
        company: user.company || '',
        profession: user.profession,
        isActive: user.isActive
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const formData = this.userForm.value;
      const userData = {
        name: formData.personalInfo.name,
        lastName: formData.personalInfo.lastName,
        rut: formData.personalInfo.rut,
        email: formData.personalInfo.email,
        phone: formData.personalInfo.phone,
        address: formData.locationInfo.address,
        city: formData.locationInfo.city,
        region: formData.locationInfo.region,
        company: formData.professionalInfo.company || undefined,
        profession: formData.professionalInfo.profession,
        isActive: formData.professionalInfo.isActive
      };

      if (this.isEditing && this.userId) {
        this.updateUser(userData);
      } else {
        this.createUser(userData);
      }
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Por favor, completa todos los campos requeridos', 'Cerrar', { 
        duration: 3000 
      });
    }
  }

  private createUser(userData: any): void {
    this.userService.createUser(userData).subscribe({
      next: (user) => {
        this.snackBar.open(`Usuario ${user.name} ${user.lastName} creado exitosamente`, 'Cerrar', { 
          duration: 3000 
        });
        this.router.navigate(['/users', user.id]);
      },
      error: (error) => {
        console.error('Error creando usuario:', error);
        this.snackBar.open('Error al crear usuario', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private updateUser(userData: any): void {
    this.userService.updateUser(this.userId!, userData).subscribe({
      next: (user) => {
        this.snackBar.open(`Usuario ${user.name} ${user.lastName} actualizado exitosamente`, 'Cerrar', { 
          duration: 3000 
        });
        this.router.navigate(['/users', user.id]);
      },
      error: (error) => {
        console.error('Error actualizando usuario:', error);
        this.snackBar.open('Error al actualizar usuario', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(nestedKey => {
          control.get(nestedKey)?.markAsTouched();
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  cancel(): void {
    if (this.isEditing && this.userId) {
      this.router.navigate(['/users', this.userId]);
    } else {
      this.router.navigate(['/users']);
    }
  }

  // ===== VALIDADORES PERSONALIZADOS =====

  private rutValidator(control: any) {
    if (!control.value) return null;
    
    const rut = control.value.replace(/\./g, '').replace(/\-/g, '');
    const rutRegex = /^[0-9]+[0-9kK]{1}$/;
    
    if (!rutRegex.test(rut)) {
      return { invalidRut: true };
    }
    
    const dv = rut.slice(-1).toLowerCase();
    const rutNumbers = rut.slice(0, -1);
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = rutNumbers.length - 1; i >= 0; i--) {
      sum += parseInt(rutNumbers[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const expectedDv = 11 - (sum % 11);
    const finalDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'k' : expectedDv.toString();
    
    return dv === finalDv ? null : { invalidRut: true };
  }

  private phoneValidator(control: any) {
    if (!control.value) return null;
    
    const phoneRegex = /^(\+56|56)?[2-9][0-9]{8}$/;
    return phoneRegex.test(control.value.replace(/\s/g, '')) ? null : { invalidPhone: true };
  }

  // ===== MÉTODOS DE UTILIDAD =====

  getErrorMessage(groupName: string, fieldName: string): string {
    const control = this.userForm.get(`${groupName}.${fieldName}`);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }
    
    if (control?.hasError('email')) {
      return 'Email no válido';
    }
    
    if (control?.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${requiredLength} caracteres`;
    }
    
    if (control?.hasError('invalidRut')) {
      return 'RUT no válido';
    }
    
    if (control?.hasError('invalidPhone')) {
      return 'Teléfono no válido (formato: +56912345678)';
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nombre',
      lastName: 'Apellido',
      rut: 'RUT',
      email: 'Email',
      phone: 'Teléfono',
      address: 'Dirección',
      city: 'Ciudad',
      region: 'Región',
      company: 'Empresa',
      profession: 'Profesión'
    };
    return labels[fieldName] || fieldName;
  }

  formatRut(event: any): void {
    let value = event.target.value.replace(/\./g, '').replace(/\-/g, '');
    
    if (value.length > 1) {
      value = value.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + value.slice(-1);
    }
    
    event.target.value = value;
    this.userForm.get('personalInfo.rut')?.setValue(value);
  }

  formatPhone(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.startsWith('569')) {
      value = '+' + value;
    } else if (value.startsWith('9') && value.length === 9) {
      value = '+56' + value;
    }
    
    event.target.value = value;
    this.userForm.get('personalInfo.phone')?.setValue(value);
  }

  isStepValid(stepIndex: number): boolean {
    const stepNames = ['personalInfo', 'locationInfo', 'professionalInfo'];
    const stepGroup = this.userForm.get(stepNames[stepIndex]);
    return stepGroup ? stepGroup.valid : false;
  }

  getFormTitle(): string {
    return this.isEditing ? 'Editar Usuario' : 'Nuevo Usuario';
  }

  getSubmitButtonText(): string {
    if (this.isLoading) {
      return this.isEditing ? 'Actualizando...' : 'Creando...';
    }
    return this.isEditing ? 'Actualizar Usuario' : 'Crear Usuario';
  }
}
