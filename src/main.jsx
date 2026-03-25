import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { authService } from './services/authService.js'
import App from './App.jsx'
import './index.css'

// Initialize app (create default admin if no users exist)
authService.initializeApp().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  )
})
