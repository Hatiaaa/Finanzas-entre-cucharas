import { useMemo, useState, useEffect } from 'react'
import { History, Trash2, Bot, Settings2, Eye, ChevronLeft, ChevronRight, X, List } from 'lucide-react'
import { useAccounts }           from '@/hooks/queries/useAccounts'
import { useClosings, useDeleteClosing } from '@/hooks/queries/useClosings'
import { useCuadreCaja }         from '@/hooks/useCuadreCaja'
import { useModalStore }         from '@/store/useModalStore'
import { formatMoney, formatDate, formatTime } from '@/utils/formatters'
import { todayLocal } from '@/utils/dates'
import { Card }    from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { FormularioTexto }    from './FormularioTexto'
import { TablaCuadre }        from './TablaCuadre'
import { TablaGastos }        from './TablaGastos'
import { ResumenArqueo }      from './ResumenArqueo'
import { EstadoCierre }       from './EstadoCierre'
import { ModalDetalleCierre } from './ModalDetalleCierre'
import type { AccountType }   from '@/types'
import type { DailyClosing }  from '@/types'

export function DailyClosingView() {
  const { data: accounts = [], isLoading: accLoading } = useAccounts()
  const { data: closings = [], isLoading: clLoading }  = useClosings()
  const deleteClosing = useDeleteClosing()
  const openConfirm   = useModalStore(s => s.openConfirm)

  // Auto-detectar cuentas por tipo
  const cuentasEfectivo = useMemo(() => accounts.filter(a => a.type === 'Efectivo'), [accounts])
  const cuentasBanco    = useMemo(() => accounts.filter(a => a.type === 'Banco'), [accounts])
  const accountIdCredito = useMemo(
    () => accounts.find(a => a.type === 'Crédito')?.id ?? '',
    [accounts],
  )

  const [accountIdEfectivo, setAccountIdEfectivo] = useState('')
  const [accountIdBanco,    setAccountIdBanco]    = useState('')

  // Establecer cuentas por defecto una vez que carguen
  useEffect(() => {
    if (!accountIdEfectivo && cuentasEfectivo.length > 0)
      setAccountIdEfectivo(cuentasEfectivo[0].id)
  }, [cuentasEfectivo, accountIdEfectivo])

  useEffect(() => {
    if (!accountIdBanco && cuentasBanco.length > 0)
      setAccountIdBanco(cuentasBanco[0].id)
  }, [cuentasBanco, accountIdBanco])
  const [cierreDetalle, setCierreDetalle] = useState<DailyClosing | null>(null)

  const {
    texto, setTexto,
    fechaCierre, setFechaCierre,
    datos, resumen, estado, errorMsg,
    procesarTexto, actualizarProducto, actualizarGasto,
    actualizarConteoFisico, eliminarProducto, eliminarGasto,
    limpiarProductos, limpiarGastos, guardarCierre, resetear,
  } = useCuadreCaja(accountIdEfectivo, accountIdBanco, accountIdCredito)

  const tieneResultado = estado === 'listo' || estado === 'guardando' || estado === 'guardado'
  const getAccName = (id: string) => accounts.find(a => a.id === id)?.name ?? '—'

  // ── Historial: filtros de fecha + paginación ──────────────────────────────
  const PER_PAGE = 10
  const [desde, setDesde]             = useState('')
  const [hasta, setHasta]             = useState('')
  const [page, setPage]               = useState(1)
  const [mostrarTodo, setMostrarTodo] = useState(false)

  const closingsFiltrados = useMemo(() => {
    // Comparar por el día LOCAL (Ecuador), igual que lo que ve el usuario.
    const diaLocal = (iso: string) =>
      new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
    return closings.filter(c => {
      const d = diaLocal(c.date)
      if (desde && d < desde) return false
      if (hasta && d > hasta) return false
      return true
    })
  }, [closings, desde, hasta])

  const totalPages = Math.max(1, Math.ceil(closingsFiltrados.length / PER_PAGE))
  const pageActual = Math.min(page, totalPages)
  const visibles   = mostrarTodo
    ? closingsFiltrados
    : closingsFiltrados.slice((pageActual - 1) * PER_PAGE, pageActual * PER_PAGE)
  const hayFiltro  = desde !== '' || hasta !== ''

  // Volver a la primera página cuando cambian los filtros o el modo "mostrar todo"
  useEffect(() => { setPage(1) }, [desde, hasta, mostrarTodo])

  if (accLoading) return (
    <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
  )

  return (
    <>
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Cuadre de Caja</h2>
          <p className="text-[#9ca3af] text-sm mt-0.5">Describe el día en lenguaje natural y la IA llena el cuadre</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9ca3af] bg-[#1A1D2E] border border-[#2A2F42] rounded-xl px-3 py-2">
          <Bot size={14} className="text-teal" />
          <span>Powered by Claude AI</span>
        </div>
      </div>

      {/* Configuración del cierre */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 size={16} className="text-[#9ca3af]" />
          <p className="text-[#9ca3af] text-sm font-medium">Configuración del cierre</p>
        </div>

        {/* Fecha del cierre */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2 px-1">
            Fecha del cierre
          </label>
          <input
            type="date"
            value={fechaCierre}
            max={todayLocal()}
            onChange={e => setFechaCierre(e.target.value)}
            disabled={estado === 'guardando' || estado === 'guardado'}
            className="w-full sm:w-auto bg-[#0E1420] text-white px-4 py-2.5 rounded-xl border border-[#2A2F42] focus:border-amber focus:ring-1 focus:ring-amber/30 outline-none transition-all disabled:opacity-50"
          />
          {fechaCierre !== todayLocal() && (
            <p className="text-amber text-xs mt-1.5 px-1">
              Registrando un cierre de una fecha pasada
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2 px-1">
              Cuenta Efectivo
            </label>
            <select
              value={accountIdEfectivo}
              onChange={e => setAccountIdEfectivo(e.target.value)}
              disabled={tieneResultado}
              className="w-full bg-[#0E1420] text-white px-4 py-2.5 rounded-xl border border-[#2A2F42] focus:border-positive focus:ring-1 focus:ring-positive/30 outline-none transition-all appearance-none disabled:opacity-50"
            >
              {cuentasEfectivo.length === 0 && <option value="">Sin cuentas de efectivo</option>}
              {cuentasEfectivo.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2 px-1">
              Cuenta Banco / Transferencias
            </label>
            <select
              value={accountIdBanco}
              onChange={e => setAccountIdBanco(e.target.value)}
              disabled={tieneResultado}
              className="w-full bg-[#0E1420] text-white px-4 py-2.5 rounded-xl border border-[#2A2F42] focus:border-teal focus:ring-1 focus:ring-teal/30 outline-none transition-all appearance-none disabled:opacity-50"
            >
              {cuentasBanco.length === 0 && <option value="">Sin cuentas bancarias</option>}
              {cuentasBanco.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Formulario IA */}
      <FormularioTexto
        texto={texto} onTextoChange={setTexto}
        onProcesar={procesarTexto} onReset={resetear}
        estado={estado} errorMsg={errorMsg}
      />

      {/* Resultado */}
      {tieneResultado && datos && resumen && (
        <div className="space-y-5">
          <TablaCuadre
            productos={datos.productos}
            onActualizar={actualizarProducto}
            onEliminar={eliminarProducto}
            onLimpiarTodo={limpiarProductos}
          />
          <TablaGastos
            gastos={datos.gastos}
            onActualizar={actualizarGasto}
            onEliminar={eliminarGasto}
            onLimpiarTodo={limpiarGastos}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ResumenArqueo
              resumen={resumen}
              baseInicial={datos.baseInicial}
              conteoFisico={datos.conteoFisico}
              onConteoFisicoChange={actualizarConteoFisico}
            />
            <EstadoCierre
              estado={estado}
              resumen={resumen}
              onGuardar={guardarCierre}
              disabled={!accountIdEfectivo || !accountIdBanco}
            />
          </div>
        </div>
      )}

      {/* Historial de cierres */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-amber/10 rounded-xl">
            <History size={20} className="text-amber" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Historial de Cierres</h3>
            {!clLoading && (
              <p className="text-[#9ca3af] text-xs">
                {hayFiltro
                  ? `${closingsFiltrados.length} de ${closings.length} cierres`
                  : `${closings.length} cierres registrados`}
              </p>
            )}
          </div>
        </div>

        {/* Filtros: rango de fechas + mostrar todo */}
        {!clLoading && closings.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 px-1">
                Desde
              </label>
              <input
                type="date"
                value={desde}
                max={hasta || undefined}
                onChange={e => setDesde(e.target.value)}
                className="w-full bg-[#0E1420] text-white px-3 py-2 rounded-xl border border-[#2A2F42] focus:border-amber focus:ring-1 focus:ring-amber/30 outline-none transition-all text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 px-1">
                Hasta
              </label>
              <input
                type="date"
                value={hasta}
                min={desde || undefined}
                onChange={e => setHasta(e.target.value)}
                className="w-full bg-[#0E1420] text-white px-3 py-2 rounded-xl border border-[#2A2F42] focus:border-amber focus:ring-1 focus:ring-amber/30 outline-none transition-all text-sm"
              />
            </div>
            {hayFiltro && (
              <button
                onClick={() => { setDesde(''); setHasta('') }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-[#9ca3af] hover:text-white bg-[#0E1420] hover:bg-white/5 border border-[#2A2F42] rounded-xl transition-all"
                title="Limpiar filtros"
              >
                <X size={13} /> Limpiar
              </button>
            )}
            <button
              onClick={() => setMostrarTodo(v => !v)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-xl transition-all ${
                mostrarTodo
                  ? 'text-amber bg-amber/10 border-amber/30'
                  : 'text-[#9ca3af] hover:text-white bg-[#0E1420] hover:bg-white/5 border-[#2A2F42]'
              }`}
              title={mostrarTodo ? 'Volver a paginar' : 'Mostrar todos en una página'}
            >
              <List size={13} /> {mostrarTodo ? 'Paginar' : 'Mostrar todo'}
            </button>
          </div>
        )}

        {clLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 rounded-l-xl font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Cuenta</th>
                  <th className="px-4 py-3 text-right font-semibold">Sistema</th>
                  <th className="px-4 py-3 text-right font-semibold">Físico</th>
                  <th className="px-4 py-3 text-right font-semibold">Diferencia</th>
                  <th className="px-4 py-3 text-center rounded-r-xl font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2F42]">
                {visibles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#4b5563] italic text-sm">
                      {closings.length === 0
                        ? 'No hay cierres registrados aún'
                        : 'No hay cierres en ese rango de fechas'}
                    </td>
                  </tr>
                ) : (
                  visibles.map(c => {
                    const diff  = c.difference
                    const color = diff === 0 ? 'text-[#9ca3af]' : diff > 0 ? 'text-positive' : 'text-negative'
                    return (
                      <tr key={c.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{formatDate(c.date)}</div>
                          <div className="text-[#4b5563] text-xs">{formatTime(c.date)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#9ca3af] bg-[#0E1420] px-2 py-1 rounded-lg border border-[#2A2F42]">
                            {getAccName(c.accountId)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-[#9ca3af] font-mono">
                          {formatMoney(c.systemBalance)}
                        </td>
                        <td className="px-4 py-3 text-right text-white font-bold font-mono">
                          {formatMoney(c.physicalAmount)}
                        </td>
                        <td className={`px-4 py-3 text-right font-black font-mono ${color}`}>
                          {diff > 0 ? '+' : ''}{diff.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setCierreDetalle(c)}
                              className="p-2 text-[#4b5563] hover:text-teal hover:bg-teal/10 rounded-xl transition-all"
                              title="Ver detalle"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => openConfirm(
                                'Eliminar cierre',
                                `¿Eliminar el cierre del ${formatDate(c.date)}? Esta acción no se puede deshacer.`,
                                () => deleteClosing.mutate(c.id),
                              )}
                              className="p-2 text-[#4b5563] hover:text-negative hover:bg-negative/10 rounded-xl transition-all"
                              title="Eliminar cierre"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!clLoading && !mostrarTodo && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-[#2A2F42]">
            <p className="text-xs text-[#9ca3af]">
              Mostrando {(pageActual - 1) * PER_PAGE + 1}–{Math.min(pageActual * PER_PAGE, closingsFiltrados.length)} de {closingsFiltrados.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pageActual <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-[#0E1420] border border-[#2A2F42] rounded-lg hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <span className="text-xs text-[#9ca3af] px-1">
                Página <span className="text-white font-semibold">{pageActual}</span> de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={pageActual >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-[#0E1420] border border-[#2A2F42] rounded-lg hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>

    {/* Modal detalle */}
    {cierreDetalle && (
      <ModalDetalleCierre
        closing={cierreDetalle}
        accountIdEfectivo={accountIdEfectivo}
        accountIdBanco={accountIdBanco}
        accountIdCredito={accountIdCredito}
        onClose={() => setCierreDetalle(null)}
      />
    )}
    </>
  )
}
