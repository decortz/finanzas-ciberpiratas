import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import AppShell from './components/layout/AppShell.jsx'
import { ProtectedRoute, AdminRoute } from './components/layout/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import NewProjectPage from './pages/NewProjectPage.jsx'
import ProjectDetailPage from './pages/ProjectDetailPage.jsx'
import NewMovementPage from './pages/NewMovementPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import SheetsPage from './pages/SheetsPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

export default function App() {
  const { currentUser } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected - all inside AppShell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/movements/new" element={<NewMovementPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/sheets" element={<SheetsPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
