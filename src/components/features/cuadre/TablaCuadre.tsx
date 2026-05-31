import { Trash2, X, UserCheck } from 'lucide-react'
import { formatearMoneda } from '@/lib/calculos'
import type { ProductoCuadre } from '@/types/cuadre'

interface Props {
  productos:    ProductoCuadre[]
  onActualizar: (index: number, campo: keyof Omit<ProductoCuadre, 'total'>, valor: number | string) => void
  onEliminar:   (index: number) => void
  onLimpiarTodo: () => void
}

type CampoNumerico = 'cantidad' | 'efectivo' | 'transferencia' | 'credito'

const COLS: { campo: CampoNumerico; label: string; color: string }[] = [
  { campo: 'cantidad',      label: 'Cant.',     color: 'text-[#9ca3af]' },
  { campo: 'efectivo',      label: 'Efectivo',  color: 'text-positive'  },
  { campo: 'transferencia', label: 'Transfer.', color: 'text-teal'      },
  { campo: 'credito',       label: 'Crédito',   color: 'text-amber'     },
]

export function TablaCuadre({ productos, onActualizar, onEliminar, onLimpiarTodo }: Props) {
  const totales = productos.reduce(
    (acc, p) => ({
      cantidad:      acc.cantidad      + p.cantidad,
      efectivo:      acc.efectivo      + p.efectivo,
      transferencia: acc.transferencia + p.transferencia,
      credito:       acc.credito       + p.credito,
      total:         acc.total         + p.total,
    }),
    { cantidad: 0, efectivo: 0, transferencia: 0, credito: 0, total: 0 },
  )

  return (
    <div className="bg-[#1A1D2E] border border-[#2A2F42] rounded-3xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#2A2F42] flex items-start justify-between gap-4">
        <div>
          <h3 className="text-white font-bold text-lg">Ventas del día</h3>
          <p className="text-[#9ca3af] text-xs mt-0.5">Todas las celdas son editables</p>
        </div>
        {productos.length > 0 && (
          <button
            onClick={onLimpiarTodo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#9ca3af] hover:text-negative hover:bg-negative/10 border border-[#2A2F42] hover:border-negative/30 transition-all"
          >
            <Trash2 size={13} />Limpiar todo
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left font-semibold">Producto</th>
              {COLS.map(c => (
                <th key={c.campo} className={`px-3 py-3 text-right font-semibold ${c.color}`}>
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-white">Total</th>
              <th className="px-2 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2F42]">
            {productos.map((p, i) => (
              <tr key={i} className="hover:bg-white/3 transition-colors group">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={p.nombre}
                    onChange={e => onActualizar(i, 'nombre', e.target.value)}
                    className="bg-transparent text-white w-full outline-none focus:text-teal transition-colors font-medium"
                  />
                </td>
                {COLS.map(c => (
                  <td key={c.campo} className="px-3 py-3 text-right">
                    {c.campo === 'credito' && p.creditos && p.creditos.length > 0 ? (
                      <div className="flex flex-col items-end gap-0.5">
                        {p.creditos.map((cr, ci) => (
                          <div key={ci} className="flex items-center gap-1 text-xs">
                            <UserCheck size={10} className="text-amber/60" />
                            <span className="text-[#9ca3af]">{cr.cliente}</span>
                            <span className="text-amber font-semibold">{formatearMoneda(cr.monto)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step={c.campo === 'cantidad' ? '1' : '0.01'}
                        value={p[c.campo] === 0 ? '' : p[c.campo]}
                        placeholder="0"
                        onChange={e => onActualizar(i, c.campo, e.target.value)}
                        className={`bg-transparent w-20 text-right outline-none focus:ring-0 ${c.color} placeholder-[#4b5563]`}
                      />
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-bold text-white">
                  {formatearMoneda(p.total)}
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
          <tfoot>
            <tr className="bg-[#0E1420] font-bold border-t-2 border-[#2A2F42]">
              <td className="px-4 py-3 text-white uppercase text-xs tracking-wider">TOTAL</td>
              <td className="px-3 py-3 text-right text-[#9ca3af]">{totales.cantidad}</td>
              <td className="px-3 py-3 text-right text-positive">{formatearMoneda(totales.efectivo)}</td>
              <td className="px-3 py-3 text-right text-teal">{formatearMoneda(totales.transferencia)}</td>
              <td className="px-3 py-3 text-right text-amber">{formatearMoneda(totales.credito)}</td>
              <td className="px-4 py-3 text-right text-white">{formatearMoneda(totales.total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
