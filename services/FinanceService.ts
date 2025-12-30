import { supabase } from '../lib/supabase';
import { Account, Category, Transaction, TransactionType, AccountType, Supplier, Ingredient, UnitType, DailyClosing, Recipe } from '../types';

// Seed Data
const DEFAULT_CATEGORIES = [
  { name: 'Ventas Alimentos', type: TransactionType.INCOME, subcategories: ['Desayunos', 'Comidas', 'Cenas'] },
  { name: 'Bebidas', type: TransactionType.INCOME, subcategories: ['Café', 'Refrescos', 'Alcohol'] },
  { name: 'Proveedores', type: TransactionType.EXPENSE, subcategories: ['Verduras', 'Carnes', 'Abarrotes'] },
  { name: 'Nómina', type: TransactionType.EXPENSE, subcategories: ['Cocina', 'Meseros', 'Gerencia'] },
  { name: 'Servicios', type: TransactionType.EXPENSE, subcategories: ['Luz', 'Agua', 'Internet'] },
  { name: 'Transferencia', type: 'Neutro' },
];

const DEFAULT_ACCOUNTS = [
  { name: 'Caja General', initial_balance: 0, type: AccountType.CASH },
  { name: 'Banco Principal', initial_balance: 0, type: AccountType.BANK },
  { name: 'Cuentas por Cobrar', initial_balance: 0, type: AccountType.CREDIT },
];

