/**
 * Cliente de Supabase compartido por toda la app.
 *
 * Variables de entorno requeridas (en .env):
 *   VITE_SUPABASE_URL       — URL del proyecto Supabase
 *   VITE_SUPABASE_ANON_KEY  — Clave pública (anon) del proyecto
 *
 * Configuración:
 *   - persistSession: true → la sesión sobrevive a recargas
 *   - autoRefreshToken: true → renueva el JWT automáticamente
 *   - detectSessionInUrl: true → captura tokens de magic-links y OAuth en la URL
 *   - realtime.eventsPerSecond: 10 → límite de eventos para evitar throttling
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Psiconecta] Faltan las variables de entorno de Supabase. Copia .env.example a .env y complétalo.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
