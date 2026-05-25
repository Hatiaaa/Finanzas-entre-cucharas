import React from 'react'
import { ResumenCuadre } from '../../types/cuadre'
import { formatearMoneda } from '../../lib/calculos'
import { Wallet, TrendingUp, TrendingDown, Scale } from 'lucide-react'

interface Props {
  resumen: ResumenCuadre
  baseInicial: number
  conteoFisico: number
  onConteoFisicoChange: (valor: number) => void
}

export function ResumenArqueo({ resumen, baseInicial, conteoFisico, onConteoFisicoChange }: Props) {
  const esExacto = resumen.diferencia === 0
  const esSobra = resumen.diferencia > 0

  return (
    <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#FF8A00]/10">
          <Scale size={20} className="text-[#FF8A00]" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Arqueo de Caja</h3>
          <p className="text-gray-500 text-xs">Resumen del cierre del día</p>
        </div>
      </div>

      {/* Grid de resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#1E293B]">
          <p className="text-gray-500 text-xs mb-1">Base inicial</p>
          <p className="text-white font-bold text-lg">{formatearMoneda(baseInicial)}</p>
        </div>
        <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#1E293B]">
          <p className="text-gray-500 text-xs mb-1">Total ventas</p>
          <p className="text-[#10b981] font-bold text-lg">{formatearMoneda(resumen.totalVentas)}</p>
        </div>
        <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#1E293B]">
          <p className="text-gray-500 text-xs mb-1">Efectivo ventas</p>
          <p className="text-[#10b981] font-bold">{formatearMoneda(resumen.totalEfectivo)}</p>
        </div>
        <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#1E293B]">
          <p className="text-gray-500 text-xs mb-1">Transferencias</p>
          <p className="text-[#19A8C7] font-bold">{formatearMoneda(resumen.totalTransferencia)}</p>
        </div>
        <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#1E293B]">
          <p className="text-gray-500 text-xs mb-1">Créditos</p>
          <p className="text-[#FF8A00] font-bold">{formatearMoneda(resumen.totalCredito)}</p>
        </div>
        <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#1E293B]">
          <p className="text-gray-500 text-xs mb-1">Total gastos</p>
          <p className="text-[#ef4444] font-bold">{formatearMoneda(resumen.totalGastos)}</p>
        </div>
      </div>

      {/* Saldo teórico */}
      <div className="bg-[#0B131F] rounded-2xl p-4 border border-[#19A8C7]/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-[#19A8C7]" />
            <p className="text-[#19A8C7] text-sm font-semibold">Saldo teórico en caja</p>
          </div>
          <p className="text-white font-black text-xl">{formatearMoneda(resumen.saldoTeorico)}</p>
        </div>
        <p className="text-gray-600 text-xs mt-1.5">Base + efectivo ventas − gastos</p>
      </div>

      {/* Conteo físico */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
          Conteo físico de caja
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={conteoFisico === 0 ? '' : conteoFisico}
          placeholder="0.00"
          onChange={e => onConteoFisicoChange(Number(e.target.value) || 0)}
          className="w-full bg-[#0B131F] border border-[#1E293B] rounded-2xl px-4 py-3 text-white text-lg font-bold outline-none focus:ring-1 focus:ring-[#19A8C7] focus:border-[#19A8C7] transition-all placeholder-gray-700"
        />
      </div>

      {/* Diferencia */}
      <div className={`rounded-2xl p-4 border transition-colors ${
        esExacto
          ? 'bg-[#10b981]/10 border-[#10b981]/30'
          : esSobra
          ? 'bg-[#10b981]/10 border-[#10b981]/30'
          : 'bg-[#ef4444]/10 border-[#ef4444]/30'
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {esSobra || esExacto ? (
              <TrendingUp size={16} className="text-[#10b981]" />
            ) : (
              <TrendingDown size={16} className="text-[#ef4444]" />
            )}
            <p className={`text-sm font-semibold ${
              esExacto || esSobra ? 'text-[#10b981]' : 'text-[#ef4444]'
            }`}>
              Diferencia
            </p>
          </div>
          <p className={`font-black text-xl ${
            esExacto || esSobra ? 'text-[#10b981]' : 'text-[#ef4444]'
          }`}>
            {resumen.diferencia > 0 ? '+' : ''}{formatearMoneda(resumen.diferencia)}
          </p>
        </div>
      </div>
    </div>
  )
}
