import { useMemo, useState } from 'react'
import { Search, Trash2, Pencil, Save, X, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import { useTransactions, useDeleteTransaction, useUpdateTransaction } from '@/hooks/queries/useTransactions'
import { useAccounts }    from '@/hooks/queries/useAccounts'
import { useCategories }  from '@/hooks/queries/useCategories'
import { useModalStore }  from '@/store/useModalStore'
import { formatMoney, formatDate, formatTime } from '@/utils/formatters'
import { Card }    from '@/components/ui/Card'
import { Select }  from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Badge }   from '@/components/ui/Badge'
import { Modal }   from '@/components/ui/Modal'
import { Button }  from '@/components/ui/Button'
import { Input }   from '@/components/ui/Input'
import type { Transaction, TransactionType } from '@/types'

// ── Modal de edición ─────────────────────────────────────────────────────────
interface EditModalProps {
  tx:         Transaction
  accounts:   { id: string; name: string }[]
  categories: { name: string }[]
  onSave:     (t: Transaction) => void
  onClose:    () => void
}

function EditModal({ tx, accounts, categories, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState({
    date:        tx.date.split('T')[0],
    type:        tx.type        as TransactionType,
    accountId:   tx.accountId,
    category:    tx.category,
    subcategory: tx.subcategory,
    amount:      tx.amount.toString(),
    description: tx.description ?? '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    const amount = parseFloat(form.amount)
    if (!isFinite(amount) || amount <= 0) return
    onSave({
      ...tx,
      date:        new Date(form.date).toISOString(),
      type:        form.type,
      accountId:   form.accountId,
      category:    form.category,
      subcategory: form.subcategory,
      amount,
      description: form.description,
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Editar Movimiento" size="md">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Fecha" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          <Select
            label="Tipo"
            value={form.type}
            onChange={e => set('type', e.target.value)}
            options={[
              { value: 'Ingreso',       label: 'Ingreso'       },
              { value: 'Egreso',        label: 'Egreso'        },
              { value: 'Transferencia', label: 'Transferencia' },
            ]}
          />
        </div>
        <Select
          label="Cuenta"
          value={form.accountId}
          onChange={e => set('accountId', e.target.value)}
          options={accounts.map(a => ({ value: a.id, label: a.name }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Categoría"
            value={form.category}
            onChange={e => set('category', e.target.value)}
            options={categories.map(c => ({ value: c.name, label: c.name }))}
          />
          <Input
            label="Subcategoría"
            value={form.subcategory}
            onChange={e => set('subcategory', e.target.value)}
          />
        </div>
        <Input
          label="Monto ($)"
          type="number" min="0" step="0.01"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
        />
        <Input
          label="Descripción"
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSave}>
            <Save size={15} /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────
export function HistoryView() {
  const { data: transactions = [], isLoading } = useTransactions()
  const { data: accounts     = [] }            = useAccounts()
  const { data: categories   = [] }            = useCategories()
  const deleteTx    = useDeleteTransaction()
  const updateTx    = useUpdateTransaction()
  const openConfirm = useModalStore(s => s.openConfirm)

  const [search,      setSearch]      = useState('')
  const [filterAcc,   setFilterAcc]   = useState('')
  const [filterType,  setFilterType]  = useState('')
  const [filterCat,   setFilterCat]   = useState('')
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')
  const [editingTx,   setEditingTx]   = useState<Transaction | null>(null)
  const [page,        setPage]        = useState(1)
  const PER_PAGE = 20

  const categoryOptions = useMemo(
    () => [...new Set(transactions.map(t => t.category))].sort().map(c => ({ value: c, label: c })),
    [transactions],
  )

  const filtered = useMemo(() => {
    const q    = search.toLowerCase()
    const from = startDate ? new Date(startDate).getTime() : null
    const to   = endDate   ? new Date(endDate + 'T23:59:59').getTime() : null

    return transactions.filter(t => {
      if (filterAcc  && t.accountId !== filterAcc)  return false
      if (filterType && t.type      !== filterType)  return false
      if (filterCat  && t.category  !== filterCat)   return false
      if (from && new Date(t.date).getTime() < from) return false
      if (to   && new Date(t.date).getTime() > to)   return false
      if (q && ![t.category, t.subcategory, t.description, t.client]
        .some(s => s?.toLowerCase().includes(q))) return false
      return true
    })
  }, [transactions, filterAcc, filterType, filterCat, search, startDate, endDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const resetFilters = () => {
    setSearch(''); setFilterAcc(''); setFilterType('')
    setFilterCat(''); setStartDate(''); setEndDate(''); setPage(1)
  }
  const hasFilters = search || filterAcc || filterType || filterCat || startDate || endDate

  if (isLoading) return (
    <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
  )

  return (
    <>
    <div className="space-y-5 pb-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Historial</h2>
        <p className="text-[#9ca3af] text-sm mt-0.5">{filtered.length} de {transactions.length} movimientos</p>
      </div>

      {/* Filtros */}
      <Card className="p-4 space-y-3">
        {/* Fila 1: búsqueda + tipo + cuenta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563]" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar descripción, cliente…"
              className="w-full bg-[#0E1420] text-white pl-8 pr-4 py-2.5 rounded-xl border border-[#2A2F42] focus:outline-none focus:border-teal text-sm placeholder:text-[#4b5563]"
            />
          </div>
          <Select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1) }}
            placeholder="Todos los tipos"
            options={[
              { value: 'Ingreso',       label: 'Ingresos'       },
              { value: 'Egreso',        label: 'Egresos'        },
              { value: 'Transferencia', label: 'Transferencias' },
            ]}
          />
          <Select
            value={filterAcc}
            onChange={e => { setFilterAcc(e.target.value); setPage(1) }}
            placeholder="Todas las cuentas"
            options={accounts.map(a => ({ value: a.id, label: a.name }))}
          />
        </div>

        {/* Fila 2: categoría + fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            value={filterCat}
            onChange={e => { setFilterCat(e.target.value); setPage(1) }}
            placeholder="Todas las categorías"
            options={categoryOptions}
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1) }}
              className="flex-1 bg-[#0E1420] text-white px-3 py-2.5 rounded-xl border border-[#2A2F42] focus:outline-none focus:border-teal text-sm"
            />
            <span className="text-[#4b5563] text-xs shrink-0">hasta</span>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPage(1) }}
              className="flex-1 bg-[#0E1420] text-white px-3 py-2.5 rounded-xl border border-[#2A2F42] focus:outline-none focus:border-teal text-sm"
            />
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs text-teal hover:underline px-1">
              <X size={12} /> Limpiar filtros
            </button>
          )}
        </div>
      </Card>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold">Categoría</th>
                <th className="px-4 py-3 text-left font-semibold">Cuenta</th>
                <th className="px-4 py-3 text-right font-semibold">Monto</th>
                <th className="px-3 py-3 text-center w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2F42]">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#4b5563] italic">Sin movimientos</td>
                </tr>
              )}
              {paginated.map(tx => {
                const accName = accounts.find(a => a.id === tx.accountId)?.name ?? '—'
                const isIn  = tx.type === 'Ingreso'
                const isOut = tx.type === 'Egreso'
                return (
                  <tr key={tx.id} className="hover:bg-white/3 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{formatDate(tx.date)}</p>
                      <p className="text-[#4b5563] text-xs">{formatTime(tx.date)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isIn  ? <TrendingUp    size={13} className="text-positive shrink-0" />
                               : isOut
                                  ? <TrendingDown  size={13} className="text-orange-red shrink-0" />
                                  : <ArrowLeftRight size={13} className="text-teal shrink-0" />}
                        <Badge variant={isIn ? 'success' : isOut ? 'danger' : 'info'}>{tx.type}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium truncate max-w-[200px]">
                        {tx.subcategory || tx.category}
                      </p>
                      {tx.client && <p className="text-amber text-xs">{tx.client}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#9ca3af] bg-[#0E1420] px-2 py-1 rounded-lg border border-[#2A2F42]">
                        {accName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className={`font-bold ${isIn ? 'text-positive' : isOut ? 'text-orange-red' : 'text-teal'}`}>
                        {isIn ? '+' : isOut ? '-' : ''}{formatMoney(tx.amount)}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingTx(tx)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-[#4b5563] hover:text-teal hover:bg-teal/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => openConfirm(
                            'Eliminar movimiento',
                            `¿Eliminar "${tx.subcategory || tx.category}"? Esta acción no se puede deshacer.`,
                            () => deleteTx.mutate(tx.id),
                          )}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-[#4b5563] hover:text-negative hover:bg-negative/10 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2F42]">
            <p className="text-[#9ca3af] text-xs">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white disabled:opacity-30 hover:bg-white/10">
                ← Anterior
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white disabled:opacity-30 hover:bg-white/10">
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>

    {editingTx && (
      <EditModal
        tx={editingTx}
        accounts={accounts}
        categories={categories}
        onSave={t => updateTx.mutate(t)}
        onClose={() => setEditingTx(null)}
      />
    )}
    </>
  )
}
