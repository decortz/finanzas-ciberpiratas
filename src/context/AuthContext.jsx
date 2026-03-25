import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session on mount
    const session = authService.getSession()
    if (session) {
      const user = authService.getUserById(session.userId)
      if (user) {
        setCurrentUser({ ...session, ...user })
      } else {
        authService.logout()
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const session = await authService.login(username, password)
    if (!session) throw new Error('Usuario o contraseña incorrectos')
    const user = authService.getUserById(session.userId)
    setCurrentUser({ ...session, ...user })
    return session
  }

  const logout = () => {
    authService.logout()
    setCurrentUser(null)
  }

  const refreshUser = () => {
    if (currentUser) {
      const user = authService.getUserById(currentUser.id)
      if (user) setCurrentUser(prev => ({ ...prev, ...user }))
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
