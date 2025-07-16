import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  category: AccountCategory;
  balance: number;
  isActive: boolean;
  description?: string;
  parentAccountId?: string;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum AccountType {
  ASSET = 'ASSET',           // Activo
  LIABILITY = 'LIABILITY',   // Pasivo
  EQUITY = 'EQUITY',         // Patrimonio
  INCOME = 'INCOME',         // Ingreso
  EXPENSE = 'EXPENSE'        // Gasto
}

export enum AccountCategory {
  // Activos
  CURRENT_ASSET = 'CURRENT_ASSET',           // Activo Corriente
  NON_CURRENT_ASSET = 'NON_CURRENT_ASSET',   // Activo No Corriente
  
  // Pasivos
  CURRENT_LIABILITY = 'CURRENT_LIABILITY',   // Pasivo Corriente
  NON_CURRENT_LIABILITY = 'NON_CURRENT_LIABILITY', // Pasivo No Corriente
  
  // Patrimonio
  CAPITAL = 'CAPITAL',                       // Capital
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',   // Utilidades Retenidas
  
  // Ingresos
  OPERATING_INCOME = 'OPERATING_INCOME',     // Ingresos Operacionales
  NON_OPERATING_INCOME = 'NON_OPERATING_INCOME', // Ingresos No Operacionales
  
  // Gastos
  OPERATING_EXPENSE = 'OPERATING_EXPENSE',   // Gastos Operacionales
  NON_OPERATING_EXPENSE = 'NON_OPERATING_EXPENSE' // Gastos No Operacionales
}

export interface JournalEntry {
  id: string;
  number: string;
  date: Date;
  description: string;
  reference?: string;
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  entries: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
  order: number;
}

export interface TrialBalance {
  period: string;
  accounts: TrialBalanceAccount[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  generatedAt: Date;
}

export interface TrialBalanceAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
  balance: number;
}

export interface FinancialStatement {
  type: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CASH_FLOW';
  period: string;
  startDate: Date;
  endDate: Date;
  sections: FinancialStatementSection[];
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  totalIncome?: number;
  totalExpenses?: number;
  netIncome?: number;
  generatedAt: Date;
}

export interface FinancialStatementSection {
  name: string;
  accounts: FinancialStatementAccount[];
  total: number;
}

export interface FinancialStatementAccount {
  accountCode: string;
  accountName: string;
  amount: number;
  level: number;
}

export interface AccountingPeriod {
  id: string;
  year: number;
  month?: number;
  startDate: Date;
  endDate: Date;
  status: 'OPEN' | 'CLOSED';
  closingEntryId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private readonly ACCOUNTS_KEY = 'sistema_contable_accounts';
  private readonly JOURNAL_ENTRIES_KEY = 'sistema_contable_journal_entries';
  private readonly PERIODS_KEY = 'sistema_contable_periods';

  constructor() {
    this.initializeChartOfAccounts();
  }

  private initializeChartOfAccounts(): void {
    if (!localStorage.getItem(this.ACCOUNTS_KEY)) {
      const defaultAccounts = this.getDefaultChartOfAccounts();
      this.saveAccountsToStorage(defaultAccounts);
    }
  }

  // Gestión de Cuentas
  getChartOfAccounts(): Observable<Account[]> {
    const accounts = this.getAccountsFromStorage();
    return of(accounts).pipe(delay(200));
  }

  getAccount(accountId: string): Observable<Account> {
    const accounts = this.getAccountsFromStorage();
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
      return throwError(() => new Error('Cuenta no encontrada'));
    }

