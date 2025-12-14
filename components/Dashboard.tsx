import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import { Transaction, Account, TransactionType, AccountType } from '../types';
import { 
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Wallet, 
  CreditCard, TrendingUp, DollarSign
} from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  balances: { accountId: string; balance: number }[];
}

// Custom Colors matching the Dark UI reference
const COLORS = {
  purple: '#6c5dd3',
  purpleLight: '#8B7EF8',
  orange: '#ffce74',
  green: '#a0d7e7', 
  neonGreen: '#10b981',
  blue: '#3b82f6',
  pink: '#cf8bf3',
  bgCard: '#1c1c24',
  bgDark: '#13131a',
  textGray: '#9ca3af'
};

const PIE_COLORS = [COLORS.purple, COLORS.orange, COLORS.pink, COLORS.green, COLORS.blue];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, accounts, balances }) => {
  
  // --- KPIs Dinámicos ---
  const kpis = useMemo(() => {
    let income = 0;
    let expense = 0;
    const now = new Date();
    
    // Filtrar transacciones del mes actual para los KPIs
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
      
      {/* --- Fila 1 --- */}
      
      {/* Tarjeta Balance Total */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-[#1c1c24] p-6 rounded-3xl shadow-lg relative overflow-hidden group">
        <div className="flex justify-between items-start z-10 relative">
          <div>
             <p className="text-gray-400 text-sm font-medium mb-1">Balance Total</p>
             <h3 className="text-3xl font-bold text-white mb-2">${kpis.totalBalance.toLocaleString()}</h3>
             <div className="flex items-center gap-1 text-[#10b981] text-xs font-bold bg-[#10b981]/10 px-2 py-1 rounded-full w-fit">
                <ArrowUpRight size={14} />
                <span>Actualizado hoy</span>
             </div>
          </div>
          <MoreHorizontal className="text-gray-600 hover:text-white cursor-pointer" />
        </div>
        {/* Decoración de fondo */}
        <div className="absolute -bottom-4 -right-4 opacity-20 group-hover:opacity-30 transition-opacity">
           <Wallet size={120} className="text-[#6c5dd3]" />
        </div>
        {/* Gráfico de fondo pequeño */}
         <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c5dd3" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6c5dd3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="Ingresos" stroke="#6c5dd3" fill="url(#colorBal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Tarjeta Gastos Totales (Mes) */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-[#1c1c24] p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-start relative z-10">
          <div>
             <p className="text-gray-400 text-sm font-medium mb-1">Gastos (Mes Actual)</p>
             <h3 className="text-3xl font-bold text-white mb-2">${kpis.expense.toLocaleString()}</h3>
             <div className="flex items-center gap-1 text-[#cf8bf3] text-xs font-bold bg-[#cf8bf3]/10 px-2 py-1 rounded-full w-fit">
                <ArrowDownRight size={14} />
                <span>Salidas registradas</span>
             </div>
          </div>
          <MoreHorizontal className="text-gray-600 hover:text-white cursor-pointer" />
        </div>
         <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cf8bf3" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#cf8bf3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="Egresos" stroke="#cf8bf3" fill="url(#colorExp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Tarjetas Activas (Cuentas Reales) */}
      <div className="col-span-12 lg:col-span-3 bg-[#1c1c24] p-6 rounded-3xl shadow-lg flex flex-col justify-between">
         <div className="flex justify-between items-center mb-4">
             <h4 className="text-white font-semibold">Cuentas Activas</h4>
             <span className="text-gray-500 text-xs">{accounts.length} Cuentas</span>
         </div>
         {/* Renderizar las 2 primeras cuentas */}
         <div className="space-y-3 overflow-y-auto max-h-[160px] custom-scrollbar pr-1">
            {accounts.map((acc, index) => {
               const bal = balances.find(b => b.accountId === acc.id)?.balance || 0;
               return (
                 <div key={acc.id} className="bg-gradient-to-r from-[#2c2c35] to-[#13131a] rounded-xl p-3 border border-gray-800 relative overflow-hidden group hover:border-[#6c5dd3] transition-colors cursor-pointer">
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">{acc.type}</span>
                         {acc.type === AccountType.BANK ? <CreditCard className="text-[#3b82f6]" size={16} /> : <DollarSign className="text-[#10b981]" size={16} />}
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-white">${bal.toLocaleString()}</h4>
                        <p className="text-gray-500 text-xs truncate">{acc.name}</p>
                     </div>
                 </div>
               );
            })}
         </div>
      </div>

      {/* Gráfico Donut - Categorías */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-[#1c1c24] p-6 rounded-3xl shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-2">
           <h4 className="text-white font-semibold">Gastos por Categoría</h4>
        </div>
        <div className="flex-1 min-h-[140px] relative">
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={categoryData}
                 cx="50%"
                 cy="50%"
                 innerRadius={45}
                 outerRadius={60}
                 paddingAngle={5}
                 dataKey="value"
                 stroke="none"
               >
                 {categoryData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                 ))}
               </Pie>
               <Tooltip 
                  contentStyle={{ backgroundColor: '#13131a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
               />
             </PieChart>
           </ResponsiveContainer>
           {/* Texto Central */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-2xl font-bold text-white">Top 5</span>
              <span className="text-[10px] text-gray-500 uppercase">Gastos</span>
           </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
           {categoryData.slice(0,3).map((cat, i) => (
             <div key={i} className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full" style={{backgroundColor: PIE_COLORS[i]}}></span>
               <span className="text-[10px] text-gray-400 truncate max-w-[60px]">{cat.name}</span>
             </div>
           ))}
        </div>
      </div>


      {/* --- Fila 2 --- */}

      {/* Análisis Mensual (Gráfico de Barras) */}
      <div className="col-span-12 lg:col-span-8 bg-[#1c1c24] p-6 rounded-3xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Análisis Mensual</h3>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-[#6c5dd3]"></span>
               <span className="text-xs text-gray-400">Ingresos</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-[#cf8bf3]"></span>
               <span className="text-xs text-gray-400">Egresos</span>
             </div>
             <div className="bg-[#13131a] text-white text-xs px-3 py-1 rounded-lg border border-gray-800 ml-2">
               Últimos 6 meses
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
                  tick={{fill: '#6b7280', fontSize: 12}} 
                  dy={10}
               />
               <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6b7280', fontSize: 12}} 
                  tickFormatter={(val) => `${val/1000}k`}
               />
               <Tooltip 
                  cursor={{fill: '#2c2c35', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#13131a', borderRadius: '12px', border: '1px solid #2c2c35', color: '#fff' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
               />
               <Bar dataKey="Ingresos" fill="#6c5dd3" radius={[4, 4, 4, 4]} barSize={12} name="Ingresos" />
               <Bar dataKey="Egresos" fill="#cf8bf3" radius={[4, 4, 4, 4]} barSize={12} name="Egresos" />
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Movimientos Recientes */}
      <div className="col-span-12 lg:col-span-4 bg-[#1c1c24] p-6 rounded-3xl shadow-lg flex flex-col">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Movimientos Recientes</h3>
            <span className="text-gray-500 text-xs">Últimos 5</span>
         </div>
         
         <div className="flex-1 space-y-5 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {recentTransactions.map((t, i) => (
              <div key={t.id} className="flex items-center justify-between group">
                 <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      t.type === TransactionType.INCOME 
                        ? 'bg-[#10b981]/10 text-[#10b981]' 
                        : t.type === TransactionType.TRANSFER ? 'bg-[#3b82f6]/10 text-[#3b82f6]' 
                        : 'bg-[#6c5dd3]/10 text-[#6c5dd3]'
                    }`}>
                      {t.type === TransactionType.INCOME ? <TrendingUp size={18} /> : 
                       t.type === TransactionType.TRANSFER ? <CreditCard size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium truncate max-w-[120px]">{t.description}</p>
                      <p className="text-gray-500 text-xs">{new Date(t.date).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})}</p>
                    </div>
                 </div>
                 <span className={`text-sm font-bold ${
                   t.type === TransactionType.INCOME ? 'text-white' : 'text-gray-300'
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
      
      {/* --- Fila 3 --- */}
      <div className="col-span-12 bg-[#1c1c24] p-6 rounded-3xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Flujo de Caja (Tendencias)</h3>
             <div className="flex gap-4">
                <span className="flex items-center gap-2 text-xs text-gray-400"><div className="w-2 h-2 rounded-full bg-[#6c5dd3]"></div> Ingresos</span>
                <span className="flex items-center gap-2 text-xs text-gray-400"><div className="w-2 h-2 rounded-full bg-[#ffce74]"></div> Egresos</span>
             </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                 <defs>
                    <linearGradient id="colorInc2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6c5dd3" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6c5dd3" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffce74" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ffce74" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid vertical={false} stroke="#2c2c35" strokeDasharray="3 3" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} />
                 <Tooltip contentStyle={{ backgroundColor: '#13131a', borderRadius: '12px', border: '1px solid #2c2c35', color: '#fff' }}/>
                 <Area type="monotone" dataKey="Ingresos" stroke="#6c5dd3" strokeWidth={3} fill="url(#colorInc2)" />
                 <Area type="monotone" dataKey="Egresos" stroke="#ffce74" strokeWidth={3} fill="url(#colorExp2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

    </div>
  );
};