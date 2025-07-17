import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type ContabiliumButtonType = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
export type ContabiliumButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-contabilium-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <button 
      class="contabilium-btn"
      [class]="'btn-' + type + ' btn-' + size"
      [disabled]="disabled || loading"
      (click)="handleClick()">
      
      <mat-spinner 
        *ngIf="loading" 
        diameter="20" 
        class="btn-spinner">
      </mat-spinner>
      
      <mat-icon *ngIf="icon && !loading" class="btn-icon">{{icon}}</mat-icon>
      
      <span class="btn-text">
        <ng-content></ng-content>
      </span>
      
      <mat-icon *ngIf="rightIcon && !loading" class="btn-icon-right">{{rightIcon}}</mat-icon>
    </button>
  `,
  styleUrl: './contabilium-button.component.scss'
})
export class ContabiliumButtonComponent {
  @Input() type: ContabiliumButtonType = 'primary';
  @Input() size: ContabiliumButtonSize = 'md';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() icon?: string;
  @Input() rightIcon?: string;
  @Output() clicked = new EventEmitter<void>();

  handleClick() {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
