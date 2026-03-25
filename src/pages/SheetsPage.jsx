import { useState, useEffect } from 'react'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { sheetsService } from '../services/sheetsService.js'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import { dataService } from '../services/dataService.js'
import './SheetsPage.css'

// Admin demo sheet ID (read-only demo)
const DEMO_SHEET_ID = '1Wyv15kydn-sMKwYL2AJBhfFs9EjpE08clhqEu2cNHLY'

export default function SheetsPage() {
  const { currentUser } = useAuth()
  const { projects, movements, getSheetsConfig, saveSheetsConfig, removeSheetsConfig } = useData()
  const addToast = useToast()

  const [config, setConfig] = useState(getSheetsConfig())
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  const isConnected = !!(config?.spreadsheetId && config?.accessToken)

  const handleConnect = (e) => {
    e.preventDefault()
    if (!spreadsheetId.trim() || !accessToken.trim()) {
      addToast('Ingresa el ID de la hoja y el token de acceso', 'error')
      return
    }
    const cfg = {
      userId: currentUser.id,
      spreadsheetId: spreadsheetId.trim(),
      accessToken: accessToken.trim(),
      connectedAt: new Date().toISOString(),
    }
    saveSheetsConfig(cfg)
    setConfig(cfg)
    addToast('Google Sheets conectado', 'success')
  }

  const handleDisconnect = () => {
    removeSheetsConfig()
    setConfig(null)
    setSpreadsheetId('')
    setAccessToken('')
    addToast('Google Sheets desconectado', 'info')
  }

  const handleSync = async () => {
    if (!config?.spreadsheetId || !config?.accessToken) return
    setSyncing(true)
    try {
      const pending = dataService.getPendingSyncMovements(currentUser.id)
      if (pending.length === 0) {
        addToast('Todo está al día. Sin movimientos pendientes.', 'info')
        return
      }
      const projectMap = {}
      projects.forEach(p => { projectMap[p.id] = p.name })

      await sheetsService.ensureHeaderRow(config.spreadsheetId, config.accessToken)
      await sheetsService.appendMovements(config.spreadsheetId, config.accessToken, pending, projectMap)
      dataService.markMovementsSynced(currentUser.id, pending.map(m => m.id))

      addToast(`✅ ${pending.length} movimientos sincronizados con Google Sheets`, 'success')
    } catch (err) {
      addToast(`Error al sincronizar: ${err.message}`, 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleFullResync = async () => {
    if (!config?.spreadsheetId || !config?.accessToken) return
    setSyncing(true)
    try {
      const projectMap = {}
      projects.forEach(p => { projectMap[p.id] = p.name })
      await sheetsService.clearAndResync(config.spreadsheetId, config.accessToken, movements, projectMap)
      dataService.markMovementsSynced(currentUser.id, movements.map(m => m.id))
      addToast(`✅ Re-sincronización completa: ${movements.length} movimientos`, 'success')
    } catch (err) {
      addToast(`Error: ${err.message}`, 'error')
    } finally {
      setSyncing(false)
    }
  }

  const pendingCount = dataService.getPendingSyncMovements(currentUser?.id || '')?.length || 0

  return (
    <div className="sheets-page fade-in">
      {/* Privacy notice */}
      <div className="sheets-privacy">
        <div className="sheets-privacy__icon">🔒</div>
        <div>
          <h3>Tu privacidad es lo primero</h3>
          <p>
            Nosotros no guardamos ninguno de tus datos. Todos ellos se deben almacenar en una hoja de cálculo de Google de tu propiedad para que nadie tenga acceso a la información excepto tú. Ningún usuario tendrá acceso a tu información ni podrá descargarla.
          </p>
        </div>
      </div>

      {/* Connection status */}
      {isConnected ? (
        <div className="sheets-connected">
          <div className="sheets-connected__header">
            <div className="sheets-status sheets-status--connected">🟢 Conectado a Google Sheets</div>
            <div className="sheets-connected__id">ID: {config.spreadsheetId}</div>
          </div>
          <div className="sheets-connected__actions">
            <Button variant="primary" onClick={handleSync} loading={syncing} disabled={syncing}>
              {syncing ? 'Sincronizando...' : `Sincronizar ahora ${pendingCount > 0 ? `(${pendingCount} pendientes)` : ''}`}
            </Button>
            <Button variant="ghost" onClick={handleFullResync} loading={syncing} disabled={syncing}>
              Re-sincronizar todo
            </Button>
            <Button variant="danger" onClick={handleDisconnect} disabled={syncing}>
              Desconectar
            </Button>
          </div>
        </div>
      ) : (
        <div className="sheets-connect-form-card">
          <h3>Conectar tu Google Sheets</h3>
          <p className="sheets-connect-form-card__desc">
            Ingresa el ID de tu hoja de cálculo y un token de acceso válido con permisos de escritura.
          </p>
          <form onSubmit={handleConnect} className="sheets-connect-form">
            <Input
              label="ID de la hoja de cálculo"
              value={spreadsheetId}
              onChange={e => setSpreadsheetId(e.target.value)}
              placeholder="Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              hint="Lo encuentras en la URL de tu Google Sheets entre /d/ y /edit"
            />
            <Input
              label="Token de acceso (OAuth2)"
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              placeholder="ya29.A0..."
              hint="Genera tu token siguiendo las instrucciones de abajo"
            />
            <Button variant="pink" type="submit">Conectar</Button>
          </form>
        </div>
      )}

      {/* Instructions toggle */}
      <div className="sheets-instructions-section">
        <button
          className="sheets-instructions-toggle"
          onClick={() => setShowInstructions(v => !v)}
        >
          📋 Instrucciones para conectar tus datos
          <span>{showInstructions ? ' ▲' : ' ▼'}</span>
        </button>

        {showInstructions && (
          <div className="sheets-instructions fade-in">
            <InstructionsContent />
          </div>
        )}
      </div>

      {/* Demo sheet info for admin */}
      {currentUser?.role === 'admin' && (
        <div className="sheets-demo-notice">
          <h4>📊 Hoja demo (solo administrador)</h4>
          <p>
            ID de la hoja demo de referencia: <code>{DEMO_SHEET_ID}</code>
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Esta hoja fue configurada como referencia inicial del proyecto. Cada usuario debe conectar su propia hoja.
          </p>
        </div>
      )}
    </div>
  )
}

function InstructionsContent() {
  return (
    <div className="instructions-content">
      <div className="instructions-step">
        <div className="instructions-step__num">1</div>
        <div>
          <h4>Crea una cuenta en Google Cloud</h4>
          <p>Ve a <strong>console.cloud.google.com</strong> e inicia sesión con tu cuenta de Google.</p>
        </div>
      </div>

      <div className="instructions-step">
        <div className="instructions-step__num">2</div>
        <div>
          <h4>Crea un nuevo proyecto en Google Cloud</h4>
          <p>Haz clic en "Nuevo Proyecto", dale un nombre y créalo.</p>
        </div>
      </div>

      <div className="instructions-step">
        <div className="instructions-step__num">3</div>
        <div>
          <h4>Habilita la API de Google Sheets</h4>
          <p>Ve a <strong>APIs y servicios → Biblioteca</strong>, busca "Google Sheets API" y haz clic en <strong>Habilitar</strong>.</p>
        </div>
      </div>

      <div className="instructions-step">
        <div className="instructions-step__num">4</div>
        <div>
          <h4>Crea credenciales OAuth2</h4>
          <p>Ve a <strong>APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth</strong>.</p>
          <p>Tipo de aplicación: <strong>Aplicación web</strong>. Agrega el dominio de esta app en "Orígenes autorizados".</p>
        </div>
      </div>

      <div className="instructions-step">
        <div className="instructions-step__num">5</div>
        <div>
          <h4>Crea tu Google Sheets</h4>
          <p>Ve a <strong>sheets.google.com</strong> y crea una nueva hoja de cálculo en blanco.</p>
          <p>Copia el ID de la URL: la parte entre <code>/d/</code> y <code>/edit</code>.</p>
        </div>
      </div>

      <div className="instructions-step">
        <div className="instructions-step__num">6</div>
        <div>
          <h4>Obtén un token de acceso</h4>
          <p>Usa el <strong>OAuth 2.0 Playground</strong> de Google (<code>developers.google.com/oauthplayground</code>):</p>
          <ol>
            <li>En el paso 1, ingresa el scope: <code>https://www.googleapis.com/auth/spreadsheets</code></li>
            <li>Autoriza la API con tu cuenta</li>
            <li>En el paso 2, haz clic en "Exchange authorization code for tokens"</li>
            <li>Copia el <strong>Access token</strong> que aparece</li>
          </ol>
          <p style={{ color: 'var(--color-warning)', fontSize: 12 }}>
            ⚠️ Los tokens de acceso duran solo 1 hora. Deberás renovarlo periódicamente.
          </p>
        </div>
      </div>

      <div className="instructions-step">
        <div className="instructions-step__num">7</div>
        <div>
          <h4>Conecta tu hoja en esta app</h4>
          <p>Ingresa el ID de la hoja y el token de acceso en el formulario de arriba y haz clic en <strong>Conectar</strong>.</p>
        </div>
      </div>

      <div className="instructions-note">
        <strong>🔐 Recuerda:</strong> Tus datos solo viven en tu hoja de cálculo personal. Esta app no guarda ni transmite tu información a ningún servidor nuestro. Solo tú tienes acceso a tu hoja de cálculo de Google.
      </div>
    </div>
  )
}
