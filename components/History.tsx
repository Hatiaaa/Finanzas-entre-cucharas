import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Account, Category, TransactionType } from '../types';
import { Search, Filter, Download, Calendar, ArrowUpCircle, ArrowDownCircle, RefreshCw, X, Pencil, Save, Trash2 } from 'lucide-react';

interface HistoryProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const History: React.FC<HistoryProps> = ({ transactions, accounts, categories, onUpdateTransaction, onDeleteTransaction }) => {
  // --- Estados de Filtros ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- Estado de Edición ---
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // --- Estados de Formulario de Edición (replicados del TransactionForm) ---
  const [editDate, setEditDate] = useState('');
  const [editType, setEditType] = useState<TransactionType>(TransactionType.INCOME);
  const [editAccountId, setEditAccountId] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editSubcategory, setEditSubcategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Cuando se abre el modal, llenar datos
  useEffect(() => {
    if (editingTx) {
      setEditDate(editingTx.date.split('T')[0]);
      setEditType(editingTx.type);
      setEditAccountId(editingTx.accountId);
      // Buscar ID de categoría basado en el nombre
      const cat = categories.find(c => c.name === editingTx.category);
      setEditCategoryId(cat ? cat.id : '');
      setEditSubcategory(editingTx.subcategory || '');
      setEditAmount(editingTx.amount.toString());
      setEditDescription(editingTx.description);
    }
  }, [editingTx, categories]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const selectedCat = categories.find(c => c.id === editCategoryId);

    const updatedTransaction: Transaction = {
      ...editingTx,
      date: editDate,
      type: editType,
      accountId: editAccountId,
      category: selectedCat?.name || 'General',
      subcategory: editSubcategory || undefined,
      amount: parseFloat(editAmount),
      description: editDescription
    };

    onUpdateTransaction(updatedTransaction);
    setEditingTx(null);
  };

  // --- Lógica de Filtrado ---
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      // Filtro de Texto (Descripción o Cuenta)
      const accountName = accounts.find(a => a.id === t.accountId)?.name.toLowerCase() || '';
      const matchesText =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accountName.includes(searchTerm.toLowerCase());

      // Filtro de Tipo
      const matchesType = filterType === 'all' || t.type === filterType;

      // Filtro de Categoría
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

      // Filtro de Fechas
      let matchesDate = true;
      if (start) matchesDate = matchesDate && tDate >= start;
      if (end) matchesDate = matchesDate && tDate <= end;

