import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface TaxCalculation {
  income: number;
  deductions: number;
  taxableIncome: number;
  tax: number;
  taxRate: number;
  exemptAmount: number;
}

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  fixedAmount: number;
}

export interface TaxDeduction {
  id: string;
  name: string;
  amount: number;
  category: 'HEALTH' | 'EDUCATION' | 'CHARITY' | 'MORTGAGE' | 'OTHER';
  description: string;
  maxAllowed?: number;
}

export interface TaxYear {
  year: number;
  brackets: TaxBracket[];
  exemptAmount: number;
  additionalTaxes: {
    socialSecurity: number;
    healthInsurance: number;
  };
}

export interface VATCalculation {
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaxService {
  private readonly TAX_RATES_KEY = 'sistema_contable_tax_rates';
  private readonly TAX_DEDUCTIONS_KEY = 'sistema_contable_tax_deductions';

  constructor() {
    this.initializeTaxData();
  }

  private initializeTaxData(): void {
    // Inicializar datos de impuestos chilenos para 2024
    if (!localStorage.getItem(this.TAX_RATES_KEY)) {
      const taxYear2024: TaxYear = {
        year: 2024,
        brackets: [
          { min: 0, max: 8160000, rate: 0, fixedAmount: 0 },
          { min: 8160001, max: 18960000, rate: 0.04, fixedAmount: 0 },
          { min: 18960001, max: 31500000, rate: 0.08, fixedAmount: 432000 },
          { min: 31500001, max: 44040000, rate: 0.135, fixedAmount: 1435200 },
          { min: 44040001, max: 58800000, rate: 0.23, fixedAmount: 3128100 },
          { min: 58800001, max: 78000000, rate: 0.304, fixedAmount: 6522900 },
          { min: 78000001, max: Infinity, rate: 0.35, fixedAmount: 12350400 }
        ],
        exemptAmount: 8160000,
        additionalTaxes: {
          socialSecurity: 0.07, // 7%
          healthInsurance: 0.07 // 7%
        }
      };
      localStorage.setItem(this.TAX_RATES_KEY, JSON.stringify([taxYear2024]));
    }
  }

  calculateIncomeTax(income: number, deductions: TaxDeduction[] = [], year: number = 2024): Observable<TaxCalculation> {
    const taxYears = this.getTaxYearsFromStorage();
    const taxYear = taxYears.find(ty => ty.year === year);
    
    if (!taxYear) {
      return throwError(() => new Error(`No se encontraron datos de impuestos para el año ${year}`));
    }

    // Calcular total de deducciones
    const totalDeductions = deductions.reduce((sum, deduction) => {
      return sum + Math.min(deduction.amount, deduction.maxAllowed || deduction.amount);
    }, 0);

    // Calcular renta imponible
    const taxableIncome = Math.max(0, income - totalDeductions);

    // Calcular impuesto según tramos
    let tax = 0;
    let applicableBracket: TaxBracket | null = null;

    for (const bracket of taxYear.brackets) {
      if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
        applicableBracket = bracket;
        tax = bracket.fixedAmount + ((taxableIncome - bracket.min) * bracket.rate);
        break;
      }
    }

    const calculation: TaxCalculation = {
      income,
      deductions: totalDeductions,
      taxableIncome,
      tax: Math.round(tax),
      taxRate: applicableBracket?.rate || 0,
      exemptAmount: taxYear.exemptAmount
    };

    return of(calculation).pipe(delay(300));
  }

  calculateVAT(netAmount: number, vatRate: number = 0.19): Observable<VATCalculation> {
    const vatAmount = Math.round(netAmount * vatRate);
    const totalAmount = netAmount + vatAmount;

    const calculation: VATCalculation = {
      netAmount,
      vatRate,
      vatAmount,
      totalAmount
    };

    return of(calculation).pipe(delay(100));
  }

  calculateNetFromGross(grossAmount: number, vatRate: number = 0.19): Observable<VATCalculation> {
    const netAmount = Math.round(grossAmount / (1 + vatRate));
    const vatAmount = grossAmount - netAmount;

    const calculation: VATCalculation = {
      netAmount,
      vatRate,
      vatAmount,
      totalAmount: grossAmount
    };

    return of(calculation).pipe(delay(100));
  }

