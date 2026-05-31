import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase }       from '@/lib/supabase'
import { formatearMoneda } from '@/lib/calculos'
import { formatDate, formatTime } from '@/utils/formatters'
import { Modal }  from '@/components/ui/Modal'
import type { DailyClosing } from '@/types'

interface Tx {
  id: string; type: string; category: string; subcategory: string
  amount: number; account_id: string | null; client?: string; quantity?: number
}

interface FilaProducto {
  nombre: string; categoria: string; cantidad: number
  efectivo: number; transferencia: number
  creditos: { cliente: string; monto: number }[]
  total: number
}

interface Props {
  closing:          DailyClosing
  accountIdEfectivo: string
  accountIdBanco:    string
  accountIdCredito:  string
  onClose:           () => void
}

export function ModalDetalleCierre({ closing, accountIdEfectivo, accountIdBanco, accountIdCredito, onClose }: Props) {
  const [cargando,  setCargando]  = useState(true)
  const [productos, setProductos] = useState<FilaProducto[]>([])
  const [gastos,    setGastos]    = useState<{ descripcion: string; valor: number }[]>([])

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('date', closing.date)
        .order('category')

      if (error || !data) { setCargando(false); return }

      const txs = data as Tx[]
      const ingresos = txs.filter(t => t.type === 'Ingreso')
      const egresos  = txs.filter(t => t.type === 'Egreso')

      const mapa = new Map<string, FilaProducto>()
      for (const tx of ingresos) {
        const key = `${tx.category}__${tx.subcategory}`
        if (!mapa.has(key)) {
          mapa.set(key, {
            nombre: tx.subcategory || tx.category,
            categoria: tx.category,
            cantidad: tx.quantity || 0,
            efectivo: 0, transferencia: 0, creditos: [], total: 0,
          })
        }
        const fila = mapa.get(key)!
        if (tx.account_id === accountIdEfectivo) {
          fila.efectivo += tx.amount
          fila.cantidad = tx.quantity || fila.cantidad
        } else if (tx.account_id === accountIdBanco) {
          fila.transferencia += tx.amount
        } else if (tx.account_id === accountIdCredito || tx.account_id === null) {
          fila.creditos.push({ cliente: tx.client || 'Sin nombre', monto: tx.amount })
        }
        fila.total = fila.efectivo + fila.transferencia + fila.creditos.reduce((s, c) => s + c.monto, 0)
      }

      setProductos(Array.from(mapa.values()))
      setGastos(egresos.map(t => ({ descripcion: t.subcategory || '', valor: t.amount })))
      setCargando(false)
    }
    cargar()
  }, [closing.date, accountIdEfectivo, accountIdBanco, accountIdCredito])

  const totalEfectivo = productos.reduce((s, p) => s + p.efectivo, 0)
  const totalTransf   = productos.reduce((s, p) => s + p.transferencia, 0)
  const totalCredito  = productos.reduce((s, p) => s + p.creditos.reduce((sc, c) => sc + c.monto, 0), 0)
  const totalVentas   = productos.reduce((s, p) => s + p.total, 0)
  const totalGastos   = gastos.reduce((s, g) => s + g.valor, 0)

  return (
    <Modal open onClose={onClose} size="xl" title="Detalle del Cierre">
      <div className="px-1 pb-1">
        <p className="px-6 pb-3 text-[#9ca3af] text-xs">
          {formatDate(closing.date)} · {formatTime(closing.date)}
        </p>
      </div>

      <div className="overflow-y-auto max-h-[70vh] px-6 pb-6 space-y-5">
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="text-teal animate-spin" />
          </div>
        ) : (
          <>
            {/* Ventas */}
            <div className="bg-[#0E1420] rounded-2xl overflow-hidden border border-[#2A2F42]">
              <div className="px-4 py-3 border-b border-[#2A2F42]">
                <p className="text-white font-semibold text-sm">Ventas del día</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#9ca3af] text-xs uppercase tracking-wider">
                    <th className="px-4 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-right text-positive">Efectivo</th>
                    <th className="px-3 py-2 text-right text-teal">Transfer.</th>
                    <th className="px-3 py-2 text-right text-amber">Crédito</th>
                    <th className="px-4 py-2 text-right text-white">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2F42]">
                  {productos.map((p, i) => (
                    <tr key={i} className="hover:bg-white/3">
                      <td className="px-4 py-2.5">
                        <div className="text-white font-medium text-sm">{p.nombre}</div>
                        <div className="text-[#4b5563] text-xs">{p.categoria}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-positive">
                        {p.efectivo > 0 ? formatearMoneda(p.efectivo) : <span className="text-[#4b5563]">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-teal">
                        {p.transferencia > 0 ? formatearMoneda(p.transferencia) : <span className="text-[#4b5563]">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {p.creditos.length > 0 ? (
                          <div className="flex flex-col items-end gap-0.5">
                            {p.creditos.map((c, ci) => (
                              <span key={ci} className="text-amber text-xs">{c.cliente}: {formatearMoneda(c.monto)}</span>
                            ))}
                          </div>
                        ) : <span className="text-[#4b5563]">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-white font-bold">{formatearMoneda(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#1A1D2E] border-t-2 border-[#2A2F42] font-bold text-xs uppercase">
                    <td className="px-4 py-2.5 text-[#9ca3af]">Total</td>
                    <td className="px-3 py-2.5 text-right text-positive">{formatearMoneda(totalEfectivo)}</td>
                    <td className="px-3 py-2.5 text-right text-teal">{formatearMoneda(totalTransf)}</td>
                    <td className="px-3 py-2.5 text-right text-amber">{formatearMoneda(totalCredito)}</td>
                    <td className="px-4 py-2.5 text-right text-white">{formatearMoneda(totalVentas)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Gastos */}
            {gastos.length > 0 && (
              <div className="bg-[#0E1420] rounded-2xl overflow-hidden border border-[#2A2F42]">
                <div className="px-4 py-3 border-b border-[#2A2F42] flex justify-between">
                  <p className="text-white font-semibold text-sm">Gastos del día</p>
                  <p className="text-negative font-bold text-sm">-{formatearMoneda(totalGastos)}</p>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[#2A2F42]">
                    {gastos.map((g, i) => (
                      <tr key={i} className="hover:bg-white/3">
                        <td className="px-4 py-2.5 text-[#9ca3af]">{g.descripcion}</td>
                        <td className="px-4 py-2.5 text-right text-negative font-semibold">{formatearMoneda(g.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Resumen arqueo */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Saldo sistema',  value: closing.systemBalance,  color: 'text-white'    },
                { label: 'Conteo físico',  value: closing.physicalAmount, color: 'text-white'    },
                { label: 'Diferencia',     value: closing.difference,
                  color: closing.difference >= 0 ? 'text-positive' : 'text-negative' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#0E1420] rounded-2xl p-4 border border-[#2A2F42] text-center">
                  <p className="text-[#9ca3af] text-xs mb-1">{label}</p>
                  <p className={`font-bold ${color}`}>
                    {value > 0 && label === 'Diferencia' ? '+' : ''}{formatearMoneda(value)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
