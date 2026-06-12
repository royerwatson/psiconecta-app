/**
 * process-refund
 * Calcula el reembolso según la política de cancelación y llama a PayPal Refunds API.
 *
 * Política:
 *   > 24h antes  → 100% reembolso
 *   2-24h antes  → 50% reembolso
 *   < 2h antes   → sin reembolso (error 400)
 *
 * Body: { sessionId: string, reason?: string }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { getCorsHeaders } from '../_shared/cors.ts'

async function getPayPalToken(): Promise<string> {
  const baseUrl = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${Deno.env.get('PAYPAL_CLIENT_ID')}:${Deno.env.get('PAYPAL_CLIENT_SECRET')}`)}`,
    },
    body: 'grant_type=client_credentials',
  })
  const d = await res.json()
  if (!d.access_token) throw new Error('No se pudo obtener token de PayPal')
  return d.access_token
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) throw new Error('No autorizado')

    const { sessionId, reason } = await req.json()
    if (!sessionId) throw new Error('Falta sessionId')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Obtener sesión ────────────────────────────────────────────────────────
    const { data: session, error: sessErr } = await supabaseAdmin
      .from('sessions')
      .select('id, scheduled_at, status, price, therapist_id, patient_id, payment_intent_id')
      .eq('id', sessionId)
      .eq('patient_id', user.id)
      .single()

    if (sessErr || !session) throw new Error('Sesión no encontrada')
    if (session.status !== 'scheduled') throw new Error('Solo se pueden cancelar sesiones programadas')

    // ── Calcular política de reembolso ────────────────────────────────────────
    const hoursUntil = (new Date(session.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60)

    if (hoursUntil < 2) {
      throw new Error('No se puede cancelar con menos de 2 horas de anticipación')
    }

    const refundPct    = hoursUntil >= 24 ? 100 : 50
    const refundAmount = parseFloat(((session.price ?? 0) * refundPct / 100).toFixed(2))

    // ── Cancelar la sesión ────────────────────────────────────────────────────
    await supabaseAdmin
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId)

    // ── Crear registro de reembolso ───────────────────────────────────────────
    const { data: refundRecord, error: insertErr } = await supabaseAdmin
      .from('refunds')
      .insert({
        session_id:        sessionId,
        patient_id:        user.id,
        therapist_id:      session.therapist_id,
        original_amount:   session.price ?? 0,
        refund_percentage: refundPct,
        refund_amount:     refundAmount,
        paypal_capture_id: session.payment_intent_id,
        status:            'processing',
        reason:            reason ?? null,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('[process-refund] Insert error:', insertErr)
      throw new Error('Error registrando el reembolso')
    }

    // ── Llamar a PayPal Refunds API ───────────────────────────────────────────
    let paypalRefundId: string | null = null
    let refundStatus = 'completed'

    if (session.payment_intent_id && refundAmount > 0) {
      try {
        const baseUrl = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
        const token   = await getPayPalToken()

        const refundRes = await fetch(
          `${baseUrl}/v2/payments/captures/${session.payment_intent_id}/refund`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              'PayPal-Request-Id': `refund-${refundRecord.id}`,
            },
            body: JSON.stringify({
              amount: {
                value:         refundAmount.toFixed(2),
                currency_code: 'USD',
              },
              note_to_payer: `Reembolso Psiconecta - ${refundPct}% por cancelación`,
            }),
          }
        )

        const refundData = await refundRes.json()

        if (refundData.id && refundData.status === 'COMPLETED') {
          paypalRefundId = refundData.id
          refundStatus   = 'completed'
          console.log(`[process-refund] Reembolso PayPal completado: ${refundData.id}`)
        } else {
          console.error('[process-refund] PayPal refund failed:', JSON.stringify(refundData))
          refundStatus = 'failed'
        }
      } catch (paypalErr) {
        console.error('[process-refund] PayPal error:', paypalErr)
        refundStatus = 'failed'
      }
    } else if (refundAmount === 0) {
      // Sin pago o reembolso 0% — marcar como completado sin llamar a PayPal
      refundStatus = 'completed'
    }

    // ── Actualizar registro con resultado ─────────────────────────────────────
    await supabaseAdmin
      .from('refunds')
      .update({
        status:          refundStatus,
        paypal_refund_id: paypalRefundId,
        processed_at:    new Date().toISOString(),
      })
      .eq('id', refundRecord.id)

    return new Response(
      JSON.stringify({
        success:        true,
        refundAmount,
        refundPercent:  refundPct,
        refundStatus,
        paypalRefundId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[process-refund]', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
