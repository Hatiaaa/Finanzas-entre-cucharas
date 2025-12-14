import React, { useEffect, useState, useCallback } from 'react';
import { FinanceService } from './services/financeService';
import { Transaction, Account, Category } from './types';
import { LayoutDashboard, PlusCircle, Settings as SettingsIcon, UtensilsCrossed, Menu, X, List, LogOut, Bell, Search } from 'lucide-react';

import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { Settings } from './components/Settings';
import { History } from './components/History';

type View = 'dashboard' | 'transaction' | 'settings' | 'history';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // App State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [balances, setBalances] = useState<{ accountId: string; balance: number }[]>([]);

  const refreshData = useCallback(() => {
    setTransactions(FinanceService.getTransactions());
    setAccounts(FinanceService.getAccounts());
    setCategories(FinanceService.getCategories());
    setBalances(FinanceService.calculateBalances());
  }, []);

  useEffect(() => {
    FinanceService.init();
    refreshData();
  }, [refreshData]);

  // Handlers
  const handleAddTransaction = (data: any) => {
    FinanceService.addTransaction(data);
    refreshData();
    setView('dashboard');
  };

  const handleUpdateTransaction = (transaction: Transaction) => {
    FinanceService.updateTransaction(transaction);
    refreshData();
  };

  const handleDeleteTransaction = (id: string) => {
    if(window.confirm('¿Estás seguro de que quieres eliminar este movimiento?')) {
        FinanceService.deleteTransaction(id);
        refreshData();
    }
  };

  const handleAddAccount = (data: any) => {
    FinanceService.addAccount(data);
    refreshData();
  };

  const handleUpdateAccount = (account: Account) => {
    FinanceService.updateAccount(account);
    refreshData();
  };
  
  const handleDeleteAccount = (id: string) => {
    if(window.confirm('¿Eliminar cuenta?')) {
        FinanceService.deleteAccount(id);
        refreshData();
    }
  };

  const handleAddCategory = (data: any) => {
    FinanceService.addCategory(data);
    refreshData();
  };

  const handleUpdateCategory = (category: Category) => {
    FinanceService.updateCategory(category);
    refreshData();
  };

  const handleDeleteCategory = (id: string) => {
      FinanceService.deleteCategory(id);
      refreshData();
  };

  const NavItem = ({ target, icon: Icon, label }: { target: View; icon: any; label: string }) => (
    <button
      onClick={() => { setView(target); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 border-l-4 ${
        view === target 
          ? 'border-[#6c5dd3] text-white bg-white/5' 
          : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={22} className={view === target ? 'text-[#6c5dd3]' : ''} />
      <span className="font-medium text-sm tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#13131a] text-gray-200 flex overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-[#1c1c24] z-20 border-b border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-white">
           <div className="bg-[#6c5dd3] p-1.5 rounded-lg text-white">
            <UtensilsCrossed size={20} />
           </div>
           <span className="font-bold text-lg">Entre Cucharas</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-400">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#1c1c24] transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 hidden lg:flex items-center gap-3 mb-6">
          <div className="bg-[#6c5dd3] p-2 rounded-xl text-white shadow-lg shadow-[#6c5dd3]/30">
            <UtensilsCrossed size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Entre Cucharas</h1>
            <p className="text-xs text-gray-500 font-medium">Panel Financiero</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 mt-14 lg:mt-0">
          <NavItem target="dashboard" icon={LayoutDashboard} label="Panel Principal" />
          <NavItem target="transaction" icon={PlusCircle} label="Registrar Movimiento" />
          <NavItem target="history" icon={List} label="Historial y Análisis" />
          <NavItem target="settings" icon={SettingsIcon} label="Configuración" />
        </nav>

        <div className="p-6">
           <button className="flex items-center gap-3 text-gray-500 hover:text-white transition-colors w-full px-4 py-3">
             <LogOut size={20} />
             <span className="font-medium text-sm">Cerrar Sesión</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:h-screen lg:overflow-y-auto pt-20 lg:pt-0 bg-[#13131a]">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          
          {/* Top Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                 Hola, Gerencia
              </h2>
              <p className="text-gray-500 text-sm mt-1">Resumen financiero actualizado al {new Date().toLocaleDateString('es-ES')}</p>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                 <input 
                   type="text" 
                   placeholder="Buscar transacción..." 
                   className="w-full bg-[#1c1c24] text-white pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-[#6c5dd3] focus:ring-1 focus:ring-[#6c5dd3] outline-none text-sm transition-all placeholder-gray-600"
                 />
               </div>
               <button className="p-2.5 bg-[#1c1c24] rounded-xl text-gray-400 hover:text-white relative transition-colors">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-orange-500 rounded-full border border-[#1c1c24]"></span>
               </button>
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6c5dd3] to-blue-500 p-0.5 cursor-pointer">
                  <img src="https://ui-avatars.com/api/?name=Admin+Restaurante&background=1c1c24&color=fff" alt="Profile" className="w-full h-full rounded-full border-2 border-[#13131a]" />
               </div>
            </div>
          </div>

          {/* Content Views */}
          {view === 'dashboard' && (
            <Dashboard 
              transactions={transactions} 
              accounts={accounts} 
              balances={balances} 
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
        </div>
      </main>
    </div>
  );
}

export default App;