  getTaxBrackets(year: number = 2024): Observable<TaxBracket[]> {
    const taxYears = this.getTaxYearsFromStorage();
    const taxYear = taxYears.find(ty => ty.year === year);
    
    if (!taxYear) {
      return throwError(() => new Error(`No se encontraron datos de impuestos para el año ${year}`));
    }

    return of(taxYear.brackets).pipe(delay(100));
  }

  getAvailableDeductions(): Observable<TaxDeduction[]> {
    const deductions = this.getDeductionsFromStorage();
    return of(deductions).pipe(delay(100));
  }

  addCustomDeduction(deduction: Omit<TaxDeduction, 'id'>): Observable<TaxDeduction> {
    const deductions = this.getDeductionsFromStorage();
    
    const newDeduction: TaxDeduction = {
      ...deduction,
      id: this.generateId()
    };

    deductions.push(newDeduction);
    this.saveDeductionsToStorage(deductions);

    return of(newDeduction).pipe(delay(200));
  }

  updateDeduction(deductionId: string, updates: Partial<TaxDeduction>): Observable<TaxDeduction> {
    const deductions = this.getDeductionsFromStorage();
    const index = deductions.findIndex(d => d.id === deductionId);
    
    if (index === -1) {
      return throwError(() => new Error('Deducción no encontrada'));
    }

    deductions[index] = { ...deductions[index], ...updates };
    this.saveDeductionsToStorage(deductions);

    return of(deductions[index]).pipe(delay(200));
  }

  deleteDeduction(deductionId: string): Observable<boolean> {
    const deductions = this.getDeductionsFromStorage();
    const index = deductions.findIndex(d => d.id === deductionId);
    
    if (index === -1) {
      return throwError(() => new Error('Deducción no encontrada'));
    }

    deductions.splice(index, 1);
    this.saveDeductionsToStorage(deductions);

    return of(true).pipe(delay(200));
  }

  calculateMonthlyTax(monthlyIncome: number, year: number = 2024): Observable<TaxCalculation> {
    // Proyectar ingreso anual
    const annualIncome = monthlyIncome * 12;
    return this.calculateIncomeTax(annualIncome, [], year);
  }

  calculateQuarterlyTax(quarterlyIncome: number, year: number = 2024): Observable<TaxCalculation> {
    // Proyectar ingreso anual
    const annualIncome = quarterlyIncome * 4;
    return this.calculateIncomeTax(annualIncome, [], year);
  }

  estimateAnnualTax(monthlyIncomes: number[], deductions: TaxDeduction[] = [], year: number = 2024): Observable<TaxCalculation> {
    const annualIncome = monthlyIncomes.reduce((sum, income) => sum + income, 0);
    return this.calculateIncomeTax(annualIncome, deductions, year);
  }

  getOptimalDeductionStrategy(income: number, availableDeductions: TaxDeduction[], year: number = 2024): Observable<{
    recommendedDeductions: TaxDeduction[];
    taxSavings: number;
    originalTax: number;
    optimizedTax: number;
  }> {
    // Calcular impuesto sin deducciones
    return new Observable(observer => {
      this.calculateIncomeTax(income, [], year).subscribe(originalCalculation => {
        // Ordenar deducciones por eficiencia (mayor reducción de impuesto por peso gastado)
        const sortedDeductions = availableDeductions
          .map(deduction => {
            const effectiveAmount = Math.min(deduction.amount, deduction.maxAllowed || deduction.amount);
            return {
              ...deduction,
              effectiveAmount,
              efficiency: effectiveAmount > 0 ? this.calculateTaxBenefit(income, effectiveAmount, year) / effectiveAmount : 0
            };
          })
          .sort((a, b) => b.efficiency - a.efficiency);

        // Seleccionar deducciones hasta que ya no haya beneficio significativo
        const recommendedDeductions: TaxDeduction[] = [];
        let currentIncome = income;
        
        for (const deduction of sortedDeductions) {
          const taxBenefit = this.calculateTaxBenefit(currentIncome, deduction.effectiveAmount, year);
          if (taxBenefit > 0) {
            recommendedDeductions.push(deduction);
            currentIncome -= deduction.effectiveAmount;
          }
        }

        this.calculateIncomeTax(income, recommendedDeductions, year).subscribe(optimizedCalculation => {
          observer.next({
            recommendedDeductions,
            taxSavings: originalCalculation.tax - optimizedCalculation.tax,
            originalTax: originalCalculation.tax,
            optimizedTax: optimizedCalculation.tax
          });
          observer.complete();
        });
      });
    });
  }

