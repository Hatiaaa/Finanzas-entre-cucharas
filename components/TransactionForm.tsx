import React, { useState, useEffect } from 'react';
import { Account, Category, TransactionType, AccountType } from '../types';
import { Upload, Save, RefreshCw, CheckCircle } from 'lucide-react';

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  onAddTransaction: (data: any) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ accounts, categories, onAddTransaction }) => {
  const [mode, setMode] = useState<'standard' | 'transfer'>('standard');

  // Form States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState(''); // Stores the name of the subcategory
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [client, setClient] = useState(''); // New state for customer name
  const [file, setFile] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset category selection when type changes
  useEffect(() => {
    setCategoryId('');
    setSubcategoryId('');
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'standard') {
      const selectedCat = categories.find(c => c.id === categoryId);
      onAddTransaction({
        date,
        type,
        accountId,
        category: selectedCat?.name || 'General',
        subcategory: subcategoryId || undefined,
        amount: parseFloat(amount),
        description,
        hasAttachment: !!file,
        quantity: quantity ? parseInt(quantity) : undefined,
        client: client || undefined
      });
    } else {
      if (accountId === toAccountId) {
        alert("La cuenta de origen y destino no pueden ser la misma.");
        return;
      }
      onAddTransaction({
        date,
        type: TransactionType.TRANSFER,
        accountId,
        toAccountId,
        category: 'Transferencia',
        amount: parseFloat(amount),
        description,
        hasAttachment: !!file
      });
    }

    // Reset basic fields
    setAmount('');
    setDescription('');
    setQuantity('');
    setClient('');
    setFile(null);
    setSubcategoryId('');

    // Show success feedback
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const filteredCategories = categories.filter(c => c.type === type);
  const selectedCategoryObj = categories.find(c => c.id === categoryId);
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  return (
    <div className="max-w-4xl mx-auto bg-[#151E2B] rounded-3xl shadow-xl border border-[#1E293B] overflow-hidden animate-fade-in shadow-[#19A8C7]/5">
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setMode('standard')}
          className={`flex-1 py-4 text-center font-bold transition-all ${mode === 'standard' ? 'bg-[#19A8C7]/10 text-[#19A8C7] border-b-2 border-[#19A8C7]' : 'text-gray-500 hover:bg-white/5'
            }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Save size={18} />
            Ingreso / Egreso
          </span>
        </button>
        <button
          onClick={() => setMode('transfer')}
          className={`flex-1 py-4 text-center font-bold transition-all ${mode === 'transfer' ? 'bg-[#FF8A00]/10 text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-500 hover:bg-white/5'
            }`}
        >
          <span className="flex items-center justify-center gap-2">
            <RefreshCw size={18} />
            Transferencia
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Fecha</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] text-white p-3 focus:ring-1 focus:ring-[#19A8C7] focus:border-[#19A8C7] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Monto</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] text-white pl-8 p-3 focus:ring-1 focus:ring-[#19A8C7] focus:border-[#19A8C7] outline-none placeholder-gray-600 transition-all font-bold"
                placeholder="0.00"
              />
            </div>
          </div>

          {mode === 'standard' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className="w-full rounded-xl bg-[#13131a] border border-gray-700 text-white p-3 focus:ring-1 focus:ring-[#6c5dd3] focus:border-[#6c5dd3] outline-none"
                >
                  <option value={TransactionType.INCOME}>Ingreso</option>
                  <option value={TransactionType.EXPENSE}>Egreso</option>
                </select>
              </div>

              {type === TransactionType.INCOME && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cantidad / Unidades (Opcional)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ej: 300 (Almuerzos)"
                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] text-white p-3 focus:ring-1 focus:ring-[#19A8C7] focus:border-[#19A8C7] outline-none placeholder-gray-600 font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cuenta</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-xl bg-[#13131a] border border-gray-700 text-white p-3 focus:ring-1 focus:ring-[#6c5dd3] focus:border-[#6c5dd3] outline-none"
                >
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>

              {/* Campos condicionales para créditos */}
              {accounts.find(a => a.id === accountId)?.type === AccountType.CREDIT && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cliente / Deudor (Opcional)</label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Ej: Juan Mecánico"
                    className="w-full rounded-xl bg-[#0B131F] border border-[#ff8a00] text-white p-3 focus:ring-1 focus:ring-[#ff8a00] outline-none placeholder-gray-600 font-medium"
                  />
                </div>
              )}

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Categoría</label>
                  <select
                    value={categoryId}
                    required
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] text-white p-3 focus:ring-1 focus:ring-[#19A8C7] focus:border-[#19A8C7] outline-none transition-all"
                  >
                    <option value="">Selecciona una categoría</option>
                    {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                {availableSubcategories.length > 0 && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Subcategoría</label>
                    <select
                      value={subcategoryId}
                      onChange={(e) => setSubcategoryId(e.target.value)}
                      className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] text-white p-3 focus:ring-1 focus:ring-[#19A8C7] focus:border-[#19A8C7] outline-none transition-all"
                    >
                      <option value="">Selecciona subcategoría...</option>
                      {availableSubcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Desde Cuenta</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] text-white p-3 focus:ring-1 focus:ring-[#FF8A00] focus:border-[#FF8A00] outline-none transition-all"
                >
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Hacia Cuenta</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] text-white p-3 focus:ring-1 focus:ring-[#FF8A00] focus:border-[#FF8A00] outline-none transition-all"
                >
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">Descripción / Notas</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] text-white p-3 focus:ring-1 focus:ring-[#19A8C7] focus:border-[#19A8C7] outline-none placeholder-gray-600 transition-all font-medium"
              placeholder="Detalles del movimiento..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">Comprobante (Opcional)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#1E293B] border-dashed rounded-xl cursor-pointer bg-[#0B131F] hover:bg-[#151E2B] transition-colors group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-[#A0B0C0] group-hover:text-[#19A8C7] transition-colors" />
                  <p className="mb-2 text-sm text-[#A0B0C0]"><span className="font-semibold text-white">Click para subir</span></p>
                  <p className="text-xs text-[#6f6f7b]">PNG, JPG o PDF</p>
                </div>
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
              </label>
            </div>
            {file && <p className="text-sm text-[#19A8C7] mt-2 text-center font-medium">Archivo seleccionado: {file.name}</p>}
          </div>

        </div>

        <div className="flex justify-end items-center gap-4">
          {showSuccess && (
            <div className="flex items-center gap-2 text-[#10b981] font-bold animate-bounce">
              <CheckCircle size={20} />
              ¡Registro Guardado!
            </div>
          )}
          <button
            type="submit"
            className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all ${mode === 'standard' ? 'bg-[#19A8C7] hover:bg-[#107287]' : 'bg-[#FF8A00] hover:bg-[#E67C00]'
              }`}
          >
            {mode === 'standard' ? 'Registrar Movimiento' : 'Realizar Transferencia'}
          </button>
        </div>
      </form>
    </div>
  );
};