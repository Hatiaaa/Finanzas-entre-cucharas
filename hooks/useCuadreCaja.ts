import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  DatosCuadre,
  ResumenCuadre,
  EstadoCuadre,
  ProductoCuadre,
  GastoCuadre
} from '../types/cuadre'
import { calcularTotales, enriquecerProductos } from '../lib/calculos'

export function useCuadreCaja(accountIdEfectivo: string, accountIdBanco: string, accountIdCredito: string, onGuardado?: () => void) {
  const [texto, setTexto] = useState('')
  const [datos, setDatos] = useState<DatosCuadre | null>(null)
  const [resumen, setResumen] = useState<ResumenCuadre | null>(null)
  const [estado, setEstado] = useState<EstadoCuadre>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Recalcula resumen cada vez que cambian los datos
  const recalcular = useCallback((nuevosDatos: DatosCuadre) => {
    const nuevoResumen = calcularTotales(nuevosDatos)
    setDatos(nuevosDatos)
    setResumen(nuevoResumen)
  }, [])

  // Llama a /api/parsear con el texto libre
  const procesarTexto = useCallback(async () => {
    if (!texto.trim()) return
    setEstado('procesando')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/parsear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }

      const raw = await res.json()

      // Enriquecer productos con el campo "total"
      const nuevosDatos: DatosCuadre = {
        baseInicial: Number(raw.baseInicial) || 0,
        conteoFisico: Number(raw.conteoFisico) || 0,
        productos: enriquecerProductos(
          (raw.productos || []).map((p: any) => {
            // Robusto: acepta creditos[] (nuevo) o credito number (viejo/fallback)
            let creditos: { cliente: string; cantidad: number; monto: number }[] = []
            if (Array.isArray(p.creditos)) {
              creditos = p.creditos
                .filter((c: any) => c && Number(c.monto) > 0)
                .map((c: any) => ({
                  cliente: c.cliente || 'Sin nombre',
                  cantidad: Number(c.cantidad) || 0,
                  monto: Number(c.monto) || 0
                }))
            } else if (typeof p.credito === 'number' && p.credito > 0) {
              creditos = [{ cliente: 'Sin nombre', cantidad: 0, monto: p.credito }]
            }
            return {
              nombre: p.nombre || '',
              categoria: p.categoria || 'Ventas Alimentos',
              cantidad: Number(p.cantidad) || 0,
              efectivo: Number(p.efectivo) || 0,
              transferencia: Number(p.transferencia) || 0,
              creditos
            }
          })
        ),
        gastos: (raw.gastos || []).map((g: any) => ({
          descripcion: g.descripcion || '',
          valor: Number(g.valor) || 0,
          tieneFactura: Boolean(g.tieneFactura)
        }))
      }

      recalcular(nuevosDatos)
      setEstado('listo')
    } catch (err: any) {
      setErrorMsg(err.message || 'Error desconocido al procesar el texto')
      setEstado('error')
    }
  }, [texto, recalcular])

  // Edición manual de una celda de producto
  const actualizarProducto = useCallback(
    (index: number, campo: keyof Omit<ProductoCuadre, 'total'>, valor: number | string) => {
      if (!datos) return
      const nuevosProductos = datos.productos.map((p, i) => {
        if (i !== index) return p
        const esString = campo === 'nombre' || campo === 'categoria'
        let actualizado = { ...p, [campo]: esString ? valor : (typeof valor === 'string' ? Number(valor) || 0 : valor) }
        // Si el usuario edita 'credito' manualmente, sincronizar creditos array
        if (campo === 'credito') {
          const monto = typeof valor === 'string' ? Number(valor) || 0 : valor as number
          actualizado = { ...actualizado, creditos: monto > 0 ? [{ cliente: 'Sin nombre', cantidad: 0, monto }] : [] }
        }
        const credito = actualizado.creditos.reduce((s, c) => s + c.monto, 0)
        return { ...actualizado, credito, total: actualizado.efectivo + actualizado.transferencia + credito }
      })
      recalcular({ ...datos, productos: nuevosProductos })
    },
    [datos, recalcular]
  )

  // Edición manual de un gasto
  const actualizarGasto = useCallback(
    (index: number, campo: keyof GastoCuadre, valor: number | string | boolean) => {
      if (!datos) return
      const nuevosGastos = datos.gastos.map((g, i) => {
        if (i !== index) return g
        return { ...g, [campo]: valor }
      })
      recalcular({ ...datos, gastos: nuevosGastos })
    },
    [datos, recalcular]
  )

  // Actualizar conteo físico manualmente
  const actualizarConteoFisico = useCallback(
    (valor: number) => {
      if (!datos) return
      recalcular({ ...datos, conteoFisico: valor })
    },
    [datos, recalcular]
  )

  // Guardar cierre en Supabase
  const guardarCierre = useCallback(async () => {
    if (!datos || !resumen || !accountIdEfectivo || !accountIdBanco) return

    setEstado('guardando')
    setErrorMsg(null)

    try {
      const ahora = new Date().toISOString()
      const fechaHoy = ahora.split('T')[0]

      // Verificar si ya existe un cierre para hoy
      const { data: existente } = await supabase
        .from('daily_closings')
        .select('id')
        .gte('date', `${fechaHoy}T00:00:00`)
        .lte('date', `${fechaHoy}T23:59:59`)
        .maybeSingle()

      if (existente) {
        const confirmar = window.confirm(
          'Ya existe un cierre para el día de hoy. ¿Deseas reemplazarlo?'
        )
        if (!confirmar) {
          setEstado('listo')
          return
        }
        // Eliminar el cierre anterior
        await supabase.from('daily_closings').delete().eq('id', existente.id)
      }

      // --- 1. Preparar transacciones ---
      const transacciones: any[] = []

      for (const producto of datos.productos) {
        const cat = producto.categoria || 'Ventas Alimentos'

        // Ingreso en efectivo
        if (producto.efectivo > 0) {
          transacciones.push({
            date: ahora,
            type: 'Ingreso',
            category: cat,
            subcategory: producto.nombre,
            amount: producto.efectivo,
            account_id: accountIdEfectivo,
            quantity: producto.cantidad > 0 ? producto.cantidad : null,
            description: `Cierre del día - ${producto.nombre}`,
            has_attachment: false
          })
        }

        // Ingreso por transferencia
        if (producto.transferencia > 0) {
          transacciones.push({
            date: ahora,
            type: 'Ingreso',
            category: cat,
            subcategory: producto.nombre,
            amount: producto.transferencia,
            account_id: accountIdBanco,
            quantity: null,
            description: `Cierre del día - ${producto.nombre} (transferencia)`,
            has_attachment: false
          })
        }

        // Ingresos a crédito — uno por cliente en la cuenta Cuentas por Cobrar
        for (const cr of producto.creditos) {
          if (cr.monto > 0) {
            transacciones.push({
              date: ahora,
              type: 'Ingreso',
              category: cat,
              subcategory: producto.nombre,
              amount: cr.monto,
              account_id: accountIdCredito || null,
              quantity: cr.cantidad > 0 ? cr.cantidad : null,
              description: `Cierre del día - ${producto.nombre}`,
              has_attachment: false,
              client: cr.cliente
            })
          }
        }
      }

      // Egresos por gastos
      for (const gasto of datos.gastos) {
        if (gasto.valor > 0) {
          transacciones.push({
            date: ahora,
            type: 'Egreso',
            category: 'Gastos Diarios',
            subcategory: gasto.descripcion,
            amount: gasto.valor,
            account_id: accountIdEfectivo,
            description: gasto.descripcion,
            has_attachment: gasto.tieneFactura
          })
        }
      }

      // --- 2. Insertar transacciones en lote ---
      if (transacciones.length > 0) {
        const { error: txError } = await supabase
          .from('transactions')
          .insert(transacciones)

        if (txError) throw new Error(`Error al guardar transacciones: ${txError.message}`)
      }

      // --- 3. Insertar daily_closing ---
      const { error: closingError } = await supabase.from('daily_closings').insert([{
        date: ahora,
        account_id: accountIdEfectivo,
        system_balance: resumen.saldoTeorico,
        physical_amount: datos.conteoFisico,
        difference: resumen.diferencia,
        notes: texto
      }])

      if (closingError) throw new Error(`Error al guardar cierre: ${closingError.message}`)

      setEstado('guardado')
      onGuardado?.()  // notificar a App.tsx para que recargue los datos
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar en la base de datos')
      setEstado('error')
    }
  }, [datos, resumen, accountIdEfectivo, accountIdBanco, texto])

  // Eliminar un producto por índice
  const eliminarProducto = useCallback(
    (index: number) => {
      if (!datos) return
      const nuevosProductos = datos.productos.filter((_, i) => i !== index)
      recalcular({ ...datos, productos: nuevosProductos })
    },
    [datos, recalcular]
  )

  // Eliminar un gasto por índice
  const eliminarGasto = useCallback(
    (index: number) => {
      if (!datos) return
      const nuevosGastos = datos.gastos.filter((_, i) => i !== index)
      recalcular({ ...datos, gastos: nuevosGastos })
    },
    [datos, recalcular]
  )

  // Limpiar todos los productos
  const limpiarProductos = useCallback(() => {
    if (!datos) return
    recalcular({ ...datos, productos: [] })
  }, [datos, recalcular])

  // Limpiar todos los gastos
  const limpiarGastos = useCallback(() => {
    if (!datos) return
    recalcular({ ...datos, gastos: [] })
  }, [datos, recalcular])

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
    resetear
  }
}
