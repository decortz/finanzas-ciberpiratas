// ===== STORAGE SERVICE =====
// Centralized localStorage read/write with JSON serialization
// All keys are namespaced under "fc_" (finanzas-ciberpiratas)

const PREFIX = 'fc_'

export const storageService = {
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  remove(key) {
    localStorage.removeItem(PREFIX + key)
  },

  // Create a namespaced key for user-specific data
  userKey(userId, entity) {
    return `${entity}_${userId}`
  },
}
