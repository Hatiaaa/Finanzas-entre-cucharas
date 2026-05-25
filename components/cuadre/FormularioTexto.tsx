import React from 'react'
import { Bot, Loader2, RotateCcw } from 'lucide-react'
import { EstadoCuadre } from '../../types/cuadre'

interface Props {
  texto: string
  onTextoChange: (v: string) => void
  onProcesar: () => void
  onReset: () => void
  estado: EstadoCuadre
  errorMsg: string | null
}

const PLACEHOLDER = `Escribe el cierre del día en lenguaje natural. Por ejemplo:

"Base $63.81. Almuerzos 28: 18 efectivo $54 y 10 transferencia $30.
Segundos 10: 7 efectivo $21 y 3 crédito $9.
Gastos: tienda $2.10 con factura, Freddy $10.
Conté la caja y hay $119.40"`

export function FormularioTexto({ texto, onTextoChange, onProcesar, onReset, estado, errorMsg }: Props) {
  const procesando = estado === 'procesando'
  const tieneResultado = estado === 'listo' || estado === 'guardando' || estado === 'guardado'

  return (
    <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#19A8C7]/10">
          <Bot size={20} className="text-[#19A8C7]" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Descripción del día</h3>
          <p className="text-gray-500 text-xs">La IA interpretará tu texto y llenará el cuadre automáticamente</p>
        </div>
      </div>

      <textarea
        value={texto}
        onChange={e => onTextoChange(e.target.value)}
        placeholder={PLACEHOLDER}
        disabled={procesando}
        rows={6}
        className="w-full bg-[#0B131F] border border-[#1E293B] rounded-2xl p-4 text-white text-sm placeholder-gray-600 focus:ring-1 focus:ring-[#19A8C7] focus:border-[#19A8C7] outline-none resize-none transition-all disabled:opacity-50"
      />

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onProcesar}
          disabled={procesando || !texto.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#19A8C7] hover:bg-[#107287] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#19A8C7]/20"
        >
          {procesando ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Procesando con IA...
            </>
          ) : (
            <>
              <Bot size={18} />
              {tieneResultado ? 'Re-procesar con IA' : 'Procesar con IA'}
            </>
          )}
        </button>

        {tieneResultado && (
          <button
            onClick={onReset}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors border border-[#1E293B]"
            title="Nuevo cuadre"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
