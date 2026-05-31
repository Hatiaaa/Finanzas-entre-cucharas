import { useMemo, useState } from 'react'
import {
  TrendingUp, TrendingDown, ChevronRight, Search, X,
} from 'lucide-react'
import { useTransactions }   from '@/hooks/queries/useTransactions'
import { useAccounts }       from '@/hooks/queries/useAccounts'
import { useProductAliases } from '@/hooks/useProductAliases'
import { normalizeKey }      from '@/utils/normalize'
import { formatMoney }       from '@/utils/formatters'
import { Card }    from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PeriodType = 'quincena' | 'mes' | 'año' | 'personalizar'

interface DateRange { from: Date; to: Date }

interface ProductRow {
  name:        string
  current:     number   // unidades período actual
  prev:        number   // unidades período anterior
  revenue:     number   // recaudado período actual
  lastDate:    string   // última venta (ISO)
}

// ── Utilidades de fechas ──────────────────────────────────────────────────────

function getRanges(
  period: PeriodType,
  selMonth: number,
  selYear: number,
  customFrom: string,
  customTo: string,
): { current: DateRange; prev: DateRange | null } {
  switch (period) {
    case 'mes': {
      const current = {
        from: new Date(selYear, selMonth, 1, 0, 0, 0),
        to:   new Date(selYear, selMonth + 1, 0, 23, 59, 59),
      }
      // Mes anterior
      const pm = selMonth === 0 ? 11 : selMonth - 1
      const py = selMonth === 0 ? selYear - 1 : selYear
      const prev = {
        from: new Date(py, pm, 1, 0, 0, 0),
        to:   new Date(py, pm + 1, 0, 23, 59, 59),
      }
      return { current, prev }
    }

    case 'quincena': {
      // Qué quincena estamos (1=1-15, 2=16-fin)
      const today = new Date()
      const isFirstQ = today.getDate() <= 15
      const current = isFirstQ
        ? { from: new Date(selYear, selMonth, 1, 0,0,0),
            to:   new Date(selYear, selMonth, 15, 23,59,59) }
        : { from: new Date(selYear, selMonth, 16, 0,0,0),
            to:   new Date(selYear, selMonth + 1, 0, 23,59,59) }

      // Quincena anterior
      let prev: DateRange
      if (isFirstQ) {
        // Previa = segunda quincena del mes anterior
        const pm = selMonth === 0 ? 11 : selMonth - 1
        const py = selMonth === 0 ? selYear - 1 : selYear
        prev = {
          from: new Date(py, pm, 16, 0,0,0),
          to:   new Date(py, pm + 1, 0, 23,59,59),
        }
      } else {
        // Previa = primera quincena del mismo mes
        prev = {
          from: new Date(selYear, selMonth, 1, 0,0,0),
          to:   new Date(selYear, selMonth, 15, 23,59,59),
        }
      }
      return { current, prev }
    }

    case 'año': {
      const current = {
        from: new Date(selYear, 0, 1, 0,0,0),
        to:   new Date(selYear, 11, 31, 23,59,59),
      }
      const prev = {
        from: new Date(selYear - 1, 0, 1, 0,0,0),
        to:   new Date(selYear - 1, 11, 31, 23,59,59),
      }
      return { current, prev }
    }

    case 'personalizar': {
      if (!customFrom || !customTo) return { current: { from: new Date(0), to: new Date() }, prev: null }
      return {
        current: {
          from: new Date(customFrom + 'T00:00:00'),
          to:   new Date(customTo   + 'T23:59:59'),
        },
        prev: null,
      }
    }
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

export function SalesVolumeSection() {
  const { data: transactions = [], isLoading: txLoading } = useTransactions()
  const { data: accounts     = [], isLoading: accLoading } = useAccounts()
  const { resolve: resolveAlias } = useProductAliases()

  // Período seleccionado
  const now = new Date()
  const [period,     setPeriod]     = useState<PeriodType>('mes')
  const [selMonth,   setSelMonth]   = useState(now.getMonth())
  const [selYear,    setSelYear]    = useState(now.getFullYear())
  const [customFrom, setCustomFrom] = useState('')
  const [customTo,   setCustomTo]   = useState('')
  const [showAll,    setShowAll]    = useState(false)
  const [search,     setSearch]     = useState('')

  // IDs de cuenta crédito (excluir del total recaudado)
  const creditIds = useMemo(
    () => new Set(accounts.filter(a => a.type === 'Crédito').map(a => a.id)),
    [accounts],
  )

  // Solo transacciones de ventas con cantidad > 0 (productos del cuadre)
  const salesTx = useMemo(
    () => transactions.filter(t =>
      t.type === 'Ingreso' &&
      typeof t.quantity === 'number' &&
      t.quantity > 0
    ),
    [transactions],
  )

  // Rangos de fecha según período
  const { current: curRange, prev: prevRange } = useMemo(
    () => getRanges(period, selMonth, selYear, customFrom, customTo),
    [period, selMonth, selYear, customFrom, customTo],
  )

  const inRange = (d: Date, r: DateRange) => d >= r.from && d <= r.to

  // Agrupa transacciones por nombre de producto.
  // Clave = nombre normalizado (sin tildes, sin mayúsculas).
  // Display = variante con más unidades vendidas (la más usada).
  function groupByProduct(txList: typeof salesTx): Map<string, { units: number; revenue: number; lastDate: string }> {
    const rawMap = new Map<string, {
      units:    number
      revenue:  number
      lastDate: string
      variants: Map<string, number>  // label original → unidades totales
    }>()

    for (const t of txList) {
      // 1. nombre original  2. aplica alias  3. normaliza para agrupar
      const raw   = (t.subcategory || t.category).trim()
      const label = resolveAlias(raw)   // aplica alias si hay uno definido
      const key   = normalizeKey(label)
      const ex    = rawMap.get(key) ?? { units: 0, revenue: 0, lastDate: '', variants: new Map() }

      ex.units   += t.quantity!
      ex.revenue += t.amount
      if (!ex.lastDate || t.date > ex.lastDate) ex.lastDate = t.date
      ex.variants.set(label, (ex.variants.get(label) ?? 0) + t.quantity!)
      rawMap.set(key, ex)
    }

    // Para cada grupo, elige el nombre de variante con más unidades como nombre canónico
    const result = new Map<string, { units: number; revenue: number; lastDate: string }>()
    for (const [, v] of rawMap) {
      let topLabel = '', topCount = 0
      for (const [label, count] of v.variants) {
        if (count > topCount) { topLabel = label; topCount = count }
      }
      result.set(topLabel, { units: v.units, revenue: v.revenue, lastDate: v.lastDate })
    }
    return result
  }

  const curTx  = useMemo(() => salesTx.filter(t => inRange(new Date(t.date), curRange)), [salesTx, curRange])
  const prevTx = useMemo(
    () => prevRange ? salesTx.filter(t => inRange(new Date(t.date), prevRange)) : [],
    [salesTx, prevRange],
  )

  const curMap  = useMemo(() => groupByProduct(curTx),  [curTx])
  const prevMap = useMemo(() => groupByProduct(prevTx), [prevTx])

  // Combinar en filas finales
  const rows: ProductRow[] = useMemo(() => {
    const allNames = new Set([...curMap.keys(), ...prevMap.keys()])
    const list: ProductRow[] = []
    for (const name of allNames) {
      const c = curMap.get(name)  ?? { units: 0, revenue: 0, lastDate: '' }
      const p = prevMap.get(name) ?? { units: 0, revenue: 0, lastDate: '' }
      list.push({
        name,
        current:  c.units,
        prev:     p.units,
        revenue:  c.revenue,
        lastDate: c.lastDate,
      })
    }
    return list.sort((a, b) => b.current - a.current)
  }, [curMap, prevMap])

  const filteredRows = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter(r => r.name.toLowerCase().includes(q))
  }, [rows, search])

  const totalCurrent = rows.reduce((s, r) => s + r.current, 0)
  const totalPrev    = rows.reduce((s, r) => s + r.prev,    0)
  const totalRevenue = curTx.reduce((s, t) => s + (!creditIds.has(t.accountId) ? t.amount : 0), 0)
  const deltaPct     = totalPrev > 0 ? ((totalCurrent - totalPrev) / totalPrev) * 100 : null
  const delta        = totalCurrent - totalPrev

  // Label del período anterior
  const prevLabel = period === 'mes'
    ? 'Mes anterior'
    : period === 'quincena'
      ? 'Quincena anterior'
      : period === 'año'
        ? 'Año anterior'
        : null

  // Años disponibles para selector
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    transactions.forEach(t => years.add(new Date(t.date).getFullYear()))
    years.add(now.getFullYear())
    return [...years].sort((a, b) => b - a)
  }, [transactions])

  const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  if (txLoading || accLoading) return (
    <div className="flex justify-center py-8"><Spinner /></div>
  )

  const topProducts = rows.slice(0, 5)

  return (
    <Card className="overflow-hidden">
      {/* ── Barra superior ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 pt-5 pb-4 border-b border-[#2A2F42]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-lg">Volumen de Ventas</h3>
            {deltaPct !== null && (
              <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                deltaPct >= 0 ? 'bg-positive/15 text-positive' : 'bg-negative/15 text-negative'
              }`}>
                {deltaPct >= 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-[#9ca3af] text-xs mt-0.5">
            Unidades vendidas en:{' '}
            <span className="font-semibold text-white">
              {period === 'mes' ? `${MONTHS_FULL[selMonth]} ${selYear}`
               : period === 'quincena' ? `Quincena · ${MONTHS_ES[selMonth]} ${selYear}`
               : period === 'año' ? `Año ${selYear}`
               : 'Período personalizado'}
            </span>
          </p>
        </div>

        {/* Selectores de período */}
        <div className="flex flex-wrap items-center gap-2">
          {(['quincena', 'mes', 'año', 'personalizar'] as PeriodType[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                period === p
                  ? 'bg-amber text-[#0E1420]'
                  : 'bg-white/5 text-[#9ca3af] hover:text-white hover:bg-white/10'
              }`}
            >
              {p === 'mes' ? 'Mes' : p === 'año' ? 'Año' : p === 'quincena' ? 'Quincena' : 'Personalizar'}
            </button>
          ))}

          {/* Selectores mes/año */}
          {(period === 'mes' || period === 'quincena' || period === 'año') && (
            <div className="flex items-center gap-1.5">
              {period !== 'año' && (
                <select
                  value={selMonth}
                  onChange={e => setSelMonth(Number(e.target.value))}
                  className="bg-[#0E1420] text-white px-2 py-1.5 rounded-lg border border-[#2A2F42] focus:outline-none focus:border-teal text-xs appearance-none"
                >
                  {MONTHS_FULL.map((m, i) => (
                    <option key={m} value={i}>{MONTHS_ES[i]}</option>
                  ))}
                </select>
              )}
              <select
                value={selYear}
                onChange={e => setSelYear(Number(e.target.value))}
                className="bg-[#0E1420] text-white px-2 py-1.5 rounded-lg border border-[#2A2F42] focus:outline-none focus:border-teal text-xs appearance-none"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Selector personalizado */}
          {period === 'personalizar' && (
            <div className="flex items-center gap-1.5 text-xs">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="bg-[#0E1420] text-white px-2 py-1.5 rounded-lg border border-[#2A2F42] focus:outline-none focus:border-teal text-xs" />
              <span className="text-[#4b5563]">–</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="bg-[#0E1420] text-white px-2 py-1.5 rounded-lg border border-[#2A2F42] focus:outline-none focus:border-teal text-xs" />
            </div>
          )}
        </div>
      </div>

      {/* ── Resumen + cards de top productos ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 px-5 py-4 border-b border-[#2A2F42]">
        {/* Total */}
        <div className="shrink-0">
          <p className="text-5xl font-black text-white leading-none">{totalCurrent.toLocaleString()}</p>
          <p className="text-[#9ca3af] text-sm mt-1">unidades / servicios</p>
          {prevRange && (
            <p className="text-[#4b5563] text-xs mt-0.5">
              vs {totalPrev.toLocaleString()} <span className="text-[#2A2F42]">·</span>{' '}
              <span className="text-[#9ca3af]">({prevLabel})</span>
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-16 bg-[#2A2F42] shrink-0" />

        {/* Mini tarjetas de productos */}
        <div className="flex items-center gap-3 overflow-x-auto flex-1 pb-1">
          {topProducts.length === 0 && (
            <p className="text-[#4b5563] text-sm italic">Sin ventas con cantidad en este período.</p>
          )}
          {topProducts.map(r => {
            const d = r.current - r.prev
            const isUp = d >= 0
            return (
              <div
                key={r.name}
                className="shrink-0 bg-[#0E1420] border border-[#2A2F42] rounded-2xl px-4 py-3 min-w-[90px] text-center relative"
              >
                {/* Delta badge */}
                {prevRange && r.prev > 0 && (
                  <div className={`absolute -top-2.5 right-1.5 flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isUp ? 'bg-positive text-[#0E1420]' : 'bg-negative text-white'
                  }`}>
                    {isUp ? <TrendingUp size={9}/> : <TrendingDown size={9}/>}
                    {isUp ? '+' : ''}{d}
                  </div>
                )}
                <p className="text-2xl font-black text-amber">{r.current.toLocaleString()}</p>
                {prevRange && (
                  <p className="text-[#4b5563] text-[10px] mt-0.5">prev: {r.prev}</p>
                )}
                <p className="text-white text-[10px] font-bold uppercase tracking-wider mt-1 truncate max-w-[80px] mx-auto">
                  {r.name}
                </p>
              </div>
            )
          })}

          {rows.length > 5 && (
            <button
              onClick={() => setShowAll(true)}
              className="shrink-0 flex flex-col items-center justify-center gap-1 bg-[#0E1420] border border-[#2A2F42] rounded-2xl px-4 py-3 min-w-[70px] h-full text-[#9ca3af] hover:text-teal hover:border-teal/30 transition-all"
            >
              <span className="text-xl font-bold">···</span>
              <span className="text-[10px] font-bold uppercase">Ver todo</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Tabla completa (expandible) ── */}
      {showAll && (
        <div>
          {/* Header de la tabla */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2F42]">
            <div className="flex items-center gap-2">
              <h4 className="text-white font-bold">Desglose de Ventas</h4>
              <span className="text-[#4b5563] text-xs">
                {filteredRows.length} producto{filteredRows.length !== 1 ? 's' : ''}
              </span>
              {prevRange && (
                <span className="text-positive text-xs bg-positive/10 px-2 py-0.5 rounded-full font-semibold">
                  {delta >= 0 ? '+' : ''}{delta} vs {prevLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Buscador */}
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4b5563]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar producto…"
                  className="bg-[#0E1420] text-white pl-7 pr-3 py-1.5 rounded-lg border border-[#2A2F42] focus:outline-none focus:border-teal text-xs placeholder:text-[#4b5563] w-40"
                />
              </div>
              <button
                onClick={() => { setShowAll(false); setSearch('') }}
                className="p-1.5 text-[#4b5563] hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">Producto / Servicio</th>
                  <th className="px-5 py-3 text-center font-semibold">Unidades</th>
                  {prevRange && <th className="px-5 py-3 text-center font-semibold">vs Anterior</th>}
                  <th className="px-5 py-3 text-right font-semibold">Recaudado</th>
                  <th className="px-5 py-3 text-right font-semibold hidden sm:table-cell">Última venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2F42]">
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[#4b5563] italic text-sm">
                      {search ? 'Sin resultados para esta búsqueda' : 'Sin ventas en este período'}
                    </td>
                  </tr>
                )}
                {filteredRows.map(r => {
                  const d    = r.current - r.prev
                  const isUp = d >= 0
                  return (
                    <tr key={r.name} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-amber/10 rounded-lg shrink-0">
                            <div className="w-3 h-3 rounded bg-amber" />
                          </div>
                          <span className="text-white font-medium">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <p className="text-amber font-extrabold text-lg">{r.current.toLocaleString()}</p>
                        {prevRange && r.prev > 0 && (
                          <p className="text-[#4b5563] text-[10px]">prev: {r.prev}</p>
                        )}
                      </td>
                      {prevRange && (
                        <td className="px-5 py-3.5 text-center">
                          {r.prev === 0 && r.current === 0 ? (
                            <span className="text-[#4b5563]">—</span>
                          ) : (
                            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              r.prev === 0
                                ? 'bg-positive/10 text-positive'
                                : isUp
                                  ? 'bg-positive/10 text-positive'
                                  : 'bg-negative/10 text-negative'
                            }`}>
                              {r.prev === 0 ? <TrendingUp size={11}/> : isUp ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                              {d > 0 ? '+' : ''}{d}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-right font-bold text-white">
                        {formatMoney(r.revenue)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-[#4b5563] text-xs hidden sm:table-cell">
                        {r.lastDate
                          ? new Date(r.lastDate).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {filteredRows.length > 0 && (
                <tfoot>
                  <tr className="bg-[#0E1420] font-bold border-t border-[#2A2F42]">
                    <td className="px-5 py-3 text-[#9ca3af] text-xs uppercase">
                      Total ({filteredRows.length} productos)
                    </td>
                    <td className="px-5 py-3 text-center text-amber font-extrabold">
                      {filteredRows.reduce((s, r) => s + r.current, 0).toLocaleString()}
                    </td>
                    {prevRange && (
                      <td className="px-5 py-3 text-center">
                        {(() => {
                          const td = filteredRows.reduce((s, r) => s + r.current, 0) -
                                     filteredRows.reduce((s, r) => s + r.prev, 0)
                          return (
                            <span className={`text-xs font-bold ${td >= 0 ? 'text-positive' : 'text-negative'}`}>
                              {td >= 0 ? '+' : ''}{td}
                            </span>
                          )
                        })()}
                      </td>
                    )}
                    <td className="px-5 py-3 text-right text-white font-extrabold">
                      {formatMoney(filteredRows.reduce((s, r) => s + r.revenue, 0))}
                    </td>
                    <td className="hidden sm:table-cell" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Botón "Ver todo" si no está expandido */}
      {!showAll && rows.length > 5 && (
        <div className="px-5 py-3 border-t border-[#2A2F42]">
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-1.5 text-teal text-sm font-semibold hover:underline"
          >
            Ver los {rows.length} productos <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Resumen ingresos recaudados si hay datos */}
      {rows.length > 0 && !showAll && (
        <div className="px-5 py-3 border-t border-[#2A2F42] flex items-center justify-between">
          <p className="text-[#4b5563] text-xs">{rows.length} productos · {totalRevenue > 0 ? `Recaudado: ` : ''}</p>
          {totalRevenue > 0 && (
            <p className="text-teal text-sm font-bold">{formatMoney(totalRevenue)}</p>
          )}
        </div>
      )}
    </Card>
  )
}
