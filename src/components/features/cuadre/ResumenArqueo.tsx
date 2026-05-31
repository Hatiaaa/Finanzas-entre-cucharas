import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatearMoneda } from '@/lib/calculos'
import type { ResumenCuadre } from '@/types/cuadre'

interface Props {
  resumen:               ResumenCuadre
  baseInicial:           number
  conteoFisico:          number
  onConteoFisicoChange:  (valor: number) => void
}

export function ResumenArqueo({ resumen, baseInicial, conteoFisico, onConteoFisicoChange }: Props) {
  const { diferencia } = resumen
  const esExacto = diferencia === 0
  const esSobra  = diferencia > 0

  const difColor = esExacto || esSobra ? 'text-positive' : 'text-negative'
  const difBg    = esExacto || esSobra
    ? 'bg-positive/10 border-positive/30'
    : 'bg-negative/10 border-negative/30'

  return (
    <div className="bg-[#1A1D2E] border border-[#2A2F42] rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber/10">
          <Scale size={20} className="text-amber" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Arqueo de Caja</h3>
          <p className="text-[#9ca3af] text-xs">Resumen del cierre del día</p>
        </div>
      </div>

      {/* Cálculo físico */}
      <div className="bg-[#0E1420] rounded-2xl p-4 border border-[#2A2F42] space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[#9ca3af] text-sm">Efectivo en caja hoy</p>
          <div className="flex items-center gap-1">
            <span className="text-[#9ca3af] text-sm">$</span>
            <input
              type="number" min="0" step="0.01"
              value={conteoFisico === 0 ? '' : conteoFisico}
              placeholder="0.00"
              onChange={e => onConteoFisicoChange(Number(e.target.value) || 0)}
              className="bg-transparent text-white font-bold text-right w-28 outline-none focus:text-teal transition-colors placeholder-[#4b5563]"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[#9ca3af] text-sm">
            <span className="text-teal font-bold mr-1">(+)</span>Transferencias del día
          </p>
          <p className="text-teal font-bold">{formatearMoneda(resumen.totalTransferencia)}</p>
        </div>
        <div className="border-t border-[#2A2F42] pt-3 flex items-center justify-between">
          <p className="text-[#9ca3af] text-sm font-semibold">Total físico</p>
          <p className="text-white font-bold">{formatearMoneda(resumen.totalFisico)}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[#9ca3af] text-sm">
            <span className="text-negative font-bold mr-1">(-)</span>Base inicial
          </p>
          <p className="text-[#9ca3af] font-bold">{formatearMoneda(baseInicial)}</p>
        </div>
        <div className="border-t border-[#2A2F42] pt-3 flex items-center justify-between">
          <p className="text-white text-sm font-bold uppercase tracking-wide">Lo que ingresó hoy</p>
          <p className="text-white font-black text-lg">{formatearMoneda(resumen.ingresadoHoy)}</p>
        </div>
      </div>

      {/* Ventas netas */}
      <div className="bg-[#0E1420] rounded-2xl p-4 border border-[#2A2F42] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#9ca3af] text-sm">Total ventas registradas</p>
            {resumen.totalCredito > 0 && (
              <p className="text-[#4b5563] text-xs mt-0.5">Incluye créditos {formatearMoneda(resumen.totalCredito)}</p>
            )}
          </div>
          <p className="text-positive font-bold">{formatearMoneda(resumen.totalVentas)}</p>
        </div>
        {resumen.totalGastos > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-[#9ca3af] text-sm">
              <span className="text-negative font-bold mr-1">(-)</span>Gastos del día
            </p>
            <p className="text-negative font-bold">{formatearMoneda(resumen.totalGastos)}</p>
          </div>
        )}
        <div className="border-t border-[#2A2F42] pt-3 flex items-center justify-between">
          <p className="text-white text-sm font-bold uppercase tracking-wide">Ventas netas</p>
          <p className="text-positive font-black text-lg">
            {formatearMoneda(resumen.totalVentas - resumen.totalGastos)}
          </p>
        </div>
      </div>

      {/* Diferencia */}
      <div className={`rounded-2xl p-4 border ${difBg}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {esExacto
              ? <Minus size={16} className="text-positive" />
              : esSobra
                ? <TrendingUp size={16} className="text-positive" />
                : <TrendingDown size={16} className="text-negative" />
            }
            <p className={`text-sm font-semibold ${difColor}`}>Diferencia</p>
          </div>
          <p className={`font-black text-xl ${difColor}`}>
            {diferencia > 0 ? '+' : ''}{formatearMoneda(diferencia)}
          </p>
        </div>
        <p className="text-[#4b5563] text-xs mt-1.5">
          {esExacto ? 'La caja cuadra exacto' : esSobra ? 'Sobra en caja' : 'Falta en caja'}
        </p>
      </div>
    </div>
  )
}
