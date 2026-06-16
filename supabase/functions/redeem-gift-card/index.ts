/**
 * redeem-gift-card
 *
 * Canjea un código de gift card y agrega crédito al paciente.
 * Requiere JWT de paciente autenticado.
 *
 * Body: { code: string }
 * Returns: { success, amountUsd, newBalance }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders }  from '../_shared/cors.ts'
import { checkRateLimit }  from '../_shared/rateLimit.ts'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Verificar sesión del paciente
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Rate limiting: máx. 10 intentos de canje por usuario por hora (previene fuerza bruta de códigos)
    const rl = await checkRateLimit(supabaseAdmin, user.id, {
      maxRequests: 10,
      windowSeconds: 3600,
      functionName: 'redeem-gift-card',
    })
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Demasiados intentos. Intenta más tarde.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { code } = await req.json().catch(() => ({}))
    if (!code?.trim()) throw new Error('Falta el código de regalo')

    const normalizedCode = code.trim().toUpperCase()

    // Buscar gift card
    const { data: giftCard, error: gcError } = await supabaseAdmin
      .from('gift_cards')
      .select('id, code, amount_usd, status, expires_at, redeemed_by')
      .eq('code', normalizedCode)
      .single()

    if (gcError || !giftCard) throw new Error('Código no encontrado')

    if (giftCard.status === 'redeemed') {
      throw new Error('Este código ya fue canjeado')
    }
    if (giftCard.status === 'expired' || new Date(giftCard.expires_at) < new Date()) {
      // Marcar como expirado si no lo está
      await supabaseAdmin.from('gift_cards').update({ status: 'expired' }).eq('id', giftCard.id)
      throw new Error('Este código ha expirado')
    }
    if (giftCard.status !== 'paid') {
      throw new Error('El pago de esta gift card no ha sido completado')
    }

    // Idempotencia: si ya fue canjeado por este mismo usuario
    if (giftCard.redeemed_by === user.id) {
      const { data: bal } = await supabaseAdmin.rpc('get_patient_credit_balance', { p_user_id: user.id })
      return new Response(
        JSON.stringify({ success: true, amountUsd: giftCard.amount_usd, newBalance: bal ?? 0, alreadyRedeemed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Marcar como canjeada (operación atómica)
    const { error: updateError } = await supabaseAdmin
      .from('gift_cards')
      .update({ status: 'redeemed', redeemed_by: user.id, redeemed_at: new Date().toISOString() })
      .eq('id', giftCard.id)
      .eq('status', 'paid')   // guard extra contra race conditions

    if (updateError) throw new Error('Error procesando el canje: ' + updateError.message)

    // Agregar crédito al paciente
    const { error: creditError } = await supabaseAdmin
      .from('patient_credits')
      .insert({
        user_id:      user.id,
        amount_usd:   giftCard.amount_usd,
        source:       'gift_card',
        gift_card_id: giftCard.id,
      })

    if (creditError) {
      // Revertir el estado de la gift card
      await supabaseAdmin.from('gift_cards')
        .update({ status: 'paid', redeemed_by: null, redeemed_at: null })
        .eq('id', giftCard.id)
      throw new Error('Error agregando crédito: ' + creditError.message)
    }

    // Obtener nuevo balance
    const { data: newBalance } = await supabaseAdmin
      .rpc('get_patient_credit_balance', { p_user_id: user.id })

    console.log(`[redeem-gift] ${normalizedCode} canjeado por user ${user.id} — $${giftCard.amount_usd}`)

    return new Response(
      JSON.stringify({ success: true, amountUsd: giftCard.amount_usd, newBalance: newBalance ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[redeem-gift-card]', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
