import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowLeft, Search, Package, TrendingUp, TrendingDown } from 'lucide-react';

interface SalesVolumeViewProps {
    transactions: Transaction[];
    onBack: () => void;
}

export const SalesVolumeView: React.FC<SalesVolumeViewProps> = ({ transactions, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [period, setPeriod] = useState<'month' | 'fortnight' | 'year' | 'all'>('month');

    const volumeData = useMemo(() => {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;
        let startPrev: Date | null = null;
        let endPrev: Date | null = null;

        if (period === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else if (period === 'year') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            startPrev = new Date(now.getFullYear() - 1, 0, 1);
            endPrev = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        } else if (period === 'fortnight') {
            const day = now.getDate();
            if (day <= 15) {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999);
                startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 16);
                endPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            } else {
                start = new Date(now.getFullYear(), now.getMonth(), 16);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                startPrev = new Date(now.getFullYear(), now.getMonth(), 1);
                endPrev = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999);
            }
        }

        const currentMap: Record<string, { quantity: number; amount: number; lastSale: string }> = {};
        const prevMap: Record<string, number> = {};

        transactions.forEach(t => {
            if (t.type !== TransactionType.INCOME || !t.quantity) return;
            const d = new Date(t.date);
            const key = t.subcategory || t.category || 'Otros';

            // Current period
            if (start && end && d >= start && d <= end) {
                if (!currentMap[key]) currentMap[key] = { quantity: 0, amount: 0, lastSale: t.date };
                currentMap[key].quantity += t.quantity;
                currentMap[key].amount += t.amount;
                if (new Date(t.date) > new Date(currentMap[key].lastSale)) currentMap[key].lastSale = t.date;
            }
            // Previous period
            else if (startPrev && endPrev && d >= startPrev && d <= endPrev) {
                prevMap[key] = (prevMap[key] || 0) + t.quantity;
            }
            // 'All' period (no comparative)
            else if (period === 'all') {
                if (!currentMap[key]) currentMap[key] = { quantity: 0, amount: 0, lastSale: t.date };
                currentMap[key].quantity += t.quantity;
                currentMap[key].amount += t.amount;
                if (new Date(t.date) > new Date(currentMap[key].lastSale)) currentMap[key].lastSale = t.date;
            }
        });

        const list = Object.entries(currentMap)
            .map(([name, stats]) => ({
                name,
                ...stats,
                previous: prevMap[name] || 0
            }))
            .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => b.quantity - a.quantity);

        const totalUnits = list.reduce((acc, curr) => acc + curr.quantity, 0);
        const totalPrevUnits = Object.values(prevMap).reduce((acc, q) => acc + q, 0);

        return { list, totalUnits, totalPrevUnits };
    }, [transactions, searchTerm, period]);

    const { list, totalUnits, totalPrevUnits } = volumeData;

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
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">{totalUnits} unidades este período</span>
                            {period !== 'all' && (
                                <span className={`text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 ${totalUnits >= totalPrevUnits ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-red-500/20 text-red-400'}`}>
                                    {totalUnits >= totalPrevUnits ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {Math.abs(totalUnits - totalPrevUnits)} vs prev: {totalPrevUnits}
                                </span>
                            )}
                        </div>
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
                        <button onClick={() => setPeriod('fortnight')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period === 'fortnight' ? 'bg-[#FFC72C] text-black' : 'text-gray-500 hover:text-white'}`}>Quincena</button>
                        <button onClick={() => setPeriod('month')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period === 'month' ? 'bg-[#FFC72C] text-black' : 'text-gray-500 hover:text-white'}`}>Mes</button>
                        <button onClick={() => setPeriod('year')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period === 'year' ? 'bg-[#FFC72C] text-black' : 'text-gray-500 hover:text-white'}`}>Año</button>
                        <button onClick={() => setPeriod('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period === 'all' ? 'bg-[#FFC72C] text-black' : 'text-gray-500 hover:text-white'}`}>Todo</button>
                    </div>
                </div>
            </div>

            <div className="bg-[#151E2B] rounded-3xl border border-[#1E293B] shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[#1E293B] bg-white/5">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Producto / Servicio</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Unidades (Actual vs Prev)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Recaudado</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Última Venta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E293B]">
                            {list.map((item, idx) => {
                                const diff = item.quantity - item.previous;
                                return (
                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-[#FFC72C]/10 rounded-lg text-[#FFC72C] group-hover:scale-110 transition-transform">
                                                    <Package size={18} />
                                                </div>
                                                <span className="font-bold text-white">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-[#0B131F] px-4 py-1.5 rounded-full text-[#FFC72C] font-black text-lg border border-[#FFC72C]/20 shadow-lg">
                                                        {item.quantity}
                                                    </span>
                                                    {period !== 'all' && diff !== 0 && (
                                                        <div className={`flex items-center text-xs font-bold ${diff > 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
                                                            {diff > 0 ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                                                            {Math.abs(diff)}
                                                        </div>
                                                    )}
                                                </div>
                                                {period !== 'all' && (
                                                    <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">previo: {item.previous}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-white font-medium">${item.amount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                                            {new Date(item.lastSale).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                        </td>
                                    </tr>
                                );
                            })}
                            {list.length === 0 && (
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
        </div>
    );
};
