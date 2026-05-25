import React from 'react'
import { CheckCircle2, AlertCircle, TrendingUp, Loader2, Save } from 'lucide-react'
import { EstadoCuadre, ResumenCuadre } from '../../types/cuadre'

interface Props {
  estado: EstadoCuadre
  resumen: ResumenCuadre
  onGuardar: () => void
  disabled?: boolean
}

export function EstadoCierre({ estado, resumen, onGuardar, disabled }: Props) {
  const esExacto = resumen.diferencia === 0
  const esSobra = resumen.diferencia > 0
  const guardando = estado === 'guardando'
  const guardado = estado === 'guardado'

  const badge = esExacto
    ? { label: 'CUADRA', color: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30', icon: <CheckCircle2 size={14} /> }
    : esSobra
    ? { label: 'SOBRA', color: 'text-[#19A8C7] bg-[#19A8C7]/10 border-[#19A8C7]/30', icon: <TrendingUp size={14} /> }
    : { label: 'FALTA', color: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30', icon: <AlertCircle size={14} /> }

  if (guardado) {
    return (
      <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-3xl p-6 flex flex-col items-center gap-3 text-center">
        <div className="p-3 rounded-2xl bg-[#10b981]/20">
          <CheckCircle2 size={28} className="text-[#10b981]" />
        </div>
        <div>
          <p className="text-[#10b981] font-black text-lg">¡Cierre guardado!</p>
          <p className="text-gray-500 text-xs mt-1">Las transacciones han sido registradas en el sistema</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl p-6 space-y-4">
      {/* Estado badge */}
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm font-medium">Estado del cierre</p>
        <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border ${badge.color}`}>
          {badge.icon}
          {badge.label}
        </span>
      </div>

      {/* Botón guardar */}
      <button
        onClick={onGuardar}
        disabled={disabled || guardando || guardado}
        className="w-full flex items-center justify-center gap-2 py-4 bg-[#19A8C7] hover:bg-[#107287] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-colors shadow-lg shadow-[#19A8C7]/20 text-base"
      >
        {guardando ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Guardando cierre...
          </>
        ) : (
          <>
            <Save size={20} />
            CONFIRMAR Y GUARDAR CIERRE
          </>
        )}
      </button>

      <p className="text-gray-600 text-xs text-center">
        Se registrarán todas las transacciones del día en el sistema
      </p>
    </div>
  )
}
