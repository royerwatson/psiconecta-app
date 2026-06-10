/**
 * Sentry — monitoreo de errores en producción.
 * Solo se inicializa si VITE_SENTRY_DSN está definido (no-op en dev local).
 *
 * Configurar:
 *   1. Crear proyecto React en sentry.io
 *   2. Añadir VITE_SENTRY_DSN en Vercel → Environment Variables
 *   3. (Opcional) VITE_SENTRY_ENVIRONMENT=production|preview
 */
import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  if (!DSN) return

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    // Performance: muestrea 10% de transacciones (ajustar según cuota)
    tracesSampleRate: 0.1,
    // Privacidad: nunca enviar PII de pacientes
    sendDefaultPii: false,
    beforeSend(event) {
      // Sanear posibles datos sensibles en URLs (ids de pacientes en rutas)
      if (event.request?.url) {
        event.request.url = event.request.url.replace(
          /\/(patients?|therapist)\/[0-9a-f-]{36}/gi,
          '/$1/<id>'
        )
      }
      return event
    },
    ignoreErrors: [
      // Ruido conocido de browsers/extensiones
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
  })
}

/** Asociar el usuario actual (solo id y rol — nunca nombre/email) */
export function setSentryUser(user, role) {
  if (!DSN) return
  if (user) {
    Sentry.setUser({ id: user.id, role })
  } else {
    Sentry.setUser(null)
  }
}

export { Sentry }
