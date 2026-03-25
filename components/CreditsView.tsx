import React, { useState, useMemo } from 'react';
import { Transaction, Account, TransactionType, AccountType } from '../types';
import { ArrowLeft, Search, CheckCircle, Wallet, User, Calendar, Pencil, Trash2, X, Save } from 'lucide-react';

interface CreditsViewProps {
    transactions: Transaction[];
    accounts: Account[];
    onBack: () => void;
    onPayCredit: (transactionId: string, toAccountId: string) => void;
    onPayAllCredit: (clientName: string, toAccountId: string) => void;
    onUpdateTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (id: string) => void;
}

export const CreditsView: React.FC<CreditsViewProps> = ({ transactions, accounts, onBack, onPayCredit, onPayAllCredit, onUpdateTransaction, onDeleteTransaction }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [selectedClientForPayAll, setSelectedClientForPayAll] = useState<string | null>(null);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    // Edit Form State
    const [editClient, setEditClient] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDate, setEditDate] = useState('');

    const paymentAccount = accounts.find(a => a.type === AccountType.CASH)?.id || '';
    const [selectedPaymentAccount, setSelectedPaymentAccount] = useState(paymentAccount);

    const openEditModal = (tx: Transaction) => {
        setEditingTx(tx);
        setEditClient(tx.client || '');
        setEditAmount(tx.amount.toString());
        setEditDescription(tx.description);
        setEditDate(tx.date.split('T')[0]);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTx) return;

        const updatedTx: Transaction = {
            ...editingTx,
            client: editClient,
            amount: parseFloat(editAmount),
            description: editDescription,
            date: editDate
        };

        onUpdateTransaction(updatedTx);
        setEditingTx(null);
    };

    // Filter transactions that are INCOMES in CREDIT accounts
    const creditTransacitons = useMemo(() => {
        const creditAccountIds = accounts.filter(a => a.type === AccountType.CREDIT).map(a => a.id);
        return transactions.filter(t =>
            creditAccountIds.includes(t.accountId) &&
            t.type === TransactionType.INCOME
        ).filter(t =>
        (t.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [transactions, accounts, searchTerm]);

    // Group transactions by Client
    const groupedTransactions = useMemo(() => {
        const groups: { [key: string]: Transaction[] } = {};
        creditTransacitons.forEach(tx => {
            const clientName = tx.client?.trim() || 'Cliente Sin Nombre';
            if (!groups[clientName]) {
                groups[clientName] = [];
            }
            groups[clientName].push(tx);
        });
        return groups;
    }, [creditTransacitons]);

    const totalPending = creditTransacitons.reduce((acc, t) => acc + t.amount, 0);

    const handlePay = () => {
        if (selectedTx && selectedPaymentAccount) {
            onPayCredit(selectedTx.id, selectedPaymentAccount);
            setSelectedTx(null);
        }
    };

    const handlePayAll = () => {
        if (selectedClientForPayAll && selectedPaymentAccount) {
            onPayAllCredit(selectedClientForPayAll, selectedPaymentAccount);
            setSelectedClientForPayAll(null);
        }
    };

    const cashAccounts = accounts.filter(a => a.type !== AccountType.CREDIT);

    return (
        <div className="p-1 md:p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151E2B] p-6 rounded-3xl border border-[#1E293B] shadow-lg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Cuentas por Cobrar</h2>
                        <p className="text-gray-400 text-sm">Gestiona tus créditos pendientes</p>
                    </div>
                </div>

                <div className="bg-[#0B131F] border border-[#1E293B] rounded-2xl px-6 py-3 flex flex-col items-end">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Total Pendiente</span>
                    <span className="text-2xl font-black text-[#FF8A00]">${totalPending.toLocaleString()}</span>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder="Buscar por cliente o descripción..."
                    className="w-full bg-[#151E2B] border border-[#1E293B] rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none shadow-md"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(groupedTransactions).map(([clientName, txs]: [string, Transaction[]]) => {
                    const clientTotal = txs.reduce((sum, t) => sum + t.amount, 0);
                    return (
                        <div key={clientName} className="bg-[#151E2B] border border-[#1E293B] rounded-3xl p-5 hover:border-[#19A8C7]/50 transition-all shadow-lg group relative overflow-hidden flex flex-col h-full">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <Wallet size={80} />
                            </div>

                            {/* Client Header */}
                            <div className="flex justify-between items-center mb-4 relative z-10 border-b border-[#1E293B] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[#19A8C7]/10 flex items-center justify-center text-[#19A8C7]">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg capitalize">{clientName}</h3>
                                        <p className="text-xs text-gray-500 font-mono">{txs.length} movimiento{txs.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <div className="text-right">
                                        <span className="block text-xs text-gray-500 uppercase font-bold">Total</span>
                                        <span className="text-[#FF8A00] text-xl font-bold">
                                            ${clientTotal.toLocaleString()}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedClientForPayAll(clientName)}
                                        className="text-[10px] font-bold uppercase tracking-wider bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981] hover:text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <CheckCircle size={12} />
                                        Cobrar Todo
                                    </button>
                                </div>
                            </div>

                            {/* Transactions List */}
                            <div className="flex-1 space-y-3 mb-4 relative z-10 max-h-60 overflow-y-auto pr-1">
                                {txs.map(tx => (
                                    <div key={tx.id} className="bg-[#0B131F] rounded-xl p-3 border border-[#1E293B] hover:bg-white/5 transition-colors group/item">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-white font-medium text-sm">{tx.description}</p>
                                                <div className="flex gap-2 items-center mt-1">
                                                    <Calendar size={12} className="text-gray-500" />
                                                    <span className="text-xs text-gray-500 font-mono">{new Date(tx.date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</span>
                                                </div>
                                            </div>
                                            <span className="font-bold text-[#19A8C7] text-sm">${tx.amount.toLocaleString()}</span>
                                        </div>

                                        {/* Actions per item */}
                                        <div className="flex justify-end gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(tx)}
                                                className="p-1.5 text-gray-400 hover:text-[#19A8C7] hover:bg-white/10 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteTransaction(tx.id)}
                                                className="p-1.5 text-gray-400 hover:text-[#ef4444] hover:bg-white/10 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => setSelectedTx(tx)}
                                                className="p-1.5 text-gray-400 hover:text-[#10b981] hover:bg-white/10 rounded-lg transition-colors"
                                                title="Cobrar este movimiento"
                                            >
                                                <CheckCircle size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {creditTransacitons.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500 bg-[#151E2B] rounded-3xl border border-[#1E293B] border-dashed">
                        <Wallet className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>No hay cuentas por cobrar pendientes.</p>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#151E2B] rounded-3xl border border-[#1E293B] shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-2">Cobrar deuda</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Estás cobrando <strong className="text-white">${selectedTx.amount}</strong> a <strong className="text-white">{selectedTx.client || 'Cliente'}</strong>.
                            <br />¿Dónde ingresa el dinero?
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Cuenta de Destino</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {cashAccounts.map(acc => (
                                        <button
                                            key={acc.id}
                                            onClick={() => setSelectedPaymentAccount(acc.id)}
                                            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${selectedPaymentAccount === acc.id
                                                ? 'bg-[#19A8C7]/10 border-[#19A8C7] text-white shadow-[0_0_15px_rgba(25,168,199,0.2)]'
                                                : 'bg-[#0B131F] border-[#1E293B] text-gray-400 hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="font-bold">{acc.name}</span>
                                            {selectedPaymentAccount === acc.id && <CheckCircle size={20} className="text-[#19A8C7]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setSelectedTx(null)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handlePay}
                                    className="flex-1 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#10b981]/20 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={18} />
                                    Confirmar Cobro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pay All Modal */}
            {selectedClientForPayAll && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#151E2B] rounded-3xl border border-[#1E293B] shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-2">Cobrar deuda completa</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Estás cobrando <strong className="text-white">todo el saldo pendiente</strong> de <strong className="text-white">{selectedClientForPayAll}</strong>.
                            <br />¿Dónde ingresa el dinero?
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Cuenta de Destino</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {cashAccounts.map(acc => (
                                        <button
                                            key={acc.id}
                                            onClick={() => setSelectedPaymentAccount(acc.id)}
                                            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${selectedPaymentAccount === acc.id
                                                ? 'bg-[#19A8C7]/10 border-[#19A8C7] text-white shadow-[0_0_15px_rgba(25,168,199,0.2)]'
                                                : 'bg-[#0B131F] border-[#1E293B] text-gray-400 hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="font-bold">{acc.name}</span>
                                            {selectedPaymentAccount === acc.id && <CheckCircle size={20} className="text-[#19A8C7]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setSelectedClientForPayAll(null)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handlePayAll}
                                    className="flex-1 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#10b981]/20 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={18} />
                                    Confirmar Cobro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#151E2B] rounded-3xl border border-[#1E293B] shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6 border-b border-[#1E293B] pb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Pencil size={20} className="text-[#19A8C7]" /> Editar Crédito
                            </h3>
                            <button onClick={() => setEditingTx(null)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Cliente</label>
                                <input
                                    type="text"
                                    value={editClient}
                                    onChange={e => setEditClient(e.target.value)}
                                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-3 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                                    placeholder="Nombre del cliente"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Monto</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editAmount}
                                    onChange={e => setEditAmount(e.target.value)}
                                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-3 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Fecha</label>
                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={e => setEditDate(e.target.value)}
                                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-3 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nota / Descripción</label>
                                <input
                                    type="text"
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    className="w-full rounded-xl bg-[#0B131F] border border-[#1E293B] p-3 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingTx(null)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-[#19A8C7] hover:bg-[#107287] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#19A8C7]/20 flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
