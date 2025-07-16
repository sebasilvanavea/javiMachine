import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface Employee {
  id: string;
  rut: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  hireDate: Date;
  isActive: boolean;
  salary: EmployeeSalary;
  contractType: 'INDEFINIDO' | 'PLAZO_FIJO' | 'HONORARIOS' | 'PART_TIME';
  workingHours: number; // horas por semana
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  bankAccount: {
    bank: string;
    accountType: 'CORRIENTE' | 'VISTA' | 'AHORRO';
    accountNumber: string;
  };
}

export interface EmployeeSalary {
  baseSalary: number;
  allowances: SalaryAllowance[];
  deductions: SalaryDeduction[];
  effectiveDate: Date;
}

export interface SalaryAllowance {
  id: string;
  name: string;
  amount: number;
  type: 'FIXED' | 'PERCENTAGE' | 'VARIABLE';
  isImponible: boolean; // sujeto a cotizaciones
  isTaxable: boolean; // sujeto a impuestos
}

export interface SalaryDeduction {
  id: string;
  name: string;
  amount: number;
  type: 'FIXED' | 'PERCENTAGE';
  isVoluntary: boolean;
  category: 'TAX' | 'SOCIAL_SECURITY' | 'HEALTH' | 'PENSION' | 'VOLUNTARY' | 'OTHER';
}

export interface PayrollPeriod {
  id: string;
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
  payDate: Date;
  status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CLOSED';
  employeePayrolls: EmployeePayroll[];
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeePayroll {
  id: string;
  employeeId: string;
  periodId: string;
  grossSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  workedDays: number;
  overtimeHours: number;
  absences: PayrollAbsence[];
  allowances: PayrollAllowance[];
  deductions: PayrollDeduction[];
  taxableIncome: number;
  taxWithheld: number;
}

export interface PayrollAbsence {
  id: string;
  type: 'VACATION' | 'SICK_LEAVE' | 'UNPAID' | 'MATERNITY' | 'PERSONAL';
  days: number;
  amount: number; // descuento por ausencia
  description?: string;
}

export interface PayrollAllowance {
  id: string;
  name: string;
  amount: number;
  isImponible: boolean;
  isTaxable: boolean;
}

export interface PayrollDeduction {
  id: string;
  name: string;
  amount: number;
  category: 'TAX' | 'SOCIAL_SECURITY' | 'HEALTH' | 'PENSION' | 'VOLUNTARY' | 'OTHER';
}

export interface PayrollSummary {
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  totalTaxes: number;
  totalSocialSecurity: number;
  averageSalary: number;
  payrollCost: number; // incluye costos del empleador
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private readonly EMPLOYEES_KEY = 'sistema_contable_employees';
  private readonly PAYROLL_PERIODS_KEY = 'sistema_contable_payroll_periods';
  private readonly PAYROLL_CONFIG_KEY = 'sistema_contable_payroll_config';

  constructor() {
    this.initializePayrollConfig();
  }

  private initializePayrollConfig(): void {
    if (!localStorage.getItem(this.PAYROLL_CONFIG_KEY)) {
      const config = {
        socialSecurityRates: {
          pension: 0.1, // 10%
          health: 0.07, // 7%
          unemployment: 0.006, // 0.6%
          workAccident: 0.0095 // 0.95%
        },
        employerContributions: {
          pension: 0.0, // 0% - no hay contribución patronal en pensiones en Chile
          health: 0.0, // 0% - no hay contribución patronal en salud en Chile
          unemployment: 0.024, // 2.4%
          workAccident: 0.0095 // 0.95%
        },
        taxBrackets: [
          { min: 0, max: 752000, rate: 0 },
          { min: 752001, max: 1504000, rate: 0.05 },
          { min: 1504001, max: 2508000, rate: 0.10 },
          { min: 2508001, max: 3512000, rate: 0.15 },
          { min: 3512001, max: Infinity, rate: 0.20 }
        ],
        minimumWage: 460000,
        ufValue: 36000 // Valor aproximado de la UF
      };
      localStorage.setItem(this.PAYROLL_CONFIG_KEY, JSON.stringify(config));
    }
  }

  // Gestión de Empleados
  getEmployees(): Observable<Employee[]> {
    const employees = this.getEmployeesFromStorage();
    return of(employees).pipe(delay(200));
  }