  private calculateTaxBenefit(income: number, deductionAmount: number, year: number): number {
    const taxYears = this.getTaxYearsFromStorage();
    const taxYear = taxYears.find(ty => ty.year === year);
    
    if (!taxYear) return 0;

    // Encontrar el tramo de impuesto aplicable
    for (const bracket of taxYear.brackets) {
      if (income >= bracket.min && income <= bracket.max) {
        return deductionAmount * bracket.rate;
      }
    }
    
    return 0;
  }

  getCurrentTaxYear(): number {
    return new Date().getFullYear();
  }

  getTaxDeadlines(year: number = 2024): Observable<Array<{type: string, description: string, deadline: Date}>> {
    const deadlines = [
      {
        type: 'FORM_22',
        description: 'Formulario 22 - Declaración Anual de Renta',
        deadline: new Date(year + 1, 3, 30) // 30 de abril del año siguiente
      },
      {
        type: 'FORM_21',
        description: 'Formulario 21 - Declaración Mensual',
        deadline: new Date(year, new Date().getMonth() + 1, 12) // 12 del mes siguiente
      },
      {
        type: 'VAT_MONTHLY',
        description: 'IVA Mensual',
        deadline: new Date(year, new Date().getMonth() + 1, 12) // 12 del mes siguiente
      },
      {
        type: 'PROVISIONAL_TAX',
        description: 'Pagos Provisionales Mensuales',
        deadline: new Date(year, new Date().getMonth() + 1, 12) // 12 del mes siguiente
      }
    ];

    return of(deadlines).pipe(delay(100));
  }

  private getTaxYearsFromStorage(): TaxYear[] {
    const taxYearsStr = localStorage.getItem(this.TAX_RATES_KEY);
    if (taxYearsStr) {
      try {
        return JSON.parse(taxYearsStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  private getDeductionsFromStorage(): TaxDeduction[] {
    const deductionsStr = localStorage.getItem(this.TAX_DEDUCTIONS_KEY);
    if (deductionsStr) {
      try {
        return JSON.parse(deductionsStr);
      } catch {
        return this.getDefaultDeductions();
      }
    }
    return this.getDefaultDeductions();
  }

  private saveDeductionsToStorage(deductions: TaxDeduction[]): void {
    localStorage.setItem(this.TAX_DEDUCTIONS_KEY, JSON.stringify(deductions));
  }

  private getDefaultDeductions(): TaxDeduction[] {
    return [
      {
        id: '1',
        name: 'Cotizaciones de Salud',
        amount: 0,
        category: 'HEALTH',
        description: 'Cotizaciones obligatorias de salud',
        maxAllowed: 999999999
      },
      {
        id: '2',
        name: 'Cotizaciones de Pensión',
        amount: 0,
        category: 'OTHER',
        description: 'Cotizaciones obligatorias de pensión',
        maxAllowed: 999999999
      },
      {
        id: '3',
        name: 'Gastos de Educación',
        amount: 0,
        category: 'EDUCATION',
        description: 'Gastos en educación propia, cónyuge e hijos',
        maxAllowed: 999999999
      },
      {
        id: '4',
        name: 'Donaciones',
        amount: 0,
        category: 'CHARITY',
        description: 'Donaciones a instituciones sin fines de lucro',
        maxAllowed: 999999999
      },
      {
        id: '5',
        name: 'Intereses Hipotecarios',
        amount: 0,
        category: 'MORTGAGE',
        description: 'Intereses pagados por crédito hipotecario vivienda',
        maxAllowed: 8000000
      }
    ];
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}
