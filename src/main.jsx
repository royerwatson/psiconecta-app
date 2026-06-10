import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'
import { initSentry } from './lib/sentry.js'

// Monitoreo de errores (no-op si VITE_SENTRY_DSN no está definido)
initSentry()

// Plus Jakarta Sans — @font-face en index.css (URL estable /fonts/)
// Lora — auto-hospedada vía @fontsource (sin DNS externo)
import '@fontsource/lora/latin-400.css'
import '@fontsource/lora/latin-600.css'
import '@fontsource/lora/latin-700.css'

import './index.css'

// Aplicar dark mode antes del primer render para evitar flash
const saved = localStorage.getItem('psiconecta-dark-mode')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
if (saved === 'true' || (saved === null && prefersDark)) {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
