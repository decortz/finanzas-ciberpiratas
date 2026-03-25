// ===== DEFAULT PRE-FILLED ITEMS PER CATEGORY =====

export const MOVEMENT_TYPES = {
  INGRESO: 'ingreso',
  COSTO_VENTA: 'costo_venta',
  GASTO_VENTA: 'gasto_venta',
  GASTO_OPERACIONAL: 'gasto_operacional',
  PAGO_DEUDA: 'pago_deuda',
}

export const MOVEMENT_TYPE_LABELS = {
  ingreso: 'Ingreso',
  costo_venta: 'Costo de venta',
  gasto_venta: 'Gasto de venta',
  gasto_operacional: 'Gasto operacional',
  pago_deuda: 'Pago deuda',
}

export const EXPENSE_TYPES = [
  MOVEMENT_TYPES.COSTO_VENTA,
  MOVEMENT_TYPES.GASTO_VENTA,
  MOVEMENT_TYPES.GASTO_OPERACIONAL,
  MOVEMENT_TYPES.PAGO_DEUDA,
]

// Gastos Operacionales - Pre-filled list
export const DEFAULT_GASTOS_OPERACIONALES = [
  'Renta',
  'Despensa ó mercado',
  'Celular e Internet',
  'Luz',
  'Agua',
  'Mantenimiento ó administración',
  'Transporte',
  'Taxis',
  'Mantenimiento vehicular',
  'Gasolina',
  'Peajes o parqueadero',
  'Otros',
]

// Gastos de Venta - Pre-filled list
export const DEFAULT_GASTOS_VENTA = [
  'Papelería',
  'Gastos médicos',
  'Autocuidado',
  'Deporte',
  'Plataformas',
  'Tienditas',
  'Café y similares',
  'Salidas de trabajo',
  'Comidas Fuera',
  'Fiestas o salidas',
  'Viajes',
  'Regalos',
  'Ropa (y otras compras)',
  'Cosas que no me debí gastar',
  'Impuestos y bancarios',
  'Disposición de efectivo',
  'Préstamos',
  'Otros',
]

// Pago Deudas - Pre-filled list (customizable labels)
export const DEFAULT_PAGO_DEUDAS = [
  'Tarjeta de crédito 1',
  'Tarjeta de crédito 2',
  'Tarjeta departamental',
  'Créditos',
  'Otros',
]

// Costos de Venta - Always empty by default (user creates custom items)
export const DEFAULT_COSTOS_VENTA = []

// Income - Always empty by default + auto "Préstamos" item
export const INCOME_AUTO_ITEMS = ['Préstamos']

export const MONTHS = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

export const CURRENT_YEAR = new Date().getFullYear()

export const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)

/**
 * Create the default items structure for a new project
 * Returns the full items config with pre-filled defaults
 */
export function createDefaultProjectItems() {
  return {
    ingresos: [], // User creates manually; "Préstamos" is always auto-added in UI
    costos_venta: DEFAULT_COSTOS_VENTA.map(label => ({
      id: crypto.randomUUID(),
      label,
      isDefault: true,
    })),
    gastos_operacionales: DEFAULT_GASTOS_OPERACIONALES.map(label => ({
      id: crypto.randomUUID(),
      label,
      isDefault: true,
    })),
    gastos_venta: DEFAULT_GASTOS_VENTA.map(label => ({
      id: crypto.randomUUID(),
      label,
      isDefault: true,
    })),
    pago_deudas: DEFAULT_PAGO_DEUDAS.map(label => ({
      id: crypto.randomUUID(),
      label,
      isDefault: true,
    })),
  }
}
