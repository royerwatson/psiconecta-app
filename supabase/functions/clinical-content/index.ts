/**
 * Edge Function: clinical-content
 *
 * Sirve el contenido clínico protegido (DSM-5-TR, CIE-11) únicamente a
 * terapeutas con plan Pro/Premium. Antes este contenido viajaba en el
 * bundle JS del frontend: cualquiera podía extraerlo sin suscripción.
 *
 * Body esperado:
 *   { dataset: 'dsm5tr' | 'cie11' }
 *
 * Respuesta:
 *   { data: [...capítulos] }
 *
 * Autorización:
 *   - JWT válido (header Authorization)
 *   - rpc is_pro_therapist() debe devolver true
 *     (función SECURITY DEFINER creada en migration_fix_progate_server_side.sql)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { DSM5TR } from './dsm5tr.js'
import { CIE11 } from './cie11.js'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

const DATASETS: Record<string, unknown> = {
  dsm5tr: DSM5TR,
  cie11:  CIE11,
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'No autorizado' }, 401, corsHeaders)
    }

    // Cliente con el JWT del usuario: getUser valida el token y
    // la RPC se evalúa con su rol real.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return json({ error: 'Sesión inválida' }, 401, corsHeaders)
    }

    const { data: isPro, error: rpcError } = await supabase.rpc('is_pro_therapist')
    if (rpcError) {
      console.error('is_pro_therapist error:', rpcError)
      return json({ error: 'Error verificando suscripción' }, 500, corsHeaders)
    }
    if (!isPro) {
      return json({ error: 'Requiere plan Suscripción' }, 403, corsHeaders)
    }

    const { dataset } = await req.json().catch(() => ({}))
    const data = DATASETS[dataset]
    if (!data) {
      return json({ error: 'dataset inválido — usa "dsm5tr" o "cie11"' }, 400, corsHeaders)
    }

    return new Response(JSON.stringify({ data }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        // Cacheable en el browser del terapeuta, nunca en CDNs compartidas
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch (err) {
    console.error('clinical-content error:', err)
    return json({ error: 'Error interno' }, 500, corsHeaders)
  }
})

function json(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
