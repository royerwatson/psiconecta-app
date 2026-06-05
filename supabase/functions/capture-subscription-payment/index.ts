/**
 * capture-subscription-payment
 *
 * Captura el pago y activa el plan Pro.
 * NO requiere sesión. Identifica al terapeuta de dos formas:
 *   1. Por subscription_payments.paypal_order_id (si el insert funcionó)
 *   2. Por el reference_id de la orden PayPal (siempre contiene user_id)
 *
 * Body: { orderId: string }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { orderId } = await req.json()
    if (!orderId) throw new Error('Falta orderId')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Verificar si ya fue procesado (idempotencia) ──────────────────────
    const { data: existing } = await supabaseAdmin
      .from('subscription_payments')
      .select('therapist_id, status, period_end')
      .eq('paypal_order_id', orderId)
      .eq('status', 'completed')
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, expiresAt: existing.period_end, alreadyActivated: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Capturar el pago en PayPal ────────────────────────────────────────
    const baseUrl = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
    const token   = await getPayPalToken()

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    const capture = await captureRes.json()

    if (capture.status !== 'COMPLETED') {
      const detail = capture.details?.[0]?.description ?? capture.status ?? 'Error desconocido'
      throw new Error('El pago no fue completado: ' + detail)
    }

    // ── Obtener therapist_id ──────────────────────────────────────────────
    // Fuente 1: reference_id en la orden PayPal (siempre contiene user.id)
    const referenceId = capture.purchase_units?.[0]?.reference_id
    const captureId   = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id
    const amountPaid  = parseFloat(
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? '50'
    )

    // Fuente 2: subscription_payments (si el insert funcionó)
    const { data: pendingPayment } = await supabaseAdmin
      .from('subscription_payments')
      .select('id, therapist_id')
      .eq('paypal_order_id', orderId)
      .eq('status', 'pending')
      .single()

    // Determinar therapist_id — priorizar el de la BD, fallback al reference_id de PayPal
    const therapistId = pendingPayment?.therapist_id ?? referenceId

    if (!therapistId) {
      throw new Error('No se pudo identificar al terapeuta asociado a este pago')
    }

    // ── Activar plan Pro (30 días) ────────────────────────────────────────
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Usar .select() para verificar que el update afectó filas
    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from('therapist_profiles')
      .update({
        subscription_plan: 'pro',
        plan_expires_at:   expiresAt.toISOString(),
      })
      .eq('user_id', therapistId)
      .select('user_id, subscription_plan')

    if (updateError) throw new Error('Error activando plan: ' + updateError.message)

    if (!updatedRows || updatedRows.length === 0) {
      console.error(`[capture-subscription] WARN: No se actualizó therapist_profiles para user_id=${therapistId}. Verificando si el perfil existe...`)
      // Intentar insertar si no existe
      const { error: upsertError } = await supabaseAdmin
        .from('therapist_profiles')
        .upsert({
          user_id:           therapistId,
          subscription_plan: 'pro',
          plan_expires_at:   expiresAt.toISOString(),
        }, { onConflict: 'user_id' })
      if (upsertError) throw new Error('Error en upsert del plan: ' + upsertError.message)
    }

    console.log(`[capture-subscription] Plan Pro activado: user_id=${therapistId}, rows=${updatedRows?.length ?? 0}`)

    // ── Registrar pago ────────────────────────────────────────────────────
    if (pendingPayment?.id) {
      await supabaseAdmin
        .from('subscription_payments')
        .update({
          status:            'completed',
          paypal_capture_id: captureId,
          amount_usd:        amountPaid,
          period_end:        expiresAt.toISOString(),
        })
        .eq('id', pendingPayment.id)
    } else {
      // Si no había registro previo, insertar uno nuevo
      const periodStart = new Date()
      await supabaseAdmin.from('subscription_payments').insert({
        therapist_id:      therapistId,
        plan:              'pro',
        amount_usd:        amountPaid,
        paypal_order_id:   orderId,
        paypal_capture_id: captureId,
        status:            'completed',
        period_start:      periodStart.toISOString(),
        period_end:        expiresAt.toISOString(),
      }).then()
    }

    console.log(`[capture-subscription] Plan Pro activado para therapist ${therapistId}`)

    return new Response(
      JSON.stringify({ success: true, expiresAt: expiresAt.toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[capture-subscription-payment]', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
