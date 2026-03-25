import { useLocation } from 'react-router-dom'
import './TopBar.css'

const ROUTE_TITLES = {
  '/': 'Inicio',
  '/projects': 'Proyectos',
  '/projects/new': 'Nuevo Proyecto',
  '/movements/new': 'Ingresa un Movimiento',
  '/reports': 'Finanzas',
  '/sheets': 'Google Sheets',
  '/admin': 'Administración',
}

export default function TopBar({ onMenuToggle }) {
  const location = useLocation()
  const path = location.pathname

  // Determine title - check exact match first, then dynamic routes
  let title = ROUTE_TITLES[path]
  if (!title) {
    if (path.startsWith('/projects/') && path !== '/projects/new') {
      title = 'Proyecto'
    } else {
      title = 'Finanzas Ciberpiratas'
    }
  }

  return (
    <header className="topbar">
      <button className="topbar__menu-btn" onClick={onMenuToggle} aria-label="Toggle sidebar">
        ☰
      </button>
      <h1 className="topbar__title">{title}</h1>
    </header>
  )
}
