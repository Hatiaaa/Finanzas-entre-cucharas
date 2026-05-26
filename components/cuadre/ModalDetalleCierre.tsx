import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DailyClosing } from '../../types'
import { formatearMoneda } from '../../lib/calculos'
import { X, Loader2 } from 'lucide-react'

interface Transaccion {
  id: string
  type: string
  category: string
  subcategory: string
  amount: number
  account_id: string | null
  client?: string
  quantity?: number
  description: string
}

interface FilaProducto {
  nombre: string
  categoria: string
  cantidad: number
  efectivo: number
  transferencia: number
  creditos: { cliente: string; monto: number }[]
  total: number
}

interface FilaGasto {
  descripcion: string
  valor: number
}

interface Props {
  closing: DailyClosing
  accountIdEfectivo: string
  accountIdBanco: string
  accountIdCredito: string
  onClose: () => void
}

export function ModalDetalleCierre({ closing, accountIdEfectivo, accountIdBanco, accountIdCredito, onClose }: Props) {
  const [cargando, setCargando] = useState(true)
  const [productos, setProductos] = useState<FilaProducto[]>([])
  const [gastos, setGastos] = useState<FilaGasto[]>([])

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('date', closing.date)
        .order('category')

      if (error || !data) { setCargando(false); return }

      const txs: Transaccion[] = data

      // Separar ingresos y egresos
      const ingresos = txs.filter(t => t.type === 'Ingreso')
      const egresos = txs.filter(t => t.type === 'Egreso')

      // Agrupar ingresos por subcategoría (nombre del producto)
      const mapaProductos = new Map<string, FilaProducto>()
      for (const tx of ingresos) {
        const key = `${tx.category}__${tx.subcategory}`
        if (!mapaProductos.has(key)) {
          mapaProductos.set(key, {
            nombre: tx.subcategory || tx.category,
            categoria: tx.category,
            cantidad: tx.quantity || 0,
            efectivo: 0,
            transferencia: 0,
            creditos: [],
            total: 0
          })
        }
        const fila = mapaProductos.get(key)!
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

      // Construir gastos
      const filasGastos: FilaGasto[] = egresos.map(t => ({
        descripcion: t.subcategory || t.description,
        valor: t.amount
      }))

      setProductos(Array.from(mapaProductos.values()))
      setGastos(filasGastos)
      setCargando(false)
    }

    cargar()
  }, [closing.date, accountIdEfectivo, accountIdBanco, accountIdCredito])

  const totalEfectivo = productos.reduce((s, p) => s + p.efectivo, 0)
  const totalTransf = productos.reduce((s, p) => s + p.transferencia, 0)
  const totalCredito = productos.reduce((s, p) => s + p.creditos.reduce((sc, c) => sc + c.monto, 0), 0)
  const totalVentas = productos.reduce((s, p) => s + p.total, 0)
  const totalGastos = gastos.reduce((s, g) => s + g.valor, 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
          <div>
            <h3 className="text-white font-bold text-lg">Detalle del Cierre</h3>
            <p className="text-gray-500 text-xs mt-0.5">
              {new Date(closing.date).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' · '}
              {new Date(closing.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {cargando ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="text-[#19A8C7] animate-spin" />
            </div>
          ) : (
            <>
              {/* Tabla ventas */}
              <div className="bg-[#0B131F] rounded-2xl overflow-hidden border border-[#1E293B]">
                <div className="px-4 py-3 border-b border-[#1E293B]">
                  <p className="text-white font-semibold text-sm">Ventas del día</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-4 py-2 text-left">Producto</th>
                      <th className="px-3 py-2 text-right text-[#10b981]">Efectivo</th>
                      <th className="px-3 py-2 text-right text-[#19A8C7]">Transfer.</th>
                      <th className="px-3 py-2 text-right text-[#FF8A00]">Crédito</th>
                      <th className="px-4 py-2 text-right text-white">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {productos.map((p, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="px-4 py-2.5">
                          <div className="text-white font-medium text-sm">{p.nombre}</div>
                          <div className="text-gray-600 text-xs">{p.categoria}</div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-[#10b981]">
                          {p.efectivo > 0 ? formatearMoneda(p.efectivo) : <span className="text-gray-700">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right text-[#19A8C7]">
                          {p.transferencia > 0 ? formatearMoneda(p.transferencia) : <span className="text-gray-700">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {p.creditos.length > 0 ? (
                            <div className="flex flex-col items-end gap-0.5">
                              {p.creditos.map((c, ci) => (
                                <span key={ci} className="text-[#FF8A00] text-xs">
                                  {c.cliente}: {formatearMoneda(c.monto)}
                                </span>
                              ))}
                            </div>
                          ) : <span className="text-gray-700">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-white font-bold">
                          {formatearMoneda(p.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#151E2B] border-t-2 border-[#1E293B] font-bold text-xs uppercase">
                      <td className="px-4 py-2.5 text-gray-400">Total</td>
                      <td className="px-3 py-2.5 text-right text-[#10b981]">{formatearMoneda(totalEfectivo)}</td>
                      <td className="px-3 py-2.5 text-right text-[#19A8C7]">{formatearMoneda(totalTransf)}</td>
                      <td className="px-3 py-2.5 text-right text-[#FF8A00]">{formatearMoneda(totalCredito)}</td>
                      <td className="px-4 py-2.5 text-right text-white">{formatearMoneda(totalVentas)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Gastos */}
              {gastos.length > 0 && (
                <div className="bg-[#0B131F] rounded-2xl overflow-hidden border border-[#1E293B]">
                  <div className="px-4 py-3 border-b border-[#1E293B] flex justify-between items-center">
                    <p className="text-white font-semibold text-sm">Gastos del día</p>
                    <p className="text-[#ef4444] font-bold text-sm">-{formatearMoneda(totalGastos)}</p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-[#1E293B]">
                      {gastos.map((g, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="px-4 py-2.5 text-gray-300">{g.descripcion}</td>
                          <td className="px-4 py-2.5 text-right text-[#ef4444] font-semibold">
                            {formatearMoneda(g.valor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Resumen arqueo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#1E293B] text-center">
                  <p className="text-gray-500 text-xs mb-1">Saldo sistema</p>
                  <p className="text-white font-bold">{formatearMoneda(closing.systemBalance)}</p>
                </div>
                <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#1E293B] text-center">
                  <p className="text-gray-500 text-xs mb-1">Conteo físico</p>
                  <p className="text-white font-bold">{formatearMoneda(closing.physicalAmount)}</p>
                </div>
                <div className={`rounded-2xl p-4 border text-center ${
                  closing.difference >= 0
                    ? 'bg-[#10b981]/10 border-[#10b981]/30'
                    : 'bg-[#ef4444]/10 border-[#ef4444]/30'
                }`}>
                  <p className="text-gray-500 text-xs mb-1">Diferencia</p>
                  <p className={`font-bold ${closing.difference >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {closing.difference > 0 ? '+' : ''}{formatearMoneda(closing.difference)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
