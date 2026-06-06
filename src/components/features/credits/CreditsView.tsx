import { useMemo, useState } from 'react'
import {
  CreditCard, CheckCircle2, AlertCircle, User,
  ChevronDown, ChevronUp, Trash2, Pencil, Save, X,
} from 'lucide-react'
import {
  useTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from '@/hooks/queries/useTransactions'
import { useAccounts }   from '@/hooks/queries/useAccounts'
import { useBalances }   from '@/hooks/useBalances'
import { useModalStore } from '@/store/useModalStore'
import { formatMoney }   from '@/utils/formatters'
import { normalizeKey }  from '@/utils/normalize'
import { Card }    from '@/components/ui/Card'
import { Button }  from '@/components/ui/Button'
import { Modal }   from '@/components/ui/Modal'
import { Input }   from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Badge }   from '@/components/ui/Badge'
import type { Transaction } from '@/types'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface CreditEntry {
  id:      string
  date:    string
  client:  string
  product: string   // subcategory del producto
  amount:  number
}

interface ClientGroup {
  client:  string
  credits: CreditEntry[]
  total:   number
}

// ── Modal: seleccionar cuenta para cobrar ──────────────────────────────────────

interface CobroModalProps {
  amount:      number
  client:      string
  product?:    string   // si es cobro de una sola tx
  accounts:    { id: string; name: string; type: string }[]
  onConfirm:   (accountId: string, amount: number) => void
  onClose:     () => void
  loading:     boolean
}

