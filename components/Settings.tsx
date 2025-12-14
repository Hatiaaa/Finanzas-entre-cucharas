import React, { useState } from 'react';
import { Account, AccountType, Category, TransactionType } from '../types';
import { Trash2, PlusCircle, CreditCard, Tag, Plus, X, Pencil, Save } from 'lucide-react';

interface SettingsProps {
  accounts: Account[];
  categories: Category[];
  onAddAccount: (acc: any) => void;
  onUpdateAccount: (acc: Account) => void;
  onDeleteAccount: (id: string) => void;
  onAddCategory: (cat: any) => void;
  onUpdateCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  accounts, categories, onAddAccount, onUpdateAccount, onDeleteAccount, onAddCategory, onUpdateCategory, onDeleteCategory 
}) => {
  
  // --- Create States ---
  const [newAccName, setNewAccName] = useState('');
  const [newAccBal, setNewAccBal] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>(AccountType.CASH);

  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>(TransactionType.INCOME);
  
  const [subCatInput, setSubCatInput] = useState<{catId: string, value: string}>({ catId: '', value: '' });

  // --- Edit States (Modals) ---
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [tempSubcategories, setTempSubcategories] = useState<string[]>([]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccName) {
      onAddAccount({ name: newAccName, initialBalance: parseFloat(newAccBal) || 0, type: newAccType });
      setNewAccName('');
      setNewAccBal('');
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName) {
      onAddCategory({ name: newCatName, type: newCatType, subcategories: [] });
      setNewCatName('');
    }
  };

  const handleAddSubcategory = (category: Category) => {
    if (subCatInput.catId !== category.id || subCatInput.value.trim() === '') return;
    
    const updatedCategory = {
      ...category,
      subcategories: [...(category.subcategories || []), subCatInput.value.trim()]
    };
    
    onUpdateCategory(updatedCategory);
    setSubCatInput({ catId: '', value: '' });
  };

  const handleDeleteSubcategory = (category: Category, subToDelete: string) => {
    const updatedCategory = {
      ...category,
      subcategories: (category.subcategories || []).filter(s => s !== subToDelete)
    };
    onUpdateCategory(updatedCategory);
  };

  // --- Modal Logic ---
  const saveAccountEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      onUpdateAccount(editingAccount);
      setEditingAccount(null);
    }
  };

  const openCategoryEdit = (cat: Category) => {
    setEditingCategory({ ...cat });
    setTempSubcategories(cat.subcategories || []);
  };

  const saveCategoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      const finalCategory = { ...editingCategory, subcategories: tempSubcategories };
      onUpdateCategory(finalCategory);
      setEditingCategory(null);
    }
  };

  const handleTempSubcategoryChange = (index: number, val: string) => {
    const newSubs = [...tempSubcategories];
    newSubs[index] = val;
    setTempSubcategories(newSubs);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative animate-fade-in">
      
      {/* --- Account Edit Modal --- */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-[#1c1c24] rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
              <h3 className="text-lg font-bold text-white">Editar Cuenta</h3>
              <button onClick={() => setEditingAccount(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveAccountEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full p-2 border border-gray-700 rounded-lg bg-[#13131a] text-white focus:ring-1 focus:ring-[#6c5dd3] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Saldo Inicial</label>
                    <input
                      type="number"
                      required
                      value={editingAccount.initialBalance}
                      onChange={(e) => setEditingAccount({ ...editingAccount, initialBalance: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 border border-gray-700 rounded-lg bg-[#13131a] text-white focus:ring-1 focus:ring-[#6c5dd3] outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                    <select
                      value={editingAccount.type}
                      onChange={(e) => setEditingAccount({ ...editingAccount, type: e.target.value as AccountType })}
                      className="w-full p-2 border border-gray-700 rounded-lg bg-[#13131a] text-white focus:ring-1 focus:ring-[#6c5dd3] outline-none"
                    >
                      <option value={AccountType.CASH}>Efectivo</option>
                      <option value={AccountType.BANK}>Banco</option>
                    </select>
                 </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                 <button type="button" onClick={() => setEditingAccount(null)} className="px-4 py-2 text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700">Cancelar</button>
                 <button type="submit" className="px-4 py-2 text-white bg-[#6c5dd3] rounded-lg hover:bg-[#5b4eb8] flex items-center gap-2">
                   <Save size={16} /> Guardar
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Category Edit Modal --- */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-[#1c1c24] rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
              <h3 className="text-lg font-bold text-white">Editar Categoría</h3>
              <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveCategoryEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-2 border border-gray-700 rounded-lg bg-[#13131a] text-white focus:ring-1 focus:ring-[#6c5dd3] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                <select
                  value={editingCategory.type}
                  onChange={(e) => setEditingCategory({ ...editingCategory, type: e.target.value as TransactionType })}
                  className="w-full p-2 border border-gray-700 rounded-lg bg-[#13131a] text-white focus:ring-1 focus:ring-[#6c5dd3] outline-none"
                >
                  <option value={TransactionType.INCOME}>Ingreso</option>
                  <option value={TransactionType.EXPENSE}>Egreso</option>
                </select>
              </div>
              
              <div className="border-t border-gray-800 pt-3 mt-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Editar Subcategorías</label>
                <div className="space-y-2">
                  {tempSubcategories.map((sub, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text"
                        value={sub}
                        onChange={(e) => handleTempSubcategoryChange(idx, e.target.value)}
                        className="flex-1 p-1.5 text-sm border border-gray-700 rounded bg-[#13131a] text-white focus:ring-1 focus:ring-[#6c5dd3] outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newSubs = tempSubcategories.filter((_, i) => i !== idx);
                          setTempSubcategories(newSubs);
                        }}
                        className="text-red-500 hover:text-red-400 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-center mt-2">
                    <button 
                      type="button"
                      onClick={() => setTempSubcategories([...tempSubcategories, 'Nueva'])}
                      className="text-xs text-[#10b981] hover:text-[#34d399] flex items-center gap-1 bg-[#10b981]/10 px-3 py-1 rounded-full"
                    >
                      <Plus size={14} /> Añadir Subcategoría
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                 <button type="button" onClick={() => setEditingCategory(null)} className="px-4 py-2 text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700">Cancelar</button>
                 <button type="submit" className="px-4 py-2 text-white bg-[#6c5dd3] rounded-lg hover:bg-[#5b4eb8] flex items-center gap-2">
                   <Save size={16} /> Guardar
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accounts Section */}
      <div className="bg-[#1c1c24] rounded-3xl shadow-lg border border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#6c5dd3]/20 rounded-xl text-[#6c5dd3]">
            <CreditCard size={20} />
          </div>
          <h3 className="text-xl font-bold text-white">Gestionar Cuentas</h3>
        </div>

        <form onSubmit={handleCreateAccount} className="bg-[#13131a] p-5 rounded-2xl mb-6 border border-gray-800">
          <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Nueva Cuenta</h4>
          <div className="grid grid-cols-1 gap-3">
            <input
              placeholder="Nombre de Cuenta"
              value={newAccName}
              onChange={e => setNewAccName(e.target.value)}
              className="p-3 border border-gray-700 rounded-xl text-sm w-full bg-[#1c1c24] text-white focus:ring-1 focus:ring-[#6c5dd3] outline-none"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Saldo Inicial"
                value={newAccBal}
                onChange={e => setNewAccBal(e.target.value)}
                className="p-3 border border-gray-700 rounded-xl text-sm w-1/2 bg-[#1c1c24] text-white focus:ring-1 focus:ring-[#6c5dd3] outline-none"
              />
              <select 
                value={newAccType}
                onChange={e => setNewAccType(e.target.value as AccountType)}
                className="p-3 border border-gray-700 rounded-xl text-sm w-1/2 bg-[#1c1c24] text-white focus:ring-1 focus:ring-[#6c5dd3] outline-none"
              >
                <option value={AccountType.CASH}>Efectivo</option>
                <option value={AccountType.BANK}>Banco</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-[#6c5dd3] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#5b4eb8] flex items-center justify-center gap-2 transition-colors">
              <PlusCircle size={18} /> Crear Cuenta
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="flex justify-between items-center p-4 bg-[#13131a] border border-gray-800 rounded-2xl shadow-sm group hover:border-[#6c5dd3] transition-colors">
              <div>
                <p className="font-bold text-gray-200">{acc.name}</p>
                <p className="text-xs text-gray-500">{acc.type} • Inicial: ${acc.initialBalance}</p>
              </div>
              <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingAccount(acc)} className="text-gray-500 hover:text-[#6c5dd3] transition-colors p-2 bg-[#1c1c24] rounded-lg">
                  <Pencil size={16} />
                </button>
                <button onClick={() => onDeleteAccount(acc.id)} className="text-gray-500 hover:text-red-500 transition-colors p-2 bg-[#1c1c24] rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-[#1c1c24] rounded-3xl shadow-lg border border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#10b981]/20 rounded-xl text-[#10b981]">
            <Tag size={20} />
          </div>
          <h3 className="text-xl font-bold text-white">Gestionar Categorías</h3>
        </div>

        <form onSubmit={handleCreateCategory} className="bg-[#13131a] p-5 rounded-2xl mb-6 border border-gray-800">
          <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Nueva Categoría</h4>
          <div className="flex gap-2 mb-3">
             <input
              placeholder="Nombre Categoría"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="p-3 border border-gray-700 rounded-xl text-sm w-2/3 bg-[#1c1c24] text-white focus:ring-1 focus:ring-[#10b981] outline-none"
            />
            <select 
                value={newCatType}
                onChange={e => setNewCatType(e.target.value as TransactionType)}
                className="p-3 border border-gray-700 rounded-xl text-sm w-1/3 bg-[#1c1c24] text-white focus:ring-1 focus:ring-[#10b981] outline-none"
              >
                <option value={TransactionType.INCOME}>Ingreso</option>
                <option value={TransactionType.EXPENSE}>Egreso</option>
              </select>
          </div>
          <button type="submit" className="w-full bg-[#10b981] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#059669] flex items-center justify-center gap-2 transition-colors">
            <PlusCircle size={18} /> Crear Categoría
          </button>
        </form>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {categories.filter(c => c.type !== 'Neutro').map(cat => (
            <div key={cat.id} className="bg-[#13131a] border border-gray-800 rounded-2xl shadow-sm p-4 group hover:border-[#10b981] transition-colors">
               <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-3">
                   <span className={`w-2.5 h-2.5 rounded-full ${cat.type === TransactionType.INCOME ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}></span>
                   <p className="font-bold text-gray-200">{cat.name}</p>
                 </div>
                 <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openCategoryEdit(cat)} className="text-gray-500 hover:text-[#10b981] transition-colors p-1.5 bg-[#1c1c24] rounded-lg">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onDeleteCategory(cat.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1.5 bg-[#1c1c24] rounded-lg">
                      <Trash2 size={14} />
                    </button>
                 </div>
               </div>
               
               {/* Subcategories List */}
               <div className="ml-5 pl-3 border-l-2 border-gray-800 space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {cat.subcategories?.map(sub => (
                      <span key={sub} className="inline-flex items-center gap-1 bg-[#1c1c24] text-gray-400 text-xs px-2.5 py-1 rounded-lg border border-gray-700">
                        {sub}
                        <button onClick={() => handleDeleteSubcategory(cat, sub)} className="text-gray-500 hover:text-red-400"><X size={12}/></button>
                      </span>
                    ))}
                  </div>
                  
                  {/* Add Subcategory Input */}
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      placeholder="+ Subcategoría" 
                      className="text-xs p-2 border border-gray-700 rounded-lg flex-1 focus:ring-1 focus:ring-[#10b981] outline-none bg-[#1c1c24] text-white"
                      value={subCatInput.catId === cat.id ? subCatInput.value : ''}
                      onChange={(e) => setSubCatInput({ catId: cat.id, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubcategory(cat);
                        }
                      }}
                    />
                    <button 
                      onClick={() => handleAddSubcategory(cat)}
                      className="bg-[#1c1c24] hover:bg-gray-700 text-gray-400 rounded-lg p-2 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};