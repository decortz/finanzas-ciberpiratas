// ===== EXPORT SERVICE =====
// Builds CSV/XLSX structures from movements data

import * as XLSX from 'xlsx'
import { MOVEMENT_TYPE_LABELS, MONTHS } from '../constants/defaultItems.js'

const TYPE_ORDER = ['ingreso', 'costo_venta', 'gasto_venta', 'gasto_operacional', 'pago_deuda']

/**
 * Build a summary matrix for a project:
 * Rows = items, Columns = months (+ totals + averages)
 * Returns { headers, rows, totalsRow, averagesRow }
 */
export function buildProjectMatrix(project, movements, year) {
  const monthKeys = MONTHS.map(m => m.value) // '01'..'12'
  const yearStr = String(year)

  // Filter movements for this project and year
  const filtered = movements.filter(
    m => m.projectId === project.id && m.date.startsWith(yearStr)
  )

  // Build all items list ordered by type
  const allItems = []

  // Add "Saldo mes anterior" as a special ingreso row
  allItems.push({ type: 'ingreso', id: '__saldo_anterior__', label: 'Saldo mes anterior' })

  // Income items (auto "Préstamos" + user items)
  const incomeItems = [
    { id: '__prestamos_auto__', label: 'Préstamos', isAuto: true },
    ...(project.items.ingresos || []),
  ]
  incomeItems.forEach(item => allItems.push({ type: 'ingreso', id: item.id, label: item.label }))

  // Expense items per category
  const expenseCategories = [
    { key: 'costos_venta', type: 'costo_venta' },
    { key: 'gastos_venta', type: 'gasto_venta' },
    { key: 'gastos_operacionales', type: 'gasto_operacional' },
    { key: 'pago_deudas', type: 'pago_deuda' },
  ]
  expenseCategories.forEach(({ key, type }) => {
    ;(project.items[key] || []).forEach(item => {
      allItems.push({ type, id: item.id, label: item.label })
    })
  })

  // Build month totals per item
  const itemMonthTotals = {}
  filtered.forEach(mv => {
    const month = mv.date.slice(5, 7)
    const key = mv.itemId
    if (!itemMonthTotals[key]) itemMonthTotals[key] = {}
    itemMonthTotals[key][month] = (itemMonthTotals[key][month] || 0) + mv.amount
  })

  // Calculate "Saldo mes anterior" - carry forward from month to month
  const monthNetMap = {}
  monthKeys.forEach(month => {
    const totalIncome = filtered
      .filter(m => m.date.slice(5, 7) === month && m.type === 'ingreso')
      .reduce((s, m) => s + m.amount, 0)
    const totalExpenses = filtered
      .filter(m => m.date.slice(5, 7) === month && m.type !== 'ingreso')
      .reduce((s, m) => s + m.amount, 0)
    monthNetMap[month] = totalIncome - totalExpenses
  })

  // Cumulative saldo anterior
  const saldoAnterior = {}
  let cumulative = 0
  monthKeys.forEach(month => {
    saldoAnterior[month] = cumulative
    cumulative += monthNetMap[month]
  })

  // Build rows
  const rows = allItems.map(item => {
    const monthValues = {}
    monthKeys.forEach(month => {
      if (item.id === '__saldo_anterior__') {
        monthValues[month] = saldoAnterior[month]
      } else {
        monthValues[month] = itemMonthTotals[item.id]?.[month] || 0
      }
    })
    const total = Object.values(monthValues).reduce((s, v) => s + v, 0)
    const nonZero = Object.values(monthValues).filter(v => v !== 0)
    const avg = nonZero.length > 0 ? total / nonZero.length : 0
    return { ...item, monthValues, total, avg }
  })

  // Type subtotals
  const typeSubtotals = {}
  TYPE_ORDER.forEach(type => {
    const typeRows = rows.filter(r => r.type === type && r.id !== '__saldo_anterior__')
    const monthValues = {}
    monthKeys.forEach(month => {
      monthValues[month] = typeRows.reduce((s, r) => s + (r.monthValues[month] || 0), 0)
    })
    const total = Object.values(monthValues).reduce((s, v) => s + v, 0)
    const nonZero = Object.values(monthValues).filter(v => v !== 0)
    typeSubtotals[type] = { monthValues, total, avg: nonZero.length > 0 ? total / nonZero.length : 0 }
  })

  return { rows, typeSubtotals, monthKeys, allItems }
}

/**
 * Download a single project as CSV
 */
