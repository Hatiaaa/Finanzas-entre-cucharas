import { DatosCuadre, ResumenCuadre, ProductoCuadre } from '@/types/cuadre'

export function calcularTotales(datos: DatosCuadre): ResumenCuadre {
  const totalEfectivo     = datos.productos.reduce((s, p) => s + p.efectivo, 0)
  const totalTransferencia = datos.productos.reduce((s, p) => s + p.transferencia, 0)
  const totalCredito      = datos.productos.reduce(
    (s, p) => s + (p.creditos ?? []).reduce((sc, c) => sc + c.monto, 0), 0
  )
  const totalVentas  = totalEfectivo + totalTransferencia + totalCredito
  const totalGastos  = datos.gastos.reduce((s, g) => s + g.valor, 0)
  const saldoTeorico = datos.baseInicial + totalEfectivo - totalGastos

  // Conteo físico (efectivo en caja) + transferencias = total físico recibido
  const totalFisico  = datos.conteoFisico + totalTransferencia
  const ingresadoHoy = totalFisico - datos.baseInicial
  const diferencia   = ingresadoHoy - (totalVentas - totalGastos)

  return {
    totalEfectivo,
    totalTransferencia,
    totalCredito,
    totalVentas,
    totalGastos,
    saldoTeorico,
    totalFisico,
    ingresadoHoy,
    diferencia,
  }
}

export function enriquecerProductos(
  productos: Omit<ProductoCuadre, 'total' | 'credito'>[]
): ProductoCuadre[] {
  return productos.map(p => {
    const creditos = p.creditos ?? []
    const credito  = creditos.reduce((s, c) => s + c.monto, 0)
    return {
      ...p,
      categoria: p.categoria ?? 'Ventas Alimentos',
      creditos,
      credito,
      total: p.efectivo + p.transferencia + credito,
    }
  })
}

export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-EC', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: 2,
  }).format(valor)
}
