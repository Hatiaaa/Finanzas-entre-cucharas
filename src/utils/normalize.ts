/**
 * Normaliza un nombre para comparación sin tildes ni mayúsculas.
 * Ejemplos:
 *   "Bolón chicharrón" → "bolon chicharron"
 *   "ALMUERZO"         → "almuerzo"
 *   "maría"            → "maria"
 */
export function normalizeKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')            // descompone á → a + combining accent
    .replace(/[̀-ͯ]/g, '') // elimina los diacríticos
    .replace(/\s+/g, ' ')       // colapsa espacios múltiples
}
