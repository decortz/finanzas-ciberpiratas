import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import './Sidebar.css'

const LOGO_URL = 'https://elchorroco.wordpress.com/wp-content/uploads/2025/02/paleta-de-color_mascaras-ciberpiratas-05.png'

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, logout } = useAuth()
  const { projects } = useData()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`} onClick={onClose} />

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Logo */}
        <div className="sidebar__logo">
          <img src={LOGO_URL} alt="Finanzas Ciberpiratas" className="sidebar__logo-img" />
          <div>
            <div className="sidebar__logo-name">Finanzas</div>
            <div className="sidebar__logo-sub">Ciberpiratas</div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="sidebar__nav">
          <span className="sidebar__nav-label">Principal</span>
          <NavLink to="/" end className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
            <span>🏠</span> Inicio
          </NavLink>
          <NavLink to="/movements/new" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
            <span>➕</span> Ingresa un movimiento
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
            <span>📊</span> Descarga tus finanzas
          </NavLink>
        </nav>

        {/* Projects */}
        <div className="sidebar__section">
          <div className="sidebar__nav-header">
            <span className="sidebar__nav-label">Mis Proyectos</span>
            <NavLink to="/projects/new" className="sidebar__add-btn" title="Nuevo proyecto">+</NavLink>
          </div>
          {projects.length === 0 ? (
            <p className="sidebar__empty">Sin proyectos aún</p>
          ) : (
            projects.map(p => (
              <NavLink
                key={p.id}
                to={`/projects/${p.id}`}
                className={({ isActive }) => `sidebar__link sidebar__link--project ${isActive ? 'sidebar__link--active' : ''}`}
              >
                <span className="sidebar__project-dot" />
                <span className="sidebar__project-name">{p.name}</span>
              </NavLink>
            ))
          )}
        </div>

        {/* Settings */}
        <div className="sidebar__section sidebar__section--bottom">
          <span className="sidebar__nav-label">Configuración</span>
          <NavLink to="/sheets" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
            <span>🔗</span> Google Sheets
          </NavLink>
          {currentUser?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
              <span>👥</span> Usuarios
            </NavLink>
          )}
        </div>

        {/* User info */}
        <div className="sidebar__user">
          <div className="sidebar__user-info">
            <div className="sidebar__user-avatar">{currentUser?.username?.[0]?.toUpperCase()}</div>
            <div>
              <div className="sidebar__user-name">{currentUser?.username}</div>
              <div className="sidebar__user-role">{currentUser?.role === 'admin' ? 'Administrador' : 'Usuario'}</div>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout} title="Cerrar sesión">⏻</button>
        </div>
      </aside>
    </>
  )
}
