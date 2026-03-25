import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import './LoginPage.css'

const LOGO_URL = 'https://elchorroco.wordpress.com/wp-content/uploads/2025/02/paleta-de-color_mascaras-ciberpiratas-05.png'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg__orb login-bg__orb--1" />
        <div className="login-bg__orb login-bg__orb--2" />
        <div className="login-bg__orb login-bg__orb--3" />
      </div>

      <div className="login-card fade-in">
        <div className="login-card__header">
          <img src={LOGO_URL} alt="Finanzas Ciberpiratas" className="login-card__logo" />
          <h1 className="login-card__title">Finanzas<br /><span>Ciberpiratas</span></h1>
          <p className="login-card__subtitle">Gestiona tus finanzas freelance</p>
        </div>

        <form className="login-card__form" onSubmit={handleSubmit}>
          <Input
            label="Usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Tu nombre de usuario"
            required
            autoComplete="username"
            autoFocus
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="pink"
            fullWidth
            size="lg"
            loading={loading}
          >
            Entrar
          </Button>
        </form>

        <p className="login-card__footer">
          ¿Necesitas acceso? Contacta a tu administrador.
        </p>
      </div>
    </div>
  )
}
