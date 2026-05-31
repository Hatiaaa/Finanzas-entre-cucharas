import { Bot, Loader2, RotateCcw } from 'lucide-react'
import type { EstadoCuadre } from '@/types/cuadre'

interface Props {
  texto:         string
  onTextoChange: (v: string) => void
  onProcesar:    () => void
  onReset:       () => void
  estado:        EstadoCuadre
  errorMsg:      string | null
}

const PLACEHOLDER = `Escribe el cierre del día en lenguaje natural. Por ejemplo:

"Base $63.81. Almuerzos 28: 18 efectivo $54 y 10 transferencia $30.
Segundos 10: 7 efectivo $21 y 3 crédito Consuelo $9.
Gastos: tienda $2.10, Freddy $10.
Conté la caja y hay $119.40"`

export function FormularioTexto({ texto, onTextoChange, onProcesar, onReset, estado, errorMsg }: Props) {
  const procesando      = estado === 'procesando'
  const tieneResultado  = estado === 'listo' || estado === 'guardando' || estado === 'guardado'

  return (
    <div className="bg-[#1A1D2E] border border-[#2A2F42] rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-teal/10">
          <Bot size={20} className="text-teal" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Descripción del día</h3>
          <p className="text-[#9ca3af] text-xs">La IA interpretará tu texto y llenará el cuadre automáticamente</p>
        </div>
      </div>

      <textarea
        value={texto}
        onChange={e => onTextoChange(e.target.value)}
        placeholder={PLACEHOLDER}
        disabled={procesando}
        rows={6}
        className="w-full bg-[#0E1420] border border-[#2A2F42] rounded-2xl p-4 text-white text-sm placeholder-[#4b5563] focus:ring-1 focus:ring-teal focus:border-teal outline-none resize-none transition-all disabled:opacity-50"
      />

      {errorMsg && (
        <div className="bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-negative text-sm">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onProcesar}
          disabled={procesando || !texto.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal hover:bg-teal/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-teal/20"
        >
          {procesando ? (
            <><Loader2 size={18} className="animate-spin" />Procesando con IA...</>
          ) : (
            <><Bot size={18} />{tieneResultado ? 'Re-procesar con IA' : 'Procesar con IA'}</>
          )}
        </button>

        {tieneResultado && (
          <button
            onClick={onReset}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-[#9ca3af] hover:text-white rounded-xl transition-colors border border-[#2A2F42]"
            title="Nuevo cuadre"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
