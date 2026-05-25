import React from 'react'
import { ResumenCuadre } from '../../types/cuadre'
import { formatearMoneda } from '../../lib/calculos'
import { TrendingUp, TrendingDown, Scale, Minus } from 'lucide-react'

interface Props {
  resumen: ResumenCuadre
  baseInicial: number
  conteoFisico: number
  onConteoFisicoChange: (valor: number) => void
}

export function ResumenArqueo({ resumen, baseInicial, conteoFisico, onConteoFisicoChange }: Props) {
  const diferencia = resumen.diferencia
  const esExacto = diferencia === 0
  const esSobra = diferencia > 0

  const diferenciaColor = esExacto
    ? 'text-[#10b981]'
    : esSobra
    ? 'text-[#10b981]'
    : 'text-[#ef4444]'

  const diferenciaBg = esExacto || esSobra
    ? 'bg-[#10b981]/10 border-[#10b981]/30'
    : 'bg-[#ef4444]/10 border-[#ef4444]/30'

  return (
    <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#FF8A00]/10">
          <Scale size={20} className="text-[#FF8A00]" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Arqueo de Caja</h3>
          <p className="text-gray-500 text-xs">Resumen del cierre del día</p>
        </div>
      </div>

      {/* Cálculo principal */}
      <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#1E293B] space-y-3">

        {/* Efectivo en caja — editable */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm">Efectivo en caja hoy</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={conteoFisico === 0 ? '' : conteoFisico}
              placeholder="0.00"
              onChange={e => onConteoFisicoChange(Number(e.target.value) || 0)}
              className="bg-transparent text-white font-bold text-right w-28 outline-none focus:text-[#19A8C7] transition-colors text-base placeholder-gray-700"
            />
          </div>
        </div>

        {/* Transferencias */}
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            <span className="text-[#19A8C7] font-bold mr-1">(+)</span>
            Transferencias del día
          </p>
          <p className="text-[#19A8C7] font-bold">{formatearMoneda(resumen.totalTransferencia)}</p>
        </div>

        {/* Separador → Total físico */}
        <div className="border-t border-[#1E293B] pt-3 flex items-center justify-between">
          <p className="text-gray-300 text-sm font-semibold">Total físico</p>
          <p className="text-white font-bold text-base">{formatearMoneda(resumen.totalFisico)}</p>
        </div>

        {/* Base inicial */}
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            <span className="text-[#ef4444] font-bold mr-1">(-)</span>
            Base inicial (caja de ayer)
          </p>
          <p className="text-gray-300 font-bold">{formatearMoneda(baseInicial)}</p>
        </div>

        {/* Separador → Ingresado hoy */}
        <div className="border-t border-[#1E293B] pt-3 flex items-center justify-between">
          <p className="text-white text-sm font-bold uppercase tracking-wide">Lo que ingresó hoy</p>
          <p className="text-white font-black text-lg">{formatearMoneda(resumen.ingresadoHoy)}</p>
        </div>
      </div>

      {/* Total ventas registradas */}
      <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#1E293B] flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">Total ventas registradas</p>
          <p className="text-gray-600 text-xs mt-0.5">
            Efectivo + transf.
            {resumen.totalCredito > 0 ? ` + créditos (${formatearMoneda(resumen.totalCredito)})` : ''}
          </p>
        </div>
        <p className="text-[#10b981] font-black text-lg">{formatearMoneda(resumen.totalVentas)}</p>
      </div>

      {/* Gastos info */}
      {resumen.totalGastos > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-gray-600 text-xs">Gastos del día</p>
          <p className="text-[#ef4444] text-xs font-semibold">-{formatearMoneda(resumen.totalGastos)}</p>
        </div>
      )}

      {/* Diferencia */}
      <div className={`rounded-2xl p-4 border ${diferenciaBg}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {esExacto ? (
              <Minus size={16} className="text-[#10b981]" />
            ) : esSobra ? (
              <TrendingUp size={16} className="text-[#10b981]" />
            ) : (
              <TrendingDown size={16} className="text-[#ef4444]" />
            )}
            <p className={`text-sm font-semibold ${diferenciaColor}`}>
              Diferencia
            </p>
          </div>
          <p className={`font-black text-xl ${diferenciaColor}`}>
            {diferencia > 0 ? '+' : ''}{formatearMoneda(diferencia)}
          </p>
        </div>
        <p className="text-gray-600 text-xs mt-1.5">
          {esExacto ? 'La caja cuadra exacto' : esSobra ? 'Sobra en caja' : 'Falta en caja'}
        </p>
      </div>
    </div>
  )
}
