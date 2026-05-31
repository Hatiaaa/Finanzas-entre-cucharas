import { CheckCircle2, AlertCircle, TrendingUp, Loader2, Save } from 'lucide-react'
import type { EstadoCuadre, ResumenCuadre } from '@/types/cuadre'

interface Props {
  estado:    EstadoCuadre
  resumen:   ResumenCuadre
  onGuardar: () => void
  disabled?: boolean
}

export function EstadoCierre({ estado, resumen, onGuardar, disabled }: Props) {
  const esExacto = resumen.diferencia === 0
  const esSobra  = resumen.diferencia > 0
  const guardando = estado === 'guardando'
  const guardado  = estado === 'guardado'

  const badge = esExacto
    ? { label: 'CUADRA', color: 'text-positive bg-positive/10 border-positive/30',   icon: <CheckCircle2 size={14} /> }
    : esSobra
    ? { label: 'SOBRA',  color: 'text-teal bg-teal/10 border-teal/30',                icon: <TrendingUp   size={14} /> }
    : { label: 'FALTA',  color: 'text-negative bg-negative/10 border-negative/30',   icon: <AlertCircle  size={14} /> }

  if (guardado) {
    return (
      <div className="bg-positive/10 border border-positive/30 rounded-3xl p-6 flex flex-col items-center gap-3 text-center">
        <div className="p-3 rounded-2xl bg-positive/20">
          <CheckCircle2 size={28} className="text-positive" />
        </div>
        <div>
          <p className="text-positive font-black text-lg">¡Cierre guardado!</p>
          <p className="text-[#9ca3af] text-xs mt-1">Las transacciones han sido registradas en el sistema</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1A1D2E] border border-[#2A2F42] rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[#9ca3af] text-sm font-medium">Estado del cierre</p>
        <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border ${badge.color}`}>
          {badge.icon}{badge.label}
        </span>
      </div>

      <button
        onClick={onGuardar}
        disabled={disabled || guardando || guardado}
        className="w-full flex items-center justify-center gap-2 py-4 bg-teal hover:bg-teal/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-colors shadow-lg shadow-teal/20 text-base"
      >
        {guardando
          ? <><Loader2 size={20} className="animate-spin" />Guardando cierre...</>
          : <><Save size={20} />CONFIRMAR Y GUARDAR CIERRE</>
        }
      </button>

      <p className="text-[#4b5563] text-xs text-center">
        Se registrarán todas las transacciones del día en el sistema
      </p>
    </div>
  )
}
