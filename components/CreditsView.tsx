import React, { useState, useMemo } from 'react';
import { Transaction, Account, TransactionType, AccountType } from '../types';
import { ArrowLeft, Search, CheckCircle, Wallet, User, Calendar } from 'lucide-react';

interface CreditsViewProps {
    transactions: Transaction[];
    accounts: Account[];
    onBack: () => void;
    onPayCredit: (transactionId: string, toAccountId: string) => void;
}

export const CreditsView: React.FC<CreditsViewProps> = ({ transactions, accounts, onBack, onPayCredit }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [paymentAccount, setPaymentAccount] = useState(accounts.find(a => a.type === AccountType.CASH)?.id || '');

    // Filter transactions that are INCOMES in CREDIT accounts (meaning they are pending collection)
    // We assume that if it's in a credit account, it's pending.
    // When paid, we will move it out or create a transfer?
    // Strategy: The credit account balance represents the total debt.
    // The transactions in it are the debts.
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

    const totalPending = creditTransacitons.reduce((acc, t) => acc + t.amount, 0);

    const handlePay = () => {
        if (selectedTx && paymentAccount) {
            onPayCredit(selectedTx.id, paymentAccount);
            setSelectedTx(null);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creditTransacitons.map(tx => (
                    <div key={tx.id} className="bg-[#151E2B] border border-[#1E293B] rounded-3xl p-5 hover:border-[#19A8C7]/50 transition-all shadow-lg group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Wallet size={64} />
                        </div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#19A8C7]/10 flex items-center justify-center text-[#19A8C7]">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{tx.client || 'Cliente Sin Nombre'}</h3>
                                    <p className="text-xs text-gray-500 font-mono">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <span className="bg-[#FF8A00]/10 text-[#FF8A00] px-3 py-1 rounded-lg text-sm font-bold border border-[#FF8A00]/20">
                                ${tx.amount.toLocaleString()}
                            </span>
                        </div>

                        <div className="mb-4 relative z-10">
                            <p className="text-gray-400 text-sm line-clamp-2">{tx.description}</p>
                            <div className="mt-2 flex gap-2">
                                <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-1 rounded border border-white/5">{tx.category}</span>
                                {tx.subcategory && <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-1 rounded border border-white/5">{tx.subcategory}</span>}
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedTx(tx)}
                            className="w-full py-3 bg-[#0B131F] hover:bg-[#10b981]/10 border border-[#1E293B] hover:border-[#10b981] text-gray-400 hover:text-[#10b981] rounded-xl font-bold transition-all flex items-center justify-center gap-2 relative z-10"
                        >
                            <CheckCircle size={18} />
                            Marcar como Cobrado
                        </button>
                    </div>
                ))}

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
                                            onClick={() => setPaymentAccount(acc.id)}
                                            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${paymentAccount === acc.id
                                                    ? 'bg-[#19A8C7]/10 border-[#19A8C7] text-white shadow-[0_0_15px_rgba(25,168,199,0.2)]'
                                                    : 'bg-[#0B131F] border-[#1E293B] text-gray-400 hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="font-bold">{acc.name}</span>
                                            {paymentAccount === acc.id && <CheckCircle size={20} className="text-[#19A8C7]" />}
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
        </div>
    );
};
