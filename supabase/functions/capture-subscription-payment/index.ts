/**
 * capture-subscription-payment
 *
 * Captura el pago de suscripción después de la aprobación de PayPal.
 * Activa el plan Pro del terapeuta por 30 días.
 *
 * Body: { orderId: string }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APP_ORIGIN = Deno.env.get('APP_URL') ?? 'https://psiconecta-app.vercel.app'

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  // Allow app origin and localhost for development
  const allowed = origin === APP_ORIGIN
    || origin.startsWith('http://localhost')
    || origin.startsWith('https://localhost')
  return {
    'Access-Control-Allow-Origin':  allowed ? origin : APP_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
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
  if (!data.access_token) throw new Error('No se pudo obtener el token de PayPal')
  return data.access_token
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()
    if (authError || !user) throw new Error('No autorizado')

    const { orderId } = await req.json()
    if (!orderId) throw new Error('Falta orderId')

    // Capturar el pago en PayPal
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

    // Verificar que la orden pertenece al usuario
    const purchaseUnit = capture.purchase_units?.[0]
    if (purchaseUnit?.reference_id !== user.id) {
      throw new Error('La orden no pertenece a este usuario')
    }

    const captureId = purchaseUnit?.payments?.captures?.[0]?.id
    const amountPaid = parseFloat(purchaseUnit?.payments?.captures?.[0]?.amount?.value ?? '50')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Calcular fecha de expiración: 30 días desde ahora
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Activar plan Pro del terapeuta
    const { error: updateError } = await supabaseAdmin
      .from('therapist_profiles')
      .update({
        subscription_plan: 'pro',
        plan_expires_at:   expiresAt.toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) throw new Error('Error actualizando plan: ' + updateError.message)

    // Actualizar registro de pago
    await supabaseAdmin
      .from('subscription_payments')
      .update({
        status:     'completed',
        paypal_capture_id: captureId,
        amount:     amountPaid,
        paid_at:    new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('paypal_order_id', orderId)

    return new Response(
      JSON.stringify({ success: true, expiresAt: expiresAt.toISOString() }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[capture-subscription-payment]', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
