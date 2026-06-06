/**
 * usePageTracking — Dispara un pageview en GA4 en cada cambio de ruta.
 * Necesario porque Psiconecta es una SPA: el navegador no recarga la página.
 * Usar en App.jsx una sola vez.
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageview } from '@/lib/analytics'

export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    trackPageview(location.pathname + location.search)
  }, [location])
}
