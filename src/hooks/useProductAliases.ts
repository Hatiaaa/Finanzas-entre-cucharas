import { useState, useCallback } from 'react'
import { normalizeKey } from '@/utils/normalize'

const STORAGE_KEY = 'ec_product_aliases'

/** Aliases guardados: { clave_normalizada_origen → nombre_canónico_display } */
type AliasMap = Record<string, string>

function load(): AliasMap {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  catch { return {} }
}

function save(map: AliasMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function useProductAliases() {
  const [aliases, setAliases] = useState<AliasMap>(load)

  /**
   * Dado un nombre de producto (tal cual viene de la BD),
   * devuelve el nombre canónico que debe mostrarse y usarse para agrupar.
   */
  const resolve = useCallback(
    (name: string): string => aliases[normalizeKey(name)] ?? name,
    [aliases],
  )

  /**
   * Define que `from` debe mostrarse como `canonical`.
   * `from` es el nombre original (se normaliza internamente).
   * `canonical` es el nombre que se mostrará (sin normalizar).
   */
  const setAlias = useCallback((from: string, canonical: string) => {
    setAliases(prev => {
      const next = { ...prev, [normalizeKey(from)]: canonical }
      save(next)
      return next
    })
  }, [])

  const removeAlias = useCallback((from: string) => {
    setAliases(prev => {
      const { [normalizeKey(from)]: _, ...rest } = prev
      save(rest)
      return rest
    })
  }, [])

  const clearAll = useCallback(() => {
    save({})
    setAliases({})
  }, [])

  return { aliases, resolve, setAlias, removeAlias, clearAll }
}
