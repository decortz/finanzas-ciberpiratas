import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { authService } from '../services/authService.js'
import { useToast } from '../components/ui/Toast.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import './AdminPage.css'

export default function AdminPage() {
  const { currentUser } = useAuth()
  const addToast = useToast()

  const [users, setUsers] = useState(authService.getUsers())
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteUserId, setDeleteUserId] = useState(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const refreshUsers = () => setUsers(authService.getUsers())

  const openCreate = () => {
    setEditUser(null)
    setUsername('')
    setPassword('')
    setRole('user')
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (user) => {
    setEditUser(user)
    setUsername(user.username)
    setPassword('')
    setRole(user.role)
    setErrors({})
    setShowForm(true)
  }

  const validate = () => {
    const errs = {}
    if (!username.trim()) errs.username = 'El nombre de usuario es requerido'
    if (!editUser && !password) errs.password = 'La contraseña es requerida'
    if (password && password.length < 6) errs.password = 'La contraseña debe tener al menos 6 caracteres'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      if (editUser) {
        const updates = { username, role }
        if (password) updates.password = password
        await authService.updateUser(editUser.id, updates)
        addToast('Usuario actualizado', 'success')
      } else {
        await authService.createUser(username, password, role, currentUser.id)
        addToast('Usuario creado', 'success')
      }
      refreshUsers()
      setShowForm(false)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId) => {
    if (userId === currentUser.id) {
      addToast('No puedes eliminar tu propia cuenta', 'error')
      return
    }
    authService.deleteUser(userId)
    refreshUsers()
    addToast('Usuario eliminado', 'success')
    setDeleteUserId(null)
  }

  return (
    <div className="admin-page fade-in">
      <div className="admin-header">
        <div>
          <h2>Administración de usuarios</h2>
          <p>Solo el administrador puede crear, editar y eliminar usuarios.</p>
        </div>
        <Button variant="pink" onClick={openCreate}>+ Nuevo usuario</Button>
      </div>

      <div className="admin-notice">
        <strong>🔑 Credenciales iniciales:</strong> Usuario <code>admin</code> / Contraseña <code>ciberpiratas2024</code>
        <br />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cambia la contraseña del administrador lo antes posible.</span>
      </div>

      <div className="admin-table-card">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar">{user.username[0].toUpperCase()}</div>
                      <span>{user.username}</span>
                      {user.id === currentUser.id && (
                        <span className="admin-you-badge">Tú</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-role-badge admin-role-badge--${user.role}`}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td className="admin-date">{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="admin-actions">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>Editar</Button>
                      {user.id !== currentUser.id && (
                        <Button variant="danger" size="sm" onClick={() => setDeleteUserId(user.id)}>Eliminar</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editUser ? 'Editar usuario' : 'Nuevo usuario'}
        size="sm"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Input
            label="Nombre de usuario"
            value={username}
            onChange={e => { setUsername(e.target.value); setErrors({}) }}
            required
            error={errors.username}
            autoFocus
          />
          <Input
            label={editUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setErrors({}) }}
            required={!editUser}
            error={errors.password}
          />
          <Select
            label="Rol"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </Select>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="pink" type="submit" loading={loading}>
              {editUser ? 'Actualizar' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => handleDelete(deleteUserId)}
        title="Eliminar usuario"
        message="¿Estás seguro de eliminar este usuario? Sus proyectos y movimientos se conservarán en el almacenamiento local."
      />
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO')
}
