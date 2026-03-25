import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'
import { dataService } from '../services/dataService.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { currentUser } = useAuth()
  const [projects, setProjects] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)

  // Load data whenever user changes
  useEffect(() => {
    if (currentUser?.id) {
      setLoading(true)
      setProjects(dataService.getProjects(currentUser.id))
      setMovements(dataService.getMovements(currentUser.id))
      setLoading(false)
    } else {
      setProjects([])
      setMovements([])
    }
  }, [currentUser?.id])

  const reload = useCallback(() => {
    if (currentUser?.id) {
      setProjects(dataService.getProjects(currentUser.id))
      setMovements(dataService.getMovements(currentUser.id))
    }
  }, [currentUser?.id])

  // Projects
  const createProject = useCallback((data) => {
    const project = dataService.createProject(currentUser.id, data)
    setProjects(prev => [...prev, project])
    return project
  }, [currentUser?.id])

  const updateProject = useCallback((projectId, updates) => {
    const updated = dataService.updateProject(currentUser.id, projectId, updates)
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p))
    return updated
  }, [currentUser?.id])

  const deleteProject = useCallback((projectId) => {
    dataService.deleteProject(currentUser.id, projectId)
    setProjects(prev => prev.filter(p => p.id !== projectId))
    setMovements(prev => prev.filter(m => m.projectId !== projectId))
  }, [currentUser?.id])

  // Project items
  const addItemToProject = useCallback((projectId, category, label) => {
    const updated = dataService.addItemToProject(currentUser.id, projectId, category, label)
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p))
    return updated
  }, [currentUser?.id])

  const updateItemInProject = useCallback((projectId, category, itemId, newLabel) => {
    const updated = dataService.updateItemInProject(currentUser.id, projectId, category, itemId, newLabel)
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p))
    return updated
  }, [currentUser?.id])

  const removeItemFromProject = useCallback((projectId, category, itemId) => {
    const updated = dataService.removeItemFromProject(currentUser.id, projectId, category, itemId)
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p))
    return updated
  }, [currentUser?.id])

  const updateProjectItems = useCallback((projectId, items) => {
    const updated = dataService.updateProjectItems(currentUser.id, projectId, items)
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p))
    return updated
  }, [currentUser?.id])

  // Movements
  const createMovement = useCallback((data) => {
    const movement = dataService.createMovement(currentUser.id, data)
    setMovements(prev => [...prev, movement])
    return movement
  }, [currentUser?.id])

  const updateMovement = useCallback((movementId, updates) => {
    const updated = dataService.updateMovement(currentUser.id, movementId, updates)
    setMovements(prev => prev.map(m => m.id === movementId ? updated : m))
    return updated
  }, [currentUser?.id])

  const deleteMovement = useCallback((movementId) => {
    dataService.deleteMovement(currentUser.id, movementId)
    setMovements(prev => prev.filter(m => m.id !== movementId))
  }, [currentUser?.id])

  // Sheets config
  const getSheetsConfig = useCallback(() => {
    return dataService.getSheetsConfig(currentUser?.id)
  }, [currentUser?.id])

  const saveSheetsConfig = useCallback((config) => {
    dataService.saveSheetsConfig(currentUser.id, config)
  }, [currentUser?.id])

  const removeSheetsConfig = useCallback(() => {
    dataService.removeSheetsConfig(currentUser?.id)
  }, [currentUser?.id])

  return (
    <DataContext.Provider value={{
      projects,
      movements,
      loading,
      reload,
      createProject,
      updateProject,
      deleteProject,
      addItemToProject,
      updateItemInProject,
      removeItemFromProject,
      updateProjectItems,
      createMovement,
      updateMovement,
      deleteMovement,
      getSheetsConfig,
      saveSheetsConfig,
      removeSheetsConfig,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
