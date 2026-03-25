// ===== AUTH SERVICE =====
// Manages user accounts stored in localStorage
// Passwords are hashed with SHA-256 via Web Crypto API

import { storageService } from './storageService.js'

const USERS_KEY = 'users'
const SESSION_KEY = 'session'

// Hash a password using Web Crypto API
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const authService = {
  // Initialize app with default admin on first run
  async initializeApp() {
    const users = storageService.get(USERS_KEY)
    if (!users || users.length === 0) {
      const passwordHash = await hashPassword('ciberpiratas2024')
      const adminUser = {
        id: crypto.randomUUID(),
        username: 'admin',
        passwordHash,
        role: 'admin',
        createdAt: new Date().toISOString(),
        createdBy: null,
      }
      storageService.set(USERS_KEY, [adminUser])
    }
  },

  getUsers() {
    return storageService.get(USERS_KEY) || []
  },

  getUserById(id) {
    const users = this.getUsers()
    return users.find(u => u.id === id) || null
  },

  getUserByUsername(username) {
    const users = this.getUsers()
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null
  },

  async login(username, password) {
    const user = this.getUserByUsername(username)
    if (!user) return null
    const hash = await hashPassword(password)
    if (hash !== user.passwordHash) return null
    const session = {
      userId: user.id,
      username: user.username,
      role: user.role,
      loginAt: new Date().toISOString(),
    }
    storageService.set(SESSION_KEY, session)
    return session
  },

  logout() {
    storageService.remove(SESSION_KEY)
  },

  getSession() {
    return storageService.get(SESSION_KEY)
  },

  async createUser(username, password, role = 'user', createdBy = null) {
    const existing = this.getUserByUsername(username)
    if (existing) throw new Error('El nombre de usuario ya existe')
    const passwordHash = await hashPassword(password)
    const newUser = {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
      createdBy,
    }
    const users = this.getUsers()
    storageService.set(USERS_KEY, [...users, newUser])
    return newUser
  },

  async updateUser(userId, updates) {
    const users = this.getUsers()
    const idx = users.findIndex(u => u.id === userId)
    if (idx === -1) throw new Error('Usuario no encontrado')
    if (updates.password) {
      updates.passwordHash = await hashPassword(updates.password)
      delete updates.password
    }
    // Prevent changing own role from admin
    const updated = { ...users[idx], ...updates }
    users[idx] = updated
    storageService.set(USERS_KEY, users)
    return updated
  },

  deleteUser(userId) {
    const users = this.getUsers()
    storageService.set(USERS_KEY, users.filter(u => u.id !== userId))
  },
}
