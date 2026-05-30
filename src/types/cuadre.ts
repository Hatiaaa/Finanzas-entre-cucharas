export interface CreditoCliente {
  cliente:  string
  cantidad: number
  monto:    number
}

export interface ProductoCuadre {
  nombre:        string
  categoria:     string   // "Almuerzo" | "Desayunos" | "Bebidas" | "Porciones" | ...
  cantidad:      number
  efectivo:      number
  transferencia: number
  credito:       number   // calculado: suma de creditos[].monto
  creditos:      CreditoCliente[]
  total:         number   // calculado: efectivo + transferencia + credito
}

export interface GastoCuadre {
  descripcion:  string
  valor:        number
  tieneFactura: boolean
}

export interface DatosCuadre {
  baseInicial:  number
  conteoFisico: number
  productos:    ProductoCuadre[]
  gastos:       GastoCuadre[]
}

export interface ResumenCuadre {
  totalEfectivo:      number
  totalTransferencia: number
  totalCredito:       number
  totalVentas:        number
  totalGastos:        number
  saldoTeorico:       number  // legacy
  totalFisico:        number  // conteoFisico + totalTransferencia
  ingresadoHoy:       number  // totalFisico - baseInicial
  diferencia:         number  // ingresadoHoy - (totalVentas - totalGastos)
}

export type EstadoCuadre = 'idle' | 'procesando' | 'listo' | 'guardando' | 'guardado' | 'error'
