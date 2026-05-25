import React, { useState, useMemo } from 'react'
import { Account, DailyClosing, AccountType } from '../types'
import { useCuadreCaja } from '../hooks/useCuadreCaja'
import { FormularioTexto } from './cuadre/FormularioTexto'
import { TablaCuadre } from './cuadre/TablaCuadre'
import { TablaGastos } from './cuadre/TablaGastos'
import { ResumenArqueo } from './cuadre/ResumenArqueo'
import { EstadoCierre } from './cuadre/EstadoCierre'
import { History, Trash2, Bot, Settings2 } from 'lucide-react'

interface DailyClosingViewProps {
  accounts: Account[]
  balances: { accountId: string; balance: number }[]
  closings: DailyClosing[]
  onAddClosing: (closing: Omit<DailyClosing, 'id'>) => void
  onDeleteClosing: (id: string) => void
  onGuardado?: () => void
}

export function DailyClosingView({ accounts, closings, onDeleteClosing, onGuardado }: DailyClosingViewProps) {
  // Selección de cuentas para el cuadre
  const cuentasEfectivo = useMemo(
    () => accounts.filter(a => a.type === AccountType.CASH),
    [accounts]
  )
  const cuentasBanco = useMemo(
    () => accounts.filter(a => a.type === AccountType.BANK),
    [accounts]
  )

  const [accountIdEfectivo, setAccountIdEfectivo] = useState(
    () => cuentasEfectivo[0]?.id || ''
  )
  const [accountIdBanco, setAccountIdBanco] = useState(
    () => cuentasBanco[0]?.id || ''
  )

  const {
    texto, setTexto,
    datos, resumen, estado, errorMsg,
    procesarTexto,
    actualizarProducto,
    actualizarGasto,
    actualizarConteoFisico,
    eliminarProducto,
    eliminarGasto,
    limpiarProductos,
    limpiarGastos,
    guardarCierre,
    resetear
  } = useCuadreCaja(accountIdEfectivo, accountIdBanco, onGuardado)

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Desconocida'

  const tieneResultado = estado === 'listo' || estado === 'guardando' || estado === 'guardado'

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Cuadre de Caja</h2>
          <p className="text-gray-400 mt-1">Describe el día en lenguaje natural y la IA llena el cuadre por ti</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-[#151E2B] border border-[#1E293B] rounded-xl px-3 py-2">
          <Bot size={14} className="text-[#19A8C7]" />
          <span>Powered by Claude AI</span>
        </div>
      </div>

      {/* Selector de cuentas */}
      <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 size={16} className="text-gray-500" />
          <p className="text-gray-400 text-sm font-medium">Cuentas para registrar el cierre</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
              Cuenta Efectivo
            </label>
            <select
              value={accountIdEfectivo}
              onChange={e => setAccountIdEfectivo(e.target.value)}
              disabled={tieneResultado}
              className="w-full bg-[#0B131F] text-white px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none transition-all appearance-none disabled:opacity-50"
            >
              {cuentasEfectivo.length === 0 && (
                <option value="">Sin cuentas de efectivo</option>
              )}
              {cuentasEfectivo.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
              Cuenta Banco / Transferencias
            </label>
            <select
              value={accountIdBanco}
              onChange={e => setAccountIdBanco(e.target.value)}
              disabled={tieneResultado}
              className="w-full bg-[#0B131F] text-white px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#19A8C7] focus:ring-1 focus:ring-[#19A8C7] outline-none transition-all appearance-none disabled:opacity-50"
            >
              {cuentasBanco.length === 0 && (
                <option value="">Sin cuentas bancarias</option>
              )}
              {cuentasBanco.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Formulario de texto + IA */}
      <FormularioTexto
        texto={texto}
        onTextoChange={setTexto}
        onProcesar={procesarTexto}
        onReset={resetear}
        estado={estado}
        errorMsg={errorMsg}
      />

      {/* Resultado del cuadre */}
      {tieneResultado && datos && resumen && (
        <div className="space-y-6">
          {/* Tabla de ventas */}
          <TablaCuadre
            productos={datos.productos}
            onActualizar={actualizarProducto}
            onEliminar={eliminarProducto}
            onLimpiarTodo={limpiarProductos}
          />

          {/* Tabla de gastos */}
          <TablaGastos
            gastos={datos.gastos}
            onActualizar={actualizarGasto}
            onEliminar={eliminarGasto}
            onLimpiarTodo={limpiarGastos}
          />

          {/* Arqueo + Estado: 2 columnas en desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-[#FF8A00]/10 rounded-xl text-[#FF8A00]">
            <History size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Historial de Cierres</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#0B131F] text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-semibold rounded-l-xl">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold">Cuenta</th>
                <th className="px-4 py-3 text-right font-semibold">Sistema</th>
                <th className="px-4 py-3 text-right font-semibold">Físico</th>
                <th className="px-4 py-3 text-right font-semibold">Diferencia</th>
                <th className="px-4 py-3 text-center font-semibold rounded-r-xl">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {closings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-600 text-sm italic">
                    No hay cierres registrados aún
                  </td>
                </tr>
              ) : (
                closings
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(closing => {
                    const diff = closing.difference
                    const diffColor = diff === 0 ? 'text-gray-500' : diff > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                    return (
                      <tr key={closing.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">
                            {new Date(closing.date).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {new Date(closing.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-300 bg-[#0B131F] px-2 py-1 rounded-lg border border-[#1E293B]">
                            {getAccountName(closing.accountId)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400 font-mono">
                          ${closing.systemBalance.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-white font-bold font-mono">
                          ${closing.physicalAmount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`px-4 py-3 text-right font-black font-mono ${diffColor}`}>
                          {diff > 0 ? '+' : ''}{diff.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => onDeleteClosing(closing.id)}
                            className="p-2 text-gray-600 hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-xl transition-all"
                            title="Eliminar cierre"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
