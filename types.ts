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
  quantity?: number; // Para ventas de unidades (ej: 300 almuerzos)
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

// Restaurant Specific Models

export enum UnitType {
  KG = 'kg',
  L = 'l',
  UNIT = 'unidad',
  PACK = 'paquete'
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  category: string;
  email?: string;
  phone?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: UnitType;
  cost: number;
  supplierId: string;
  minStock: number;
  currentStock: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  amount: number;
}

export interface Recipe {
  id: string;
  name: string;
  sellingPrice: number;
  ingredients: RecipeIngredient[];
  category?: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  accountId: string;
  systemBalance: number;
  physicalAmount: number;
  difference: number;
  notes?: string;
}