import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ContabiliumTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'currency' | 'date' | 'status' | 'actions';
  width?: string;
}

export interface ContabiliumTableAction {
  icon: string;
  label: string;
  callback: (row: any) => void;
  type?: 'primary' | 'secondary' | 'danger';
}

@Component({
  selector: 'app-contabilium-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="contabilium-table-container">
      <div class="table-header" *ngIf="title">
        <h3>{{title}}</h3>
        <div class="table-actions">
          <ng-content select="[slot=actions]"></ng-content>
        </div>
      </div>
      
      <div class="table-wrapper">
        <table mat-table [dataSource]="data" class="contabilium-table">
          <ng-container *ngFor="let column of columns" [matColumnDef]="column.key">
            <th mat-header-cell *matHeaderCellDef [style.width]="column.width">
              {{column.label}}
            </th>
            <td mat-cell *matCellDef="let row" [ngSwitch]="column.type">
              
              <!-- Texto normal -->
              <span *ngSwitchCase="'text'">{{getValue(row, column.key)}}</span>
              
              <!-- Número -->
              <span *ngSwitchCase="'number'" class="text-right">
                {{getValue(row, column.key) | number}}
              </span>
              
              <!-- Moneda -->
              <span *ngSwitchCase="'currency'" class="text-right font-semibold">
                {{getValue(row, column.key) | currency:'USD':'symbol':'1.0-0'}}
              </span>
              
              <!-- Fecha -->
              <span *ngSwitchCase="'date'">
                {{getValue(row, column.key) | date:'shortDate'}}
              </span>
              
              <!-- Status chip -->
              <mat-chip *ngSwitchCase="'status'" [class]="'status-' + getValue(row, column.key).toLowerCase()">
                {{getValue(row, column.key)}}
              </mat-chip>
              
              <!-- Acciones -->
              <div *ngSwitchCase="'actions'" class="table-row-actions">
                <button 
                  mat-icon-button 
                  *ngFor="let action of actions"
                  [class]="'action-' + (action.type || 'secondary')"
                  (click)="action.callback(row)"
                  [matTooltip]="action.label">
                  <mat-icon>{{action.icon}}</mat-icon>
                </button>
              </div>
              
              <!-- Default -->
              <span *ngSwitchDefault>{{getValue(row, column.key)}}</span>
            </td>
          </ng-container>
          
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="onRowClick(row)"></tr>
        </table>
      </div>
      
      <mat-paginator 
        *ngIf="showPaginator"
        [pageSizeOptions]="[10, 25, 50, 100]"
        showFirstLastButtons>
      </mat-paginator>
    </div>
  `,
  styleUrl: './contabilium-table.component.scss'
})
export class ContabiliumTableComponent {
  @Input() data: any[] = [];
  @Input() columns: ContabiliumTableColumn[] = [];
  @Input() actions: ContabiliumTableAction[] = [];
  @Input() title?: string;
  @Input() showPaginator: boolean = true;
  @Output() rowClicked = new EventEmitter<any>();

  get displayedColumns(): string[] {
    return this.columns.map(col => col.key);
  }

  getValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }

  onRowClick(row: any): void {
    this.rowClicked.emit(row);
  }
}
