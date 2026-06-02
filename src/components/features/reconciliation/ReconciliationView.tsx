import { useMemo, useState, useEffect } from 'react'
import {
  Scale, TrendingUp, TrendingDown, ArrowLeftRight,
  AlertTriangle, CheckCircle2, Wrench, Wallet,
} from 'lucide-react'
import { useTransactions } from '@/hooks/queries/useTransactions'
import { useAccounts }     from '@/hooks/queries/useAccounts'
import { formatMoney, formatDate, formatTime } from '@/utils/formatters'
import { Card }    from '@/components/ui/Card'
import { Select }  from '@/components/ui/Select'
import { Input }   from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import type { Account, Transaction } from '@/types'

// ── Detección de ajustes manuales (plugs de "cuadre") ──────────────────────────
function esAjusteManual(tx: Transaction): boolean {
  const cat  = (tx.category    ?? '').toLowerCase()
  const desc = (tx.description ?? '').toLowerCase()
  return cat === 'extras' || desc.includes('correc') || desc.includes('ajuste') || desc.includes('cuadr')
}

// ── Cálculo de la conciliación de una cuenta ───────────────────────────────────
interface MovEfecto extends Transaction { efecto: number; saldo: number }
interface Reconc {
  initial: number
  income: number
  transferIn: number
  expense: number
  transferOut: number
  adjustments: number      // egresos marcados como ajuste manual
  balance: number
  egresosPorCat: { categoria: string; total: number }[]
  movimientos: MovEfecto[] // todos los que tocan la cuenta, ascendente, con saldo corrido
}

function reconciliar(account: Account, transactions: Transaction[]): Reconc {
  let income = 0, transferIn = 0, expense = 0, transferOut = 0, adjustments = 0
  const catMap = new Map<string, number>()

  // Movimientos que tocan la cuenta (como origen o destino)
  const tocan = transactions.filter(
    t => t.accountId === account.id || (t.type === 'Transferencia' && t.toAccountId === account.id),
  )

  for (const t of tocan) {
    const amt = Number(t.amount)
    if (!isFinite(amt)) continue
    if (t.accountId === account.id) {
      if (t.type === 'Ingreso')            income += amt
      else if (t.type === 'Egreso') {
        expense += amt
        catMap.set(t.category || '—', (catMap.get(t.category || '—') ?? 0) + amt)
        if (esAjusteManual(t)) adjustments += amt
      }
      else if (t.type === 'Transferencia') transferOut += amt
    }
    if (t.type === 'Transferencia' && t.toAccountId === account.id) transferIn += amt
  }

  // Saldo corrido (ascendente por fecha)
  const asc = [...tocan].sort((a, b) => a.date.localeCompare(b.date))
  let run = account.initialBalance
  const movimientos: MovEfecto[] = asc.map(t => {
    const amt = Number(t.amount) || 0
    let efecto = 0
    if (t.accountId === account.id) {
      if (t.type === 'Ingreso') efecto = amt
      else efecto = -amt                // Egreso o Transferencia saliente
    }
    if (t.type === 'Transferencia' && t.toAccountId === account.id) efecto += amt
    run += efecto
    return { ...t, efecto, saldo: run }
  })

  const balance = account.initialBalance + income + transferIn - expense - transferOut
  const egresosPorCat = [...catMap.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)

  return { initial: account.initialBalance, income, transferIn, expense, transferOut, adjustments, balance, egresosPorCat, movimientos }
}

// ── Fila de desglose ───────────────────────────────────────────────────────────
function FilaDesglose({ label, valor, signo, icon, color }: {
  label: string; valor: number; signo: '+' | '−' | '='; icon?: React.ReactNode; color: string
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <span className={`w-6 text-center font-black ${color}`}>{signo}</span>
        {icon}
        <span className="text-sm text-[#9ca3af]">{label}</span>
      </div>
      <span className={`font-mono font-bold ${color}`}>{formatMoney(valor)}</span>
    </div>
  )
}

