import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'
import './index.css'

// Aplicar dark mode antes del primer render para evitar flash
const saved = localStorage.getItem('psiconecta-dark-mode')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
if (saved === 'true' || (saved === null && prefersDark)) {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </React.StrictMode>,
)