  getEmployee(employeeId: string): Observable<Employee> {
    const employees = this.getEmployeesFromStorage();
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
      return throwError(() => new Error('Empleado no encontrado'));
    }

    return of(employee).pipe(delay(100));
  }

  createEmployee(employeeData: Omit<Employee, 'id'>): Observable<Employee> {
    const employees = this.getEmployeesFromStorage();
    
    // Verificar que el RUT no exista
    const existingEmployee = employees.find(emp => emp.rut === employeeData.rut);
    if (existingEmployee) {
      return throwError(() => new Error('Ya existe un empleado con este RUT'));
    }

    const newEmployee: Employee = {
      ...employeeData,
      id: uuidv4()
    };

    employees.push(newEmployee);
    this.saveEmployeesToStorage(employees);

    return of(newEmployee).pipe(delay(300));
  }

  updateEmployee(employeeId: string, updates: Partial<Employee>): Observable<Employee> {
    const employees = this.getEmployeesFromStorage();
    const index = employees.findIndex(emp => emp.id === employeeId);
    
    if (index === -1) {
      return throwError(() => new Error('Empleado no encontrado'));
    }

    employees[index] = { ...employees[index], ...updates };
    this.saveEmployeesToStorage(employees);

    return of(employees[index]).pipe(delay(200));
  }