// ── Vista principal ────────────────────────────────────────────────────────────
export function ReconciliationView() {
  const { data: transactions = [], isLoading: txLoading } = useTransactions()
  const { data: accounts     = [], isLoading: accLoading } = useAccounts()

  // Selecciona la primera cuenta de Banco por defecto
  const defaultId = useMemo(
    () => accounts.find(a => a.type === 'Banco')?.id ?? accounts[0]?.id ?? '',
    [accounts],
  )
  const [accountId, setAccountId] = useState('')
  useEffect(() => { if (!accountId && defaultId) setAccountId(defaultId) }, [defaultId, accountId])

  const [saldoReal, setSaldoReal] = useState('')

  const account = useMemo(() => accounts.find(a => a.id === accountId), [accounts, accountId])
  const r = useMemo(
    () => (account ? reconciliar(account, transactions) : null),
    [account, transactions],
  )

  if (txLoading || accLoading) return (
    <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
  )

  const real = parseFloat(saldoReal)
  const hayReal = isFinite(real)
  const descuadre = hayReal && r ? real - r.balance : 0
  const cuadrado = Math.abs(descuadre) < 0.005

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Conciliación de Cuentas</h2>
          <p className="text-[#9ca3af] text-sm mt-0.5">Audita el saldo del sistema y compáralo con tu banco real</p>
        </div>
        <div className="w-full md:w-64">
          <Select
            options={accounts.map(a => ({ value: a.id, label: `${a.name} (${a.type})` }))}
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
          />
        </div>
      </div>

      {!r || !account ? (
        <Card className="p-10 text-center text-[#9ca3af]">Selecciona una cuenta.</Card>
      ) : (
        <>
          {/* Saldo del sistema + comparación con banco real */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={15} className="text-teal" />
                <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest">Saldo según el sistema</p>
              </div>
              <p className="text-4xl font-extrabold text-white">{formatMoney(r.balance)}</p>
              <p className="text-[#4b5563] text-xs mt-1">{account.name} · calculado sobre {r.movimientos.length} movimientos</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Scale size={15} className="text-amber" />
                <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest">Comparar con tu banco real</p>
              </div>
              <Input
                type="number"
                step="0.01"
                placeholder="Escribe el saldo real de tu cuenta…"
                value={saldoReal}
                onChange={e => setSaldoReal(e.target.value)}
              />
              {hayReal && (
                <div className={`mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold
                  ${cuadrado
                    ? 'bg-positive/5 border-positive/30 text-positive'
                    : 'bg-negative/5 border-negative/30 text-negative'}`}>
                  {cuadrado ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  {cuadrado
                    ? '¡Cuadrado! El sistema coincide con tu banco.'
                    : `Descuadre de ${formatMoney(Math.abs(descuadre))} — ${descuadre > 0 ? 'tu banco tiene MÁS (falta registrar ingresos)' : 'el sistema tiene MÁS (falta registrar egresos)'}`}
                </div>
              )}
            </Card>
          </div>

          {/* Desglose del saldo */}
          <Card className="p-6">
            <p className="text-white font-bold mb-2">¿De dónde sale el saldo?</p>
            <div className="divide-y divide-[#2A2F42]">
              <FilaDesglose label="Saldo inicial de la cuenta" valor={r.initial} signo="=" color="text-[#9ca3af]" />
              <FilaDesglose label="Ingresos directos" valor={r.income} signo="+"
                icon={<TrendingUp size={14} className="text-positive" />} color="text-positive" />
              <FilaDesglose label="Transferencias entrantes (ej. cobros de crédito)" valor={r.transferIn} signo="+"
                icon={<ArrowLeftRight size={14} className="text-teal" />} color="text-positive" />
              <FilaDesglose label="Egresos / gastos" valor={r.expense} signo="−"
                icon={<TrendingDown size={14} className="text-orange-red" />} color="text-orange-red" />
              <FilaDesglose label="Transferencias salientes" valor={r.transferOut} signo="−"
                icon={<ArrowLeftRight size={14} className="text-orange-red" />} color="text-orange-red" />
            </div>
            <div className="flex items-center justify-between pt-3 mt-2 border-t-2 border-[#2A2F42]">
              <span className="text-white font-bold">Saldo del sistema</span>
              <span className="text-2xl font-extrabold text-white font-mono">{formatMoney(r.balance)}</span>
            </div>
          </Card>

          {/* Ajustes manuales detectados */}
          {r.adjustments > 0 && (
            <Card className="p-5 border border-amber/30 bg-amber/5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber/10 rounded-xl shrink-0"><Wrench size={18} className="text-amber" /></div>
                <div>
                  <p className="text-white font-bold">Ajustes manuales detectados: {formatMoney(r.adjustments)}</p>
                  <p className="text-[#9ca3af] text-sm mt-0.5">
                    Egresos en categoría «Extras» o con nota de «corrección/ajuste». Son los plugs que metes para «cuadrar».
                    Si son muchos, conviene revisar qué movimiento real no se está registrando automáticamente.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Egresos por categoría */}
          <Card className="p-6">
            <p className="text-white font-bold mb-4">Egresos por categoría</p>
            <div className="space-y-2">
              {r.egresosPorCat.length === 0 && <p className="text-[#4b5563] text-sm">Sin egresos.</p>}
              {r.egresosPorCat.map(({ categoria, total }) => {
                const pct = r.expense > 0 ? (total / r.expense) * 100 : 0
                return (
                  <div key={categoria}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[#9ca3af]">{categoria}</span>
                      <span className="text-white font-mono font-semibold">{formatMoney(total)}</span>
                    </div>
                    <div className="h-1.5 bg-[#0E1420] rounded-full overflow-hidden">
                      <div className="h-full bg-orange-red/70 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Movimientos recientes con saldo corrido */}
          <Card className="p-6">
            <p className="text-white font-bold mb-4">Últimos movimientos (saldo corrido)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase tracking-wider">
                    <th className="px-3 py-2.5 rounded-l-xl font-semibold">Fecha</th>
                    <th className="px-3 py-2.5 font-semibold">Concepto</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Efecto</th>
                    <th className="px-3 py-2.5 text-right rounded-r-xl font-semibold">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2F42]">
                  {r.movimientos.slice(-25).reverse().map(m => {
                    const ajuste = m.type === 'Egreso' && esAjusteManual(m)
                    return (
                      <tr key={m.id} className="hover:bg-white/3">
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="text-white">{formatDate(m.date)}</div>
                          <div className="text-[#4b5563] text-xs">{formatTime(m.date)}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-white font-medium">{m.subcategory || m.category}</div>
                          <div className="flex items-center gap-1.5 text-xs text-[#4b5563]">
                            {m.category}
                            {ajuste && <span className="text-amber font-semibold">· ajuste</span>}
                            {m.client && <span>· {m.client}</span>}
                          </div>
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono font-bold ${m.efecto >= 0 ? 'text-positive' : 'text-orange-red'}`}>
                          {m.efecto >= 0 ? '+' : '−'}{formatMoney(Math.abs(m.efecto))}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[#9ca3af]">{formatMoney(m.saldo)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