export function downloadProjectCSV(project, movements, year) {
  const { rows, typeSubtotals, monthKeys } = buildProjectMatrix(project, movements, year)

  const monthHeaders = MONTHS.map(m => m.label)
  const headers = ['Categoría', 'Ítem', ...monthHeaders, 'Total Anual', 'Promedio']

  const dataRows = []

  const groupedByType = {}
  TYPE_ORDER.forEach(type => {
    groupedByType[type] = rows.filter(r => r.type === type)
  })

  // Saldo anterior special row
  const saldoRow = rows.find(r => r.id === '__saldo_anterior__')
  if (saldoRow) {
    dataRows.push([
      'Ingresos',
      saldoRow.label,
      ...monthKeys.map(m => formatCurrency(saldoRow.monthValues[m] || 0)),
      formatCurrency(saldoRow.total),
      formatCurrency(saldoRow.avg),
    ])
  }

  TYPE_ORDER.forEach(type => {
    const typeRows = groupedByType[type].filter(r => r.id !== '__saldo_anterior__')
    typeRows.forEach(row => {
      dataRows.push([
        MOVEMENT_TYPE_LABELS[type],
        row.label,
        ...monthKeys.map(m => formatCurrency(row.monthValues[m] || 0)),
        formatCurrency(row.total),
        formatCurrency(row.avg),
      ])
    })
    // Subtotal row
    const sub = typeSubtotals[type]
    dataRows.push([
      `TOTAL ${MOVEMENT_TYPE_LABELS[type].toUpperCase()}`,
      '',
      ...monthKeys.map(m => formatCurrency(sub.monthValues[m] || 0)),
      formatCurrency(sub.total),
      formatCurrency(sub.avg),
    ])
    dataRows.push([]) // blank separator
  })

  // Total egresos
  const egresosTypes = ['costo_venta', 'gasto_venta', 'gasto_operacional', 'pago_deuda']
  const egresosMonths = {}
  monthKeys.forEach(m => {
    egresosMonths[m] = egresosTypes.reduce((s, t) => s + (typeSubtotals[t]?.monthValues[m] || 0), 0)
  })
  const egresosTotal = Object.values(egresosMonths).reduce((s, v) => s + v, 0)
  dataRows.push([
    'TOTAL EGRESOS', '',
    ...monthKeys.map(m => formatCurrency(egresosMonths[m])),
    formatCurrency(egresosTotal),
    '',
  ])

  const wsData = [headers, ...dataRows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, project.name.substring(0, 31))
  XLSX.writeFile(wb, `${project.name}_${year}.xlsx`)
}

/**
 * Download all projects as XLSX with separate sheets
 */
export function downloadAllProjectsXLSX(projects, movements, year) {
  const wb = XLSX.utils.book_new()

  projects.forEach(project => {
    const { rows, typeSubtotals, monthKeys } = buildProjectMatrix(
      project,
      movements.filter(m => m.projectId === project.id),
      year
    )

    const monthHeaders = MONTHS.map(m => m.label)
    const headers = ['Categoría', 'Ítem', ...monthHeaders, 'Total Anual', 'Promedio']
    const dataRows = []

    const saldoRow = rows.find(r => r.id === '__saldo_anterior__')
    if (saldoRow) {
      dataRows.push([
        'Ingresos', saldoRow.label,
        ...monthKeys.map(m => saldoRow.monthValues[m] || 0),
        saldoRow.total, saldoRow.avg,
      ])
    }

    TYPE_ORDER.forEach(type => {
      rows.filter(r => r.type === type && r.id !== '__saldo_anterior__').forEach(row => {
        dataRows.push([
          MOVEMENT_TYPE_LABELS[type], row.label,
          ...monthKeys.map(m => row.monthValues[m] || 0),
          row.total, row.avg,
        ])
      })
      const sub = typeSubtotals[type]
      dataRows.push([
        `TOTAL ${MOVEMENT_TYPE_LABELS[type].toUpperCase()}`, '',
        ...monthKeys.map(m => sub.monthValues[m] || 0),
        sub.total, sub.avg,
      ])
      dataRows.push([])
    })

    const egresosTypes = ['costo_venta', 'gasto_venta', 'gasto_operacional', 'pago_deuda']
    const egresosMonths = {}
    monthKeys.forEach(m => {
      egresosMonths[m] = egresosTypes.reduce((s, t) => s + (typeSubtotals[t]?.monthValues[m] || 0), 0)
    })
    const egresosTotal = Object.values(egresosMonths).reduce((s, v) => s + v, 0)
    dataRows.push(['TOTAL EGRESOS', '', ...monthKeys.map(m => egresosMonths[m]), egresosTotal, ''])

    const wsData = [headers, ...dataRows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const safeName = project.name.substring(0, 31).replace(/[\\/*?[\]:]/g, '_')
    XLSX.utils.book_append_sheet(wb, ws, safeName || `Proyecto`)
  })

  XLSX.writeFile(wb, `finanzas_ciberpiratas_${year}.xlsx`)
}

/**
 * Download filtered movements as CSV
 */
export function downloadFilteredCSV(movements, projects, filters) {
  if (!movements.length) return

  const projectMap = {}
  projects.forEach(p => { projectMap[p.id] = p.name })

  const headers = ['Fecha', 'Proyecto', 'Tipo', 'Ítem', 'Monto', 'Descripción']
  const rows = movements.map(m => [
    m.date,
    projectMap[m.projectId] || m.projectId,
    MOVEMENT_TYPE_LABELS[m.type] || m.type,
    m.itemLabel,
    m.amount,
    m.description,
  ])

  const wsData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()

  const filterDesc = filters
    ? `${filters.project ? projectMap[filters.project] || '' : 'todos'}_${filters.year || ''}_${filters.month || ''}`
    : 'filtrado'
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
  XLSX.writeFile(wb, `movimientos_${filterDesc}.xlsx`)
}

function formatCurrency(value) {
  return Number(value).toFixed(2)
}