      return matchesText && matchesType && matchesCategory && matchesDate;
    });
  }, [transactions, searchTerm, filterType, filterCategory, startDate, endDate, accounts]);

  // --- Exportar a CSV ---
  const downloadCSV = () => {
    const headers = ["Fecha", "Tipo", "Categoría", "Subcategoría", "Descripción", "Cuenta", "Monto"];
    const rows = filteredData.map(t => [
      t.date,
      t.type,
      t.category,
      t.subcategory || '',
      `"${t.description.replace(/"/g, '""')}"`, // Escapar comillas
      accounts.find(a => a.id === t.accountId)?.name || 'Desconocida',
      t.amount
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `movimientos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
    setStartDate('');
    setEndDate('');
  };

  // Icono dinámico según tipo
  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME: return <ArrowUpCircle className="text-[#10b981]" size={18} />;
      case TransactionType.EXPENSE: return <ArrowDownCircle className="text-[#ef4444]" size={18} />;
      case TransactionType.TRANSFER: return <RefreshCw className="text-[#FF8A00]" size={18} />;
    }
  };

  const filteredCategoriesForEdit = categories.filter(c => c.type === editType);
  const selectedCategoryObj = categories.find(c => c.id === editCategoryId);
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  return (
    <div className="space-y-6 animate-fade-in relative">

      {/* --- Edit Transaction Modal --- */}
      {editingTx && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-[#151E2B] rounded-2xl shadow-xl w-full max-w-2xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto border border-[#1E293B]">
            <div className="flex justify-between items-center mb-6 border-b border-[#1E293B] pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Pencil size={20} className="text-[#19A8C7]" /> Editar Movimiento
              </h3>
              <button onClick={() => setEditingTx(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-2 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-2 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                  <select
                    value={editType}
                    onChange={(e) => {
                      setEditType(e.target.value as TransactionType);
                      setEditCategoryId('');
                      setEditSubcategory('');
                    }}
                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-2 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                  >
                    <option value={TransactionType.INCOME}>Ingreso</option>
                    <option value={TransactionType.EXPENSE}>Egreso</option>
                    <option value={TransactionType.TRANSFER}>Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cuenta</label>
                  <select
                    value={editAccountId}
                    onChange={(e) => setEditAccountId(e.target.value)}
                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-2 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                  >
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>

                {editType !== TransactionType.TRANSFER && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Categoría</label>
                      <select
                        value={editCategoryId}
                        onChange={(e) => {
                          setEditCategoryId(e.target.value);
                          setEditSubcategory('');
                        }}
                        className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-2 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                      >
                        <option value="">Selecciona Categoría</option>
                        {filteredCategoriesForEdit.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Subcategoría</label>
                      <select
                        value={editSubcategory}
                        onChange={(e) => setEditSubcategory(e.target.value)}
                        disabled={availableSubcategories.length === 0}
                        className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-2 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none disabled:opacity-50"
                      >
                        <option value="">{availableSubcategories.length > 0 ? 'Selecciona Subcategoría' : 'Sin subcategorías'}</option>
                        {availableSubcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-2 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
                <button type="button" onClick={() => setEditingTx(null)} className="px-5 py-2 text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 font-medium">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-white bg-[#19A8C7] rounded-lg hover:bg-[#107287] font-bold flex items-center gap-2 shadow-lg shadow-[#19A8C7]/20">
                  <Save size={18} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* --- Panel de Control / Filtros --- */}
      <div className="bg-[#151E2B] p-5 rounded-3xl shadow-lg border border-[#1E293B]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Filter size={20} className="text-[#19A8C7]" />
            Filtros de Búsqueda
          </h3>
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-red-400 underline px-2"
            >
              Limpiar
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 bg-[#19A8C7] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#107287] transition-all shadow-lg shadow-[#19A8C7]/20"
            >
              <Download size={16} /> Exportar CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Buscador */}
          <div className="lg:col-span-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0B131F] border border-[#1E293B] rounded-xl text-sm text-white focus:ring-1 focus:ring-[#19A8C7] focus:border-[#19A8C7] outline-none"
            />
          </div>

          {/* Fechas */}
          <div className="flex items-center gap-2 lg:col-span-2">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Calendar size={14} /></span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-8 pr-2 py-2 bg-[#0B131F] border border-[#1E293B] rounded-xl text-sm text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
              />
            </div>
            <span className="text-gray-500">-</span>
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Calendar size={14} /></span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-8 pr-2 py-2 bg-[#0B131F] border border-[#1E293B] rounded-xl text-sm text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
              />
            </div>
          </div>

          {/* Selectores */}
          <div className="lg:col-span-1">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#0B131F] border border-[#1E293B] rounded-xl text-sm text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
            >
              <option value="all">Todos los Tipos</option>
              <option value={TransactionType.INCOME}>Ingresos</option>
              <option value={TransactionType.EXPENSE}>Egresos</option>
              <option value={TransactionType.TRANSFER}>Transferencias</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B131F] border border-[#1E293B] rounded-xl text-sm text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- Tabla de Resultados --- */}
      <div className="bg-[#151E2B] rounded-3xl shadow-lg border border-[#1E293B] overflow-hidden">
        <div className="p-6 border-b border-[#1E293B] flex justify-between items-center">
          <span className="font-bold text-white text-lg">Resultados</span>
          <span className="text-xs text-gray-400 bg-[#0B131F] px-3 py-1 rounded-full border border-[#1E293B]">
            {filteredData.length} movimientos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B131F] text-gray-500 text-xs uppercase tracking-wider border-b border-[#1E293B]">
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Descripción</th>
                <th className="px-6 py-4 font-semibold">Categoría</th>
                <th className="px-6 py-4 font-semibold">Cuenta</th>
                <th className="px-6 py-4 font-semibold text-right">Monto</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {filteredData.length > 0 ? (
                filteredData.map((t) => {
                  const account = accounts.find(a => a.id === t.accountId);
                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2" title={t.type}>
                          {getTypeIcon(t.type)}
                          <span className="hidden md:inline text-gray-300">{t.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-medium max-w-xs truncate" title={t.description}>
                        {t.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        <div className="flex flex-col items-start">
                          <span className="px-2 py-1 bg-[#0B131F] border border-[#1E293B] rounded-md text-xs">
                            {t.category}
                          </span>
                          {t.subcategory && (
                            <span className="text-[10px] text-gray-500 ml-1 mt-0.5">↳ {t.subcategory}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {account?.name || 'Desconocida'}
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-[#10b981]' :
                        t.type === TransactionType.EXPENSE ? 'text-[#ef4444]' : 'text-[#FF8A00]'
                        }`}>
                        {t.type === TransactionType.EXPENSE ? '-' : ''}${t.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingTx(t)}
                            className="text-gray-500 hover:text-[#19A8C7] transition-colors p-2 rounded-full hover:bg-white/5"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(t.id)}
                            className="text-gray-500 hover:text-[#ef4444] transition-colors p-2 rounded-full hover:bg-white/5"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search size={32} className="mb-2 opacity-50" />
                      <p>No se encontraron movimientos con estos filtros.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};