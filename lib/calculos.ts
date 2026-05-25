import { DatosCuadre, ResumenCuadre, ProductoCuadre } from '../types/cuadre'

export function calcularTotales(datos: DatosCuadre): ResumenCuadre {
  const totalEfectivo = datos.productos.reduce((s, p) => s + p.efectivo, 0)
  const totalTransferencia = datos.productos.reduce((s, p) => s + p.transferencia, 0)
  const totalCredito = datos.productos.reduce((s, p) => s + p.credito, 0)
  const totalVentas = totalEfectivo + totalTransferencia + totalCredito
  const totalGastos = datos.gastos.reduce((s, g) => s + g.valor, 0)

  // Saldo teórico: solo considera efectivo (lo que debe haber físicamente en caja)
  const saldoTeorico = datos.baseInicial + totalEfectivo - totalGastos
  const diferencia = datos.conteoFisico - saldoTeorico

  return {
    totalEfectivo,
    totalTransferencia,
    totalCredito,
    totalVentas,
    totalGastos,
    saldoTeorico,
    diferencia
  }
}

export function enriquecerProductos(
  productos: Omit<ProductoCuadre, 'total'>[]
): ProductoCuadre[] {
  return productos.map(p => ({
    ...p,
    total: p.efectivo + p.transferencia + p.credito
  }))
}

export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(valor)
}
