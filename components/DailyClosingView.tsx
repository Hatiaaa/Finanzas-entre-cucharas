import React, { useState, useMemo } from 'react';
import { FinanceService } from '../services/FinanceService';
import { Account, Transaction, DailyClosing } from '../types';
import { Wallet, Calculator, History, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

interface DailyClosingViewProps {
    accounts: Account[];
    balances: { accountId: string; balance: number }[];
    closings: DailyClosing[];
    onAddClosing: (closing: Omit<DailyClosing, 'id'>) => void;
    onDeleteClosing: (id: string) => void;
}

export function DailyClosingView({ accounts, balances, closings, onAddClosing, onDeleteClosing }: DailyClosingViewProps) {
    const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
    const [physicalAmount, setPhysicalAmount] = useState<string>('');
    const [notes, setNotes] = useState('');

    const systemBalance = useMemo(() => {
        return balances.find(b => b.accountId === selectedAccountId)?.balance || 0;
    }, [balances, selectedAccountId]);

    const difference = useMemo(() => {
        const physical = parseFloat(physicalAmount) || 0;
        return physical - systemBalance;
    }, [physicalAmount, systemBalance]);

    const handleSave = () => {
        if (!physicalAmount || isNaN(parseFloat(physicalAmount))) return;

        onAddClosing({
            date: new Date().toISOString(),
            accountId: selectedAccountId,
            systemBalance,
            physicalAmount: parseFloat(physicalAmount),
            difference,
            notes
        });

        setPhysicalAmount('');
        setNotes('');
    };

    const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Cuenta Desconocida';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Cuadre de Caja Diario</h2>
                    <p className="text-gray-400 mt-1">Verifica y registra el efectivo físico contra el sistema</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario de Cuadre */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-[#19A8C7]/10 rounded-xl text-[#19A8C7]">
                                <Calculator size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Nuevo Cuadre</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Seleccionar Caja</label>
                                <select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    className="w-full bg-[#0B131F] text-white px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#19A8C7] focus:ring-1 focus:ring-[#19A8C7] outline-none transition-all appearance-none"
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#1E293B] border-dashed">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-500 font-medium">Saldo en Sistema</span>
                                    <Wallet size={14} className="text-gray-600" />
                                </div>
                                <span className="text-2xl font-bold text-white">${systemBalance.toLocaleString()}</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Efectivo Físico</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={physicalAmount}
                                    onChange={(e) => setPhysicalAmount(e.target.value)}
                                    className="w-full bg-[#0B131F] text-white px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#19A8C7] focus:ring-1 focus:ring-[#19A8C7] outline-none transition-all placeholder-gray-700"
                                />
                            </div>

                            <div className={`rounded-2xl p-4 border transition-colors ${difference === 0 ? 'bg-gray-800/10 border-gray-800' :
                                    difference > 0 ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' :
                                        'bg-red-500/10 border-red-500/30 text-red-500'
                                }`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium uppercase tracking-wider">Diferencia</span>
                                    {difference === 0 ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                </div>
                                <span className="text-2xl font-black">${difference.toLocaleString()}</span>
                                <p className="text-[10px] mt-1 font-bold uppercase opacity-70">
                                    {difference === 0 ? 'Caja Cuadrada' : difference > 0 ? 'Sobrante' : 'Faltante'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Notas / Observaciones</label>
                                <textarea
                                    placeholder="Ej: Ajuste por propinas, error en cambio..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full bg-[#0B131F] text-white px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#19A8C7] focus:ring-1 focus:ring-[#19A8C7] outline-none transition-all placeholder-gray-700 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!physicalAmount}
                                className="w-full py-4 bg-[#19A8C7] hover:bg-[#158fa9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-all shadow-lg shadow-[#19A8C7]/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-[0px]"
                            >
                                <CheckCircle2 size={20} />
                                CONFIRMAR CIERRE
                            </button>
                        </div>
                    </div>
                </div>

                {/* Historial de Cierres */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl p-6 shadow-xl h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-[#FF8A00]/10 rounded-xl text-[#FF8A00]">
                                <History size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Últimos Cierres</h3>
                        </div>

                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#1E293B]">
                                        <th className="pb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">Fecha</th>
                                        <th className="pb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Caja</th>
                                        <th className="pb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sistema</th>
                                        <th className="pb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Físico</th>
                                        <th className="pb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dif.</th>
                                        <th className="pb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right pr-2">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E293B]/50">
                                    {closings.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-gray-500 italic">No hay cierres registrados aún</td>
                                        </tr>
                                    ) : (
                                        closings.map((closing) => (
                                            <tr key={closing.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 pl-2">
                                                    <div className="text-sm font-medium text-white">
                                                        {new Date(closing.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">
                                                        {new Date(closing.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="text-xs text-gray-300 font-medium bg-[#0B131F] px-2 py-1 rounded-lg border border-[#1E293B]">
                                                        {getAccountName(closing.accountId)}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-sm text-gray-400 font-mono">${closing.systemBalance.toLocaleString()}</td>
                                                <td className="py-4 text-sm text-white font-bold font-mono">${closing.physicalAmount.toLocaleString()}</td>
                                                <td className="py-4">
                                                    <span className={`text-xs font-black font-mono ${closing.difference === 0 ? 'text-gray-500' :
                                                            closing.difference > 0 ? 'text-[#10b981]' : 'text-red-500'
                                                        }`}>
                                                        {closing.difference > 0 ? '+' : ''}{closing.difference.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right pr-2">
                                                    <button
                                                        onClick={() => onDeleteClosing(closing.id)}
                                                        className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
