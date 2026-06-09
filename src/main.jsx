import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'

// Fuentes auto-hospedadas — solo subconjunto latin (sin DNS externo, font-display:swap incluido)
import '@fontsource-variable/plus-jakarta-sans/wght.css'   // latin + latin-ext, todos los pesos
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
