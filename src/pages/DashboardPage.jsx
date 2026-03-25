import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'
import Button from '../components/ui/Button.jsx'
import { downloadAllProjectsXLSX } from '../services/exportService.js'
import { CURRENT_YEAR } from '../constants/defaultItems.js'
import './DashboardPage.css'

export default function DashboardPage() {
  const { currentUser } = useAuth()
  const { projects, movements } = useData()
  const navigate = useNavigate()

  const handleDownloadAll = () => {
    if (projects.length === 0) return
    downloadAllProjectsXLSX(projects, movements, CURRENT_YEAR)
  }

  const totalIncome = movements
    .filter(m => m.type === 'ingreso')
    .reduce((s, m) => s + m.amount, 0)

  const totalExpenses = movements
    .filter(m => m.type !== 'ingreso')
    .reduce((s, m) => s + m.amount, 0)

  const balance = totalIncome - totalExpenses

  return (
    <div className="dashboard fade-in">
      {/* Welcome */}
      <div className="dashboard__welcome">
        <h2 className="dashboard__greeting">
          Hola, <span>{currentUser?.username}</span> 👋
        </h2>
        <p className="dashboard__sub">Gestiona tus finanzas freelance desde aquí.</p>
      </div>

      {/* Summary cards */}
      <div className="dashboard__cards">
        <div className="summary-card summary-card--income">
          <div className="summary-card__label">Total Ingresos</div>
          <div className="summary-card__amount">${totalIncome.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card summary-card--expense">
          <div className="summary-card__label">Total Egresos</div>
          <div className="summary-card__amount">${totalExpenses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className={`summary-card ${balance >= 0 ? 'summary-card--positive' : 'summary-card--negative'}`}>
          <div className="summary-card__label">Balance</div>
          <div className="summary-card__amount">{balance >= 0 ? '+' : ''}${balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Main actions */}
      <div className="dashboard__actions">
        <button className="action-card" onClick={() => navigate('/projects/new')}>
          <div className="action-card__icon">📁</div>
          <div className="action-card__title">Crea un proyecto nuevo</div>
          <div className="action-card__desc">Organiza tus ingresos y egresos por proyecto</div>
        </button>

        <button className="action-card" onClick={() => navigate('/movements/new')}>
          <div className="action-card__icon">➕</div>
          <div className="action-card__title">Ingresa un movimiento</div>
          <div className="action-card__desc">Registra un ingreso o egreso rápidamente</div>
        </button>

        <button className="action-card" onClick={handleDownloadAll} disabled={projects.length === 0}>
          <div className="action-card__icon">📥</div>
          <div className="action-card__title">Descarga tus finanzas</div>
          <div className="action-card__desc">Exporta todos tus proyectos en un archivo</div>
        </button>
      </div>

      {/* Projects list */}
      {projects.length > 0 && (
        <div className="dashboard__projects">
          <div className="dashboard__section-header">
            <h3>Mis Proyectos</h3>
            <Button variant="secondary" size="sm" onClick={() => navigate('/projects/new')}>+ Nuevo</Button>
          </div>
          <div className="project-cards-grid">
            {projects.map(p => {
              const pMovements = movements.filter(m => m.projectId === p.id)
              const pIncome = pMovements.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0)
              const pExpenses = pMovements.filter(m => m.type !== 'ingreso').reduce((s, m) => s + m.amount, 0)
              const pBalance = pIncome - pExpenses
              return (
                <button key={p.id} className="project-mini-card" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="project-mini-card__name">{p.name}</div>
                  {p.description && <div className="project-mini-card__desc">{p.description}</div>}
                  <div className="project-mini-card__stats">
                    <span className="text-success">+${pIncome.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                    <span className="text-error">-${pExpenses.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                    <span className={pBalance >= 0 ? 'text-success' : 'text-error'}>
                      ={pBalance >= 0 ? '+' : ''}${pBalance.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Instructions link */}
      <div className="dashboard__sheets-link">
        <Button variant="ghost" size="sm" onClick={() => navigate('/sheets')}>
          🔗 Instrucciones para conectar tus datos
        </Button>
      </div>
    </div>
  )
}
