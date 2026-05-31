import { useMemo, useState } from 'react'
import { CreditCard, CheckCircle2, AlertCircle, Loader2, User, ChevronDown, ChevronUp } from 'lucide-react'
import { useTransactions, useCreateTransaction } from '@/hooks/queries/useTransactions'
import { useAccounts }  from '@/hooks/queries/useAccounts'
import { useBalances }  from '@/hooks/useBalances'
import { formatMoney }  from '@/utils/formatters'
import { nowISO }       from '@/utils/dates'
import { Card }    from '@/components/ui/Card'
import { Button }  from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Badge }   from '@/components/ui/Badge'

// ── Tipos internos ────────────────────────────────────────────────────────────

interface CreditEntry {
  id:     string
  date:   string
  client: string
  amount: number
}

interface ClientGroup {
  client:  string
  credits: CreditEntry[]
  total:   number
}

// ── Vista ─────────────────────────────────────────────────────────────────────

export function CreditsView() {
  const { data: transactions = [], isLoading: txLoading } = useTransactions()
  const { data: accounts     = [], isLoading: accLoading } = useAccounts()
  const createTx = useCreateTransaction()

  // Cuenta crédito (la única de tipo 'Crédito')
  const creditAccount = useMemo(
    () => accounts.find(a => a.type === 'Crédito'),
    [accounts],
  )

  // Cuentas destino para recibir el cobro (Efectivo o Banco)
  const destAccounts = useMemo(
    () => accounts.filter(a => a.type === 'Efectivo' || a.type === 'Banco'),
    [accounts],
  )

  const [destAccountId, setDestAccountId] = useState('')
  const [payingClient,  setPayingClient]  = useState<string | null>(null)   // cliente en proceso
  const [paidClients,   setPaidClients]   = useState<Set<string>>(new Set()) // feedback visual
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set())
  const [errorMsg,      setErrorMsg]      = useState('')

  // Cuenta destino activa (primer resultado si no hay selección)
  const activeDest = destAccountId || destAccounts[0]?.id || ''

  // ── Cálculo de créditos pendientes por cliente ────────────────────────────
  // Lógica: créditos adeudados = Ingresos al creditAccount con client != null
  //         créditos cobrados  = Transferencias DESDE creditAccount con client != null
  // Pendiente neto por cliente = adeudado - cobrado
  const clientGroups: ClientGroup[] = useMemo(() => {
    if (!creditAccount) return []

    // Mapa: client → lista de ingresos pendientes (aún no cobrados)
    const pending = new Map<string, CreditEntry[]>()

    // Primero: acumulamos todos los ingresos a la cuenta crédito con cliente
    for (const tx of transactions) {
      if (
        tx.accountId === creditAccount.id &&
        tx.type === 'Ingreso' &&
        tx.client
      ) {
        const list = pending.get(tx.client) ?? []
        list.push({ id: tx.id, date: tx.date, client: tx.client, amount: tx.amount })
        pending.set(tx.client, list)
      }
    }

    // Después: descontamos las transferencias ya cobradas (por cliente)
    // Una Transferencia DESDE la cuenta crédito reduce el pendiente de ese cliente
    const paidByClient = new Map<string, number>()
    for (const tx of transactions) {
      if (
        tx.accountId === creditAccount.id &&
        tx.type === 'Transferencia' &&
        tx.client
      ) {
        paidByClient.set(tx.client, (paidByClient.get(tx.client) ?? 0) + tx.amount)
      }
    }

    // Construimos grupos con el monto pendiente real
    const groups: ClientGroup[] = []
    for (const [client, credits] of pending.entries()) {
      const totalCredited = credits.reduce((s, c) => s + c.amount, 0)
      const totalPaid     = paidByClient.get(client) ?? 0
      const remaining     = Math.max(0, totalCredited - totalPaid)

      if (remaining > 0.005) {
        groups.push({ client, credits, total: remaining })
      }
    }

    return groups.sort((a, b) => b.total - a.total)
  }, [transactions, creditAccount])

  const totalPending = clientGroups.reduce((s, g) => s + g.total, 0)

  // Balance actual de la cuenta crédito (para mostrar en el header)
  const balances = useBalances(accounts, transactions)
  const creditBalance = useMemo(
    () => balances.find(b => b.accountId === creditAccount?.id)?.balance ?? 0,
    [balances, creditAccount],
  )

  // ── Cobrar crédito de un cliente (secuencial, sin duplicados) ─────────────
  /**
   * CRÍTICO: en v1 se usaba Promise.all() para cobrar múltiples créditos
   * simultáneamente, causando insercciones duplicadas en la BD.
   * Aquí procesamos cada pago de forma SECUENCIAL con for…await.
   */
  const handleCobrar = async (client: string, amount: number) => {
    if (!creditAccount || !activeDest || payingClient) return
    setErrorMsg('')
    setPayingClient(client)

    try {
      // Un solo registro: Transferencia del monto total pendiente del cliente
      // Desde cuenta crédito → cuenta destino (efectivo o banco)
      await createTx.mutateAsync({
        date:          nowISO(),
        type:          'Transferencia',
        category:      'Crédito',
        subcategory:   'Cobro de crédito',
        amount,
        accountId:     creditAccount.id,
        toAccountId:   activeDest,
        client,
        description:   `Cobro de crédito: ${client}`,
        hasAttachment: false,
      })

      setPaidClients(prev => new Set(prev).add(client))
    } catch (err) {
      setErrorMsg(`Error cobrando a ${client}. Intenta nuevamente.`)
    } finally {
      setPayingClient(null)
    }
  }

  const handleCobrarTodo = async () => {
    if (!creditAccount || !activeDest || payingClient) return
    setErrorMsg('')

    // ✅ Fix: procesar SECUENCIALMENTE — nunca con Promise.all()
    for (const group of clientGroups) {
      if (paidClients.has(group.client)) continue
      await handleCobrar(group.client, group.total)
    }
  }

  const toggleExpand = (client: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(client) ? next.delete(client) : next.add(client)
      return next
    })
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (txLoading || accLoading) {
    return (
      <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
    )
  }

  // Sin cuenta crédito configurada
  if (!creditAccount) {
    return (
      <div className="space-y-6 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Créditos</h2>
        </div>
        <Card className="p-10 flex flex-col items-center gap-4 text-center">
          <AlertCircle size={40} className="text-amber" />
          <p className="text-white font-bold">No hay cuenta de crédito</p>
          <p className="text-[#9ca3af] text-sm">
            Crea una cuenta de tipo <span className="text-amber font-semibold">Crédito</span> en Configuración para gestionar créditos.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white">Créditos</h2>
        <p className="text-[#9ca3af] text-sm mt-0.5">Gestión de cobros pendientes por cliente</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border border-amber/20 bg-amber/5">
          <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">
            Total pendiente
          </p>
          <p className="text-3xl font-extrabold text-amber">{formatMoney(totalPending)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">
            Clientes con deuda
          </p>
          <p className="text-3xl font-extrabold text-white">{clientGroups.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">
            Saldo cuenta crédito
          </p>
          <p className={`text-3xl font-extrabold ${creditBalance > 0 ? 'text-amber' : 'text-positive'}`}>
            {formatMoney(creditBalance)}
          </p>
        </Card>
      </div>

      {/* Sin créditos pendientes */}
      {clientGroups.length === 0 && (
        <Card className="p-10 flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-positive/10 rounded-2xl">
            <CheckCircle2 size={40} className="text-positive" />
          </div>
          <p className="text-white font-bold text-lg">¡Sin créditos pendientes!</p>
          <p className="text-[#9ca3af] text-sm">Todos los créditos han sido cobrados.</p>
        </Card>
      )}

      {/* Panel de cobro */}
      {clientGroups.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Selector de cuenta destino */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2 px-1">
                Depositar cobros en
              </label>
              <select
                value={activeDest}
                onChange={e => setDestAccountId(e.target.value)}
                className="w-full bg-[#0E1420] text-white px-4 py-2.5 rounded-xl border border-[#2A2F42] focus:border-teal focus:ring-1 focus:ring-teal/30 outline-none transition-all appearance-none"
              >
                {destAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>

            {/* Cobrar todo */}
            <Button
              onClick={handleCobrarTodo}
              loading={payingClient !== null}
              disabled={paidClients.size === clientGroups.length}
              className="shrink-0"
            >
              <CreditCard size={15} />
              Cobrar todo ({formatMoney(totalPending)})
            </Button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 bg-negative/10 border border-negative/30 text-negative text-sm px-4 py-2.5 rounded-xl">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}
        </Card>
      )}

      {/* Lista de clientes */}
      {clientGroups.map(group => {
        const isPaying = payingClient === group.client
        const isPaid   = paidClients.has(group.client)
        const isOpen   = expanded.has(group.client)

        return (
          <Card key={group.client} className={`
            overflow-hidden transition-all
            ${isPaid ? 'opacity-60 border-positive/30' : ''}
          `}>
            {/* Fila principal del cliente */}
            <div className="flex items-center gap-4 p-5">
              {/* Avatar */}
              <div className={`
                p-3 rounded-xl shrink-0
                ${isPaid ? 'bg-positive/10' : 'bg-amber/10'}
              `}>
                {isPaid
                  ? <CheckCircle2 size={20} className="text-positive" />
                  : <User size={20} className="text-amber" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base truncate">{group.client}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={isPaid ? 'success' : 'warning'}>
                    {isPaid ? 'Cobrado' : `${group.credits.length} crédito${group.credits.length > 1 ? 's' : ''}`}
                  </Badge>
                </div>
              </div>

              {/* Monto + acciones */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className={`text-xl font-extrabold ${isPaid ? 'text-positive' : 'text-amber'}`}>
                    {formatMoney(group.total)}
                  </p>
                  <p className="text-[#4b5563] text-xs">pendiente</p>
                </div>

                {!isPaid && (
                  <Button
                    size="sm"
                    onClick={() => handleCobrar(group.client, group.total)}
                    loading={isPaying}
                    disabled={payingClient !== null && !isPaying}
                  >
                    {isPaying ? '' : 'Cobrar'}
                  </Button>
                )}

                <button
                  onClick={() => toggleExpand(group.client)}
                  className="p-2 text-[#4b5563] hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>
            </div>

            {/* Detalle de créditos del cliente */}
            {isOpen && (
              <div className="border-t border-[#2A2F42]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase">
                      <th className="px-5 py-2 text-left font-semibold">Fecha</th>
                      <th className="px-5 py-2 text-right font-semibold">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2F42]">
                    {group.credits.map(c => (
                      <tr key={c.id} className="hover:bg-white/2">
                        <td className="px-5 py-2.5 text-[#9ca3af]">
                          {new Date(c.date).toLocaleDateString('es-EC', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-2.5 text-right text-amber font-bold font-mono">
                          {formatMoney(c.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#0E1420]">
                      <td className="px-5 py-2 text-[#9ca3af] text-xs font-bold uppercase">Total adeudado</td>
                      <td className="px-5 py-2 text-right font-extrabold text-amber">
                        {formatMoney(group.credits.reduce((s, c) => s + c.amount, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
