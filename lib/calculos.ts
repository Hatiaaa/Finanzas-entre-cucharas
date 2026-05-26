import { DatosCuadre, ResumenCuadre, ProductoCuadre } from '../types/cuadre'

export function calcularTotales(datos: DatosCuadre): ResumenCuadre {
  const totalEfectivo = datos.productos.reduce((s, p) => s + p.efectivo, 0)
  const totalTransferencia = datos.productos.reduce((s, p) => s + p.transferencia, 0)
  const totalCredito = datos.productos.reduce((s, p) => s + p.credito, 0)
  const totalVentas = totalEfectivo + totalTransferencia + totalCredito
  const totalGastos = datos.gastos.reduce((s, g) => s + g.valor, 0)

  // Legacy
  const saldoTeorico = datos.baseInicial + totalEfectivo - totalGastos

  // Nueva lógica: desde el conteo físico hacia atrás
  // totalFisico = lo que hay en caja (efectivo) + lo que llegó por transferencia
  const totalFisico = datos.conteoFisico + totalTransferencia
  // ingresadoHoy = lo que entró al negocio hoy (descontando la base de ayer)
  const ingresadoHoy = totalFisico - datos.baseInicial
  // diferencia = lo que ingresó vs ventas netas (ventas - gastos)
  const diferencia = ingresadoHoy - (totalVentas - totalGastos)

  return {
    totalEfectivo,
    totalTransferencia,
    totalCredito,
    totalVentas,
    totalGastos,
    saldoTeorico,
    totalFisico,
    ingresadoHoy,
    diferencia
  }
}

export function enriquecerProductos(
  productos: Omit<ProductoCuadre, 'total'>[]
): ProductoCuadre[] {
  return productos.map(p => ({
    ...p,
    categoria: p.categoria || 'Ventas Alimentos',
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
