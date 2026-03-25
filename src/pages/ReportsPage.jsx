import { useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import Button from '../components/ui/Button.jsx'
import MovementsTable from '../components/movements/MovementsTable.jsx'
import {
  downloadAllProjectsXLSX,
  downloadProjectCSV,
  downloadFilteredCSV,
} from '../services/exportService.js'
import { CURRENT_YEAR, MONTHS, YEARS } from '../constants/defaultItems.js'
import './ReportsPage.css'

export default function ReportsPage() {
  const { projects, movements } = useData()
  const addToast = useToast()

  const [filterProject, setFilterProject] = useState('')
  const [filterYear, setFilterYear] = useState(String(CURRENT_YEAR))
  const [filterMonth, setFilterMonth] = useState('')

  // Apply filters
  let filtered = [...movements]
  if (filterProject) filtered = filtered.filter(m => m.projectId === filterProject)
  if (filterYear) filtered = filtered.filter(m => m.date.startsWith(filterYear))
  if (filterMonth) filtered = filtered.filter(m => m.date.slice(5, 7) === filterMonth)

  const totalIncome = filtered.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0)
  const totalExpenses = filtered.filter(m => m.type !== 'ingreso').reduce((s, m) => s + m.amount, 0)
  const balance = totalIncome - totalExpenses

  const handleDownloadAll = () => {
    if (!projects.length) return
    downloadAllProjectsXLSX(projects, movements, Number(filterYear) || CURRENT_YEAR)
    addToast('Descargando todos los proyectos...', 'info')
  }

  const handleDownloadProject = () => {
    if (!filterProject) return
    const project = projects.find(p => p.id === filterProject)
    if (!project) return
    const pMovements = movements.filter(m => m.projectId === filterProject)
    downloadProjectCSV(project, pMovements, Number(filterYear) || CURRENT_YEAR)
    addToast(`Descargando ${project.name}...`, 'info')
  }

  const handleDownloadFiltered = () => {
    downloadFilteredCSV(filtered, projects, { project: filterProject, year: filterYear, month: filterMonth })
    addToast('Descargando movimientos filtrados...', 'info')
  }

  const displayedProjects = filterProject
    ? projects.filter(p => p.id === filterProject)
    : projects

  return (
    <div className="reports-page fade-in">
      {/* Summary */}
      <div className="reports-summary">
        <div className={`summary-card-r ${totalIncome > 0 ? 'summary-card-r--income' : ''}`}>
          <div className="summary-card-r__label">Total Ingresos</div>
          <div className="summary-card-r__amount text-success">
            +${totalIncome.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="summary-card-r">
          <div className="summary-card-r__label">Total Egresos</div>
          <div className="summary-card-r__amount text-error">
            -${totalExpenses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className={`summary-card-r ${balance >= 0 ? 'summary-card-r--positive' : 'summary-card-r--negative'}`}>
          <div className="summary-card-r__label">Balance</div>
          <div className={`summary-card-r__amount ${balance >= 0 ? 'text-success' : 'text-error'}`}>
            {balance >= 0 ? '+' : ''}${balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filters & Download */}
      <div className="reports-controls">
        <div className="reports-filters">
          <select
            className="input-field reports-filter"
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
          >
            <option value="">Todos los proyectos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            className="input-field reports-filter"
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
          >
            {YEARS.map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>

          <select
            className="input-field reports-filter"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
          >
            <option value="">Todos los meses</option>
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="reports-downloads">
          <Button variant="primary" size="sm" onClick={handleDownloadAll} disabled={!projects.length}>
            📥 Descargar todos los proyectos
          </Button>
          {filterProject && (
            <Button variant="secondary" size="sm" onClick={handleDownloadProject}>
              📥 Descargar proyecto seleccionado
            </Button>
          )}
          {filtered.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleDownloadFiltered}>
              📥 Descargar tus finanzas con estos filtros
            </Button>
          )}
        </div>
      </div>

      {/* Projects tables */}
      {projects.length === 0 ? (
        <div className="reports-empty">
          <p>No tienes proyectos aún. Crea tu primer proyecto para ver los reportes.</p>
        </div>
      ) : (
        displayedProjects.map(project => {
          let pMovements = movements.filter(m => m.projectId === project.id)
          if (filterYear) pMovements = pMovements.filter(m => m.date.startsWith(filterYear))
          const pIncome = pMovements.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0)
          const pExpenses = pMovements.filter(m => m.type !== 'ingreso').reduce((s, m) => s + m.amount, 0)
          const pBalance = pIncome - pExpenses

          return (
            <div key={project.id} className="project-report">
              <div className="project-report__header">
                <div>
                  <h3 className="project-report__name">{project.name}</h3>
                  {project.description && (
                    <p className="project-report__desc">{project.description}</p>
                  )}
                </div>
                <div className="project-report__stats">
                  <span className="text-success">+${pIncome.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                  <span className="text-error">-${pExpenses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                  <span className={pBalance >= 0 ? 'text-success' : 'text-error'}>
                    ={pBalance >= 0 ? '+' : ''}${pBalance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <MovementsTable
                movements={pMovements}
                projects={projects}
                projectId={project.id}
                showProjectColumn={false}
              />
            </div>
          )
        })
      )}
    </div>
  )
}
