export interface CreditoCliente {
  cliente: string
  cantidad: number
  monto: number
}

export interface ProductoCuadre {
  nombre: string
  categoria: string  // categoría del sistema: "Almuerzo", "Desayunos", "Bebidas", "Porciones", etc.
  cantidad: number
  efectivo: number
  transferencia: number
  credito: number          // total calculado: suma de creditos[].monto
  creditos: CreditoCliente[] // desglose por cliente
  total: number // calculado: efectivo + transferencia + credito
}

export interface GastoCuadre {
  descripcion: string
  valor: number
  tieneFactura: boolean
}

export interface DatosCuadre {
  baseInicial: number
  conteoFisico: number
  productos: ProductoCuadre[]
  gastos: GastoCuadre[]
}

export interface ResumenCuadre {
  totalEfectivo: number
  totalTransferencia: number
  totalCredito: number
  totalVentas: number
  totalGastos: number
  saldoTeorico: number   // legacy, se mantiene para compatibilidad
  totalFisico: number    // conteoFisico + totalTransferencia
  ingresadoHoy: number   // totalFisico - baseInicial
  diferencia: number     // ingresadoHoy - totalVentas
}

export interface CierrePayload {
  datos: DatosCuadre
  resumen: ResumenCuadre
  textoOriginal: string
  accountIdEfectivo: string
  accountIdBanco: string
}

export type EstadoCuadre = 'idle' | 'procesando' | 'listo' | 'guardando' | 'guardado' | 'error'
