import React, { useState } from 'react';
import { Account, AccountType, Category, TransactionType } from '../types';
import { Trash2, PlusCircle, CreditCard, Tag, Plus, X, Pencil, Save, AlertTriangle } from 'lucide-react';

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

  const [subCatInput, setSubCatInput] = useState<{ catId: string, value: string }>({ catId: '', value: '' });

  // --- Edit States (Modals) ---
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [tempSubcategories, setTempSubcategories] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'account' | 'category', id: string, name: string } | null>(null);

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

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'account') {
      onDeleteAccount(deleteConfirm.id);
    } else {
      onDeleteCategory(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative animate-fade-in pb-12">

      {/* --- Account Edit Modal --- */}
      {editingAccount && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-[#151E2B] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-[#1E293B] animate-scale-in">
            <div className="flex justify-between items-center mb-6 border-b border-[#1E293B] pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Pencil size={20} className="text-[#19A8C7]" /> Editar Cuenta
              </h3>
              <button onClick={() => setEditingAccount(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={saveAccountEdit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-3 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
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
                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-3 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                  <select
                    value={editingAccount.type}
                    onChange={(e) => setEditingAccount({ ...editingAccount, type: e.target.value as AccountType })}
                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-3 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                  >
                    <option value={AccountType.CASH}>Efectivo</option>
                    <option value={AccountType.BANK}>Banco</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
                <button type="button" onClick={() => setEditingAccount(null)} className="px-5 py-2.5 text-gray-400 bg-white/5 rounded-xl hover:bg-white/10 font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-white bg-[#19A8C7] rounded-xl hover:bg-[#107287] font-bold flex items-center gap-2 shadow-lg shadow-[#19A8C7]/20 transition-all">
                  <Save size={18} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Category Edit Modal --- */}
      {editingCategory && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-[#151E2B] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-[#1E293B] max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-center mb-6 border-b border-[#1E293B] pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Tag size={20} className="text-[#10b981]" /> Editar Categoría
              </h3>
              <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={saveCategoryEdit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-3 text-white focus:ring-1 focus:ring-[#10b981] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                <select
                  value={editingCategory.type}
                  onChange={(e) => setEditingCategory({ ...editingCategory, type: e.target.value as TransactionType })}
                  className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-3 text-white focus:ring-1 focus:ring-[#10b981] outline-none"
                >
                  <option value={TransactionType.INCOME}>Ingreso</option>
                  <option value={TransactionType.EXPENSE}>Egreso</option>
                </select>
              </div>

              <div className="border-t border-[#1E293B] pt-4 mt-2">
                <label className="block text-sm font-medium text-gray-400 mb-3">Subcategorías</label>
                <div className="space-y-3">
                  {tempSubcategories.map((sub, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={sub}
                        onChange={(e) => handleTempSubcategoryChange(idx, e.target.value)}
                        className="flex-1 rounded-lg p-2 text-sm border border-[#1E293B] bg-[#0B131F] text-white focus:ring-1 focus:ring-[#10b981] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSubs = tempSubcategories.filter((_, i) => i !== idx);
                          setTempSubcategories(newSubs);
                        }}
                        className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      onClick={() => setTempSubcategories([...tempSubcategories, ''])}
                      className="text-xs text-[#10b981] hover:text-[#34d399] flex items-center gap-1 bg-[#10b981]/10 px-4 py-2 rounded-full font-bold transition-all"
                    >
                      <Plus size={14} /> Añadir Subcategoría
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#1E293B]">
                <button type="button" onClick={() => setEditingCategory(null)} className="px-5 py-2.5 text-gray-400 bg-white/5 rounded-xl hover:bg-white/10 font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-white bg-[#10b981] rounded-xl hover:bg-[#059669] font-bold flex items-center gap-2 shadow-lg shadow-[#10b981]/20 transition-all">
                  <Save size={18} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-scale-in">
            <div className="flex items-center gap-4 mb-4 text-red-500">
              <div className="bg-red-500/10 p-3 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <h4 className="text-xl font-bold text-white">¿Eliminar {deleteConfirm.type === 'account' ? 'Cuenta' : 'Categoría'}?</h4>
            </div>
            <p className="text-gray-400 mb-8">Estás a punto de eliminar <strong>{deleteConfirm.name}</strong>. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-[#0B131F] hover:bg-[#1E293B] text-white font-bold rounded-xl transition-colors border border-[#1E293B]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Section */}
      <div className="bg-[#151E2B] rounded-3xl shadow-xl border border-[#1E293B] p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#19A8C7]/10 rounded-2xl text-[#19A8C7]">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Cuentas</h3>
            <p className="text-xs text-gray-500 mt-1">Administra tus cajas y cuentas bancarias.</p>
          </div>
        </div>

        <form onSubmit={handleCreateAccount} className="bg-[#0B131F] p-6 rounded-2xl mb-8 border border-[#1E293B] border-dashed">
          <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">Registrar nueva cuenta</h4>
          <div className="grid grid-cols-1 gap-4">
            <input
              placeholder="Nombre (ej. Caja Chica)"
              value={newAccName}
              onChange={e => setNewAccName(e.target.value)}
              className="w-full bg-[#151E2B] border border-[#1E293B] rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-[#19A8C7] outline-none transition-all"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Saldo Inicial"
                value={newAccBal}
                onChange={e => setNewAccBal(e.target.value)}
                className="w-full bg-[#151E2B] border border-[#1E293B] rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-[#19A8C7] outline-none transition-all"
              />
              <select
                value={newAccType}
                onChange={e => setNewAccType(e.target.value as AccountType)}
                className="w-full bg-[#151E2B] border border-[#1E293B] rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-[#19A8C7] outline-none transition-all"
              >
                <option value={AccountType.CASH}>Efectivo</option>
                <option value={AccountType.BANK}>Banco</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-[#19A8C7] text-white py-3.5 rounded-xl font-bold hover:bg-[#107287] transition-all shadow-lg shadow-[#19A8C7]/10 flex items-center justify-center gap-2">
              <PlusCircle size={18} /> Añadir Cuenta
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="flex justify-between items-center p-4 bg-[#0B131F] border border-[#1E293B] rounded-2xl group hover:border-[#19A8C7]/50 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${acc.type === AccountType.CASH ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                <div>
                  <p className="font-bold text-white text-sm">{acc.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-medium tracking-tighter">Inicial: ${acc.initialBalance.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingAccount(acc)} className="p-2 text-gray-400 hover:text-[#19A8C7] hover:bg-[#19A8C7]/10 rounded-lg transition-all">
                  <Pencil size={16} />
                </button>
                <button onClick={() => setDeleteConfirm({ type: 'account', id: acc.id, name: acc.name })} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-[#151E2B] rounded-3xl shadow-xl border border-[#1E293B] p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#10b981]/10 rounded-2xl text-[#10b981]">
            <Tag size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Categorías</h3>
            <p className="text-xs text-gray-500 mt-1">Organiza tus ingresos y egresos sistemáticamente.</p>
          </div>
        </div>

        <form onSubmit={handleCreateCategory} className="bg-[#0B131F] p-6 rounded-2xl mb-8 border border-[#1E293B] border-dashed">
          <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">Añadir nueva categoría</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              placeholder="Nombre (ej. Insumos)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="w-full bg-[#151E2B] border border-[#1E293B] rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-[#10b981] outline-none transition-all"
            />
            <select
              value={newCatType}
              onChange={e => setNewCatType(e.target.value as TransactionType)}
              className="w-full bg-[#151E2B] border border-[#1E293B] rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-[#10b981] outline-none transition-all"
            >
              <option value={TransactionType.INCOME}>Ingreso</option>
              <option value={TransactionType.EXPENSE}>Egreso</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-[#10b981] text-white py-3.5 rounded-xl font-bold hover:bg-[#059669] transition-all shadow-lg shadow-[#10b981]/10 flex items-center justify-center gap-2">
            <PlusCircle size={18} /> Añadir Categoría
          </button>
        </form>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {categories.filter(c => c.type !== 'Neut' && c.type !== 'Neutro').map(cat => (
            <div key={cat.id} className="bg-[#0B131F] border border-[#1E293B] rounded-2xl p-4 group hover:border-[#10b981]/50 transition-all">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${cat.type === TransactionType.INCOME ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}></div>
                  <p className="font-bold text-white text-sm">{cat.name}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openCategoryEdit(cat)} className="p-2 text-gray-400 hover:text-[#10b981] hover:bg-[#10b981]/10 rounded-lg transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Subcategories List */}
              <div className="ml-5 pl-4 border-l-2 border-[#1E293B] space-y-3">
                <div className="flex flex-wrap gap-2">
                  {cat.subcategories?.map(sub => (
                    <span key={sub} className="inline-flex items-center gap-2 bg-[#151E2B] text-gray-400 text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg border border-[#1E293B] group/sub transition-all hover:border-gray-600">
                      {sub}
                      <button onClick={() => handleDeleteSubcategory(cat, sub)} className="text-gray-600 hover:text-red-400 transition-colors"><X size={12} /></button>
                    </span>
                  ))}
                  {(!cat.subcategories || cat.subcategories.length === 0) && (
                    <span className="text-[10px] text-gray-600 italic">Sin subcategorías</span>
                  )}
                </div>

                {/* Add Subcategory Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="+ Añadir subcategoría"
                    className="text-[10px] uppercase font-bold tracking-wider p-2.5 bg-[#151E2B] border border-[#1E293B] rounded-lg flex-1 outline-none focus:ring-1 focus:ring-[#10b981] text-white placeholder-gray-700 transition-all"
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
                    className="bg-[#151E2B] hover:bg-[#1E293B] text-gray-400 hover:text-[#10b981] border border-[#1E293B] rounded-lg px-2.5 transition-all"
                  >
                    <Plus size={16} />
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