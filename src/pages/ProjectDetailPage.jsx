import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import MovementsTable from '../components/movements/MovementsTable.jsx'
import { downloadProjectCSV } from '../services/exportService.js'
import { CURRENT_YEAR, INCOME_AUTO_ITEMS } from '../constants/defaultItems.js'
import './ProjectDetailPage.css'

const TABS = [
  { key: 'ingresos', label: 'Ingresos', color: 'var(--color-success)' },
  { key: 'costos_venta', label: 'Costos de Venta', color: 'var(--color-primary)' },
  { key: 'gastos_venta', label: 'Gastos de Venta', color: 'var(--color-pink)' },
  { key: 'gastos_operacionales', label: 'Gastos Operacionales', color: 'var(--color-violet)' },
  { key: 'pago_deudas', label: 'Pago Deudas', color: 'var(--color-teal)' },
]

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, movements, addItemToProject, updateItemInProject, removeItemFromProject, deleteProject } = useData()
  const addToast = useToast()

  const project = projects.find(p => p.id === id)

  const [activeTab, setActiveTab] = useState('ingresos')
  const [newItemLabel, setNewItemLabel] = useState('')
  const [editingItem, setEditingItem] = useState(null) // { id, label, category }
  const [editLabel, setEditLabel] = useState('')
  const [deleteItem, setDeleteItem] = useState(null)
  const [showDeleteProject, setShowDeleteProject] = useState(false)
  const [showMovements, setShowMovements] = useState(true)

  if (!project) {
    return (
      <div className="not-found fade-in">
        <p>Proyecto no encontrado.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    )
  }

  const projectMovements = movements.filter(m => m.projectId === id)

  const handleAddItem = (e) => {
    e.preventDefault()
    if (!newItemLabel.trim()) return
    try {
      addItemToProject(id, activeTab, newItemLabel.trim())
      setNewItemLabel('')
      addToast('Ítem agregado', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleUpdateItem = (e) => {
    e.preventDefault()
    if (!editLabel.trim()) return
    try {
      updateItemInProject(id, editingItem.category, editingItem.id, editLabel.trim())
      setEditingItem(null)
      addToast('Ítem actualizado', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleDeleteItem = (item, category) => {
    removeItemFromProject(id, category, item.id)
    addToast('Ítem eliminado', 'success')
  }

  const handleDeleteProject = () => {
    deleteProject(id)
    addToast('Proyecto eliminado', 'success')
    navigate('/')
  }

  const handleDownload = () => {
    downloadProjectCSV(project, projectMovements, CURRENT_YEAR)
    addToast('Descargando...', 'info')
  }

  const currentItems = project.items[activeTab] || []
  const tabInfo = TABS.find(t => t.key === activeTab)

  const getTabMessage = () => {
    if (activeTab === 'ingresos') {
      return 'Crea los tipos de ingreso para este proyecto, ten en cuenta únicamente los que estén directamente relacionados con este proyecto.'
    }
    if (activeTab === 'costos_venta') {
      return 'Crea todos los costos directos asociados a este proyecto. Ten en cuenta que son egresos imprescindibles para el desarrollo de este proyecto.'
    }
    return null
  }

  const tabMsg = getTabMessage()

  return (
    <div className="project-detail fade-in">
      {/* Header */}
      <div className="project-detail__header">
        <div>
          <h2 className="project-detail__title">{project.name}</h2>
          {project.description && <p className="project-detail__desc">{project.description}</p>}
          <span className="project-detail__badge">
            Fechas: {project.dateMode === 'auto' ? 'Automáticas' : 'Manuales'}
          </span>
        </div>
        <div className="project-detail__header-actions">
          <Button variant="pink" onClick={() => navigate(`/movements/new?project=${id}`)}>
            ➕ Ingresa un movimiento
          </Button>
          <Button variant="secondary" onClick={handleDownload}>
            📥 Descarga las finanzas de este proyecto
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteProject(true)}>
            Eliminar proyecto
          </Button>
        </div>
      </div>

      {/* Items configuration */}
      <div className="project-detail__config">
        <h3 className="project-detail__section-title">Configurar ítems por categoría</h3>
        <p className="project-detail__section-desc">
          Define los tipos de ingresos y egresos para este proyecto. Estos ítems aparecerán como opciones al registrar movimientos.
        </p>

        {/* Tabs */}
        <div className="items-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`items-tab ${activeTab === tab.key ? 'items-tab--active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setNewItemLabel('') }}
              style={{ '--tab-color': tab.color }}
            >
              {tab.label}
              <span className="items-tab__count">
                {tab.key === 'ingresos'
                  ? (project.items.ingresos?.length || 0) + INCOME_AUTO_ITEMS.length
                  : project.items[tab.key]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="items-panel">
          {tabMsg && (
            <div className="items-panel__msg">
              💡 {tabMsg}
            </div>
          )}

          {/* Auto items for income */}
          {activeTab === 'ingresos' && (
            <div className="items-list__auto">
              {INCOME_AUTO_ITEMS.map(label => (
                <div key={label} className="item-row item-row--auto">
                  <span className="item-row__label">{label}</span>
                  <span className="item-row__badge">Automático</span>
                </div>
              ))}
            </div>
          )}

          {/* User items */}
          <div className="items-list">
            {currentItems.length === 0 && activeTab !== 'ingresos' && (
              <div className="items-empty">
                Sin ítems configurados. Agrega el primero abajo.
              </div>
            )}
            {currentItems.map(item => (
              <div key={item.id} className="item-row">
                {editingItem?.id === item.id ? (
                  <form className="item-edit-form" onSubmit={handleUpdateItem}>
                    <input
                      className="input-field"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      autoFocus
                    />
                    <Button size="sm" variant="primary" type="submit">Guardar</Button>
                    <Button size="sm" variant="ghost" type="button" onClick={() => setEditingItem(null)}>Cancelar</Button>
                  </form>
                ) : (
                  <>
                    <span className="item-row__label">{item.label}</span>
                    <div className="item-row__actions">
                      <button
                        className="item-row__btn"
                        onClick={() => { setEditingItem({ id: item.id, category: activeTab }); setEditLabel(item.label) }}
                      >✏️</button>
                      <button
                        className="item-row__btn item-row__btn--danger"
                        onClick={() => setDeleteItem({ item, category: activeTab })}
                      >🗑️</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add item form */}
          <form className="items-add-form" onSubmit={handleAddItem}>
            <input
              className="input-field"
              value={newItemLabel}
              onChange={e => setNewItemLabel(e.target.value)}
              placeholder={`Nuevo ítem de ${tabInfo?.label.toLowerCase()}...`}
            />
            <Button size="sm" variant="primary" type="submit" disabled={!newItemLabel.trim()}>
              Agregar
            </Button>
          </form>

          {/* Cross-project expense option */}
          {(activeTab === 'costos_venta' || activeTab === 'gastos_venta') && (
            <CrossProjectOption
              project={project}
              projects={projects}
              category={activeTab}
              onAdd={(label) => {
                addItemToProject(id, activeTab, label)
                addToast(`Proyecto "${label}" agregado como ítem. Recuerda revisarlo en ese proyecto.`, 'info', 6000)
              }}
            />
          )}
        </div>
      </div>

      {/* Movements table */}
      <div className="project-detail__movements">
        <div className="project-detail__section-header">
          <h3>Movimientos del proyecto</h3>
          <button
            className="toggle-btn"
            onClick={() => setShowMovements(v => !v)}
          >
            {showMovements ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {showMovements && (
          <MovementsTable
            movements={projectMovements}
            projects={projects}
            projectId={id}
            showProjectColumn={false}
          />
        )}
      </div>

      {/* Delete project confirm */}
      <ConfirmDialog
        isOpen={showDeleteProject}
        onClose={() => setShowDeleteProject(false)}
        onConfirm={handleDeleteProject}
        title="Eliminar proyecto"
        message={`¿Estás seguro de eliminar el proyecto "${project.name}"? También se eliminarán todos sus movimientos. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar proyecto"
      />

      {/* Delete item confirm */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => handleDeleteItem(deleteItem.item, deleteItem.category)}
        title="Eliminar ítem"
        message={`¿Eliminar el ítem "${deleteItem?.item?.label}"?`}
        confirmLabel="Eliminar"
      />
    </div>
  )
}

function CrossProjectOption({ project, projects, category, onAdd }) {
  const [selected, setSelected] = useState('')
  const otherProjects = projects.filter(p => p.id !== project.id)
  if (otherProjects.length === 0) return null

  const handleAdd = () => {
    if (!selected) return
    const p = otherProjects.find(op => op.id === selected)
    if (p) {
      onAdd(p.name)
      setSelected('')
    }
  }

  return (
    <div className="cross-project">
      <div className="cross-project__label">Incluir otro proyecto como egreso:</div>
      <div className="cross-project__row">
        <select
          className="input-field"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">— Selecciona un proyecto —</option>
          {otherProjects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <Button size="sm" variant="secondary" type="button" onClick={handleAdd} disabled={!selected}>
          Agregar
        </Button>
      </div>
    </div>
  )
}
