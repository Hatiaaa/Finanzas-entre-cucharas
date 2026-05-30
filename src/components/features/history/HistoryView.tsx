import { useMemo, useState } from 'react'
import { Search, Trash2, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import { useTransactions, useDeleteTransaction } from '@/hooks/queries/useTransactions'
import { useAccounts }                           from '@/hooks/queries/useAccounts'
import { useModalStore }                         from '@/store/useModalStore'
import { formatMoney, formatDate, formatTime }   from '@/utils/formatters'
import { Card }    from '@/components/ui/Card'
import { Input }   from '@/components/ui/Input'
import { Select }  from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Badge }   from '@/components/ui/Badge'

export function HistoryView() {
  const { data: transactions = [], isLoading } = useTransactions()
  const { data: accounts     = [] }            = useAccounts()
  const deleteTx    = useDeleteTransaction()
  const openConfirm = useModalStore(s => s.openConfirm)

  const [search,     setSearch]     = useState('')
  const [filterAcc,  setFilterAcc]  = useState('')
  const [filterType, setFilterType] = useState('')
  const [page,       setPage]       = useState(1)
  const PER_PAGE = 20

  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }))

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return transactions.filter(t => {
      if (filterAcc  && t.accountId !== filterAcc)  return false
      if (filterType && t.type      !== filterType)  return false
      if (q && ![t.category, t.subcategory, t.description, t.client]
        .some(s => s?.toLowerCase().includes(q)))   return false
      return true
    })
  }, [transactions, filterAcc, filterType, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleDelete = (id: string, label: string) =>
    openConfirm(
      'Eliminar movimiento',
      `¿Eliminar "${label}"? Esta acción no se puede deshacer.`,
      () => deleteTx.mutate(id),
    )

  const reset = () => { setSearch(''); setFilterAcc(''); setFilterType(''); setPage(1) }

  if (isLoading) return (
    <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
  )

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Historial</h2>
        <p className="text-[#9ca3af] text-sm mt-0.5">{filtered.length} movimientos</p>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563]" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar…"
              className="w-full bg-[#0E1420] text-white pl-8 pr-4 py-2.5 rounded-xl border border-[#2A2F42] focus:outline-none focus:border-teal text-sm placeholder:text-[#4b5563]"
            />
          </div>
          <Select
            value={filterAcc}
            onChange={e => { setFilterAcc(e.target.value); setPage(1) }}
            placeholder="Todas las cuentas"
            options={accountOptions}
          />
          <Select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1) }}
            placeholder="Todos los tipos"
            options={[
              { value: 'Ingreso',       label: 'Ingresos'      },
              { value: 'Egreso',        label: 'Egresos'       },
              { value: 'Transferencia', label: 'Transferencias'},
            ]}
          />
        </div>
        {(search || filterAcc || filterType) && (
          <button onClick={reset} className="mt-2 text-xs text-teal hover:underline">
            Limpiar filtros
          </button>
        )}
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
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2F42]">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#4b5563] italic">
                    No hay movimientos
                  </td>
                </tr>
              )}
              {paginated.map(tx => {
                const accName = accounts.find(a => a.id === tx.accountId)?.name ?? '—'
                const isIn    = tx.type === 'Ingreso'
                const isOut   = tx.type === 'Egreso'
                return (
                  <tr key={tx.id} className="hover:bg-white/3 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{formatDate(tx.date)}</p>
                      <p className="text-[#4b5563] text-xs">{formatTime(tx.date)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isIn
                          ? <TrendingUp  size={13} className="text-positive shrink-0" />
                          : isOut
                            ? <TrendingDown size={13} className="text-orange-red shrink-0" />
                            : <ArrowLeftRight size={13} className="text-teal shrink-0" />
                        }
                        <Badge variant={isIn ? 'success' : isOut ? 'danger' : 'info'}>
                          {tx.type}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium truncate max-w-[180px]">
                        {tx.subcategory || tx.category}
                      </p>
                      {tx.client && (
                        <p className="text-amber text-xs">{tx.client}</p>
                      )}
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
                      <button
                        onClick={() => handleDelete(tx.id, tx.subcategory || tx.category)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[#4b5563] hover:text-negative hover:bg-negative/10 rounded-lg transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2F42]">
            <p className="text-[#9ca3af] text-xs">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white disabled:opacity-30 hover:bg-white/10"
              >
                ← Anterior
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white disabled:opacity-30 hover:bg-white/10"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
