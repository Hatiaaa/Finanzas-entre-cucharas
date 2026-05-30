const TZ = 'America/Guayaquil' // UTC-5, sin horario de verano

/** ISO timestamp actual en UTC (para guardar en Supabase) */
export function nowISO(): string {
  return new Date().toISOString()
}

/** Fecha local hoy en formato YYYY-MM-DD usando la timezone del browser */
export function todayLocal(): string {
  const now = new Date()
  return now.toLocaleDateString('en-CA', { timeZone: TZ }) // en-CA → YYYY-MM-DD
}

/**
 * Límites del día actual en UTC, basados en la hora local (Ecuador).
 * Úsalos en queries de Supabase para filtrar por "hoy" sin desfase.
 */
export function todayUTCBounds(): { start: string; end: string } {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
  return { start, end }
}
