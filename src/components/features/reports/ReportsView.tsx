import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, Calendar, Target, CheckCircle2, AlertCircle } from 'lucide-react'
import { SalesVolumeSection } from './SalesVolumeSection'
import { useTransactions } from '@/hooks/queries/useTransactions'
import { useAccounts }     from '@/hooks/queries/useAccounts'
import { useClosings }     from '@/hooks/queries/useClosings'
import { formatMoney, formatDate } from '@/utils/formatters'
import { Card }    from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge }   from '@/components/ui/Badge'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ── Tooltip customizado ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0E1420] border border-[#2A2F42] rounded-xl p-3 text-sm">
      <p className="text-[#9ca3af] mb-1 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill || p.color }}>
          {formatMoney(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Vista ─────────────────────────────────────────────────────────────────────

export function ReportsView() {
  const { data: transactions = [], isLoading: txLoading }  = useTransactions()
  const { data: accounts     = [], isLoading: accLoading } = useAccounts()
  const { data: closings     = [], isLoading: clLoading }  = useClosings()

  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const isLoading = txLoading || accLoading || clLoading

  // IDs de cuentas crédito (excluir de estadísticas de flujo)
  const creditIds = useMemo(
    () => new Set(accounts.filter(a => a.type === 'Crédito').map(a => a.id)),
    [accounts],
  )

  // ── Transacciones del año seleccionado (sin créditos) ────────────────────
  const yearTx = useMemo(
    () => transactions.filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() === year && !creditIds.has(t.accountId)
    }),
    [transactions, year, creditIds],
  )

  // ── KPIs anuales ─────────────────────────────────────────────────────────
  const { totalIncome, totalExpenses } = useMemo(() => ({
    totalIncome:   yearTx.filter(t => t.type === 'Ingreso').reduce((s, t) => s + t.amount, 0),
    totalExpenses: yearTx.filter(t => t.type === 'Egreso' ).reduce((s, t) => s + t.amount, 0),
  }), [yearTx])

  const netYear = totalIncome - totalExpenses

  // ── Tabla mensual ────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    return MONTHS.map((name, m) => {
      const mTx = yearTx.filter(t => new Date(t.date).getMonth() === m)
      const income   = mTx.filter(t => t.type === 'Ingreso').reduce((s, t) => s + t.amount, 0)
      const expenses = mTx.filter(t => t.type === 'Egreso' ).reduce((s, t) => s + t.amount, 0)
      return { name: MONTHS_SHORT[m], fullName: name, income, expenses, net: income - expenses }
    })
  }, [yearTx])

  // ── Top categorías de ingresos ───────────────────────────────────────────
  const topIncome = useMemo(() => {
    const map = new Map<string, number>()
    yearTx
      .filter(t => t.type === 'Ingreso')
      .forEach(t => map.set(t.category, (map.get(t.category) ?? 0) + t.amount))
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, amount]) => ({ cat, amount }))
  }, [yearTx])

  const topIncomeTotal = topIncome.reduce((s, i) => s + i.amount, 0)

  // ── Top categorías de egresos ────────────────────────────────────────────
  const topExpenses = useMemo(() => {
    const map = new Map<string, number>()
    yearTx
      .filter(t => t.type === 'Egreso')
      .forEach(t => map.set(t.category, (map.get(t.category) ?? 0) + t.amount))
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, amount]) => ({ cat, amount }))
  }, [yearTx])

  const topExpTotal = topExpenses.reduce((s, i) => s + i.amount, 0)

  // ── Estadísticas de cierres ──────────────────────────────────────────────
  const closingStats = useMemo(() => {
    const yearClosings = closings.filter(c => new Date(c.date).getFullYear() === year)
    if (yearClosings.length === 0) return null

    const exact    = yearClosings.filter(c => c.difference === 0).length
    const avgDiff  = yearClosings.reduce((s, c) => s + Math.abs(c.difference), 0) / yearClosings.length
    const avgDaily = yearClosings.reduce((s, c) => s + c.systemBalance, 0) / yearClosings.length
    const maxDiff  = yearClosings.reduce((best, c) =>
      Math.abs(c.difference) > Math.abs(best.difference) ? c : best
    )
    return { total: yearClosings.length, exact, avgDiff, avgDaily, maxDiff, pctExact: (exact / yearClosings.length) * 100 }
  }, [closings, year])

  // ── Días con más ingresos ─────────────────────────────────────────────────
  const bestDays = useMemo(() => {
    const map = new Map<string, number>()
    yearTx
      .filter(t => t.type === 'Ingreso')
      .forEach(t => {
        const day = t.date.split('T')[0]
        map.set(day, (map.get(day) ?? 0) + t.amount)
      })
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([date, amount]) => ({ date, amount }))
  }, [yearTx])

  // ── Años disponibles ─────────────────────────────────────────────────────
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    transactions.forEach(t => years.add(new Date(t.date).getFullYear()))
    years.add(currentYear)
    return [...years].sort((a, b) => b - a)
  }, [transactions, currentYear])

  if (isLoading) return (
    <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
  )

  const INCOME_COLORS = ['#5CB8B2', '#4DA9A3', '#3D9A94', '#2D8B85', '#1D7C76', '#0D6D67']
  const EXPENSE_COLORS = ['#E8603A', '#D95530', '#CA4A26', '#BB3F1C', '#AC3412', '#9D2908']

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Reportes</h2>
          <p className="text-[#9ca3af] text-sm mt-0.5">Análisis financiero detallado</p>
        </div>
        {/* Selector de año */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[#9ca3af]" />
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="bg-[#1A1D2E] text-white px-3 py-2 rounded-xl border border-[#2A2F42] focus:outline-none focus:border-teal text-sm appearance-none cursor-pointer"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Volumen de Ventas ── */}
      <SalesVolumeSection />

      {/* ── KPIs del año ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">Ingresos {year}</p>
          <p className="text-2xl font-extrabold text-positive">{formatMoney(totalIncome)}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={12} className="text-positive" />
            <p className="text-positive text-xs">{yearTx.filter(t=>t.type==='Ingreso').length} movimientos</p>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">Egresos {year}</p>
          <p className="text-2xl font-extrabold text-orange-red">{formatMoney(totalExpenses)}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDown size={12} className="text-orange-red" />
            <p className="text-orange-red text-xs">{yearTx.filter(t=>t.type==='Egreso').length} movimientos</p>
          </div>
        </Card>
        <Card className={`p-5 ${netYear >= 0 ? 'border-positive/20 bg-positive/5' : 'border-negative/20 bg-negative/5'}`}>
          <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">Resultado neto</p>
          <p className={`text-2xl font-extrabold ${netYear >= 0 ? 'text-positive' : 'text-negative'}`}>
            {netYear >= 0 ? '+' : ''}{formatMoney(netYear)}
          </p>
          <Badge variant={netYear >= 0 ? 'success' : 'danger'} className="mt-1">
            {netYear >= 0 ? 'Superávit' : 'Déficit'}
          </Badge>
        </Card>
        <Card className="p-5">
          <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">Promedio diario</p>
          <p className="text-2xl font-extrabold text-teal">
            {formatMoney(totalIncome / Math.max(1, yearTx.filter(t=>t.type==='Ingreso').length > 0 ? 365 : 1))}
          </p>
          <p className="text-[#4b5563] text-xs mt-1">{yearTx.length} transacciones totales</p>
        </Card>
      </div>

      {/* ── Gráfico barras mensuales ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-bold">Evolución mensual {year}</p>
            <p className="text-[#9ca3af] text-xs">Ingresos vs Egresos por mes</p>
          </div>
          <div className="flex gap-3 text-xs text-[#9ca3af]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal inline-block"/> Ingresos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-red inline-block"/> Egresos
            </span>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barGap={3}>
              <CartesianGrid vertical={false} stroke="#2A2F42" strokeDasharray="3 3" />
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10 }} dy={8} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income"   name="Ingresos" fill="#5CB8B2" radius={[4,4,4,4]} barSize={9} />
              <Bar dataKey="expenses" name="Egresos"  fill="#E8603A" radius={[4,4,4,4]} barSize={9} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Top categorías ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top ingresos */}
        <Card className="p-5">
          <p className="text-white font-bold mb-4">Top categorías de ingresos</p>
          {topIncome.length === 0
            ? <p className="text-[#4b5563] text-sm italic text-center py-6">Sin ingresos en {year}</p>
            : (
              <div className="space-y-3">
                {topIncome.map(({ cat, amount }, i) => {
                  const pct = topIncomeTotal > 0 ? (amount / topIncomeTotal) * 100 : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#9ca3af] text-sm truncate max-w-[60%]">{cat || 'Sin categoría'}</span>
                        <span className="text-white font-bold text-sm shrink-0">{formatMoney(amount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#2A2F42] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: INCOME_COLORS[i] ?? '#5CB8B2' }}
                          />
                        </div>
                        <span className="text-[#4b5563] text-xs w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </Card>

        {/* Top egresos */}
        <Card className="p-5">
          <p className="text-white font-bold mb-4">Top categorías de egresos</p>
          {topExpenses.length === 0
            ? <p className="text-[#4b5563] text-sm italic text-center py-6">Sin egresos en {year}</p>
            : (
              <div className="space-y-3">
                {topExpenses.map(({ cat, amount }, i) => {
                  const pct = topExpTotal > 0 ? (amount / topExpTotal) * 100 : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#9ca3af] text-sm truncate max-w-[60%]">{cat || 'Sin categoría'}</span>
                        <span className="text-white font-bold text-sm shrink-0">{formatMoney(amount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#2A2F42] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: EXPENSE_COLORS[i] ?? '#E8603A' }}
                          />
                        </div>
                        <span className="text-[#4b5563] text-xs w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </Card>
      </div>

      {/* ── Tabla mensual detallada ── */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A2F42]">
          <p className="text-white font-bold">Resumen mensual {year}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold">Mes</th>
                <th className="px-5 py-3 text-right font-semibold">Ingresos</th>
                <th className="px-5 py-3 text-right font-semibold">Egresos</th>
                <th className="px-5 py-3 text-right font-semibold">Neto</th>
                <th className="px-5 py-3 text-right font-semibold hidden sm:table-cell">Transacciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2F42]">
              {monthlyData.map((m, idx) => {
                const hasData = m.income > 0 || m.expenses > 0
                const txCount = yearTx.filter(t => new Date(t.date).getMonth() === idx).length
                return (
                  <tr key={m.name} className={`transition-colors ${hasData ? 'hover:bg-white/3' : 'opacity-40'}`}>
                    <td className="px-5 py-3 text-white font-medium">{m.fullName}</td>
                    <td className="px-5 py-3 text-right font-mono text-positive">
                      {m.income > 0 ? formatMoney(m.income) : <span className="text-[#4b5563]">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-orange-red">
                      {m.expenses > 0 ? formatMoney(m.expenses) : <span className="text-[#4b5563]">—</span>}
                    </td>
                    <td className={`px-5 py-3 text-right font-bold font-mono ${
                      !hasData ? 'text-[#4b5563]' : m.net >= 0 ? 'text-positive' : 'text-negative'
                    }`}>
                      {hasData ? `${m.net >= 0 ? '+' : ''}${formatMoney(m.net)}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-[#4b5563] hidden sm:table-cell">
                      {txCount > 0 ? txCount : '—'}
                    </td>
                  </tr>
                )
              })}
              {/* Total */}
              <tr className="bg-[#0E1420] font-bold">
                <td className="px-5 py-3 text-white">Total {year}</td>
                <td className="px-5 py-3 text-right font-mono text-positive">{formatMoney(totalIncome)}</td>
                <td className="px-5 py-3 text-right font-mono text-orange-red">{formatMoney(totalExpenses)}</td>
                <td className={`px-5 py-3 text-right font-mono ${netYear >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {netYear >= 0 ? '+' : ''}{formatMoney(netYear)}
                </td>
                <td className="px-5 py-3 text-right text-[#9ca3af] hidden sm:table-cell">{yearTx.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Grid: cierres + mejores días ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Estadísticas de cierres */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-amber" />
            <p className="text-white font-bold">Estadísticas de cierres {year}</p>
          </div>
          {!closingStats ? (
            <p className="text-[#4b5563] text-sm italic text-center py-6">Sin cierres en {year}</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0E1420] rounded-xl p-3 text-center">
                  <p className="text-[#9ca3af] text-xs mb-1">Total cierres</p>
                  <p className="text-white font-extrabold text-xl">{closingStats.total}</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${
                  closingStats.pctExact >= 80 ? 'bg-positive/10' : 'bg-amber/10'
                }`}>
                  <p className="text-[#9ca3af] text-xs mb-1">Exactos</p>
                  <p className={`font-extrabold text-xl ${closingStats.pctExact >= 80 ? 'text-positive' : 'text-amber'}`}>
                    {closingStats.exact} <span className="text-sm">({closingStats.pctExact.toFixed(0)}%)</span>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-[#2A2F42]">
                  <span className="text-[#9ca3af] text-sm">Diferencia promedio</span>
                  <span className="text-white font-bold">{formatMoney(closingStats.avgDiff)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#2A2F42]">
                  <span className="text-[#9ca3af] text-sm">Saldo promedio diario</span>
                  <span className="text-teal font-bold">{formatMoney(closingStats.avgDaily)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[#9ca3af] text-sm">Mayor diferencia</span>
                  <div className="text-right">
                    <p className="text-amber font-bold">{formatMoney(Math.abs(closingStats.maxDiff.difference))}</p>
                    <p className="text-[#4b5563] text-xs">{formatDate(closingStats.maxDiff.date)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                {closingStats.pctExact >= 80
                  ? <><CheckCircle2 size={12} className="text-positive" /> Excelente precisión en cierres</>
                  : <><AlertCircle size={12} className="text-amber" /> Hay margen para mejorar los cierres</>
                }
              </div>
            </div>
          )}
        </Card>

        {/* Mejores días del año */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-positive" />
            <p className="text-white font-bold">Mejores días del año</p>
          </div>
          {bestDays.length === 0 ? (
            <p className="text-[#4b5563] text-sm italic text-center py-6">Sin ingresos en {year}</p>
          ) : (
            <div className="space-y-3">
              {bestDays.map(({ date, amount }, i) => (
                <div key={date} className="flex items-center gap-3">
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0
                    ${i === 0 ? 'bg-amber text-[#0E1420]' : i === 1 ? 'bg-[#C0C0C0] text-[#0E1420]' : 'bg-[#CD7F32] text-[#0E1420]'}
                  `}
                    style={i >= 3 ? { background: '#2A2F42', color: '#9ca3af' } : {}}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{formatDate(date + 'T12:00:00')}</p>
                  </div>
                  <p className="text-positive font-bold shrink-0">{formatMoney(amount)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
