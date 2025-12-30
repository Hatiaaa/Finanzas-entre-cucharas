import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowLeft, Search, Calendar, ChevronDown, Package } from 'lucide-react';

interface SalesVolumeViewProps {
    transactions: Transaction[];
    onBack: () => void;
}

export const SalesVolumeView: React.FC<SalesVolumeViewProps> = ({ transactions, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [period, setPeriod] = useState<'all' | 'month' | 'week'>('month');

    const filteredData = useMemo(() => {
        const now = new Date();
        const data: Record<string, { quantity: number; amount: number; lastSale: string }> = {};

        transactions.forEach(t => {
            if (t.type !== TransactionType.INCOME || !t.quantity) return;

            const d = new Date(t.date);
            if (period === 'month' && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return;
            if (period === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (d < weekAgo) return;
            }

            const key = t.subcategory || t.category;
            if (!data[key]) {
                data[key] = { quantity: 0, amount: 0, lastSale: t.date };
            }
            data[key].quantity += t.quantity;
            data[key].amount += t.amount;
            if (new Date(t.date) > new Date(data[key].lastSale)) {
                data[key].lastSale = t.date;
            }
        });

        return Object.entries(data)
            .map(([name, stats]) => ({ name, ...stats }))
            .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => b.quantity - a.quantity);
    }, [transactions, searchTerm, period]);

    const totalUnits = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.quantity, 0), [filteredData]);

    return (
        <div className="p-1 md:p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151E2B] p-6 rounded-3xl border border-[#1E293B] shadow-lg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Desglose de Ventas</h2>
                        <p className="text-gray-400 text-sm">{totalUnits} unidades totales detectadas</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            className="bg-[#0B131F] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#19A8C7] outline-none w-full md:w-64"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex bg-[#0B131F] rounded-xl p-1 border border-[#1E293B]">
                        <button onClick={() => setPeriod('month')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period === 'month' ? 'bg-[#FFC72C] text-black' : 'text-gray-500 hover:text-white'}`}>Mes</button>
                        <button onClick={() => setPeriod('week')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period === 'week' ? 'bg-[#FFC72C] text-black' : 'text-gray-500 hover:text-white'}`}>Semana</button>
                        <button onClick={() => setPeriod('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period === 'all' ? 'bg-[#FFC72C] text-black' : 'text-gray-500 hover:text-white'}`}>Todo</button>
                    </div>
                </div>
            </div>

            <div className="bg-[#151E2B] rounded-3xl border border-[#1E293B] shadow-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[#1E293B] bg-white/5">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Producto / Servicio</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Unidades</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Recaudado</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Última Venta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]">
                        {filteredData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#FFC72C]/10 rounded-lg text-[#FFC72C] group-hover:scale-110 transition-transform">
                                            <Package size={18} />
                                        </div>
                                        <span className="font-bold text-white">{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-[#0B131F] px-4 py-1.5 rounded-full text-[#FFC72C] font-black text-lg border border-[#FFC72C]/20 shadow-lg shadow-[#FFC72C]/5">
                                        {item.quantity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-white font-medium">${item.amount.toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-500">
                                    {new Date(item.lastSale).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    No se encontraron registros para los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
