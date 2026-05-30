import { useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight,
  ArrowDownRight, CreditCard,
} from 'lucide-react'
import { useTransactions } from '@/hooks/queries/useTransactions'
import { useAccounts }     from '@/hooks/queries/useAccounts'
import { useBalances }     from '@/hooks/useBalances'
import { formatMoney, formatDate } from '@/utils/formatters'
import { Card }    from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge }   from '@/components/ui/Badge'
import type { View } from '../layout/Layout'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

interface Props {
  onNavigate: (v: View) => void
}

export function Dashboard({ onNavigate }: Props) {
  const { data: transactions = [], isLoading: txLoading } = useTransactions()
  const { data: accounts     = [], isLoading: accLoading } = useAccounts()
  const balances = useBalances(accounts, transactions)

  const isLoading = txLoading || accLoading

  // ── KPIs del mes actual ───────────────────────────────────────────────────
  const { income, expenses } = useMemo(() => {
    const now = new Date()
    const m = now.getUTCMonth()
    const y = now.getUTCFullYear()
    const creditIds = new Set(accounts.filter(a => a.type === 'CREDIT').map(a => a.id))

    return transactions
      .filter(t => {
        const d = new Date(t.date)
        return d.getUTCMonth() === m && d.getUTCFullYear() === y && !creditIds.has(t.accountId)
      })
      .reduce(
        (acc, t) => ({
          income:   acc.income   + (t.type === 'Ingreso' ? t.amount : 0),
          expenses: acc.expenses + (t.type === 'Egreso'  ? t.amount : 0),
        }),
        { income: 0, expenses: 0 },
      )
  }, [transactions, accounts])

  // ── Evolución últimos 6 meses ─────────────────────────────────────────────
  const chartData = useMemo(() => {
    const now = new Date()
    const creditIds = new Set(accounts.filter(a => a.type === 'CREDIT').map(a => a.id))
    const data: { name: string; Ingresos: number; Egresos: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      const m = d.getUTCMonth()
      const y = d.getUTCFullYear()

      const totals = transactions
        .filter(t => {
          const td = new Date(t.date)
          return td.getUTCMonth() === m && td.getUTCFullYear() === y && !creditIds.has(t.accountId)
        })
        .reduce(
          (acc, t) => ({
            Ingresos: acc.Ingresos + (t.type === 'Ingreso' ? t.amount : 0),
            Egresos:  acc.Egresos  + (t.type === 'Egreso'  ? t.amount : 0),
          }),
          { Ingresos: 0, Egresos: 0 },
        )

      data.push({ name: MONTHS[m], ...totals })
    }
    return data
  }, [transactions, accounts])

  // ── Movimientos recientes ─────────────────────────────────────────────────
  const recent = useMemo(() => transactions.slice(0, 6), [transactions])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const netMonth = income - expenses
  const creditIds = new Set(accounts.filter(a => a.type === 'CREDIT').map(a => a.id))
  const totalBalance = balances
    .filter(b => !creditIds.has(b.accountId))
    .reduce((s, b) => s + b.balance, 0)

  return (
    <div className="space-y-6 pb-6">
      {/* ── Título ── */}
      <div>
        <h2 className="text-2xl font-extrabold text-white">Dashboard</h2>
        <p className="text-[#9ca3af] text-sm mt-0.5">Resumen financiero del restaurante</p>
      </div>

      {/* ── Cuentas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => {
          const bal = balances.find(b => b.accountId === acc.id)?.balance ?? 0
          const neg = bal < 0
          const colors: Record<string, string> = {
            CASH:   'border-positive/30 bg-positive/5',
            BANK:   'border-teal/30 bg-teal/5',
            CREDIT: 'border-amber/30 bg-amber/5',
          }
          const textColors: Record<string, string> = {
            CASH: 'text-positive', BANK: 'text-teal', CREDIT: 'text-amber',
          }
          return (
            <Card key={acc.id} className={`p-5 border ${colors[acc.type] ?? ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">
                    {acc.type}
                  </p>
                  <p className="text-white font-bold">{acc.name}</p>
                </div>
                <Wallet size={18} className={textColors[acc.type] ?? 'text-[#9ca3af]'} />
              </div>
              <p className={`text-2xl font-extrabold ${neg ? 'text-negative' : (textColors[acc.type] ?? 'text-white')}`}>
                {neg ? '-' : ''}{formatMoney(Math.abs(bal))}
              </p>
            </Card>
          )
        })}
      </div>

      {/* ── KPIs del mes ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Balance total */}
        <Card className="p-5">
          <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">Balance Total</p>
          <p className="text-3xl font-extrabold text-white">{formatMoney(totalBalance)}</p>
          <Badge variant="info" className="mt-2">Cuentas activas</Badge>
        </Card>

        {/* Ingresos mes */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest">Ingresos · Mes</p>
            <ArrowUpRight size={16} className="text-positive" />
          </div>
          <p className="text-3xl font-extrabold text-positive">{formatMoney(income)}</p>
        </Card>

        {/* Gastos + neto */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest">Gastos · Mes</p>
            <ArrowDownRight size={16} className="text-orange-red" />
          </div>
          <p className="text-3xl font-extrabold text-orange-red">{formatMoney(expenses)}</p>
          <p className={`text-xs mt-1 font-semibold ${netMonth >= 0 ? 'text-positive' : 'text-negative'}`}>
            Neto: {netMonth >= 0 ? '+' : ''}{formatMoney(netMonth)}
          </p>
        </Card>
      </div>

      {/* ── Gráfico + Recientes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Gráfico evolución */}
        <Card className="lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-bold">Flujo de caja</p>
              <p className="text-[#9ca3af] text-xs">Últimos 6 meses</p>
            </div>
            <div className="flex gap-3 text-xs text-[#9ca3af]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal inline-block"/>Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-red inline-block"/>Egresos
              </span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid vertical={false} stroke="#2A2F42" strokeDasharray="3 3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#0E1420', border: '1px solid #2A2F42', borderRadius: 12 }}
                  formatter={(v: number) => [formatMoney(v), '']}
                />
                <Bar dataKey="Ingresos" fill="#5CB8B2" radius={[4,4,4,4]} barSize={10} />
                <Bar dataKey="Egresos"  fill="#E8603A" radius={[4,4,4,4]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Movimientos recientes */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-bold">Recientes</p>
            <button
              onClick={() => onNavigate('history')}
              className="text-teal text-xs font-semibold hover:underline"
            >
              Ver todo →
            </button>
          </div>
          <div className="space-y-3">
            {recent.length === 0 && (
              <p className="text-[#4b5563] text-sm text-center py-6">Sin movimientos</p>
            )}
            {recent.map(tx => {
              const isIn = tx.type === 'Ingreso'
              return (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${isIn ? 'bg-positive/10' : tx.type === 'Transferencia' ? 'bg-teal/10' : 'bg-orange-red/10'}`}>
                    {isIn
                      ? <TrendingUp  size={14} className="text-positive" />
                      : tx.type === 'Transferencia'
                        ? <CreditCard   size={14} className="text-teal" />
                        : <TrendingDown size={14} className="text-orange-red" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {tx.subcategory || tx.category}
                    </p>
                    <p className="text-[#4b5563] text-xs">{formatDate(tx.date)}</p>
                  </div>
                  <p className={`text-sm font-bold shrink-0 ${isIn ? 'text-positive' : 'text-white'}`}>
                    {isIn ? '+' : '-'}{formatMoney(tx.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── Área (tendencia) ── */}
      <Card className="p-5">
        <p className="text-white font-bold mb-4">Tendencia de ingresos</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#5CB8B2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#5CB8B2" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#2A2F42" strokeDasharray="3 3" />
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0E1420', border: '1px solid #2A2F42', borderRadius: 12 }}
                formatter={(v: number) => [formatMoney(v), '']}
              />
              <Area type="monotone" dataKey="Ingresos" stroke="#5CB8B2"
                strokeWidth={2} fill="url(#gradIn)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