export const FinanceService = {
  init: async () => {
    try {
      // Check if categories exist
      const { data: cats, error: cErr } = await supabase.from('categories').select('id').limit(1);
      if (!cErr && (!cats || cats.length === 0)) {
        await supabase.from('categories').insert(DEFAULT_CATEGORIES);
      }

      // Check if accounts exist
      const { data: accs, error: aErr } = await supabase.from('accounts').select('id').limit(1);
      if (!aErr && (!accs || accs.length === 0)) {
        await supabase.from('accounts').insert(DEFAULT_ACCOUNTS);
      }
    } catch (e) {
      console.error('Initialization error:', e);
    }
  },

  // --- Accounts ---
  getAccounts: async (): Promise<Account[]> => {
    const { data, error } = await supabase.from('accounts').select('*').order('name');
    if (error) throw error;
    return data.map(acc => ({
      id: acc.id,
      name: acc.name,
      initialBalance: Number(acc.initial_balance),
      type: acc.type
    }));
  },

  addAccount: async (account: Omit<Account, 'id'>) => {
    const { data, error } = await supabase.from('accounts').insert([{
      name: account.name,
      initial_balance: account.initialBalance,
      type: account.type
    }]).select().single();
    if (error) throw error;
    return data;
  },

  updateAccount: async (acc: Account) => {
    const { error } = await supabase.from('accounts').update({
      name: acc.name,
      initial_balance: acc.initialBalance,
      type: acc.type
    }).eq('id', acc.id);
    if (error) throw error;
  },

  deleteAccount: async (id: string) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Categories ---
  getCategories: async (): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return data;
  },

  addCategory: async (category: Omit<Category, 'id'>) => {
    const { data, error } = await supabase.from('categories').insert([category]).select().single();
    if (error) throw error;
    return data;
  },

  updateCategory: async (cat: Category) => {
    const { error } = await supabase.from('categories').update(cat).eq('id', cat.id);
    if (error) throw error;
  },

  deleteCategory: async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Transactions ---
  getTransactions: async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data.map(tx => ({
      id: tx.id,
      date: tx.date,
      type: tx.type as TransactionType,
      category: tx.category,
      subcategory: tx.subcategory,
      amount: Number(tx.amount),
      description: tx.description,
      accountId: tx.account_id,
      toAccountId: tx.to_account_id,
      quantity: tx.quantity,
      hasAttachment: tx.has_attachment
    }));
  },

  addTransaction: async (tx: Omit<Transaction, 'id'>) => {
    const { data, error } = await supabase.from('transactions').insert([{
      date: tx.date,
      type: tx.type,
      category: tx.category,
      subcategory: tx.subcategory,
      amount: tx.amount,
      description: tx.description,
      account_id: tx.accountId,
      to_account_id: tx.toAccountId,
      quantity: tx.quantity,
      has_attachment: tx.hasAttachment
    }]).select().single();
    if (error) throw error;
    return data;
  },

  updateTransaction: async (tx: Transaction) => {
    const { error } = await supabase.from('transactions').update({
      date: tx.date,
      type: tx.type,
      category: tx.category,
      subcategory: tx.subcategory,
      amount: tx.amount,
      description: tx.description,
      account_id: tx.accountId,
      to_account_id: tx.toAccountId,
      quantity: tx.quantity,
      has_attachment: tx.hasAttachment
    }).eq('id', tx.id);
    if (error) throw error;
  },

  deleteTransaction: async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Suppliers ---
  getSuppliers: async (): Promise<Supplier[]> => {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) throw error;
    return data;
  },

  addSupplier: async (supplier: Omit<Supplier, 'id'>) => {
    const { data, error } = await supabase.from('suppliers').insert([supplier]).select().single();
    if (error) throw error;
    return data;
  },

  updateSupplier: async (s: Supplier) => {
    const { error } = await supabase.from('suppliers').update(s).eq('id', s.id);
    if (error) throw error;
  },

  deleteSupplier: async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Ingredients ---
  getIngredients: async (): Promise<Ingredient[]> => {
    const { data, error } = await supabase.from('ingredients').select('*').order('name');
    if (error) throw error;
    return data.map(i => ({
      id: i.id,
      name: i.name,
      unit: i.unit as UnitType,
      cost: Number(i.cost),
      supplierId: i.supplier_id,
      minStock: Number(i.min_stock),
      currentStock: Number(i.current_stock)
    }));
  },

  addIngredient: async (ing: Omit<Ingredient, 'id'>) => {
    const { data, error } = await supabase.from('ingredients').insert([{
      name: ing.name,
      unit: ing.unit,
      cost: ing.cost,
      supplier_id: ing.supplierId,
      min_stock: ing.minStock,
      current_stock: ing.currentStock
    }]).select().single();
    if (error) throw error;
    return data;
  },

  // --- Recipes ---
  getRecipes: async (): Promise<Recipe[]> => {
    const { data: recipes, error: rError } = await supabase.from('recipes').select('*, recipe_ingredients(*)');
    if (rError) throw rError;

    return recipes.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      sellingPrice: Number(r.selling_price),
      ingredients: (r.recipe_ingredients || []).map((ri: any) => ({
        ingredientId: ri.ingredient_id,
        amount: Number(ri.amount)
      }))
    }));
  },

  addRecipe: async (recipe: Omit<Recipe, 'id'>) => {
    const { data: newRecipe, error: rError } = await supabase.from('recipes').insert([{
      name: recipe.name,
      selling_price: recipe.sellingPrice,
      category: recipe.category
    }]).select().single();

    if (rError) throw rError;

    const recipeIngredients = recipe.ingredients.map(ri => ({
      recipe_id: newRecipe.id,
      ingredient_id: ri.ingredientId,
      amount: ri.amount
    }));

    const { error: riError } = await supabase.from('recipe_ingredients').insert(recipeIngredients);
    if (riError) throw riError;

    return { ...newRecipe, sellingPrice: Number(newRecipe.selling_price), ingredients: recipe.ingredients };
  },

  deleteRecipe: async (id: string) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Daily Closings ---
  getClosings: async (): Promise<DailyClosing[]> => {
    const { data, error } = await supabase.from('daily_closings').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data.map(c => ({
      id: c.id,
      date: c.date,
      accountId: c.account_id,
      systemBalance: Number(c.system_balance),
      physicalAmount: Number(c.physical_amount),
      difference: Number(c.difference),
      notes: c.notes
    }));
  },

  addClosing: async (closing: Omit<DailyClosing, 'id'>) => {
    const { data, error } = await supabase.from('daily_closings').insert([{
      date: closing.date,
      account_id: closing.accountId,
      system_balance: closing.systemBalance,
      physical_amount: closing.physicalAmount,
      difference: closing.difference,
      notes: closing.notes
    }]).select().single();
    if (error) throw error;
    return data;
  },

  deleteClosing: async (id: string) => {
    const { error } = await supabase.from('daily_closings').delete().eq('id', id);
    if (error) throw error;
  },

  calculateBalances: (accounts: Account[], transactions: Transaction[]): { accountId: string, balance: number }[] => {
    return accounts.map(acc => {
      let balance = acc.initialBalance;
      transactions.forEach(tx => {
        if (tx.accountId === acc.id) {
          if (tx.type === TransactionType.INCOME) balance += tx.amount;
          if (tx.type === TransactionType.EXPENSE) balance -= tx.amount;
          if (tx.type === TransactionType.TRANSFER) balance -= tx.amount;
        }
        if (tx.toAccountId === acc.id && tx.type === TransactionType.TRANSFER) {
          balance += tx.amount;
        }
      });
      return { accountId: acc.id, balance };
    });
  }
};