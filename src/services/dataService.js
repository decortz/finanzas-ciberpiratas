// ===== DATA SERVICE =====
// CRUD for projects and movements, namespaced by userId

import { storageService } from './storageService.js'
import { createDefaultProjectItems } from '../constants/defaultItems.js'

// ---- Projects ----

export const dataService = {
  // Projects
  getProjects(userId) {
    return storageService.get(storageService.userKey(userId, 'projects')) || []
  },

  saveProjects(userId, projects) {
    storageService.set(storageService.userKey(userId, 'projects'), projects)
  },

  createProject(userId, { name, description, dateMode, copyFromProjectId }) {
    const projects = this.getProjects(userId)
    let items = createDefaultProjectItems()

    if (copyFromProjectId) {
      const source = projects.find(p => p.id === copyFromProjectId)
      if (source) {
        // Deep clone items from the source project
        items = JSON.parse(JSON.stringify(source.items))
        // Assign new IDs to all items
        Object.keys(items).forEach(key => {
          items[key] = items[key].map(item => ({ ...item, id: crypto.randomUUID() }))
        })
      }
    }

    const project = {
      id: crypto.randomUUID(),
      userId,
      name,
      description,
      dateMode: dateMode || 'manual', // 'auto' | 'manual'
      items,
      createdAt: new Date().toISOString(),
    }
    storageService.set(storageService.userKey(userId, 'projects'), [...projects, project])
    return project
  },

  updateProject(userId, projectId, updates) {
    const projects = this.getProjects(userId)
    const idx = projects.findIndex(p => p.id === projectId)
    if (idx === -1) throw new Error('Proyecto no encontrado')
    projects[idx] = { ...projects[idx], ...updates }
    storageService.set(storageService.userKey(userId, 'projects'), projects)
    return projects[idx]
  },

  deleteProject(userId, projectId) {
    const projects = this.getProjects(userId)
    storageService.set(
      storageService.userKey(userId, 'projects'),
      projects.filter(p => p.id !== projectId)
    )
    // Also remove movements for this project
    const movements = this.getMovements(userId)
    storageService.set(
      storageService.userKey(userId, 'movements'),
      movements.filter(m => m.projectId !== projectId)
    )
  },

  // Project items management
  updateProjectItems(userId, projectId, itemsUpdate) {
    return this.updateProject(userId, projectId, { items: itemsUpdate })
  },

  addItemToProject(userId, projectId, category, label) {
    const projects = this.getProjects(userId)
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('Proyecto no encontrado')

    const newItem = {
      id: crypto.randomUUID(),
      label,
      isDefault: false,
    }
    const updatedItems = {
      ...project.items,
      [category]: [...(project.items[category] || []), newItem],
    }
    return this.updateProject(userId, projectId, { items: updatedItems })
  },

  updateItemInProject(userId, projectId, category, itemId, newLabel) {
    const projects = this.getProjects(userId)
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('Proyecto no encontrado')

    const updatedItems = {
      ...project.items,
      [category]: project.items[category].map(item =>
        item.id === itemId ? { ...item, label: newLabel } : item
      ),
    }
    return this.updateProject(userId, projectId, { items: updatedItems })
  },

  removeItemFromProject(userId, projectId, category, itemId) {
    const projects = this.getProjects(userId)
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('Proyecto no encontrado')

    const updatedItems = {
      ...project.items,
      [category]: project.items[category].filter(item => item.id !== itemId),
    }
    return this.updateProject(userId, projectId, { items: updatedItems })
  },

  // Movements
  getMovements(userId) {
    return storageService.get(storageService.userKey(userId, 'movements')) || []
  },

  getMovementsByProject(userId, projectId) {
    return this.getMovements(userId).filter(m => m.projectId === projectId)
  },

  createMovement(userId, data) {
    const movements = this.getMovements(userId)
    const movement = {
      id: crypto.randomUUID(),
      userId,
      projectId: data.projectId,
      date: data.date,
      type: data.type, // ingreso | costo_venta | gasto_venta | gasto_operacional | pago_deuda
      itemId: data.itemId,
      itemLabel: data.itemLabel,
      amount: Number(data.amount),
      description: data.description || '',
      createdAt: new Date().toISOString(),
      syncedAt: null,
    }
    storageService.set(
      storageService.userKey(userId, 'movements'),
      [...movements, movement]
    )
    return movement
  },

  updateMovement(userId, movementId, updates) {
    const movements = this.getMovements(userId)
    const idx = movements.findIndex(m => m.id === movementId)
    if (idx === -1) throw new Error('Movimiento no encontrado')
    movements[idx] = { ...movements[idx], ...updates, syncedAt: null }
    storageService.set(storageService.userKey(userId, 'movements'), movements)
    return movements[idx]
  },

  deleteMovement(userId, movementId) {
    const movements = this.getMovements(userId)
    storageService.set(
      storageService.userKey(userId, 'movements'),
      movements.filter(m => m.id !== movementId)
    )
  },

  markMovementsSynced(userId, movementIds) {
    const movements = this.getMovements(userId)
    const syncedAt = new Date().toISOString()
    const updated = movements.map(m =>
      movementIds.includes(m.id) ? { ...m, syncedAt } : m
    )
    storageService.set(storageService.userKey(userId, 'movements'), updated)
  },

  getPendingSyncMovements(userId) {
    return this.getMovements(userId).filter(m => !m.syncedAt)
  },

  // Google Sheets config
  getSheetsConfig(userId) {
    return storageService.get(storageService.userKey(userId, 'sheets')) || null
  },

  saveSheetsConfig(userId, config) {
    storageService.set(storageService.userKey(userId, 'sheets'), config)
  },

  removeSheetsConfig(userId) {
    storageService.remove(storageService.userKey(userId, 'sheets'))
  },
}
