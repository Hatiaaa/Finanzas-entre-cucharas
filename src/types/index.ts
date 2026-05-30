// ─── Enums / Unions ────────────────────────────────────────────────────────

export type AccountType      = 'CASH' | 'BANK' | 'CREDIT'
export type TransactionType  = 'Ingreso' | 'Egreso' | 'Transferencia'
export type UnitType         = 'kg' | 'g' | 'l' | 'ml' | 'unidad' | 'docena'

// ─── Cuentas ───────────────────────────────────────────────────────────────

export interface Account {
  id:             string
  name:           string
  type:           AccountType
  initialBalance: number
}

// ─── Transacciones ─────────────────────────────────────────────────────────

export interface Transaction {
  id:            string
  date:          string      // ISO timestamp
  type:          TransactionType
  category:      string
  subcategory:   string
  amount:        number
  accountId:     string
  toAccountId?:  string      // solo Transferencia
  quantity?:     number
  description?:  string
  hasAttachment: boolean
  client?:       string      // solo créditos
}

// ─── Cierre diario ─────────────────────────────────────────────────────────

export interface DailyClosing {
  id:             string
  date:           string
  accountId:      string
  systemBalance:  number
  physicalAmount: number
  difference:     number
  notes?:         string
}

// ─── Categorías ────────────────────────────────────────────────────────────

export interface Category {
  id:            string
  name:          string
  type:          string
  subcategories: string[]
}

// ─── Proveedores ───────────────────────────────────────────────────────────

export interface Supplier {
  id:   string
  name: string
}

// ─── Inventario ────────────────────────────────────────────────────────────

export interface Ingredient {
  id:           string
  name:         string
  unit:         UnitType
  cost:         number
  supplierId?:  string
  minStock:     number
  currentStock: number
}

// ─── Recetas ───────────────────────────────────────────────────────────────

export interface RecipeIngredient {
  ingredientId: string
  amount:       number
}

export interface Recipe {
  id:           string
  name:         string
  category:     string
  sellingPrice: number
  ingredients:  RecipeIngredient[]
}

// ─── Balances calculados ───────────────────────────────────────────────────

export interface AccountBalance {
  accountId: string
  balance:   number
}
