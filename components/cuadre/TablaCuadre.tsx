import React from 'react'
import { ProductoCuadre } from '../../types/cuadre'
import { formatearMoneda } from '../../lib/calculos'
import { Trash2, X } from 'lucide-react'

interface Props {
  productos: ProductoCuadre[]
  onActualizar: (index: number, campo: keyof Omit<ProductoCuadre, 'total'>, valor: number | string) => void
  onEliminar: (index: number) => void
  onLimpiarTodo: () => void
}

type CampoNumerico = 'cantidad' | 'efectivo' | 'transferencia' | 'credito'

const COLUMNAS: { campo: CampoNumerico; label: string; color: string }[] = [
  { campo: 'cantidad', label: 'Cant.', color: 'text-gray-300' },
  { campo: 'efectivo', label: 'Efectivo', color: 'text-[#10b981]' },
  { campo: 'transferencia', label: 'Transfer.', color: 'text-[#19A8C7]' },
  { campo: 'credito', label: 'Crédito', color: 'text-[#FF8A00]' },
]

export function TablaCuadre({ productos, onActualizar, onEliminar, onLimpiarTodo }: Props) {
  const totales = productos.reduce(
    (acc, p) => ({
      cantidad: acc.cantidad + p.cantidad,
      efectivo: acc.efectivo + p.efectivo,
      transferencia: acc.transferencia + p.transferencia,
      credito: acc.credito + p.credito,
      total: acc.total + p.total
    }),
    { cantidad: 0, efectivo: 0, transferencia: 0, credito: 0, total: 0 }
  )

  return (
    <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1E293B] flex items-start justify-between gap-4">
        <div>
          <h3 className="text-white font-bold text-lg">Ventas del día</h3>
          <p className="text-gray-500 text-xs mt-0.5">Todas las celdas son editables</p>
        </div>
        {productos.length > 0 && (
          <button
            onClick={onLimpiarTodo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 border border-[#1E293B] hover:border-red-400/30 transition-all"
            title="Limpiar todas las filas"
          >
            <Trash2 size={13} />
            Limpiar todo
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0B131F] text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left font-semibold">Producto</th>
              {COLUMNAS.map(c => (
                <th key={c.campo} className={`px-3 py-3 text-right font-semibold ${c.color}`}>
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-white">Total</th>
              <th className="px-2 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {productos.map((p, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={p.nombre}
                    onChange={e => onActualizar(i, 'nombre', e.target.value)}
                    className="bg-transparent text-white w-full outline-none focus:text-[#19A8C7] transition-colors font-medium"
                  />
                </td>
                {COLUMNAS.map(c => (
                  <td key={c.campo} className="px-3 py-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step={c.campo === 'cantidad' ? '1' : '0.01'}
                      value={p[c.campo] === 0 ? '' : p[c.campo]}
                      placeholder="0"
                      onChange={e => onActualizar(i, c.campo, e.target.value)}
                      className={`bg-transparent w-20 text-right outline-none focus:ring-0 ${c.color} placeholder-gray-700`}
                    />
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-bold text-white">
                  {formatearMoneda(p.total)}
                </td>
                <td className="px-2 py-3 text-center">
                  <button
                    onClick={() => onEliminar(i)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    title="Eliminar fila"
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#0B131F] font-bold border-t-2 border-[#1E293B]">
              <td className="px-4 py-3 text-white uppercase text-xs tracking-wider">TOTAL</td>
              <td className="px-3 py-3 text-right text-gray-300">{totales.cantidad}</td>
              <td className="px-3 py-3 text-right text-[#10b981]">{formatearMoneda(totales.efectivo)}</td>
              <td className="px-3 py-3 text-right text-[#19A8C7]">{formatearMoneda(totales.transferencia)}</td>
              <td className="px-3 py-3 text-right text-[#FF8A00]">{formatearMoneda(totales.credito)}</td>
              <td className="px-4 py-3 text-right text-white">{formatearMoneda(totales.total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
