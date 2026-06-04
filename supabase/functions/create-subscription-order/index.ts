/**
 * create-subscription-order
 *
 * Crea una orden de PayPal por $50 USD para la suscripción mensual del terapeuta.
 * Devuelve { approveUrl } para redirigir al terapeuta a PayPal.
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'therapist') throw new Error('Solo terapeutas pueden suscribirse')

    const baseUrl = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
    const appUrl  = Deno.env.get('APP_URL') ?? 'https://psiconecta-app.vercel.app'
    const token   = await getPayPalAccessToken()

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'PayPal-Request-Id': `sub-${user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: user.id,
          description:  'Psiconecta - Suscripcion mensual Plan Pro',
          amount: { currency_code: 'USD', value: '50.00' },
        }],
        application_context: {
          brand_name:          'Psiconecta',
          locale:              'es-DO',
          user_action:         'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: `${appUrl}/payment/subscription-success`,
          cancel_url: `${appUrl}/therapist/subscription?cancelled=1`,
        },
      }),
    })

    const order = await orderRes.json()
    if (!order.id) throw new Error('Error creando orden PayPal: ' + JSON.stringify(order))

    // Registrar pago pendiente
    await supabaseAdmin.from('subscription_payments').insert({
      therapist_id: user.id,
      amount: 50,
      currency: 'USD',
      status: 'pending',
      paypal_order_id: order.id,
    })

    const approveLink = order.links?.find((l: any) => l.rel === 'approve')
    if (!approveLink) throw new Error('No se encontro approveUrl de PayPal')

    return new Response(
      JSON.stringify({ approveUrl: approveLink.href, orderId: order.id }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[create-subscription-order]', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
