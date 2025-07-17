import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';

export interface ContabiliumCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  type: 'primary' | 'success' | 'warning' | 'danger';
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  progress?: {
    value: number;
    max: number;
    label: string;
  };
  action?: {
    label: string;
    callback: () => void;
  };
}

@Component({
  selector: 'app-contabilium-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule
  ],
  template: `
    <div class="contabilium-card" [class]="'card-' + data.type">
      <div class="card-header">
        <div class="card-icon">
          <mat-icon>{{data.icon}}</mat-icon>
        </div>
        <div class="card-trend" *ngIf="data.trend" [class.positive]="data.trend.isPositive" [class.negative]="!data.trend.isPositive">
          <mat-icon>{{data.trend.isPositive ? 'trending_up' : 'trending_down'}}</mat-icon>
          <span>{{data.trend.value}}%</span>
        </div>
      </div>
      
      <div class="card-content">
        <div class="card-value">{{data.value}}</div>
        <div class="card-title">{{data.title}}</div>
        <div class="card-subtitle" *ngIf="data.subtitle">{{data.subtitle}}</div>
      </div>
      
      <div class="card-progress" *ngIf="data.progress">
        <div class="progress-label">
          <span>{{data.progress.label}}</span>
          <span>{{data.progress.value}}/{{data.progress.max}}</span>
        </div>
        <mat-progress-bar 
          mode="determinate" 
          [value]="(data.progress.value / data.progress.max) * 100">
        </mat-progress-bar>
      </div>
      
      <div class="card-action" *ngIf="data.action">
        <button mat-button (click)="data.action.callback()">
          {{data.action.label}}
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </div>
  `,
  styleUrl: './contabilium-card.component.scss'
})
export class ContabiliumCardComponent {
  @Input() data!: ContabiliumCardData;
}
