/**
 * rateLimit.ts — Rate limiting simple basado en Supabase para Edge Functions.
 *
 * Registra llamadas por IP + función y rechaza si supera el límite.
 * Requiere tabla `rate_limit_log` en Supabase (ver migration_security_fixes.sql).
 */
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface RateLimitConfig {
  maxRequests: number   // máximo de peticiones permitidas
  windowSeconds: number // ventana de tiempo en segundos
  functionName: string  // nombre de la función (para logs)
}

export async function checkRateLimit(
  supabaseAdmin: SupabaseClient,
  identifier: string,  // IP o user ID
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString()

    const { count } = await supabaseAdmin
      .from('rate_limit_log')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('function_name', config.functionName)
      .gte('created_at', windowStart)

    const requestCount = count ?? 0
    if (requestCount >= config.maxRequests) {
      return { allowed: false, remaining: 0 }
    }

    // Registrar esta petición
    await supabaseAdmin.from('rate_limit_log').insert({
      identifier,
      function_name: config.functionName,
      created_at: new Date().toISOString(),
    })

    return { allowed: true, remaining: config.maxRequests - requestCount - 1 }
  } catch {
    // Si falla el rate limiting, permitir la petición (fail open)
    return { allowed: true, remaining: -1 }
  }
}
