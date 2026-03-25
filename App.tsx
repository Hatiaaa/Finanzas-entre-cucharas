import React, { useEffect, useState, useCallback } from 'react';
import { FinanceService } from './services/FinanceService';
import { Transaction, Account, Category, DailyClosing } from './types';
import { Layout, View } from './components/Layout';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { Settings } from './components/Settings';
import { History } from './components/History';
import { SuppliersView } from './components/SuppliersView';
import { InventoryView } from './components/InventoryView';
import { RecipesView } from './components/RecipesView';
import { DailyClosingView } from './components/DailyClosingView';
import { SalesVolumeView } from './components/SalesVolumeView';
import { CreditsView } from './components/CreditsView';
import { TransactionType, AccountType } from './types';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // App State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [balances, setBalances] = useState<{ accountId: string; balance: number }[]>([]);
  const [closings, setClosings] = useState<DailyClosing[]>([]);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const refreshData = useCallback(async () => {
    try {
      const [txs, accs, cats, clgs] = await Promise.all([
        FinanceService.getTransactions(),
        FinanceService.getAccounts(),
        FinanceService.getCategories(),
        FinanceService.getClosings()
      ]);

      setTransactions(txs);
      setAccounts(accs);
      setCategories(cats);
      setClosings(clgs);
      setBalances(FinanceService.calculateBalances(accs, txs));
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await FinanceService.init();
      await refreshData();
    };
    init();
  }, [refreshData]);

  // Handlers
  const handleAddTransaction = async (data: any) => {
    try {
      setIsLoading(true);
      await FinanceService.addTransaction(data);
      await refreshData();
      // setView('dashboard'); 
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Error al guardar el movimiento. Verifique su conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTransaction = async (transaction: Transaction) => {
    try {
      setIsLoading(true);
      await FinanceService.updateTransaction(transaction);
      await refreshData();
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Error al actualizar el movimiento. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Movimiento',
      message: '¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await FinanceService.deleteTransaction(id);
          await refreshData();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Error deleting transaction:", error);
          alert("Error al eliminar. Intente nuevamente.");
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleAddAccount = async (data: any) => {
    try {
      setIsLoading(true);
      await FinanceService.addAccount(data);
      await refreshData();
    } catch (error) {
      console.error("Error adding account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAccount = async (account: Account) => {
    try {
      setIsLoading(true);
      await FinanceService.updateAccount(account);
      await refreshData();
    } catch (error) {
      console.error("Error updating account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Cuenta',
      message: '¿Eliminar esta cuenta? Se perderán los saldos asociados.',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await FinanceService.deleteAccount(id);
          await refreshData();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Error deleting account:", error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleAddCategory = async (data: any) => {
    try {
      setIsLoading(true);
      await FinanceService.addCategory(data);
      await refreshData();
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (category: Category) => {
    try {
      setIsLoading(true);
      await FinanceService.updateCategory(category);
      await refreshData();
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Categoría',
      message: '¿Estás seguro de que quieres eliminar esta categoría?',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await FinanceService.deleteCategory(id);
          await refreshData();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Error deleting category:", error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleAddClosing = async (data: any) => {
    setIsLoading(true);
    await FinanceService.addClosing(data);
    await refreshData();
  };

  const handleDeleteClosing = async (id: string) => {
    setIsLoading(true);
    await FinanceService.deleteClosing(id);
    await refreshData();
    await refreshData();
  };

  const handlePayCredit = async (transactionId: string, toAccountId: string) => {
    setIsLoading(true);
    try {
      const originalTx = transactions.find(t => t.id === transactionId);
      if (!originalTx) return;

      // Move transaction to the destination account (e.g. Cash)
      // This "pays" the credit by converting it into a realized income in the cash account
      await FinanceService.updateTransaction({
        ...originalTx,
        date: new Date().toISOString(),
        accountId: toAccountId,
        description: `${originalTx.description} (Cobrado - ${originalTx.client || 'Cliente'})`,
      });

      await refreshData();
    } catch (error) {
      console.error("Error paying credit", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayAllCredit = async (clientName: string, toAccountId: string) => {
    setIsLoading(true);
    try {
      const creditAccountIds = accounts.filter(a => a.type === AccountType.CREDIT).map(a => a.id);
      const clientTxs = transactions.filter(t => 
        creditAccountIds.includes(t.accountId) && 
        t.type === TransactionType.INCOME &&
        (t.client?.trim() || 'Cliente Sin Nombre') === clientName
      );

      if (clientTxs.length === 0) return;

      await Promise.all(clientTxs.map(tx => {
        return FinanceService.updateTransaction({
          ...tx,
          date: new Date().toISOString(),
          accountId: toAccountId,
          description: `${tx.description} (Cobrado - ${tx.client || 'Cliente Sin Nombre'})`
        });
      }));

      await refreshData();
    } catch (error) {
      console.error("Error paying all credit", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout currentView={view} onNavigate={setView}>
      {isLoading && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[#151E2B] p-6 rounded-3xl shadow-2xl border border-[#1E293B] flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-[#19A8C7] animate-spin" />
            <p className="text-white font-medium">Sincronizando con la nube...</p>
          </div>
        </div>
      )}

      {/* Content Views */}
      {view === 'dashboard' && (
        <Dashboard
          transactions={transactions}
          accounts={accounts}
          balances={balances}
          onNavigate={setView}
        />
      )}

      {view === 'transaction' && (
        <TransactionForm
          accounts={accounts}
          categories={categories}
          onAddTransaction={handleAddTransaction}
        />
      )}

      {view === 'history' && (
        <History
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {view === 'suppliers' && <SuppliersView />}
      {view === 'inventory' && <InventoryView />}
      {view === 'recipes' && <RecipesView />}

      {view === 'dailyClosing' && (
        <DailyClosingView
          accounts={accounts}
          balances={balances}
          closings={closings}
          onAddClosing={handleAddClosing}
          onDeleteClosing={handleDeleteClosing}
        />
      )}

      {view === 'salesVolume' && (
        <SalesVolumeView
          transactions={transactions}
          onBack={() => setView('dashboard')}
        />
      )}

      {view === 'credits' && (
        <CreditsView
          transactions={transactions}
          accounts={accounts}
          onBack={() => setView('dashboard')}
          onPayCredit={handlePayCredit}
          onPayAllCredit={handlePayAllCredit}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {view === 'settings' && (
        <Settings
          accounts={accounts}
          categories={categories}
          onAddAccount={handleAddAccount}
          onUpdateAccount={handleUpdateAccount}
          onDeleteAccount={handleDeleteAccount}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {/* Custom Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-500/10 p-3 rounded-2xl text-red-500">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">{confirmDialog.title}</h3>
              </div>
              <p className="text-gray-400 mb-8 leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;