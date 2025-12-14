export enum TransactionType {
  INCOME = 'Ingreso',
  EXPENSE = 'Egreso',
  TRANSFER = 'Transferencia'
}

export enum AccountType {
  CASH = 'Efectivo',
  BANK = 'Banco'
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType | 'Neutro';
  subcategories?: string[]; // Lista de subcategorías
}

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
  type: AccountType;
}

export interface Transaction {
  id: string;
  date: string; // ISO String
  type: TransactionType;
  category: string;
  subcategory?: string; // Subcategoría seleccionada
  accountId: string; // ID of the account
  toAccountId?: string; // Only for transfers
  amount: number;
  description: string;
  hasAttachment: boolean;
}

export interface DashboardKPIs {
  income: number;
  expense: number;
  balance: number;
  capital: number;
  incomeTrend: number; // vs previous month
  expenseTrend: number;
  netTrend: number;
}