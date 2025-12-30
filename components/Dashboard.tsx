import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import { Transaction, Account, TransactionType, AccountType } from '../types';
import {
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Wallet,
  CreditCard, TrendingUp, TrendingDown, DollarSign, Calendar
} from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  balances: { accountId: string; balance: number }[];
  onNavigate?: (view: any) => void;
}

// Custom Colors matching the Dark UI reference
const COLORS = {
  purple: '#19A8C7', // Cian Primario
  purpleLight: '#2ac3ff',
  orange: '#FF8A00', // Naranja Secundario
  green: '#A0D7E7',
  neonGreen: '#10b981',
  blue: '#3b82f6',
  pink: '#FFC72C', // Amarillo Cuchara
  bgCard: '#151E2B',
  bgDark: '#0B131F',
  textGray: '#9ca3af'
};

const PIE_COLORS = [COLORS.purple, COLORS.orange, COLORS.pink, COLORS.green, COLORS.blue];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, accounts, balances, onNavigate }) => {
  const [comparisonPeriod, setComparisonPeriod] = useState<'month' | 'fortnight' | 'year'>('month');
  const [volumePeriod, setVolumePeriod] = useState<'month' | 'fortnight' | 'year' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // --- Lógica de Volumen (Unidades Vendidas) ---
  const volumeData = useMemo(() => {
    let quantity = 0;
    let previousQuantity = 0;
    const now = new Date();
    let start, end, startPrev, endPrev;

    const getQuantity = (s: Date, e: Date) => {
      return transactions.reduce((acc, t) => {
        const d = new Date(t.date);
        if (t.type === TransactionType.INCOME && d >= s && d <= e) {
          return acc + (t.quantity || 0);
        }
        return acc;
      }, 0);
    };

    if (volumePeriod === 'custom' && customStart && customEnd) {
      start = new Date(customStart);
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    } else if (volumePeriod === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endPrev = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (volumePeriod === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);

      startPrev = new Date(now.getFullYear() - 1, 0, 1);
      endPrev = new Date(now.getFullYear() - 1, 11, 31);
    } else if (volumePeriod === 'fortnight') {
      const day = now.getDate();
      if (day <= 15) {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth(), 15);

        startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 16);
        endPrev = new Date(now.getFullYear(), now.getMonth(), 0);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 16);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        startPrev = new Date(now.getFullYear(), now.getMonth(), 1);
        endPrev = new Date(now.getFullYear(), now.getMonth(), 15);
      }
    }

    const getBreakdown = (s: Date, e: Date) => {
      const breakdown: Record<string, number> = {};
      transactions.forEach(t => {
        const d = new Date(t.date);
        if (t.type === TransactionType.INCOME && d >= s && d <= e && t.quantity) {
          const key = t.subcategory || t.category || 'Otros';
          breakdown[key] = (breakdown[key] || 0) + (t.quantity || 0);
        }
      });
      return breakdown;
    };

    let breakdown: Record<string, { current: number; previous: number }> = {};

    if (start && end) {
      quantity = getQuantity(start, end);
      const currentMap = getBreakdown(start, end);

      let prevMap: Record<string, number> = {};
      if (startPrev && endPrev) {
        previousQuantity = getQuantity(startPrev, endPrev);
        prevMap = getBreakdown(startPrev, endPrev);
      }

      // Merge maps
      const allKeys = new Set([...Object.keys(currentMap), ...Object.keys(prevMap)]);
      allKeys.forEach(key => {
        breakdown[key] = {
          current: currentMap[key] || 0,
          previous: prevMap[key] || 0
        };
      });
    }

    const diff = quantity - previousQuantity;
    const percentage = previousQuantity > 0 ? (diff / previousQuantity) * 100 : 0;
    const prevLabel = volumePeriod === 'month' ? 'vs Mes Anterior' : volumePeriod === 'fortnight' ? 'vs Quincena Anterior' : volumePeriod === 'year' ? 'vs Año Anterior' : '';

    return {
      quantity,
      previousQuantity,
      percentage,
      breakdown,
      periodLabel: volumePeriod === 'custom' ? 'Personalizado' : volumePeriod === 'month' ? 'Este Mes' : volumePeriod === 'year' ? 'Este Año' : 'Esta Quincena',
      prevLabel
    };
  }, [transactions, volumePeriod, customStart, customEnd]);

  // --- KPIs Dinámicos ---
  const kpis = useMemo(() => {
    let income = 0;
    let expense = 0;
    const now = new Date();

    // Filtrar transacciones del mes actual para los KPIs generales
    const currentTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    currentTx.forEach(t => {
      if (t.type === TransactionType.INCOME) income += t.amount;
      if (t.type === TransactionType.EXPENSE) expense += t.amount;
    });

    const totalBalance = balances.reduce((acc, curr) => acc + curr.balance, 0);

    return { income, expense, totalBalance };
  }, [transactions, balances]);

  // --- Lógica de Comparativa ---
  const comparisonData = useMemo(() => {
    const now = new Date();
    let currentAmount = 0;
    let previousAmount = 0;
    let previousLabel = '';

    const getIncomeForPeriod = (start: Date, end: Date) => {
      return transactions
        .filter(t => {
          const d = new Date(t.date);
          return t.type === TransactionType.INCOME && d >= start && d <= end;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    };

    if (comparisonPeriod === 'month') {
      // Este Mes vs Mes Anterior
      const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
      const endCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endPrev = new Date(now.getFullYear(), now.getMonth(), 0);

      currentAmount = getIncomeForPeriod(startCurrent, endCurrent);
      previousAmount = getIncomeForPeriod(startPrev, endPrev);
      previousLabel = 'vs Mes Anterior';

    } else if (comparisonPeriod === 'year') {
      // Este Año vs Año Anterior
      const startCurrent = new Date(now.getFullYear(), 0, 1);
      const endCurrent = new Date(now.getFullYear(), 11, 31);

      const startPrev = new Date(now.getFullYear() - 1, 0, 1);
      const endPrev = new Date(now.getFullYear() - 1, 11, 31);

      currentAmount = getIncomeForPeriod(startCurrent, endCurrent);
      previousAmount = getIncomeForPeriod(startPrev, endPrev);
      previousLabel = 'vs Año Anterior';

    } else if (comparisonPeriod === 'fortnight') {
      // Esta Quincena vs Quincena Anterior
      const day = now.getDate();
      let startCurrent, endCurrent, startPrev, endPrev;

      if (day <= 15) {
        // Primera quincena actual vs Segunda quincena mes anterior
        startCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
        endCurrent = new Date(now.getFullYear(), now.getMonth(), 15);

        startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 16);
        endPrev = new Date(now.getFullYear(), now.getMonth(), 0);
      } else {
        // Segunda quincena actual vs Primera quincena actual
        startCurrent = new Date(now.getFullYear(), now.getMonth(), 16);
        endCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        startPrev = new Date(now.getFullYear(), now.getMonth(), 1);
        endPrev = new Date(now.getFullYear(), now.getMonth(), 15);
      }
      currentAmount = getIncomeForPeriod(startCurrent, endCurrent);
      previousAmount = getIncomeForPeriod(startPrev, endPrev);
      previousLabel = 'vs Quincena Anterior';
    }

    const diff = currentAmount - previousAmount;
    const percentage = previousAmount > 0 ? (diff / previousAmount) * 100 : 0;

    return { currentAmount, previousAmount, percentage, previousLabel };
  }, [transactions, comparisonPeriod]);


  // --- Datos Gráfico Evolución (Análisis Mensual) ---
  const evolutionData = useMemo(() => {
    const data: Record<string, { name: string; Ingresos: number; Egresos: number }> = {};
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      data[key] = { name: months[d.getMonth()], Ingresos: 0, Egresos: 0 };
    }

    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (data[key]) {
        if (t.type === TransactionType.INCOME) data[key].Ingresos += t.amount;
        if (t.type === TransactionType.EXPENSE) data[key].Egresos += t.amount;
      }
    });

    return Object.values(data);
  }, [transactions]);

  // --- Datos Gráfico Categorías (Donut) ---
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    let totalExp = 0;
    transactions.forEach(t => {
      if (t.type === TransactionType.EXPENSE) {
        data[t.category] = (data[t.category] || 0) + t.amount;
        totalExp += t.amount;
      }
    });

    // Convertir a array y ordenar
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [transactions]);

  // --- Movimientos Recientes ---
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="grid grid-cols-12 gap-6 pb-8 animate-fade-in">

      {/* --- Fila 1: KPIs Principales --- */}

      {/* Tarjeta Balance Total */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-[#151E2B] p-6 rounded-3xl shadow-lg relative overflow-hidden group">
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">Balance Total</p>
            <h3 className="text-3xl font-bold text-white mb-2">${kpis.totalBalance.toLocaleString()}</h3>
            <div className="flex items-center gap-1 text-[#10b981] text-xs font-bold bg-[#10b981]/10 px-2 py-1 rounded-full w-fit">
              <ArrowUpRight size={14} />
              <span>Activos</span>
            </div>
          </div>
          <div className="bg-[#19A8C7]/20 p-2 rounded-xl">
            <Wallet size={20} className="text-[#19A8C7]" />
          </div>
        </div>
        {/* Gráfico de fondo pequeño */}
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 group-hover:opacity-30 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#19A8C7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#19A8C7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="Ingresos" stroke="#19A8C7" fill="url(#colorBal)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tarjeta Total Gastos (NUEVO) */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-[#151E2B] p-6 rounded-3xl shadow-lg relative overflow-hidden group">
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">Gastos del Mes</p>
            <h3 className="text-3xl font-bold text-white mb-2">${kpis.expense.toLocaleString()}</h3>
            <div className="flex items-center gap-1 text-[#FF8A00] text-xs font-bold bg-[#FF8A00]/10 px-2 py-1 rounded-full w-fit">
              <ArrowDownRight size={14} />
              <span>Salidas</span>
            </div>
          </div>
          <div className="bg-[#FF8A00]/20 p-2 rounded-xl">
            <TrendingDown size={20} className="text-[#FF8A00]" />
          </div>
        </div>
        {/* Decoración de fondo */}
        <div className="absolute -bottom-6 -right-6 opacity-10">
          <TrendingDown size={100} className="text-[#FF8A00]" />
        </div>
      </div>

      {/* Tarjeta Comparativa de Ventas */}
      <div className="col-span-12 lg:col-span-6 bg-[#151E2B] p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-gray-400 text-sm font-medium">Comparativa de Ingresos</p>
              {comparisonData.percentage > 0 ?
                <div className="flex items-center text-[#10b981] text-xs font-bold bg-[#10b981]/10 px-2 py-0.5 rounded-full">
                  <TrendingUp size={12} className="mr-1" /> +{comparisonData.percentage.toFixed(1)}%
                </div>
                :
                <div className="flex items-center text-red-400 text-xs font-bold bg-red-400/10 px-2 py-0.5 rounded-full">
                  <TrendingDown size={12} className="mr-1" /> {comparisonData.percentage.toFixed(1)}%
                </div>
              }
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-white mb-1">${comparisonData.currentAmount.toLocaleString()}</h3>
              <span className="text-sm text-gray-500">vs ${comparisonData.previousAmount.toLocaleString()} ({comparisonData.previousLabel})</span>
            </div>
          </div>

          {/* Selector de Periodo */}
          <div className="flex bg-[#0B131F] rounded-xl p-1 border border-[#1E293B]">
            <button
              onClick={() => setComparisonPeriod('month')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${comparisonPeriod === 'month' ? 'bg-[#19A8C7] text-white' : 'text-gray-400 hover:text-white'}`}
            >Mes</button>
            <button
              onClick={() => setComparisonPeriod('fortnight')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${comparisonPeriod === 'fortnight' ? 'bg-[#19A8C7] text-white' : 'text-gray-400 hover:text-white'}`}
            >Quincena</button>
            <button
              onClick={() => setComparisonPeriod('year')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${comparisonPeriod === 'year' ? 'bg-[#19A8C7] text-white' : 'text-gray-400 hover:text-white'}`}
            >Año</button>
          </div>
        </div>

        {/* Gráfico Comparativo Visual (Nuevo Dual Bar) */}
        <div className="mt-4 h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: 'Anterior', valor: comparisonData.previousAmount },
                { name: 'Actual', valor: comparisonData.currentAmount }
              ]}
              layout="vertical"
              barSize={20}
              barGap={4}
            >
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} width={50} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: '#0B131F', borderRadius: '8px', border: 'none', color: '#fff' }}
                formatter={(val: number) => `$${val.toLocaleString()}`}
              />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                {
                  [{ name: 'Anterior', fill: '#4b5563' }, { name: 'Actual', fill: comparisonData.percentage >= 0 ? '#10b981' : '#f87171' }].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* --- Fila 2: Volumen de Ventas (NUEVO) --- */}
      <div className="col-span-12 bg-[#151E2B] p-6 rounded-3xl shadow-lg border-l-4 border-[#FFC72C]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="text-[#FFC72C]" />
              Volumen de Ventas
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-400 text-sm">
                Unidades vendidas en: <span className="text-white font-bold">{volumeData.periodLabel}</span>
              </p>
              {volumePeriod !== 'custom' && (
                <>
                  {volumeData.percentage > 0 ?
                    <div className="flex items-center text-[#10b981] text-xs font-bold bg-[#10b981]/10 px-2 py-0.5 rounded-full">
                      <TrendingUp size={12} className="mr-1" /> +{volumeData.percentage.toFixed(1)}%
                    </div>
                    :
                    <div className="flex items-center text-red-400 text-xs font-bold bg-red-400/10 px-2 py-0.5 rounded-full">
                      <TrendingDown size={12} className="mr-1" /> {volumeData.percentage.toFixed(1)}%
                    </div>
                  }
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex bg-[#0B131F] rounded-xl p-1 border border-[#1E293B]">
              <button onClick={() => setVolumePeriod('fortnight')} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${volumePeriod === 'fortnight' ? 'bg-[#FFC72C] text-black' : 'text-gray-400 hover:text-white'}`}>Quincena</button>
              <button onClick={() => setVolumePeriod('month')} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${volumePeriod === 'month' ? 'bg-[#FFC72C] text-black' : 'text-gray-400 hover:text-white'}`}>Mes</button>
              <button onClick={() => setVolumePeriod('year')} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${volumePeriod === 'year' ? 'bg-[#FFC72C] text-black' : 'text-gray-400 hover:text-white'}`}>Año</button>
              <button onClick={() => setVolumePeriod('custom')} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${volumePeriod === 'custom' ? 'bg-[#FFC72C] text-black' : 'text-gray-400 hover:text-white'}`}>Personalizar</button>
            </div>
          </div>
        </div>

        {volumePeriod === 'custom' && (
          <div className="mt-4 flex flex-wrap gap-4 items-center bg-[#0B131F] p-3 rounded-xl border border-[#1E293B] animate-fade-in">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Desde</span>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-transparent text-white text-sm border-b border-[#1E293B] focus:border-[#FFC72C] outline-none pb-1" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Hasta</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-transparent text-white text-sm border-b border-[#1E293B] focus:border-[#FFC72C] outline-none pb-1" />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-white tracking-tight">{volumeData.quantity}</span>
            <span className="text-xl text-gray-400 font-medium">unidades / servicios</span>
            {volumePeriod !== 'custom' && (
              <span className="text-sm text-gray-500 ml-2">vs {volumeData.previousQuantity} ({volumeData.prevLabel})</span>
            )}
          </div>

          {/* Desglose por subcategoría - TOP 5 */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(volumeData.breakdown)
              .filter(([_, data]) => (data as { current: number; previous: number }).current > 0)
              .sort((a, b) => (b[1] as any).current - (a[1] as any).current)
              .slice(0, 5)
              .map(([name, dataValue], idx) => {
                const data = dataValue as { current: number; previous: number };
                const diff = data.current - data.previous;
                return (
                  <div key={idx} className="bg-[#0B131F] border border-[#1E293B] px-4 py-2 rounded-2xl flex flex-col items-center min-w-[100px] shadow-inner group hover:border-[#FFC72C]/30 transition-colors relative">
                    <div className="flex flex-col items-center mb-1">
                      <span className="text-2xl font-bold text-[#FFC72C] group-hover:scale-110 transition-transform leading-none">{data.current}</span>
                      {volumePeriod !== 'custom' && (
                        <span className="text-[10px] text-gray-500 mt-0.5">prev: {data.previous}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{name}</span>

                    {/* Indicador de tendencia por subcategoría */}
                    {volumePeriod !== 'custom' && (diff !== 0) && (
                      <div className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded-lg text-[10px] font-black shadow-lg flex items-center gap-0.5 ${diff > 0 ? 'bg-[#10b981] text-white' : 'bg-red-500 text-white'
                        }`}>
                        {diff > 0 ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
                        {Math.abs(diff)}
                      </div>
                    )}
                  </div>
                );
              })}

            {Object.keys(volumeData.breakdown).length > 5 && (
              <button
                onClick={() => onNavigate?.('salesVolume')}
                className="bg-[#151E2B] border border-[#1E293B] hover:border-[#FFC72C] px-6 py-2 rounded-2xl flex flex-col items-center justify-center min-w-[100px] group transition-all"
              >
                <MoreHorizontal className="text-[#9ca3af] group-hover:text-[#FFC72C] mb-1" />
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest group-hover:text-white">Ver todo</span>
              </button>
            )}
          </div>
        </div>
      </div>


      {/* --- Fila 3: Gráficos --- */}

      {/* Análisis Mensual (Gráfico de Barras) */}
      <div className="col-span-12 lg:col-span-8 bg-[#151E2B] p-6 rounded-3xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Análisis Mensual</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#19A8C7]"></span>
              <span className="text-xs text-gray-400">Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF8A00]"></span>
              <span className="text-xs text-gray-400">Egresos</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={evolutionData} barGap={8}>
              <CartesianGrid vertical={false} stroke="#2c2c35" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(val) => `${val / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: '#1E293B', opacity: 0.4 }}
                contentStyle={{ backgroundColor: '#0B131F', borderRadius: '12px', border: '1px solid #1E293B', color: '#fff' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Bar dataKey="Ingresos" fill="#19A8C7" radius={[4, 4, 4, 4]} barSize={12} name="Ingresos" />
              <Bar dataKey="Egresos" fill="#FF8A00" radius={[4, 4, 4, 4]} barSize={12} name="Egresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico Donut - Categorías */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#151E2B] p-6 rounded-3xl shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-white font-semibold">Top Gastos</h4>
        </div>
        <div className="flex-1 min-h-[180px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0B131F', borderRadius: '12px', border: 'none', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
            <span className="text-2xl font-bold text-white">${kpis.expense.toLocaleString()}</span>
            <span className="text-[10px] text-gray-500 uppercase">Total</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {categoryData.slice(0, 3).map((cat, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-[#0B131F] px-2 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></span>
              <span className="text-[10px] text-gray-300 truncate max-w-[80px]">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>


      {/* --- Fila 3: Listas y Detalles --- */}

      {/* Movimientos Recientes */}
      <div className="col-span-12 lg:col-span-8 bg-[#151E2B] p-6 rounded-3xl shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Movimientos Recientes</h3>
          <span className="text-gray-500 text-xs">Últimos 5</span>
        </div>

        <div className="flex-1 space-y-4">
          {recentTransactions.map((t, i) => (
            <div key={t.id} className="flex items-center justify-between group hover:bg-[#0B131F] p-2 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${t.type === TransactionType.INCOME
                  ? 'bg-[#10b981]/10 text-[#10b981]'
                  : t.type === TransactionType.TRANSFER ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                    : 'bg-[#FF8A00]/10 text-[#FF8A00]'
                  }`}>
                  {t.type === TransactionType.INCOME ? <TrendingUp size={20} /> :
                    t.type === TransactionType.TRANSFER ? <CreditCard size={20} /> : <TrendingDown size={20} />}
                </div>
                <div>
                  <p className="text-white font-medium">{t.subcategory || t.category}</p>
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    <Calendar size={12} /> {new Date(t.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
              <span className={`text-base font-bold ${t.type === TransactionType.INCOME ? 'text-[#10b981]' : 'text-white'
                }`}>
                {t.type === TransactionType.EXPENSE ? '-' : '+'}${t.amount.toLocaleString()}
              </span>
            </div>
          ))}
          {recentTransactions.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-10">Sin movimientos recientes</p>
          )}
        </div>
      </div>

      {/* Tarjetas Activas */}
      <div className="col-span-12 lg:col-span-4 bg-[#151E2B] p-6 rounded-3xl shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-white font-semibold flex items-center gap-2"><Wallet size={18} className="text-[#19A8C7]" /> Cuentas</h4>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
          {accounts.map((acc) => {
            const bal = balances.find(b => b.accountId === acc.id)?.balance || 0;
            return (
              <div key={acc.id} className="flex justify-between items-center bg-[#0B131F] p-4 rounded-2xl border border-[#1E293B] hover:border-[#19A8C7] transition-colors group">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{acc.type}</span>
                  <span className="text-white font-bold">{acc.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#19A8C7] font-bold block">${bal.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Fila 4: Flujo de Caja --- */}
      <div className="col-span-12 bg-[#151E2B] p-6 rounded-3xl shadow-lg mt-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Flujo de Caja (Tendencias)</h3>
          <div className="flex gap-4">
            <span className="flex items-center gap-2 text-xs text-gray-400"><div className="w-2 h-2 rounded-full bg-[#19A8C7]"></div> Ingresos</span>
            <span className="flex items-center gap-2 text-xs text-gray-400"><div className="w-2 h-2 rounded-full bg-[#FFC72C]"></div> Egresos</span>
          </div>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="colorInc2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#19A8C7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#19A8C7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExp2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFC72C" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FFC72C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#2c2c35" strokeDasharray="3 3" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0B131F', borderRadius: '12px', border: '1px solid #1E293B', color: '#fff' }} />
              <Area type="monotone" dataKey="Ingresos" stroke="#19A8C7" strokeWidth={3} fill="url(#colorInc2)" />
              <Area type="monotone" dataKey="Egresos" stroke="#FFC72C" strokeWidth={3} fill="url(#colorExp2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};