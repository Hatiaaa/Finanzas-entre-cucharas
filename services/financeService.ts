import { Account, Category, Transaction, TransactionType, AccountType } from '../types';

const KEYS = {
  ACCOUNTS: 'ec_accounts',
  CATEGORIES: 'ec_categories',
  TRANSACTIONS: 'ec_transactions',
};

// Seed Data
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Ventas Alimentos', type: TransactionType.INCOME, subcategories: ['Desayunos', 'Comidas', 'Cenas'] },
  { id: 'c2', name: 'Bebidas', type: TransactionType.INCOME, subcategories: ['Café', 'Refrescos', 'Alcohol'] },
  { id: 'c3', name: 'Proveedores', type: TransactionType.EXPENSE, subcategories: ['Verduras', 'Carnes', 'Abarrotes'] },
  { id: 'c4', name: 'Nómina', type: TransactionType.EXPENSE, subcategories: ['Cocina', 'Meseros', 'Gerencia'] },
  { id: 'c5', name: 'Servicios', type: TransactionType.EXPENSE, subcategories: ['Luz', 'Agua', 'Internet'] },
  { id: 'c6', name: 'Transferencia', type: 'Neutro' },
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'a1', name: 'Caja General', initialBalance: 0, type: AccountType.CASH },
  { id: 'a2', name: 'Banco Principal', initialBalance: 0, type: AccountType.BANK },
];

export const FinanceService = {
  init: () => {
    if (!localStorage.getItem(KEYS.CATEGORIES)) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem(KEYS.ACCOUNTS)) {
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
    }
    if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
    }
  },

  getAccounts: (): Account[] => {
    return JSON.parse(localStorage.getItem(KEYS.ACCOUNTS) || '[]');
  },

  addAccount: (account: Omit<Account, 'id'>) => {
    const accounts = FinanceService.getAccounts();
    const newAccount = { ...account, id: crypto.randomUUID() };
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify([...accounts, newAccount]));
    return newAccount;
  },

  updateAccount: (updatedAccount: Account) => {
    const accounts = FinanceService.getAccounts();
    const index = accounts.findIndex(a => a.id === updatedAccount.id);
    if (index !== -1) {
      accounts[index] = updatedAccount;
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
  },

  deleteAccount: (id: string) => {
    const accounts = FinanceService.getAccounts().filter(a => a.id !== id);
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  getCategories: (): Category[] => {
    return JSON.parse(localStorage.getItem(KEYS.CATEGORIES) || '[]');
  },

  addCategory: (category: Omit<Category, 'id'>) => {
    const categories = FinanceService.getCategories();
    const newCat = { 
      ...category, 
      id: crypto.randomUUID(), 
      subcategories: category.subcategories || [] 
    };
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify([...categories, newCat]));
    return newCat;
  },

  updateCategory: (updatedCat: Category) => {
    const categories = FinanceService.getCategories();
    const index = categories.findIndex(c => c.id === updatedCat.id);
    if (index !== -1) {
      categories[index] = updatedCat;
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    }
  },

  deleteCategory: (id: string) => {
    const categories = FinanceService.getCategories().filter(c => c.id !== id);
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getTransactions: (): Transaction[] => {
    const data = JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
    // Sort by date desc
    return data.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addTransaction: (tx: Omit<Transaction, 'id'>) => {
    const txs = FinanceService.getTransactions();
    const newTx = { ...tx, id: crypto.randomUUID() };
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([...txs, newTx]));
    return newTx;
  },

  updateTransaction: (updatedTx: Transaction) => {
    const txs = FinanceService.getTransactions();
    const index = txs.findIndex(t => t.id === updatedTx.id);
    if (index !== -1) {
      txs[index] = updatedTx;
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
    }
  },

  deleteTransaction: (id: string) => {
    const txs = FinanceService.getTransactions().filter(t => t.id !== id);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
  },

  // Calculate current balances dynamically
  calculateBalances: (): { accountId: string, balance: number }[] => {
    const accounts = FinanceService.getAccounts();
    const transactions = FinanceService.getTransactions();
    
    return accounts.map(acc => {
      let balance = acc.initialBalance;
      
      transactions.forEach(tx => {
        if (tx.accountId === acc.id) {
          if (tx.type === TransactionType.INCOME) balance += tx.amount;
          if (tx.type === TransactionType.EXPENSE) balance -= tx.amount;
          if (tx.type === TransactionType.TRANSFER) balance -= tx.amount; // Outgoing
        }
        if (tx.toAccountId === acc.id && tx.type === TransactionType.TRANSFER) {
          balance += tx.amount; // Incoming transfer
        }
      });
      
      return { accountId: acc.id, balance };
    });
  }
};