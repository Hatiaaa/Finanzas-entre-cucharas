import { Receipt, Trash2, X } from 'lucide-react'
import { formatearMoneda } from '@/lib/calculos'
import type { GastoCuadre } from '@/types/cuadre'

interface Props {
  gastos:        GastoCuadre[]
  onActualizar:  (index: number, campo: keyof GastoCuadre, valor: number | string | boolean) => void
  onEliminar:    (index: number) => void
  onLimpiarTodo: () => void
}

export function TablaGastos({ gastos, onActualizar, onEliminar, onLimpiarTodo }: Props) {
  const total = gastos.reduce((s, g) => s + g.valor, 0)

  return (
    <div className="bg-[#1A1D2E] border border-[#2A2F42] rounded-3xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#2A2F42] flex justify-between items-center gap-4">
        <div>
          <h3 className="text-white font-bold text-lg">Gastos del día</h3>
          <p className="text-[#9ca3af] text-xs mt-0.5">Todas las celdas son editables</p>
        </div>
        <div className="flex items-center gap-3">
          {gastos.length > 0 && (
            <button
              onClick={onLimpiarTodo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#9ca3af] hover:text-negative hover:bg-negative/10 border border-[#2A2F42] hover:border-negative/30 transition-all"
            >
              <Trash2 size={13} />Limpiar todo
            </button>
          )}
          <span className="text-negative font-bold text-lg">-{formatearMoneda(total)}</span>
        </div>
      </div>

      {gastos.length === 0 ? (
        <div className="px-6 py-8 text-center text-[#4b5563] text-sm">Sin gastos registrados</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                <th className="px-4 py-3 text-right font-semibold">Monto</th>
                <th className="px-4 py-3 text-center font-semibold">Factura</th>
                <th className="px-2 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2F42]">
              {gastos.map((g, i) => (
                <tr key={i} className="hover:bg-white/3 transition-colors group">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={g.descripcion}
                      onChange={e => onActualizar(i, 'descripcion', e.target.value)}
                      className="bg-transparent text-white w-full outline-none focus:text-teal transition-colors"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number" min="0" step="0.01"
                      value={g.valor === 0 ? '' : g.valor}
                      placeholder="0.00"
                      onChange={e => onActualizar(i, 'valor', e.target.value)}
                      className="bg-transparent text-negative w-24 text-right outline-none placeholder-[#4b5563]"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onActualizar(i, 'tieneFactura', !g.tieneFactura)}
                      className={`p-1.5 rounded-lg transition-colors ${g.tieneFactura ? 'text-positive bg-positive/10' : 'text-[#4b5563] hover:text-[#9ca3af]'}`}
                      title={g.tieneFactura ? 'Tiene factura' : 'Sin factura'}
                    >
                      <Receipt size={16} />
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => onEliminar(i)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[#4b5563] hover:text-negative hover:bg-negative/10 transition-all"
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
