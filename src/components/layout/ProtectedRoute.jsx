import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-app)' }}>
        <div style={{ color: 'var(--color-primary)', fontSize: 32, animation: 'spin 1s linear infinite' }}>⟳</div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
}

export function AdminRoute({ children }) {
  const { currentUser } = useAuth()

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