function CobroModal({ amount, client, product, accounts, onConfirm, onClose, loading }: CobroModalProps) {
  const [destId,      setDestId]      = useState(accounts[0]?.id ?? '')
  const [inputAmount, setInputAmount] = useState(String(amount))

  const parsed    = parseFloat(inputAmount)
  const isValid   = destId && isFinite(parsed) && parsed > 0 && parsed <= amount
  const isPartial = isFinite(parsed) && parsed < amount

  return (
    <Modal open onClose={onClose} title="Cobrar crédito" size="sm">
      <div className="p-6 space-y-4">
        {/* Info cliente */}
        <div className="bg-[#0E1420] rounded-xl p-3 space-y-0.5">
          <p className="text-[#9ca3af] text-xs">Cliente</p>
          <p className="text-white font-bold">{client}</p>
          {product && <p className="text-amber text-xs">{product}</p>}
          <p className="text-[#4b5563] text-xs mt-1">
            Pendiente total: <span className="text-amber font-semibold">{formatMoney(amount)}</span>
          </p>
        </div>

        {/* Monto a cobrar */}
        <Input
          label="Monto a cobrar ($)"
          type="number"
          min="0.01"
          step="0.01"
          max={amount}
          value={inputAmount}
          onChange={e => setInputAmount(e.target.value)}
          hint={isPartial ? `Cobro parcial — quedarán ${formatMoney(amount - parsed)} pendientes` : undefined}
          error={isFinite(parsed) && parsed > amount ? `No puede superar ${formatMoney(amount)}` : undefined}
        />

        {/* Cuenta destino */}
        <div>
          <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2 px-1">
            Depositar en
          </label>
          <select
            value={destId}
            onChange={e => setDestId(e.target.value)}
            className="w-full bg-[#0E1420] text-white px-4 py-2.5 rounded-xl border border-[#2A2F42] focus:outline-none focus:border-teal text-sm appearance-none"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            <X size={14}/> Cancelar
          </Button>
          <Button
            className="flex-1"
            loading={loading}
            disabled={!isValid}
            onClick={() => onConfirm(destId, parsed)}
          >
            <CreditCard size={14}/>
            {isPartial ? `Cobrar ${formatMoney(parsed)}` : 'Cobrar todo'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Modal: editar crédito ──────────────────────────────────────────────────────

interface EditModalProps {
  entry:    CreditEntry
  onSave:   (updated: Partial<CreditEntry>) => void
  onClose:  () => void
  loading:  boolean
}

function EditCreditModal({ entry, onSave, onClose, loading }: EditModalProps) {
  const [product, setProduct] = useState(entry.product)
  const [amount,  setAmount]  = useState(String(entry.amount))
  const [date,    setDate]    = useState(entry.date.split('T')[0])

  const isValid = product.trim() !== '' && Number(amount) > 0

  return (
    <Modal open onClose={onClose} title="Editar crédito" size="sm">
      <div className="p-6 space-y-4">
        <Input
          label="Producto"
          value={product}
          onChange={e => setProduct(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Monto ($)" type="number" min="0" step="0.01"
            value={amount} onChange={e => setAmount(e.target.value)} />
          <Input label="Fecha" type="date"
            value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            <X size={14}/> Cancelar
          </Button>
          <Button className="flex-1" loading={loading} disabled={!isValid}
            onClick={() => onSave({ product: product.trim(), amount: Number(amount), date })}>
            <Save size={14}/> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Vista principal ────────────────────────────────────────────────────────────

export function CreditsView() {
  const { data: transactions = [], isLoading: txLoading } = useTransactions()
  const { data: accounts     = [], isLoading: accLoading } = useAccounts()
  const createTx = useCreateTransaction()
  const deleteTx = useDeleteTransaction()
  const updateTx = useUpdateTransaction()
  const openConfirm = useModalStore(s => s.openConfirm)

  const creditAccount = useMemo(() => accounts.find(a => a.type === 'Crédito'), [accounts])
  const destAccounts  = useMemo(() => accounts.filter(a => a.type === 'Efectivo' || a.type === 'Banco'), [accounts])

  const [expanded,    setExpanded]    = useState<Set<string>>(new Set())
  const [errorMsg,    setErrorMsg]    = useState('')

  // Estado para modal de cobro
  const [cobroModal, setCobroModal] = useState<{
    client: string; amount: number; product?: string; txId?: string
  } | null>(null)
  const [cobroLoading, setCobroLoading] = useState(false)

  // Estado para edición de crédito individual
  const [editEntry, setEditEntry] = useState<CreditEntry | null>(null)

  // ── Cálculo de créditos pendientes ──────────────────────────────────────
  const clientGroups: ClientGroup[] = useMemo(() => {
    if (!creditAccount) return []

    const pending = new Map<string, { displayName: string; entries: CreditEntry[] }>()

    for (const tx of transactions) {
      if (tx.accountId === creditAccount.id && tx.type === 'Ingreso' && tx.client) {
        const key = normalizeKey(tx.client)
        const ex  = pending.get(key) ?? { displayName: tx.client, entries: [] }
        ex.entries.push({
          id:      tx.id,
          date:    tx.date,
          client:  tx.client,
          product: tx.subcategory || tx.category || '—',
          amount:  tx.amount,
        })
        pending.set(key, ex)
      }
    }

    // Elegir displayName con más apariciones
    for (const [key, val] of pending.entries()) {
      const freq = new Map<string, number>()
      for (const e of val.entries) freq.set(e.client, (freq.get(e.client) ?? 0) + 1)
      let top = val.displayName, topN = 0
      for (const [name, n] of freq) { if (n > topN) { top = name; topN = n } }
      pending.set(key, { ...val, displayName: top })
    }

    // Restar pagos ya cobrados
    const paidByClient = new Map<string, number>()
    for (const tx of transactions) {
      if (tx.accountId === creditAccount.id && tx.type === 'Transferencia' && tx.client) {
        const key = normalizeKey(tx.client)
        paidByClient.set(key, (paidByClient.get(key) ?? 0) + tx.amount)
      }
    }

    const groups: ClientGroup[] = []
    for (const [key, { displayName, entries }] of pending.entries()) {
      const totalCredited = entries.reduce((s, c) => s + c.amount, 0)
      const totalPaid     = paidByClient.get(key) ?? 0
      const remaining     = Math.max(0, totalCredited - totalPaid)
      if (remaining > 0.005) {
        groups.push({ client: displayName, credits: entries, total: remaining })
      }
    }
    return groups.sort((a, b) => b.total - a.total)
  }, [transactions, creditAccount])

  const totalPending = clientGroups.reduce((s, g) => s + g.total, 0)
  const balances     = useBalances(accounts, transactions)
  const creditBalance = useMemo(
    () => balances.find(b => b.accountId === creditAccount?.id)?.balance ?? 0,
    [balances, creditAccount],
  )

  // ── Cobrar (individual o total del cliente) ──────────────────────────────
  // MODELO: "liquidar líneas". Un crédito es un Ingreso en la cuenta Crédito.
  // Cobrarlo = sacar ESA línea de la cuenta Crédito (moverla a Efectivo/Banco).
  // Así la línea desaparece de la deuda y el detalle siempre cuadra con el total.
  // No se crean Transferencias "Cobro de crédito" (ese modelo dejaba pagos
  // sueltos que descuadraban el detalle y hacían desaparecer tarjetas al borrar).
  const ejecutarCobro = async (client: string, amount: number, destAccountId: string, txId?: string) => {
    if (!creditAccount) return
    setCobroLoading(true)
    setErrorMsg('')
    try {
      // Determinar qué línea(s) de crédito liquidar.
      let lineas: CreditEntry[]
      if (txId) {
        const one = transactions.find(t => t.id === txId)
        if (!one) throw new Error('Crédito no encontrado')
        lineas = [{
          id: one.id, date: one.date, client: one.client ?? client,
          product: one.subcategory || one.category || '—', amount: one.amount,
        }]
      } else {
        // Cobro del cliente completo: liquidar sus líneas (más antiguas primero).
        const grupo = clientGroups.find(g => g.client === client)
        lineas = grupo ? [...grupo.credits].sort((a, b) => a.date.localeCompare(b.date)) : []
      }

      let restante = amount
      for (const linea of lineas) {
        if (restante <= 0.005) break
        const full = transactions.find(t => t.id === linea.id)
        if (!full) continue

        if (restante >= linea.amount - 0.005) {
          // Cobro total de esta línea: la movemos fuera de Crédito.
          await updateTx.mutateAsync({
            ...full,
            accountId:   destAccountId,
            type:        'Ingreso',
            description: `Cobro de crédito: ${full.subcategory || 'Crédito'}`,
          })
          restante -= linea.amount
        } else {
          // Cobro parcial de esta línea: la dividimos.
          //  · la original se queda en Crédito con el saldo restante
          //  · se crea un Ingreso en la cuenta destino por lo cobrado
          const pagado = +restante.toFixed(2)
          await updateTx.mutateAsync({
            ...full,
            amount: +(linea.amount - pagado).toFixed(2),
          })
          await createTx.mutateAsync({
            date:          full.date,
            type:          'Ingreso',
            category:      full.category || 'Crédito',
            subcategory:   full.subcategory || 'Crédito',
            amount:        pagado,
            accountId:     destAccountId,
            client,
            description:   `Cobro parcial de crédito: ${full.subcategory || 'Crédito'}`,
            hasAttachment: false,
          })
          restante = 0
        }
      }
      setCobroModal(null)
    } catch {
      setErrorMsg(`Error al cobrar a ${client}. Intenta nuevamente.`)
    } finally {
      setCobroLoading(false)
    }
  }

  // ── Eliminar crédito individual ──────────────────────────────────────────
  const handleDeleteCredit = (entry: CreditEntry) => {
    openConfirm(
      'Eliminar crédito',
      `¿Eliminar el crédito de ${formatMoney(entry.amount)} (${entry.product}) de ${entry.client}?`,
      () => {
        deleteTx.mutate(entry.id)
      },
    )
  }

  // ── Editar crédito individual ────────────────────────────────────────────
  const handleSaveEdit = async (updated: Partial<CreditEntry>) => {
    if (!editEntry) return
    const full = transactions.find(t => t.id === editEntry.id)
    if (!full) return
    await updateTx.mutateAsync({
      ...full,
      subcategory: updated.product ?? full.subcategory,
      amount:      updated.amount  ?? full.amount,
      date:        updated.date    ? new Date(updated.date + 'T12:00:00').toISOString() : full.date,
    } as Transaction)
    setEditEntry(null)
  }

  const toggleExpand = (client: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(client) ? n.delete(client) : n.add(client); return n })

  if (txLoading || accLoading) return (
    <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
  )

  if (!creditAccount) return (
    <div className="space-y-6 pb-6">
      <div><h2 className="text-2xl font-extrabold text-white">Créditos</h2></div>
      <Card className="p-10 flex flex-col items-center gap-4 text-center">
        <AlertCircle size={40} className="text-amber" />
        <p className="text-white font-bold">No hay cuenta de crédito</p>
        <p className="text-[#9ca3af] text-sm">Crea una cuenta de tipo <span className="text-amber font-semibold">Crédito</span> en Configuración.</p>
      </Card>
    </div>
  )

  return (
    <>
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white">Créditos</h2>
        <p className="text-[#9ca3af] text-sm mt-0.5">Gestión de cobros pendientes por cliente</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 sm:p-5 border border-amber/20 bg-amber/5">
          <p className="text-[#9ca3af] text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1">Pendiente</p>
          <p className="text-lg sm:text-3xl font-extrabold text-amber">{formatMoney(totalPending)}</p>
        </Card>
        <Card className="p-3 sm:p-5">
          <p className="text-[#9ca3af] text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1">Clientes</p>
          <p className="text-lg sm:text-3xl font-extrabold text-white">{clientGroups.length}</p>
        </Card>
        <Card className="p-3 sm:p-5">
          <p className="text-[#9ca3af] text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1">Saldo cta.</p>
          <p className={`text-lg sm:text-3xl font-extrabold ${creditBalance > 0 ? 'text-amber' : 'text-positive'}`}>
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
        </Card>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 bg-negative/10 border border-negative/30 text-negative text-sm px-4 py-2.5 rounded-xl">
          <AlertCircle size={14}/> {errorMsg}
        </div>
      )}

      {/* Lista de clientes */}
      {clientGroups.map(group => {
        const isOpen = expanded.has(group.client)
        return (
          <Card key={group.client} className="overflow-hidden">
            {/* Fila del cliente — 2 filas en mobile, 1 en desktop */}
            <div className="p-4 space-y-3">
              {/* Fila 1: avatar + nombre + badge + chevron */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber/10 rounded-xl shrink-0">
                  <User size={18} className="text-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base truncate">{group.client}</p>
                  <Badge variant="warning" className="mt-0.5">
                    {group.credits.length} crédito{group.credits.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                <button
                  onClick={() => toggleExpand(group.client)}
                  className="p-2 text-[#4b5563] hover:text-white hover:bg-white/5 rounded-xl transition-all shrink-0"
                >
                  {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
              </div>

              {/* Fila 2: monto + botón cobrar */}
              <div className="flex items-center justify-between pl-1">
                <div>
                  <p className="text-2xl font-extrabold text-amber">{formatMoney(group.total)}</p>
                  <p className="text-[#4b5563] text-xs">pendiente</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setCobroModal({ client: group.client, amount: group.total })}
                >
                  <CreditCard size={13}/> Cobrar
                </Button>
              </div>
            </div>

            {/* Detalle de créditos */}
            {isOpen && (
              <div className="border-t border-[#2A2F42]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase">
                      <th className="px-5 py-2.5 text-left font-semibold">Fecha</th>
                      <th className="px-5 py-2.5 text-left font-semibold">Producto</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Monto</th>
                      <th className="px-5 py-2.5 text-center font-semibold w-32">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2F42]">
                    {group.credits.map(c => (
                      <tr key={c.id} className="hover:bg-white/2 group">
                        <td className="px-5 py-3 text-[#9ca3af] whitespace-nowrap">
                          {new Date(c.date).toLocaleDateString('es-EC', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-3 text-white font-medium">
                          {c.product}
                        </td>
                        <td className="px-5 py-3 text-right text-amber font-bold font-mono">
                          {formatMoney(c.amount)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {/* Cobrar esta transacción */}
                            <button
                              onClick={() => setCobroModal({
                                client:  c.client,
                                amount:  c.amount,
                                product: c.product,
                                txId:    c.id,
                              })}
                              className="p-1.5 text-[#4b5563] hover:text-teal hover:bg-teal/10 rounded-lg transition-all"
                              title="Cobrar este crédito"
                            >
                              <CreditCard size={13}/>
                            </button>
                            {/* Editar */}
                            <button
                              onClick={() => setEditEntry(c)}
                              className="p-1.5 text-[#4b5563] hover:text-amber hover:bg-amber/10 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Pencil size={13}/>
                            </button>
                            {/* Eliminar */}
                            <button
                              onClick={() => handleDeleteCredit(c)}
                              className="p-1.5 text-[#4b5563] hover:text-negative hover:bg-negative/10 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#0E1420]">
                      <td colSpan={2} className="px-5 py-2 text-[#9ca3af] text-xs font-bold uppercase text-right">
                        Total adeudado
                      </td>
                      <td className="px-5 py-2 text-right font-extrabold text-amber font-mono">
                        {formatMoney(group.total)}
                      </td>
                      <td/>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )
      })}
    </div>

    {/* Modal de cobro */}
    {cobroModal && (
      <CobroModal
        amount={cobroModal.amount}
        client={cobroModal.client}
        product={cobroModal.product}
        accounts={destAccounts}
        loading={cobroLoading}
        onConfirm={(destId, amt) => ejecutarCobro(cobroModal.client, amt, destId, cobroModal.txId)}
        onClose={() => setCobroModal(null)}
      />
    )}

    {/* Modal de edición */}
    {editEntry && (
      <EditCreditModal
        entry={editEntry}
        loading={updateTx.isPending}
        onSave={handleSaveEdit}
        onClose={() => setEditEntry(null)}
      />
    )}
    </>
  )
}
