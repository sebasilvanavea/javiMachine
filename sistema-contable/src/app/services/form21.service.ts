import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Form21Data, Form21Detail } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class Form21Service {
  private readonly FORM21_KEY = 'sistema_contable_form21';

  constructor() {}

  private getForms21FromStorage(): Form21Data[] {
    const formsStr = localStorage.getItem(this.FORM21_KEY);
    if (formsStr) {
      try {
        return JSON.parse(formsStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  private saveForms21ToStorage(forms: Form21Data[]): void {
    localStorage.setItem(this.FORM21_KEY, JSON.stringify(forms));
  }

  getForm21ByServiceId(serviceId: string): Observable<Form21Data | null> {
    const forms = this.getForms21FromStorage();
    const form = forms.find(f => f.serviceId === serviceId) || null;
    return of(form).pipe(delay(200));
  }

  createForm21(serviceId: string, formData: Omit<Form21Data, 'id' | 'serviceId'>): Observable<Form21Data> {
    const forms = this.getForms21FromStorage();
    
    // Verificar si ya existe un formulario para este servicio
    const existingForm = forms.find(f => f.serviceId === serviceId);
    if (existingForm) {
      return throwError(() => new Error('Ya existe un Formulario 21 para este servicio'));
    }

    const newForm: Form21Data = {
      ...formData,
      id: uuidv4(),
      serviceId
    };

    forms.push(newForm);
    this.saveForms21ToStorage(forms);

    return of(newForm).pipe(delay(300));
  }

  updateForm21(formId: string, formData: Partial<Form21Data>): Observable<Form21Data> {
    const forms = this.getForms21FromStorage();
    const index = forms.findIndex(f => f.id === formId);
    
    if (index === -1) {
      return throwError(() => new Error('Formulario 21 no encontrado'));
    }

    forms[index] = {
      ...forms[index],
      ...formData
    };

    this.saveForms21ToStorage(forms);
    return of(forms[index]).pipe(delay(300));
  }

  deleteForm21(formId: string): Observable<boolean> {
    const forms = this.getForms21FromStorage();
    const index = forms.findIndex(f => f.id === formId);
    
    if (index === -1) {
      return throwError(() => new Error('Formulario 21 no encontrado'));
    }

    forms.splice(index, 1);
    this.saveForms21ToStorage(forms);
    return of(true).pipe(delay(300));
  }

  addDetailToForm21(formId: string, detail: Omit<Form21Detail, 'id'>): Observable<Form21Detail> {
    const forms = this.getForms21FromStorage();
    const formIndex = forms.findIndex(f => f.id === formId);
    
    if (formIndex === -1) {
      return throwError(() => new Error('Formulario 21 no encontrado'));
    }

    const newDetail: Form21Detail = {
      ...detail
    };

    forms[formIndex].details.push(newDetail);
    
    // Recalcular totales
    this.recalculateForm21Totals(forms[formIndex]);
    
    this.saveForms21ToStorage(forms);
    return of(newDetail).pipe(delay(300));
  }

  removeDetailFromForm21(formId: string, detailIndex: number): Observable<boolean> {
    const forms = this.getForms21FromStorage();
    const formIndex = forms.findIndex(f => f.id === formId);
    
    if (formIndex === -1) {
      return throwError(() => new Error('Formulario 21 no encontrado'));
    }

    if (detailIndex < 0 || detailIndex >= forms[formIndex].details.length) {
      return throwError(() => new Error('Detalle no encontrado'));
    }

    forms[formIndex].details.splice(detailIndex, 1);
    
    // Recalcular totales
    this.recalculateForm21Totals(forms[formIndex]);
    
    this.saveForms21ToStorage(forms);
    return of(true).pipe(delay(300));
  }

  private recalculateForm21Totals(form: Form21Data): void {
    const income = form.details
      .filter(d => d.category === 'INCOME')
      .reduce((sum, d) => sum + d.amount, 0);
    
    const expenses = form.details
      .filter(d => d.category === 'EXPENSE')
      .reduce((sum, d) => sum + d.amount, 0);

    form.totalIncome = income;
    form.totalExpenses = expenses;
    form.netIncome = income - expenses;
    
    // Cálculo simplificado del impuesto (19% sobre ingresos netos)
    form.tax = Math.max(0, form.netIncome * 0.19);
  }

  submitForm21(formId: string): Observable<Form21Data> {
    const forms = this.getForms21FromStorage();
    const index = forms.findIndex(f => f.id === formId);
    
    if (index === -1) {
      return throwError(() => new Error('Formulario 21 no encontrado'));
    }

    forms[index].submittedAt = new Date();
    this.saveForms21ToStorage(forms);

    return of(forms[index]).pipe(delay(500));
  }

  getForm21Template(): Form21Data {
    return {
      id: '',
      serviceId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      tax: 0,
      details: []
    };
  }

  validateForm21(form: Form21Data): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!form.month || form.month < 1 || form.month > 12) {
      errors.push('El mes debe estar entre 1 y 12');
    }

    if (!form.year || form.year < 2020 || form.year > new Date().getFullYear()) {
      errors.push('El año debe ser válido');
    }

    if (form.details.length === 0) {
      errors.push('Debe agregar al menos un detalle al formulario');
    }

    form.details.forEach((detail, index) => {
      if (!detail.concept || detail.concept.trim().length === 0) {
        errors.push(`El concepto del detalle ${index + 1} es requerido`);
      }

      if (!detail.amount || detail.amount <= 0) {
        errors.push(`El monto del detalle ${index + 1} debe ser mayor a 0`);
      }

      if (!detail.date) {
        errors.push(`La fecha del detalle ${index + 1} es requerida`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
