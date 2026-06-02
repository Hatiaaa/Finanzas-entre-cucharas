import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QK } from '@/lib/queryClient'
import { calcularTotales, enriquecerProductos } from '@/lib/calculos'
import { todayUTCBounds } from '@/utils/dates'
import type {
  DatosCuadre,
  ResumenCuadre,
  EstadoCuadre,
  ProductoCuadre,
  GastoCuadre,
} from '@/types/cuadre'

export function useCuadreCaja(
  accountIdEfectivo: string,
  accountIdBanco:    string,
  accountIdCredito:  string,
  onGuardado?:       () => void,
) {
  const qc = useQueryClient()

  const [texto,    setTexto]    = useState('')
  const [datos,    setDatos]    = useState<DatosCuadre | null>(null)
  const [resumen,  setResumen]  = useState<ResumenCuadre | null>(null)
  const [estado,   setEstado]   = useState<EstadoCuadre>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── Recalcular resumen ────────────────────────────────────────────────────
  const recalcular = useCallback((nuevosDatos: DatosCuadre) => {
    setDatos(nuevosDatos)
    setResumen(calcularTotales(nuevosDatos))
  }, [])

  // ── Parsear texto con IA ──────────────────────────────────────────────────
  const procesarTexto = useCallback(async () => {
    if (!texto.trim()) return
    setEstado('procesando')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/parsear', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ texto }),
      })

      if (!res.ok) {
        const err    = await res.json().catch(() => ({})) as { error?: string; detail?: string }
        const detail = err.detail ? ` — ${err.detail}` : ''
        throw new Error((err.error ?? `Error ${res.status}`) + detail)
      }

      const raw = await res.json() as Record<string, unknown>

      const nuevosDatos: DatosCuadre = {
        baseInicial:  Number(raw.baseInicial)  || 0,
        conteoFisico: Number(raw.conteoFisico) || 0,
        productos: enriquecerProductos(
          ((raw.productos as unknown[]) ?? []).map((p: unknown) => {
            const prod = p as Record<string, unknown>
            let creditos: { cliente: string; cantidad: number; monto: number }[] = []

            if (Array.isArray(prod.creditos)) {
              creditos = prod.creditos
                .filter((c: unknown) => c && Number((c as Record<string,unknown>).monto) > 0)
                .map((c: unknown) => {
                  const cr = c as Record<string, unknown>
                  return {
                    cliente:  String(cr.cliente  ?? 'Sin nombre'),
                    cantidad: Number(cr.cantidad) || 0,
                    monto:    Number(cr.monto)    || 0,
                  }
                })
            } else if (typeof prod.credito === 'number' && prod.credito > 0) {
              creditos = [{ cliente: 'Sin nombre', cantidad: 0, monto: prod.credito }]
            }

            return {
              nombre:        String(prod.nombre        ?? ''),
              categoria:     String(prod.categoria     ?? 'Ventas Alimentos'),
              cantidad:      Number(prod.cantidad)     || 0,
              efectivo:      Number(prod.efectivo)     || 0,
              transferencia: Number(prod.transferencia) || 0,
              creditos,
            }
          })
        ),
        gastos: ((raw.gastos as unknown[]) ?? []).map((g: unknown) => {
          const gasto = g as Record<string, unknown>
          return {
            descripcion:  String(gasto.descripcion  ?? ''),
            valor:        Number(gasto.valor)        || 0,
            tieneFactura: Boolean(gasto.tieneFactura),
          }
        }),
      }

      recalcular(nuevosDatos)
      setEstado('listo')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al procesar el texto'
      setErrorMsg(msg)
      setEstado('error')
    }
  }, [texto, recalcular])

  // ── Edición de producto ───────────────────────────────────────────────────
  const actualizarProducto = useCallback(
    (index: number, campo: keyof Omit<ProductoCuadre, 'total'>, valor: number | string) => {
      if (!datos) return
      const nuevosProductos = datos.productos.map((p, i) => {
        if (i !== index) return p
        const esString = campo === 'nombre' || campo === 'categoria'
        const valorFinal = esString ? valor : (typeof valor === 'string' ? Number(valor) || 0 : valor)
        let actualizado = { ...p, [campo]: valorFinal }

        if (campo === 'credito') {
          const monto = typeof valor === 'string' ? Number(valor) || 0 : (valor as number)
          actualizado = {
            ...actualizado,
            creditos: monto > 0 ? [{ cliente: 'Sin nombre', cantidad: 0, monto }] : [],
          }
        }

        const credito = actualizado.creditos.reduce((s, c) => s + c.monto, 0)
        return { ...actualizado, credito, total: actualizado.efectivo + actualizado.transferencia + credito }
      })
      recalcular({ ...datos, productos: nuevosProductos })
    },
    [datos, recalcular],
  )

  // ── Edición de gasto ─────────────────────────────────────────────────────
  const actualizarGasto = useCallback(
    (index: number, campo: keyof GastoCuadre, valor: number | string | boolean) => {
      if (!datos) return
      const nuevosGastos = datos.gastos.map((g, i) => i !== index ? g : { ...g, [campo]: valor })
      recalcular({ ...datos, gastos: nuevosGastos })
    },
    [datos, recalcular],
  )

  const actualizarConteoFisico = useCallback(
    (valor: number) => { if (datos) recalcular({ ...datos, conteoFisico: valor }) },
    [datos, recalcular],
  )

  const eliminarProducto = useCallback(
    (index: number) => {
      if (!datos) return
      recalcular({ ...datos, productos: datos.productos.filter((_, i) => i !== index) })
    },
    [datos, recalcular],
  )

  const eliminarGasto = useCallback(
    (index: number) => {
      if (!datos) return
      recalcular({ ...datos, gastos: datos.gastos.filter((_, i) => i !== index) })
    },
    [datos, recalcular],
  )

  const limpiarProductos = useCallback(() => {
    if (datos) recalcular({ ...datos, productos: [] })
  }, [datos, recalcular])

  const limpiarGastos = useCallback(() => {
    if (datos) recalcular({ ...datos, gastos: [] })
  }, [datos, recalcular])

  // ── Guardar cierre ────────────────────────────────────────────────────────
  const guardarCierre = useCallback(async () => {
    if (!datos || !resumen || !accountIdEfectivo || !accountIdBanco) return

    setEstado('guardando')
    setErrorMsg(null)

    try {
      const ahora = new Date().toISOString()
      const { start, end } = todayUTCBounds()

      // Verificar si ya existe un cierre para hoy (hora local Ecuador)
      const { data: existente } = await supabase
        .from('daily_closings')
        .select('id, date')
        .gte('date', start)
        .lte('date', end)
        .maybeSingle()

      if (existente) {
        const confirmar = window.confirm('Ya existe un cierre para el día de hoy. ¿Deseas reemplazarlo?')
        if (!confirmar) { setEstado('listo'); return }
        // Borrar las transacciones del cierre anterior:
        //  · cierres nuevos   → vinculadas por closing_id (preciso y seguro)
        //  · cierres antiguos → sin closing_id: fallback por timestamp exacto
        await supabase.from('transactions').delete().eq('closing_id', existente.id)
        await supabase.from('transactions').delete().is('closing_id', null).eq('date', existente.date)
        await supabase.from('daily_closings').delete().eq('id', existente.id)
      }

      // 1) Crear el cierre PRIMERO para obtener su id y vincular las
      //    transacciones por closing_id (relación precisa, no por timestamp).
      const { data: cierre, error: cErr } = await supabase
        .from('daily_closings')
        .insert([{
          date:            ahora,
          account_id:      accountIdEfectivo,
          system_balance:  resumen.saldoTeorico,
          physical_amount: datos.conteoFisico,
          difference:      resumen.diferencia,
          notes:           texto,
        }])
        .select('id')
        .single()
      if (cErr || !cierre) throw new Error(`Error al guardar cierre: ${cErr?.message ?? 'sin id'}`)

      const closingId = (cierre as { id: string }).id

      // 2) Construir transacciones, cada una vinculada al cierre recién creado.
      const txs: Record<string, unknown>[] = []

      for (const p of datos.productos) {
        const cat = p.categoria || 'Ventas Alimentos'
        if (p.efectivo > 0)
          txs.push({ date: ahora, type: 'Ingreso', category: cat, subcategory: p.nombre,
            amount: p.efectivo, account_id: accountIdEfectivo,
            quantity: p.cantidad > 0 ? p.cantidad : null,
            description: `Cierre del día - ${p.nombre}`, has_attachment: false, closing_id: closingId })

        if (p.transferencia > 0)
          txs.push({ date: ahora, type: 'Ingreso', category: cat, subcategory: p.nombre,
            amount: p.transferencia, account_id: accountIdBanco, quantity: null,
            description: `Cierre del día - ${p.nombre} (transferencia)`, has_attachment: false, closing_id: closingId })

        for (const cr of p.creditos) {
          if (cr.monto > 0)
            txs.push({ date: ahora, type: 'Ingreso', category: cat, subcategory: p.nombre,
              amount: cr.monto, account_id: accountIdCredito || null,
              quantity: cr.cantidad > 0 ? cr.cantidad : null,
              description: `Cierre del día - ${p.nombre}`, has_attachment: false, client: cr.cliente, closing_id: closingId })
        }
      }

      for (const g of datos.gastos) {
        if (g.valor > 0)
          txs.push({ date: ahora, type: 'Egreso', category: 'Gastos Diarios',
            subcategory: g.descripcion, amount: g.valor, account_id: accountIdEfectivo,
            description: g.descripcion, has_attachment: g.tieneFactura, closing_id: closingId })
      }

      // 3) Insertar transacciones. Si falla, revertir el cierre para no dejar huérfano.
      if (txs.length > 0) {
        const { error: txErr } = await supabase.from('transactions').insert(txs)
        if (txErr) {
          await supabase.from('daily_closings').delete().eq('id', closingId)
          throw new Error(`Error al guardar transacciones: ${txErr.message}`)
        }
      }

      // Invalidar queries para que TanStack Query recargue automáticamente
      await qc.invalidateQueries({ queryKey: QK.transactions })
      await qc.invalidateQueries({ queryKey: QK.closings })

      setEstado('guardado')
      onGuardado?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar en la base de datos'
      setErrorMsg(msg)
      setEstado('error')
    }
  }, [datos, resumen, accountIdEfectivo, accountIdBanco, accountIdCredito, texto, qc, onGuardado])

  const resetear = useCallback(() => {
    setTexto('')
    setDatos(null)
    setResumen(null)
    setEstado('idle')
    setErrorMsg(null)
  }, [])

  return {
    texto, setTexto,
    datos, resumen, estado, errorMsg,
    procesarTexto,
    actualizarProducto,
    actualizarGasto,
    actualizarConteoFisico,
    eliminarProducto,
    eliminarGasto,
    limpiarProductos,
    limpiarGastos,
    guardarCierre,
    resetear,
  }
}
