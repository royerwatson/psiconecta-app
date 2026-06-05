/**
 * capture-subscription-payment
 *
 * Captura el pago de suscripción tras aprobación en PayPal.
 * NO requiere sesión activa del usuario — el orderId de PayPal
 * es suficiente para identificar y verificar el pago.
 *
 * Seguridad:
 *  - PayPal verifica que el pago fue aprobado (status = COMPLETED)
 *  - Buscamos el therapist_id en subscription_payments por orderId
 *  - Unique constraint en paypal_capture_id previene doble captura
 *
 * Body: { orderId: string }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId     = Deno.env.get('PAYPAL_CLIENT_ID')!
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')!
  const baseUrl      = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('No se pudo obtener token de PayPal')
  return data.access_token
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { orderId } = await req.json()
    if (!orderId) throw new Error('Falta orderId')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 1. Buscar el therapist_id asociado a esta orden ───────────────────
    // create-subscription-order guarda la orden como 'pending' en subscription_payments
    const { data: pendingPayment } = await supabaseAdmin
      .from('subscription_payments')
      .select('id, therapist_id, status')
      .eq('paypal_order_id', orderId)
      .single()

    if (!pendingPayment) {
      throw new Error('Orden no encontrada. Intenta de nuevo o contacta soporte.')
    }

    if (pendingPayment.status === 'completed') {
      // Ya fue capturada antes — devolver éxito idempotente
      const { data: tp } = await supabaseAdmin
        .from('therapist_profiles')
        .select('plan_expires_at')
        .eq('user_id', pendingPayment.therapist_id)
        .single()
      return new Response(
        JSON.stringify({ success: true, expiresAt: tp?.plan_expires_at, alreadyActivated: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Capturar el pago en PayPal ─────────────────────────────────────
    const baseUrl = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
    const token   = await getPayPalAccessToken()

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    const capture = await captureRes.json()

    if (capture.status !== 'COMPLETED') {
      throw new Error('El pago no fue completado: ' + (capture.details?.[0]?.description ?? capture.status))
    }

    const captureId  = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id
    const amountPaid = parseFloat(
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? '50'
    )

    // ── 3. Activar plan Pro del terapeuta (30 días) ───────────────────────
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error: updateError } = await supabaseAdmin
      .from('therapist_profiles')
      .update({
        subscription_plan: 'pro',
        plan_expires_at:   expiresAt.toISOString(),
      })
      .eq('user_id', pendingPayment.therapist_id)

    if (updateError) throw new Error('Error activando plan: ' + updateError.message)

    // ── 4. Registrar pago completado ──────────────────────────────────────
    await supabaseAdmin
      .from('subscription_payments')
      .update({
        status:            'completed',
        paypal_capture_id: captureId,
        amount:            amountPaid,
        paid_at:           new Date().toISOString(),
        expires_at:        expiresAt.toISOString(),
      })
      .eq('paypal_order_id', orderId)

    console.log(`[capture-subscription] Plan Pro activado para therapist ${pendingPayment.therapist_id}`)

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
