/** Formatea un número como moneda USD con separadores Ecuador */
export function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

/** Formatea una fecha ISO para mostrar en la UI */
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    day:      '2-digit',
    month:    'short',
    year:     'numeric',
    ...opts,
  })
}

/** Formatea hora de una fecha ISO */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-EC', {
    timeZone: 'America/Guayaquil',
    hour:     '2-digit',
    minute:   '2-digit',
  })
}
