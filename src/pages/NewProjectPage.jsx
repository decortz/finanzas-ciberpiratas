import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import './NewProjectPage.css'

export default function NewProjectPage() {
  const { projects, createProject } = useData()
  const addToast = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dateMode, setDateMode] = useState('manual')
  const [copyFrom, setCopyFrom] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'El nombre es requerido'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const project = createProject({
        name: name.trim(),
        description: description.trim(),
        dateMode,
        copyFromProjectId: copyFrom || null,
      })
      addToast('Proyecto creado. Ahora configura tus ítems.', 'success')
      navigate(`/projects/${project.id}`)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="new-project-page fade-in">
      <div className="new-project-card">
        <div className="new-project-card__header">
          <h2>Crear nuevo proyecto</h2>
          <p>Define el nombre y configura cómo quieres registrar tus movimientos.</p>
        </div>

        <form onSubmit={handleSubmit} className="new-project-form">
          <Input
            label="Nombre del proyecto"
            value={name}
            onChange={e => { setName(e.target.value); setErrors({}) }}
            placeholder="Ej: Diseño freelance 2025"
            required
            error={errors.name}
            autoFocus
          />

          <div className="input-group">
            <label className="input-label">Descripción <span style={{ color: 'var(--text-muted)' }}>(opcional)</span></label>
            <textarea
              className="input-field"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Una breve descripción del proyecto..."
              rows={3}
            />
          </div>

          <Select
            label="¿Cómo quieres registrar las fechas?"
            value={dateMode}
            onChange={e => setDateMode(e.target.value)}
          >
            <option value="manual">Manual — elijo la fecha en cada movimiento</option>
            <option value="auto">Automática — usa la fecha de hoy</option>
          </Select>

          {projects.length > 0 && (
            <Select
              label="Copiar ítems de otro proyecto (opcional)"
              value={copyFrom}
              onChange={e => setCopyFrom(e.target.value)}
              hint="Copia los tipos de ingreso y egreso de un proyecto existente"
            >
              <option value="">— Sin copiar, comenzar desde cero —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          )}

          <div className="new-project-form__actions">
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button variant="pink" type="submit" loading={loading}>Crear proyecto</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