    return of(account).pipe(delay(100));
  }

  createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Observable<Account> {
    const accounts = this.getAccountsFromStorage();
    
    // Verificar que el código no exista
    const existingAccount = accounts.find(acc => acc.code === accountData.code);
    if (existingAccount) {
      return throwError(() => new Error('Ya existe una cuenta con este código'));
    }

    const newAccount: Account = {
      ...accountData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    accounts.push(newAccount);
    this.saveAccountsToStorage(accounts);

    return of(newAccount).pipe(delay(300));
  }

  updateAccount(accountId: string, updates: Partial<Account>): Observable<Account> {
    const accounts = this.getAccountsFromStorage();
    const index = accounts.findIndex(acc => acc.id === accountId);
    
    if (index === -1) {
      return throwError(() => new Error('Cuenta no encontrada'));
    }

    accounts[index] = {
      ...accounts[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveAccountsToStorage(accounts);
    return of(accounts[index]).pipe(delay(200));
  }

  deleteAccount(accountId: string): Observable<boolean> {
    const accounts = this.getAccountsFromStorage();
    const journalEntries = this.getJournalEntriesFromStorage();
    
    // Verificar que la cuenta no tenga movimientos
    const hasMovements = journalEntries.some(entry => 
      entry.entries.some(line => line.accountId === accountId)
    );

    if (hasMovements) {
      return throwError(() => new Error('No se puede eliminar una cuenta que tiene movimientos'));
    }

    const index = accounts.findIndex(acc => acc.id === accountId);
    if (index === -1) {
      return throwError(() => new Error('Cuenta no encontrada'));
    }

    accounts.splice(index, 1);
    this.saveAccountsToStorage(accounts);

    return of(true).pipe(delay(200));
  }

  // Gestión de Asientos Contables
  getJournalEntries(startDate?: Date, endDate?: Date): Observable<JournalEntry[]> {
    let entries = this.getJournalEntriesFromStorage();
    
    if (startDate) {
      entries = entries.filter(entry => new Date(entry.date) >= startDate);
    }
    
    if (endDate) {
      entries = entries.filter(entry => new Date(entry.date) <= endDate);
    }

    return of(entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())).pipe(delay(300));
  }

  getJournalEntry(entryId: string): Observable<JournalEntry> {
    const entries = this.getJournalEntriesFromStorage();
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
      return throwError(() => new Error('Asiento contable no encontrado'));
    }

    return of(entry).pipe(delay(100));
  }

  createJournalEntry(entryData: Omit<JournalEntry, 'id' | 'number' | 'isPosted' | 'createdAt' | 'updatedAt'>): Observable<JournalEntry> {
    // Validar que el asiento esté balanceado
    const totalDebit = entryData.entries.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entryData.entries.reduce((sum, line) => sum + line.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return throwError(() => new Error('El asiento no está balanceado'));
    }

    const entries = this.getJournalEntriesFromStorage();
    const nextNumber = this.generateNextJournalNumber(entries);

    const newEntry: JournalEntry = {
      ...entryData,
      id: uuidv4(),
      number: nextNumber,
      totalDebit,
      totalCredit,
      isPosted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    entries.push(newEntry);
    this.saveJournalEntriesToStorage(entries);

    return of(newEntry).pipe(delay(400));
  }

  updateJournalEntry(entryId: string, updates: Partial<JournalEntry>): Observable<JournalEntry> {
    const entries = this.getJournalEntriesFromStorage();
    const index = entries.findIndex(e => e.id === entryId);
    
    if (index === -1) {
      return throwError(() => new Error('Asiento contable no encontrado'));
    }

    if (entries[index].isPosted) {
      return throwError(() => new Error('No se puede modificar un asiento ya contabilizado'));
    }

    // Si se actualizan las líneas, validar balance
    if (updates.entries) {
      const totalDebit = updates.entries.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = updates.entries.reduce((sum, line) => sum + line.credit, 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return throwError(() => new Error('El asiento no está balanceado'));
      }

      updates.totalDebit = totalDebit;
      updates.totalCredit = totalCredit;
    }

    entries[index] = {
      ...entries[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveJournalEntriesToStorage(entries);
    return of(entries[index]).pipe(delay(300));
  }

  postJournalEntry(entryId: string): Observable<JournalEntry> {
    const entries = this.getJournalEntriesFromStorage();
    const index = entries.findIndex(e => e.id === entryId);
    
    if (index === -1) {
      return throwError(() => new Error('Asiento contable no encontrado'));
    }

    if (entries[index].isPosted) {
      return throwError(() => new Error('El asiento ya está contabilizado'));
    }

    // Actualizar balances de las cuentas
    this.updateAccountBalances(entries[index]);

    entries[index] = {
      ...entries[index],
      isPosted: true,
      updatedAt: new Date()
    };

    this.saveJournalEntriesToStorage(entries);
    return of(entries[index]).pipe(delay(500));
  }

  deleteJournalEntry(entryId: string): Observable<boolean> {
    const entries = this.getJournalEntriesFromStorage();
    const index = entries.findIndex(e => e.id === entryId);
    
    if (index === -1) {
      return throwError(() => new Error('Asiento contable no encontrado'));
    }

    if (entries[index].isPosted) {
      return throwError(() => new Error('No se puede eliminar un asiento ya contabilizado'));
    }

    entries.splice(index, 1);
    this.saveJournalEntriesToStorage(entries);

    return of(true).pipe(delay(200));
  }

  // Reportes Contables
  generateTrialBalance(date: Date): Observable<TrialBalance> {
    const accounts = this.getAccountsFromStorage();
    const entries = this.getJournalEntriesFromStorage()
      .filter(entry => entry.isPosted && new Date(entry.date) <= date);

    const trialBalanceAccounts: TrialBalanceAccount[] = [];
    let totalDebits = 0;
    let totalCredits = 0;

    accounts.forEach(account => {
      let debit = 0;
      let credit = 0;

      entries.forEach(entry => {
        entry.entries.forEach(line => {
          if (line.accountId === account.id) {
            debit += line.debit;
            credit += line.credit;
          }
        });
      });

      if (debit > 0 || credit > 0) {
        const balance = this.calculateAccountBalance(account.type, debit, credit);
        
        trialBalanceAccounts.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          debit,
          credit,
          balance
        });

        totalDebits += debit;
        totalCredits += credit;
      }
    });

    const trialBalance: TrialBalance = {
      period: date.toLocaleDateString('es-ES'),
      accounts: trialBalanceAccounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      generatedAt: new Date()
    };

    return of(trialBalance).pipe(delay(800));
  }

  generateBalanceSheet(endDate: Date): Observable<FinancialStatement> {
    const accounts = this.getAccountsFromStorage();
    const entries = this.getJournalEntriesFromStorage()
      .filter(entry => entry.isPosted && new Date(entry.date) <= endDate);

    const assets = this.generateBalanceSheetSection(accounts, entries, [AccountType.ASSET]);
    const liabilities = this.generateBalanceSheetSection(accounts, entries, [AccountType.LIABILITY]);
    const equity = this.generateBalanceSheetSection(accounts, entries, [AccountType.EQUITY]);

    const totalAssets = assets.total;
    const totalLiabilities = liabilities.total;
    const totalEquity = equity.total;

    const balanceSheet: FinancialStatement = {
      type: 'BALANCE_SHEET',
      period: endDate.toLocaleDateString('es-ES'),
      startDate: new Date(endDate.getFullYear(), 0, 1),
      endDate,
      sections: [assets, liabilities, equity],
      totalAssets,
      totalLiabilities,
      totalEquity,
      generatedAt: new Date()
    };

    return of(balanceSheet).pipe(delay(1000));
  }

  generateIncomeStatement(startDate: Date, endDate: Date): Observable<FinancialStatement> {
    const accounts = this.getAccountsFromStorage();
    const entries = this.getJournalEntriesFromStorage()
      .filter(entry => entry.isPosted && 
        new Date(entry.date) >= startDate && 
        new Date(entry.date) <= endDate);

    const income = this.generateIncomeStatementSection(accounts, entries, [AccountType.INCOME]);
    const expenses = this.generateIncomeStatementSection(accounts, entries, [AccountType.EXPENSE]);

    const totalIncome = income.total;
    const totalExpenses = expenses.total;
    const netIncome = totalIncome - totalExpenses;

    const incomeStatement: FinancialStatement = {
      type: 'INCOME_STATEMENT',
      period: `${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')}`,
      startDate,
      endDate,
      sections: [income, expenses],
      totalIncome,
      totalExpenses,
      netIncome,
      generatedAt: new Date()
    };

    return of(incomeStatement).pipe(delay(1000));
  }

  // Períodos Contables
  createAccountingPeriod(year: number, month?: number): Observable<AccountingPeriod> {
    const periods = this.getPeriodsFromStorage();
    
    const startDate = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
    const endDate = month ? new Date(year, month, 0) : new Date(year, 11, 31);

    const existingPeriod = periods.find(p => 
      p.year === year && p.month === month
    );

    if (existingPeriod) {
      return throwError(() => new Error('Ya existe un período para esta fecha'));
    }

    const newPeriod: AccountingPeriod = {
      id: uuidv4(),
      year,
      month,
      startDate,
      endDate,
      status: 'OPEN'
    };

    periods.push(newPeriod);
    this.savePeriodsToStorage(periods);

    return of(newPeriod).pipe(delay(300));
  }

  closeAccountingPeriod(periodId: string): Observable<AccountingPeriod> {
    const periods = this.getPeriodsFromStorage();
    const index = periods.findIndex(p => p.id === periodId);
    
    if (index === -1) {
      return throwError(() => new Error('Período no encontrado'));
    }

    periods[index] = {
      ...periods[index],
      status: 'CLOSED'
    };

    this.savePeriodsToStorage(periods);
    return of(periods[index]).pipe(delay(400));
  }

  private updateAccountBalances(entry: JournalEntry): void {
    const accounts = this.getAccountsFromStorage();
    
    entry.entries.forEach(line => {
      const accountIndex = accounts.findIndex(acc => acc.id === line.accountId);
      if (accountIndex !== -1) {
        const account = accounts[accountIndex];
        const balanceChange = this.calculateBalanceChange(account.type, line.debit, line.credit);
        accounts[accountIndex].balance += balanceChange;
        accounts[accountIndex].updatedAt = new Date();
      }
    });

    this.saveAccountsToStorage(accounts);
  }

  private calculateAccountBalance(accountType: AccountType, debit: number, credit: number): number {
    switch (accountType) {
      case AccountType.ASSET:
      case AccountType.EXPENSE:
        return debit - credit;
      case AccountType.LIABILITY:
      case AccountType.EQUITY:
      case AccountType.INCOME:
        return credit - debit;
      default:
        return 0;
    }
  }

  private calculateBalanceChange(accountType: AccountType, debit: number, credit: number): number {
    switch (accountType) {
      case AccountType.ASSET:
      case AccountType.EXPENSE:
        return debit - credit;
      case AccountType.LIABILITY:
      case AccountType.EQUITY:
      case AccountType.INCOME:
        return credit - debit;
      default:
        return 0;
    }
  }

  private generateBalanceSheetSection(accounts: Account[], entries: JournalEntry[], accountTypes: AccountType[]): FinancialStatementSection {
    const sectionAccounts: FinancialStatementAccount[] = [];
    let total = 0;

    accounts
      .filter(account => accountTypes.includes(account.type))
      .forEach(account => {
        let debit = 0;
        let credit = 0;

        entries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.accountId === account.id) {
              debit += line.debit;
              credit += line.credit;
            }
          });
        });

        if (debit > 0 || credit > 0) {
          const amount = Math.abs(this.calculateAccountBalance(account.type, debit, credit));
          
          sectionAccounts.push({
            accountCode: account.code,
            accountName: account.name,
            amount,
            level: account.level
          });

          total += amount;
        }
      });

    return {
      name: this.getAccountTypeName(accountTypes[0]),
      accounts: sectionAccounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
      total
    };
  }

  private generateIncomeStatementSection(accounts: Account[], entries: JournalEntry[], accountTypes: AccountType[]): FinancialStatementSection {
    return this.generateBalanceSheetSection(accounts, entries, accountTypes);
  }

  private getAccountTypeName(accountType: AccountType): string {
    const names = {
      [AccountType.ASSET]: 'Activos',
      [AccountType.LIABILITY]: 'Pasivos',
      [AccountType.EQUITY]: 'Patrimonio',
      [AccountType.INCOME]: 'Ingresos',
      [AccountType.EXPENSE]: 'Gastos'
    };
    return names[accountType];
  }

  private generateNextJournalNumber(entries: JournalEntry[]): string {
    const currentYear = new Date().getFullYear();
    const yearEntries = entries.filter(entry => 
      new Date(entry.date).getFullYear() === currentYear
    );
    
    const nextNumber = yearEntries.length + 1;
    return `${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
  }

  private getDefaultChartOfAccounts(): Account[] {
    return [
      // Activos
      {
        id: uuidv4(),
        code: '1',
        name: 'ACTIVOS',
        type: AccountType.ASSET,
        category: AccountCategory.CURRENT_ASSET,
        balance: 0,
        isActive: true,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: '11',
        name: 'ACTIVO CORRIENTE',
        type: AccountType.ASSET,
        category: AccountCategory.CURRENT_ASSET,
        balance: 0,
        isActive: true,
        level: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: '1101',
        name: 'Caja',
        type: AccountType.ASSET,
        category: AccountCategory.CURRENT_ASSET,
        balance: 0,
        isActive: true,
        level: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: '1102',
        name: 'Banco',
        type: AccountType.ASSET,
        category: AccountCategory.CURRENT_ASSET,
        balance: 0,
        isActive: true,
        level: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: '1103',
        name: 'Cuentas por Cobrar',
        type: AccountType.ASSET,
        category: AccountCategory.CURRENT_ASSET,
        balance: 0,
        isActive: true,
        level: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Pasivos
      {
        id: uuidv4(),
        code: '2',
        name: 'PASIVOS',
        type: AccountType.LIABILITY,
        category: AccountCategory.CURRENT_LIABILITY,
        balance: 0,
        isActive: true,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: '21',
        name: 'PASIVO CORRIENTE',
        type: AccountType.LIABILITY,
        category: AccountCategory.CURRENT_LIABILITY,
        balance: 0,
        isActive: true,
        level: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: '2101',
        name: 'Cuentas por Pagar',
        type: AccountType.LIABILITY,
        category: AccountCategory.CURRENT_LIABILITY,
        balance: 0,
        isActive: true,
        level: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Patrimonio
      {
        id: uuidv4(),
        code: '3',
        name: 'PATRIMONIO',
        type: AccountType.EQUITY,
        category: AccountCategory.CAPITAL,
        balance: 0,
        isActive: true,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: '3101',
        name: 'Capital',
        type: AccountType.EQUITY,
        category: AccountCategory.CAPITAL,
        balance: 0,
        isActive: true,
        level: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Ingresos
      {
        id: uuidv4(),
        code: '4',
        name: 'INGRESOS',
        type: AccountType.INCOME,
        category: AccountCategory.OPERATING_INCOME,
        balance: 0,
        isActive: true,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: '4101',
        name: 'Ingresos por Servicios',
        type: AccountType.INCOME,
        category: AccountCategory.OPERATING_INCOME,
        balance: 0,
        isActive: true,
        level: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Gastos
      {
        id: uuidv4(),
        code: '5',
        name: 'GASTOS',
        type: AccountType.EXPENSE,
        category: AccountCategory.OPERATING_EXPENSE,
        balance: 0,
        isActive: true,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: '5101',
        name: 'Gastos Administrativos',
        type: AccountType.EXPENSE,
        category: AccountCategory.OPERATING_EXPENSE,
        balance: 0,
        isActive: true,
        level: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private getAccountsFromStorage(): Account[] {
    const accountsStr = localStorage.getItem(this.ACCOUNTS_KEY);
    if (accountsStr) {
      try {
        const accounts = JSON.parse(accountsStr);
        return accounts.map((acc: any) => ({
          ...acc,
          createdAt: new Date(acc.createdAt),
          updatedAt: new Date(acc.updatedAt)
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  private saveAccountsToStorage(accounts: Account[]): void {
    localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  private getJournalEntriesFromStorage(): JournalEntry[] {
    const entriesStr = localStorage.getItem(this.JOURNAL_ENTRIES_KEY);
    if (entriesStr) {
      try {
        const entries = JSON.parse(entriesStr);
        return entries.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  private saveJournalEntriesToStorage(entries: JournalEntry[]): void {
    localStorage.setItem(this.JOURNAL_ENTRIES_KEY, JSON.stringify(entries));
  }

  private getPeriodsFromStorage(): AccountingPeriod[] {
    const periodsStr = localStorage.getItem(this.PERIODS_KEY);
    if (periodsStr) {
      try {
        const periods = JSON.parse(periodsStr);
        return periods.map((period: any) => ({
          ...period,
          startDate: new Date(period.startDate),
          endDate: new Date(period.endDate)
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  private savePeriodsToStorage(periods: AccountingPeriod[]): void {
    localStorage.setItem(this.PERIODS_KEY, JSON.stringify(periods));
  }
}
