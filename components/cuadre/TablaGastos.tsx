import React from 'react'
import { GastoCuadre } from '../../types/cuadre'
import { formatearMoneda } from '../../lib/calculos'
import { Receipt, Trash2, X } from 'lucide-react'

interface Props {
  gastos: GastoCuadre[]
  onActualizar: (index: number, campo: keyof GastoCuadre, valor: number | string | boolean) => void
  onEliminar: (index: number) => void
  onLimpiarTodo: () => void
}

export function TablaGastos({ gastos, onActualizar, onEliminar, onLimpiarTodo }: Props) {
  const totalGastos = gastos.reduce((s, g) => s + g.valor, 0)

  return (
    <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1E293B] flex justify-between items-center gap-4">
        <div>
          <h3 className="text-white font-bold text-lg">Gastos del día</h3>
          <p className="text-gray-500 text-xs mt-0.5">Todas las celdas son editables</p>
        </div>
        <div className="flex items-center gap-3">
          {gastos.length > 0 && (
            <button
              onClick={onLimpiarTodo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 border border-[#1E293B] hover:border-red-400/30 transition-all"
              title="Limpiar todos los gastos"
            >
              <Trash2 size={13} />
              Limpiar todo
            </button>
          )}
          <span className="text-[#ef4444] font-bold text-lg">-{formatearMoneda(totalGastos)}</span>
        </div>
      </div>

      {gastos.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-600 text-sm">Sin gastos registrados</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B131F] text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                <th className="px-4 py-3 text-right font-semibold">Monto</th>
                <th className="px-4 py-3 text-center font-semibold">Factura</th>
                <th className="px-2 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {gastos.map((g, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={g.descripcion}
                      onChange={e => onActualizar(i, 'descripcion', e.target.value)}
                      className="bg-transparent text-white w-full outline-none focus:text-[#19A8C7] transition-colors"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={g.valor === 0 ? '' : g.valor}
                      placeholder="0.00"
                      onChange={e => onActualizar(i, 'valor', e.target.value)}
                      className="bg-transparent text-[#ef4444] w-24 text-right outline-none placeholder-gray-700"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onActualizar(i, 'tieneFactura', !g.tieneFactura)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        g.tieneFactura
                          ? 'text-[#10b981] bg-[#10b981]/10'
                          : 'text-gray-600 hover:text-gray-400'
                      }`}
                      title={g.tieneFactura ? 'Tiene factura' : 'Sin factura'}
                    >
                      <Receipt size={16} />
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => onEliminar(i)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      title="Eliminar gasto"
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
