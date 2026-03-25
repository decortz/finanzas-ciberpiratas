import { useState } from 'react'
import { useData } from '../../context/DataContext.jsx'
import { useToast } from '../ui/Toast.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import Button from '../ui/Button.jsx'
import MovementFormModal from './MovementFormModal.jsx'
import { MOVEMENT_TYPE_LABELS, MONTHS } from '../../constants/defaultItems.js'
import './MovementsTable.css'

export default function MovementsTable({ movements, projects, projectId, showProjectColumn = true }) {
  const { deleteMovement } = useData()
  const addToast = useToast()

  const [filterMonth, setFilterMonth] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterItem, setFilterItem] = useState('')
  const [editingMovement, setEditingMovement] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const projectMap = {}
  projects.forEach(p => { projectMap[p.id] = p })

  // Build available items for the selected type/project
  const getAvailableItems = () => {
    if (!filterType) return []
    const allItems = new Set()
    movements.forEach(m => {
      if (m.type === filterType) allItems.add(m.itemLabel)
    })
    return Array.from(allItems).sort()
  }

  // Filter
  let filtered = [...movements].sort((a, b) => b.date.localeCompare(a.date))
  if (filterMonth) filtered = filtered.filter(m => m.date.slice(5, 7) === filterMonth)
  if (filterType) filtered = filtered.filter(m => m.type === filterType)
  if (filterItem) filtered = filtered.filter(m => m.itemLabel === filterItem)

  const handleDelete = (id) => {
    deleteMovement(id)
    addToast('Movimiento eliminado', 'success')
    setDeleteId(null)
  }

  const totalIncome = filtered.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0)
  const totalExpenses = filtered.filter(m => m.type !== 'ingreso').reduce((s, m) => s + m.amount, 0)

  const availableItems = getAvailableItems()
  const availableTypes = [...new Set(movements.map(m => m.type))]

  return (
    <div className="movements-table-wrapper">
      {/* Filters */}
      <div className="movements-filters">
        <select
          className="input-field movements-filter"
          value={filterMonth}
          onChange={e => { setFilterMonth(e.target.value); setFilterItem('') }}
        >
          <option value="">Todos los meses</option>
          {MONTHS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select
          className="input-field movements-filter"
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setFilterItem('') }}
        >
          <option value="">Todos los tipos</option>
          {availableTypes.map(t => (
            <option key={t} value={t}>{MOVEMENT_TYPE_LABELS[t] || t}</option>
          ))}
        </select>

        {filterType && availableItems.length > 0 && (
          <select
            className="input-field movements-filter"
            value={filterItem}
            onChange={e => setFilterItem(e.target.value)}
          >
            <option value="">Todos los ítems</option>
            {availableItems.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        )}

        {(filterMonth || filterType || filterItem) && (
          <button
            className="filter-clear"
            onClick={() => { setFilterMonth(''); setFilterType(''); setFilterItem('') }}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* Totals */}
      {filtered.length > 0 && (
        <div className="movements-totals">
          <span className="movements-totals__item">
            <span className="movements-totals__label">Ingresos:</span>
            <span className="text-success">+${totalIncome.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
          </span>
          <span className="movements-totals__sep">|</span>
          <span className="movements-totals__item">
            <span className="movements-totals__label">Egresos:</span>
            <span className="text-error">-${totalExpenses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
          </span>
          <span className="movements-totals__sep">|</span>
          <span className="movements-totals__item">
            <span className="movements-totals__label">Balance:</span>
            <span className={(totalIncome - totalExpenses) >= 0 ? 'text-success' : 'text-error'}>
              {(totalIncome - totalExpenses) >= 0 ? '+' : ''}${(totalIncome - totalExpenses).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </span>
          </span>
          <span className="movements-totals__count">{filtered.length} movimientos</span>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="movements-empty">
          <p>Sin movimientos {filterMonth || filterType ? 'con los filtros seleccionados' : 'registrados'}.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="movements-table">
            <thead>
              <tr>
                <th>Fecha</th>
                {showProjectColumn && <th>Proyecto</th>}
                <th>Tipo</th>
                <th>Ítem</th>
                <th className="amount-col">Monto</th>
                <th>Descripción</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td className="date-col">{formatDate(m.date)}</td>
                  {showProjectColumn && (
                    <td className="project-col">{projectMap[m.projectId]?.name || '—'}</td>
                  )}
                  <td>
                    <TypeBadge type={m.type} />
                  </td>
                  <td className="item-col">{m.itemLabel}</td>
                  <td className={`amount-col ${m.type === 'ingreso' ? 'amount--income' : 'amount--expense'}`}>
                    {m.type === 'ingreso' ? '+' : '-'}${m.amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="desc-col">{m.description || '—'}</td>
                  <td className="actions-col">
                    <button className="table-action" onClick={() => setEditingMovement(m)} title="Editar">✏️</button>
                    <button className="table-action table-action--danger" onClick={() => setDeleteId(m.id)} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Percentages table */}
      {filtered.length > 0 && (
        <PercentagesTable movements={filtered} />
      )}

      {/* Edit modal */}
      {editingMovement && (
        <MovementFormModal
          isOpen={true}
          onClose={() => setEditingMovement(null)}
          movement={editingMovement}
          defaultProjectId={projectId}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Eliminar movimiento"
        message="¿Estás seguro de eliminar este movimiento? Esta acción no se puede deshacer."
      />
    </div>
  )
}

function TypeBadge({ type }) {
  const colors = {
    ingreso: { bg: 'rgba(76,175,125,0.12)', color: '#4caf7d' },
    costo_venta: { bg: 'rgba(93,128,181,0.12)', color: '#5D80B5' },
    gasto_venta: { bg: 'rgba(239,89,154,0.12)', color: '#EF599A' },
    gasto_operacional: { bg: 'rgba(168,112,176,0.12)', color: '#A870B0' },
    pago_deuda: { bg: 'rgba(98,203,230,0.12)', color: '#62CBE6' },
  }
  const style = colors[type] || {}
  return (
    <span className="type-badge" style={{ background: style.bg, color: style.color }}>
      {MOVEMENT_TYPE_LABELS[type] || type}
    </span>
  )
}

function PercentagesTable({ movements }) {
  const totalIncome = movements.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0)
  const totalExpenses = movements.filter(m => m.type !== 'ingreso').reduce((s, m) => s + m.amount, 0)

  // Group items
  const incomeByItem = {}
  const expensesByType = {}
  movements.forEach(m => {
    if (m.type === 'ingreso') {
      incomeByItem[m.itemLabel] = (incomeByItem[m.itemLabel] || 0) + m.amount
    } else {
      if (!expensesByType[m.type]) expensesByType[m.type] = {}
      expensesByType[m.type][m.itemLabel] = (expensesByType[m.type][m.itemLabel] || 0) + m.amount
    }
  })

  const pct = (val, total) => total > 0 ? ((val / total) * 100).toFixed(1) + '%' : '—'

  return (
    <div className="pct-table-wrapper">
      <h4 className="pct-table__title">Porcentajes y promedios del período seleccionado</h4>
      <div className="table-scroll">
        <table className="pct-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Ítem</th>
              <th>Monto</th>
              <th>% del total</th>
              <th>% ingresos / egresos</th>
            </tr>
          </thead>
          <tbody>
            {/* Income */}
            <tr className="pct-table__group-header">
              <td colSpan={5}>INGRESOS — Total: ${totalIncome.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
            </tr>
            {Object.entries(incomeByItem).map(([label, amt]) => (
              <tr key={label}>
                <td>Ingreso</td>
                <td>{label}</td>
                <td className="amount--income">${amt.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                <td>{pct(amt, totalIncome + totalExpenses)}</td>
                <td>{pct(amt, totalIncome)}</td>
              </tr>
            ))}

            {/* Expenses */}
            <tr className="pct-table__group-header">
              <td colSpan={5}>EGRESOS — Total: ${totalExpenses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
            </tr>
            {Object.entries(expensesByType).map(([type, items]) => {
              const typeTotal = Object.values(items).reduce((s, v) => s + v, 0)
              return Object.entries(items).map(([label, amt]) => (
                <tr key={`${type}-${label}`}>
                  <td><TypeBadge type={type} /></td>
                  <td>{label}</td>
                  <td className="amount--expense">${amt.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                  <td>{pct(amt, totalIncome + totalExpenses)}</td>
                  <td>{pct(amt, totalExpenses)}</td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