  deactivateEmployee(employeeId: string): Observable<boolean> {
    return this.updateEmployee(employeeId, { isActive: false }).pipe(
      delay(200),
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Gestión de Nóminas
  createPayrollPeriod(year: number, month: number): Observable<PayrollPeriod> {
    const periods = this.getPayrollPeriodsFromStorage();
    
    // Verificar que no exista un período para ese mes/año
    const existingPeriod = periods.find(p => p.year === year && p.month === month);
    if (existingPeriod) {
      return throwError(() => new Error('Ya existe un período de nómina para este mes'));
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const payDate = new Date(year, month, 5); // Día 5 del mes siguiente

    const newPeriod: PayrollPeriod = {
      id: uuidv4(),
      year,
      month,
      startDate,
      endDate,
      payDate,
      status: 'DRAFT',
      employeePayrolls: [],
      totalGross: 0,
      totalNet: 0,
      totalDeductions: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    periods.push(newPeriod);
    this.savePayrollPeriodsToStorage(periods);

    return of(newPeriod).pipe(delay(300));
  }

  calculatePayroll(periodId: string): Observable<PayrollPeriod> {
    const periods = this.getPayrollPeriodsFromStorage();
    const period = periods.find(p => p.id === periodId);
    
    if (!period) {
      return throwError(() => new Error('Período de nómina no encontrado'));
    }

    const employees = this.getEmployeesFromStorage().filter(emp => emp.isActive);
    const payrollConfig = this.getPayrollConfigFromStorage();

    const employeePayrolls: EmployeePayroll[] = employees.map(employee => {
      return this.calculateEmployeePayroll(employee, period, payrollConfig);
    });

    // Calcular totales
    const totalGross = employeePayrolls.reduce((sum, payroll) => sum + payroll.grossSalary, 0);
    const totalNet = employeePayrolls.reduce((sum, payroll) => sum + payroll.netSalary, 0);
    const totalDeductions = employeePayrolls.reduce((sum, payroll) => sum + payroll.totalDeductions, 0);

    const updatedPeriod: PayrollPeriod = {
      ...period,
      employeePayrolls,
      totalGross,
      totalNet,
      totalDeductions,
      status: 'CALCULATED',
      updatedAt: new Date()
    };

    const periodIndex = periods.findIndex(p => p.id === periodId);
    periods[periodIndex] = updatedPeriod;
    this.savePayrollPeriodsToStorage(periods);

    return of(updatedPeriod).pipe(delay(2000)); // Simular tiempo de cálculo
  }

  approvePayroll(periodId: string): Observable<PayrollPeriod> {
    return this.updatePayrollStatus(periodId, 'APPROVED');
  }

  payPayroll(periodId: string): Observable<PayrollPeriod> {
    return this.updatePayrollStatus(periodId, 'PAID');
  }

  closePayroll(periodId: string): Observable<PayrollPeriod> {
    return this.updatePayrollStatus(periodId, 'CLOSED');
  }

  getPayrollPeriods(): Observable<PayrollPeriod[]> {
    const periods = this.getPayrollPeriodsFromStorage();
    return of(periods.sort((a, b) => b.year - a.year || b.month - a.month)).pipe(delay(200));
  }

  getPayrollPeriod(periodId: string): Observable<PayrollPeriod> {
    const periods = this.getPayrollPeriodsFromStorage();
    const period = periods.find(p => p.id === periodId);
    
    if (!period) {
      return throwError(() => new Error('Período de nómina no encontrado'));
    }

    return of(period).pipe(delay(100));
  }

  getEmployeePayroll(periodId: string, employeeId: string): Observable<EmployeePayroll> {
    const periods = this.getPayrollPeriodsFromStorage();
    const period = periods.find(p => p.id === periodId);
    
    if (!period) {
      return throwError(() => new Error('Período de nómina no encontrado'));
    }

    const employeePayroll = period.employeePayrolls.find(ep => ep.employeeId === employeeId);
    
    if (!employeePayroll) {
      return throwError(() => new Error('Nómina del empleado no encontrada'));
    }

    return of(employeePayroll).pipe(delay(100));
  }

  generatePayrollSummary(periodId: string): Observable<PayrollSummary> {
    const periods = this.getPayrollPeriodsFromStorage();
    const period = periods.find(p => p.id === periodId);
    
    if (!period) {
      return throwError(() => new Error('Período de nómina no encontrado'));
    }

    const payrollConfig = this.getPayrollConfigFromStorage();
    const totalTaxes = period.employeePayrolls.reduce((sum, payroll) => sum + payroll.taxWithheld, 0);
    const totalSocialSecurity = period.employeePayrolls.reduce((sum, payroll) => {
      return sum + payroll.deductions
        .filter(d => ['SOCIAL_SECURITY', 'HEALTH', 'PENSION'].includes(d.category))
        .reduce((deductionSum, d) => deductionSum + d.amount, 0);
    }, 0);

    // Calcular costos del empleador
    const employerCosts = period.totalGross * (
      payrollConfig.employerContributions.unemployment + 
      payrollConfig.employerContributions.workAccident
    );

    const summary: PayrollSummary = {
      totalEmployees: period.employeePayrolls.length,
      totalGross: period.totalGross,
      totalNet: period.totalNet,
      totalTaxes,
      totalSocialSecurity,
      averageSalary: period.employeePayrolls.length > 0 ? period.totalGross / period.employeePayrolls.length : 0,
      payrollCost: period.totalGross + employerCosts
    };

    return of(summary).pipe(delay(300));
  }

  exportPayrollToExcel(periodId: string): Observable<Blob> {
    // Simular exportación a Excel
    const periods = this.getPayrollPeriodsFromStorage();
    const period = periods.find(p => p.id === periodId);
    
    if (!period) {
      return throwError(() => new Error('Período de nómina no encontrado'));
    }

    // En una implementación real, generarías un archivo Excel
    const excelContent = JSON.stringify(period, null, 2);
    const blob = new Blob([excelContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    return of(blob).pipe(delay(1500));
  }

  private calculateEmployeePayroll(employee: Employee, period: PayrollPeriod, config: any): EmployeePayroll {
    const workedDays = this.calculateWorkedDays(period.startDate, period.endDate);
    const dailySalary = employee.salary.baseSalary / 30;
    const grossSalary = dailySalary * workedDays;

    // Calcular asignaciones
    const allowances: PayrollAllowance[] = employee.salary.allowances.map(allowance => ({
      id: allowance.id,
      name: allowance.name,
      amount: allowance.type === 'PERCENTAGE' ? (grossSalary * allowance.amount / 100) : allowance.amount,
      isImponible: allowance.isImponible,
      isTaxable: allowance.isTaxable
    }));

    const totalAllowances = allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
    const totalGrossWithAllowances = grossSalary + totalAllowances;

    // Calcular renta imponible (para cotizaciones)
    const imponibleIncome = grossSalary + allowances
      .filter(a => a.isImponible)
      .reduce((sum, a) => sum + a.amount, 0);

    // Calcular renta gravable (para impuestos)
    const taxableIncome = grossSalary + allowances
      .filter(a => a.isTaxable)
      .reduce((sum, a) => sum + a.amount, 0);

    // Calcular deducciones
    const deductions: PayrollDeduction[] = [];

    // Cotizaciones previsionales
    if (imponibleIncome > 0) {
      deductions.push({
        id: uuidv4(),
        name: 'Cotización Pensión',
        amount: Math.round(imponibleIncome * config.socialSecurityRates.pension),
        category: 'PENSION'
      });

      deductions.push({
        id: uuidv4(),
        name: 'Cotización Salud',
        amount: Math.round(imponibleIncome * config.socialSecurityRates.health),
        category: 'HEALTH'
      });

      deductions.push({
        id: uuidv4(),
        name: 'Seguro Cesantía',
        amount: Math.round(imponibleIncome * config.socialSecurityRates.unemployment),
        category: 'SOCIAL_SECURITY'
      });
    }

    // Impuesto a la renta
    const taxWithheld = this.calculateIncomeTax(taxableIncome, config.taxBrackets);
    if (taxWithheld > 0) {
      deductions.push({
        id: uuidv4(),
        name: 'Impuesto a la Renta',
        amount: taxWithheld,
        category: 'TAX'
      });
    }

    // Deducciones voluntarias del empleado
    employee.salary.deductions.forEach(deduction => {
      const amount = deduction.type === 'PERCENTAGE' 
        ? Math.round(grossSalary * deduction.amount / 100)
        : deduction.amount;

      deductions.push({
        id: deduction.id,
        name: deduction.name,
        amount,
        category: deduction.category
      });
    });

    const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
    const netSalary = totalGrossWithAllowances - totalDeductions;

    return {
      id: uuidv4(),
      employeeId: employee.id,
      periodId: period.id,
      grossSalary: Math.round(grossSalary),
      totalAllowances: Math.round(totalAllowances),
      totalDeductions: Math.round(totalDeductions),
      netSalary: Math.round(netSalary),
      workedDays,
      overtimeHours: 0, // Implementar según necesidad
      absences: [], // Implementar según necesidad
      allowances,
      deductions,
      taxableIncome: Math.round(taxableIncome),
      taxWithheld: Math.round(taxWithheld)
    };
  }

  private calculateWorkedDays(startDate: Date, endDate: Date): number {
    // Calcular días trabajados excluyendo fines de semana
    let days = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Excluir domingo (0) y sábado (6)
        days++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }

  private calculateIncomeTax(taxableIncome: number, taxBrackets: any[]): number {
    let tax = 0;
    
    for (const bracket of taxBrackets) {
      if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
        tax = (taxableIncome - bracket.min) * bracket.rate;
        break;
      }
    }
    
    return Math.round(tax);
  }

  private updatePayrollStatus(periodId: string, status: PayrollPeriod['status']): Observable<PayrollPeriod> {
    const periods = this.getPayrollPeriodsFromStorage();
    const index = periods.findIndex(p => p.id === periodId);
    
    if (index === -1) {
      return throwError(() => new Error('Período de nómina no encontrado'));
    }

    periods[index] = {
      ...periods[index],
      status,
      updatedAt: new Date()
    };

    this.savePayrollPeriodsToStorage(periods);
    return of(periods[index]).pipe(delay(200));
  }

  private getEmployeesFromStorage(): Employee[] {
    const employeesStr = localStorage.getItem(this.EMPLOYEES_KEY);
    if (employeesStr) {
      try {
        return JSON.parse(employeesStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  private saveEmployeesToStorage(employees: Employee[]): void {
    localStorage.setItem(this.EMPLOYEES_KEY, JSON.stringify(employees));
  }

  private getPayrollPeriodsFromStorage(): PayrollPeriod[] {
    const periodsStr = localStorage.getItem(this.PAYROLL_PERIODS_KEY);
    if (periodsStr) {
      try {
        const periods = JSON.parse(periodsStr);
        // Convertir strings de fecha a objetos Date
        return periods.map((p: any) => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
          payDate: new Date(p.payDate),
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  private savePayrollPeriodsToStorage(periods: PayrollPeriod[]): void {
    localStorage.setItem(this.PAYROLL_PERIODS_KEY, JSON.stringify(periods));
  }

  private getPayrollConfigFromStorage(): any {
    const configStr = localStorage.getItem(this.PAYROLL_CONFIG_KEY);
    if (configStr) {
      try {
        return JSON.parse(configStr);
      } catch {
        return {};
      }
    }
    return {};
  }
}
