import { useState, useEffect } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useToast } from '../ui/Toast.jsx'
import { MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS, INCOME_AUTO_ITEMS } from '../../constants/defaultItems.js'

const TYPE_OPTIONS = [
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'costo_venta', label: 'Costo de venta' },
  { value: 'gasto_venta', label: 'Gasto de venta' },
  { value: 'gasto_operacional', label: 'Gasto operacional' },
  { value: 'pago_deuda', label: 'Pago deuda' },
]

const TYPE_TO_ITEMS_KEY = {
  ingreso: 'ingresos',
  costo_venta: 'costos_venta',
  gasto_venta: 'gastos_venta',
  gasto_operacional: 'gastos_operacionales',
  pago_deuda: 'pago_deudas',
}

export default function MovementFormModal({ isOpen, onClose, movement = null, defaultProjectId = '' }) {
  const { projects, createMovement, updateMovement } = useData()
  const addToast = useToast()

  const [projectId, setProjectId] = useState(defaultProjectId || movement?.projectId || '')
  const [type, setType] = useState(movement?.type || 'ingreso')
  const [itemId, setItemId] = useState(movement?.itemId || '')
  const [itemLabel, setItemLabel] = useState(movement?.itemLabel || '')
  const [isCustomItem, setIsCustomItem] = useState(false)
  const [customItemLabel, setCustomItemLabel] = useState('')
  const [amount, setAmount] = useState(movement?.amount?.toString() || '')
  const [description, setDescription] = useState(movement?.description || '')
  const [date, setDate] = useState(movement?.date || todayStr())
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Get selected project
  const project = projects.find(p => p.id === projectId)

  // Get items for selected type and project
  const getItems = () => {
    if (!project) return []
    const key = TYPE_TO_ITEMS_KEY[type]
    const items = [...(project.items[key] || [])]

    // Always add auto items for income
    if (type === 'ingreso') {
      const autoItems = INCOME_AUTO_ITEMS.map(label => ({
        id: `__auto_${label}`,
        label,
        isAuto: true,
      }))
      return [...autoItems, ...items]
    }
    return items
  }

  const availableItems = getItems()

  // Reset item when type or project changes
  useEffect(() => {
    if (!movement) {
      setItemId('')
      setItemLabel('')
      setIsCustomItem(false)
      setCustomItemLabel('')
    }
  }, [type, projectId])

  // Auto-date from project settings
  useEffect(() => {
    if (project?.dateMode === 'auto' && !movement) {
      setDate(todayStr())
    }
  }, [project?.dateMode, movement])

  const handleItemChange = (e) => {
    const val = e.target.value
    if (val === '__custom__') {
      setIsCustomItem(true)
      setItemId('__custom__')
      setItemLabel('')
    } else {
      setIsCustomItem(false)
      setItemId(val)
      const found = availableItems.find(i => i.id === val)
      setItemLabel(found ? found.label : '')
    }
  }

  const validate = () => {
    const errs = {}
    if (!projectId) errs.projectId = 'Selecciona un proyecto'
    if (!type) errs.type = 'Selecciona el tipo'
    if (!itemId && !isCustomItem) errs.item = 'Selecciona un ítem'
    if (isCustomItem && !customItemLabel.trim()) errs.item = 'Escribe el nombre del ítem'
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) errs.amount = 'El monto debe ser mayor a 0'
    if (!date) errs.date = 'La fecha es requerida'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const finalItemLabel = isCustomItem ? customItemLabel.trim() : itemLabel
    const finalItemId = isCustomItem ? `__custom_${crypto.randomUUID()}` : itemId

    setLoading(true)
    try {
      if (movement) {
        updateMovement(movement.id, {
          projectId,
          type,
          itemId: finalItemId,
          itemLabel: finalItemLabel,
          amount: Number(amount),
          description,
          date,
        })
        addToast('Movimiento actualizado', 'success')
      } else {
        createMovement({
          projectId,
          type,
          itemId: finalItemId,
          itemLabel: finalItemLabel,
          amount: Number(amount),
          description,
          date,
        })
        addToast('Movimiento registrado', 'success')
        // Reset form
        setType('ingreso')
        setItemId('')
        setItemLabel('')
        setAmount('')
        setDescription('')
        if (project?.dateMode !== 'auto') setDate(todayStr())
      }
      onClose()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const isAutoDate = project?.dateMode === 'auto'

  // Warning for cross-project expense
  const showCrossProjectWarning = () => {
    if (!itemLabel) return false
    return projects.some(p => p.id !== projectId && p.name === itemLabel)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={movement ? 'Editar movimiento' : 'Ingresa un movimiento'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="movement-form">
        <Select
          label="Proyecto"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          required
          error={errors.projectId}
        >
          <option value="">— Selecciona un proyecto —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>

        <Select
          label="Tipo de movimiento"
          value={type}
          onChange={e => setType(e.target.value)}
          required
          error={errors.type}
        >
          {TYPE_OPTIONS.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>

        {/* Item selection */}
        {projectId && (
          <div className="input-group" style={{ position: 'relative' }}>
            <label className="input-label">
              Ítem <span className="input-required"> *</span>
            </label>
            {availableItems.length > 0 ? (
              <select
                className={`input-field ${errors.item ? 'input-group--error' : ''}`}
                value={isCustomItem ? '__custom__' : itemId}
                onChange={handleItemChange}
              >
                <option value="">— Selecciona un ítem —</option>
                {availableItems.map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
                <option value="__custom__">➕ Otro (escribir manualmente)</option>
              </select>
            ) : (
              <div className="movement-form__no-items">
                ⚠️ No hay ítems configurados para este tipo en este proyecto.
                <br />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Ve a la configuración del proyecto para agregar ítems.
                </span>
              </div>
            )}
            {isCustomItem && (
              <Input
                style={{ marginTop: 8 }}
                value={customItemLabel}
                onChange={e => { setCustomItemLabel(e.target.value); setErrors({}) }}
                placeholder="Nombre del ítem..."
              />
            )}
            {errors.item && <span className="input-error">{errors.item}</span>}
          </div>
        )}

        {/* Cross-project warning */}
        {showCrossProjectWarning() && (
          <div className="movement-form__warning">
            ⚠️ Recuerda revisar este egreso en tu proyecto "{itemLabel}"
          </div>
        )}

        <Input
          label="Monto"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => { setAmount(e.target.value); setErrors({}) }}
          placeholder="0.00"
          required
          error={errors.amount}
        />

        {/* Date - show only if manual mode */}
        {!isAutoDate && (
          <Input
            label="Fecha"
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setErrors({}) }}
            required
            error={errors.date}
          />
        )}
        {isAutoDate && (
          <div className="movement-form__auto-date">
            📅 Fecha automática: {formatDate(date)}
          </div>
        )}

        <div className="input-group">
          <label className="input-label">Descripción <span style={{ color: 'var(--text-muted)' }}>(opcional)</span></label>
          <textarea
            className="input-field"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descripción o nota del movimiento..."
            rows={2}
          />
        </div>

        <div className="movement-form__actions">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="pink" type="submit" loading={loading}>
            {movement ? 'Actualizar' : 'Guardar movimiento'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
