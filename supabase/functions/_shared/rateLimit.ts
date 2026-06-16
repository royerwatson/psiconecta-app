/**
 * rateLimit.ts — Rate limiting simple basado en Supabase para Edge Functions.
 *
 * Registra llamadas por usuario + función y rechaza si supera el límite.
 * Requiere tabla `rate_limit_log` en Supabase (ver migration_security_fixes.sql).
 *
 * Modo de fallo configurable:
 *   failOpen: true  (default) — si la tabla falla, permite la petición (backward-compat)
 *   failOpen: false           — si la tabla falla, rechaza la petición (endpoints críticos)
 *
 * Usar failOpen: false en endpoints financieros: confirm-credit-booking,
 * create-paypal-order, redeem-gift-card, capture-gift-payment.
 */
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface RateLimitConfig {
  maxRequests: number    // máximo de peticiones permitidas en la ventana
  windowSeconds: number  // ventana de tiempo en segundos
  functionName: string   // nombre de la función (para logs y agrupación)
  failOpen?: boolean     // true = permitir si falla la tabla; false = bloquear (default: true)
}

export async function checkRateLimit(
  supabaseAdmin: SupabaseClient,
  identifier: string,  // user ID (o IP si no hay sesión)
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  const failOpen = config.failOpen ?? true

  try {
    const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString()

    const { count, error: countError } = await supabaseAdmin
      .from('rate_limit_log')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('function_name', config.functionName)
      .gte('created_at', windowStart)

    if (countError) throw countError

    const requestCount = count ?? 0
    if (requestCount >= config.maxRequests) {
      return { allowed: false, remaining: 0 }
    }

    // Registrar esta petición (best-effort — no bloquear si falla el insert)
    const { error: insertError } = await supabaseAdmin.from('rate_limit_log').insert({
      identifier,
      function_name: config.functionName,
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      // El count pasó pero el insert falló — loguear y continuar (ya se permitió)
      console.error(`[rateLimit] INSERT falló en ${config.functionName}:`, insertError.message)
    }

    return { allowed: true, remaining: config.maxRequests - requestCount - 1 }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Log siempre visible en Supabase Edge Function logs
    console.error(
      `[rateLimit] ⚠️ FALLO en tabla rate_limit_log — función: ${config.functionName}, ` +
      `usuario: ${identifier.slice(0, 8)}***, failOpen: ${failOpen}, error: ${msg}`
    )

    if (!failOpen) {
      // Fail-closed: bloquear la petición para evitar bypass de rate limit
      return { allowed: false, remaining: -1 }
    }

    // Fail-open: permitir la petición (solo para funciones no críticas)
    return { allowed: true, remaining: -1 }
  }
}
