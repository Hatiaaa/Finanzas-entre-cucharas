import { useMemo, useState, useEffect } from 'react'
import { History, Trash2, Bot, Settings2, Eye } from 'lucide-react'
import { useAccounts }           from '@/hooks/queries/useAccounts'
import { useClosings, useDeleteClosing } from '@/hooks/queries/useClosings'
import { useCuadreCaja }         from '@/hooks/useCuadreCaja'
import { useModalStore }         from '@/store/useModalStore'
import { formatMoney, formatDate, formatTime } from '@/utils/formatters'
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
    datos, resumen, estado, errorMsg,
    procesarTexto, actualizarProducto, actualizarGasto,
    actualizarConteoFisico, eliminarProducto, eliminarGasto,
    limpiarProductos, limpiarGastos, guardarCierre, resetear,
  } = useCuadreCaja(accountIdEfectivo, accountIdBanco, accountIdCredito)

  const tieneResultado = estado === 'listo' || estado === 'guardando' || estado === 'guardado'
  const getAccName = (id: string) => accounts.find(a => a.id === id)?.name ?? '—'

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

      {/* Selector de cuentas */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 size={16} className="text-[#9ca3af]" />
          <p className="text-[#9ca3af] text-sm font-medium">Cuentas para registrar el cierre</p>
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
              <p className="text-[#9ca3af] text-xs">{closings.length} cierres registrados</p>
            )}
          </div>
        </div>

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
                {closings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#4b5563] italic text-sm">
                      No hay cierres registrados aún
                    </td>
                  </tr>
                ) : (
                  closings.map(c => {
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
