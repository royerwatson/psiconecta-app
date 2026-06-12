/**
 * create-subscription-order
 * Crea una orden PayPal de $50 para la suscripción mensual del terapeuta.
 * Guarda el registro pendiente en subscription_payments con schema correcto.
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
    const token   = await getPayPalToken()

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
          amount: { currency_code: 'USD', value: '79.99' },
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

    // Guardar en subscription_payments con el schema correcto
    const periodStart = new Date()
    const periodEnd   = new Date()
    periodEnd.setDate(periodEnd.getDate() + 30)

    const { error: insertError } = await supabaseAdmin
      .from('subscription_payments')
      .insert({
        therapist_id:   user.id,
        plan:           'pro',
        amount_usd:     79.99,
        paypal_order_id: order.id,
        status:         'pending',
        period_start:   periodStart.toISOString(),
        period_end:     periodEnd.toISOString(),
      })

    if (insertError) {
      // Log el error pero no falla el flujo — la captura puede funcionar sin este registro
      console.error('[create-subscription-order] subscription_payments insert error:', insertError)
    }

    const approveLink = order.links?.find((l: any) => l.rel === 'approve')
    if (!approveLink) throw new Error('No se encontró approveUrl de PayPal')

    return new Response(
      JSON.stringify({ approveUrl: approveLink.href, orderId: order.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[create-subscription-order]', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
