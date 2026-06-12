/**
 * CORS compartido para todas las Edge Functions.
 *
 * `getCorsHeaders(req)` refleja el Origin solo si está en la allowlist:
 *   - https://psiconecta.app (producción, o APP_URL si difiere)
 *   - https://localhost / capacitor://localhost (apps nativas Capacitor
 *     Android/iOS — sin esto, todas las llamadas desde la app fallan)
 *   - http(s)://localhost:* (desarrollo local con Vite)
 *
 * CORS no es la barrera de seguridad principal (todas las funciones
 * validan JWT); limita qué webs de terceros pueden llamar con la sesión
 * del usuario desde un navegador.
 */

const APP_ORIGIN = Deno.env.get('APP_URL') ?? 'https://psiconecta.app'

const ALLOWED_ORIGINS = new Set([
  APP_ORIGIN,
  'https://psiconecta.app',
  'https://www.psiconecta.app',
  // Apps nativas (Capacitor)
  'https://localhost',     // Android
  'http://localhost',      // Android (por si androidScheme cambia a http)
  'capacitor://localhost', // iOS
])

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowed = ALLOWED_ORIGINS.has(origin)
    || origin.startsWith('http://localhost:')   // dev local (vite :3000, preview :4173)
    || origin.startsWith('https://localhost:')
    // Vercel Preview deploys (staging): https://psiconecta-app-git-dev-xxx.vercel.app
    || (origin.startsWith('https://psiconecta-app') && origin.endsWith('.vercel.app'))
  return {
    'Access-Control-Allow-Origin':  allowed ? origin : APP_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

// Compatibilidad con código aún no migrado a getCorsHeaders:
export const corsHeaders = {
  'Access-Control-Allow-Origin': APP_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
