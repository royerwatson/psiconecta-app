/**
 * useDarkMode — Gestiona el modo oscuro con persistencia en localStorage.
 * Aplica/remueve la clase 'dark' en <html> automáticamente.
 * Respeta la preferencia del sistema si no hay preferencia guardada.
 */
import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('psiconecta-dark-mode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('psiconecta-dark-mode', String(isDark))
  }, [isDark])

  const toggle = () => setIsDark(v => !v)

  return { isDark, toggle }
}
