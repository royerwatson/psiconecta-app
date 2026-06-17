/**
 * create-pack-order
 * Crea una orden PayPal para un paquete temático de evaluaciones.
 * Body: { packSlug, packName, tests[], amount }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

const PACK_PRICES: Record<string, number> = {
  bienestar: 12.99,
  laboral:   14.99,
  completo:  24.99,
}

const PACK_TESTS: Record<string, string[]> = {
  bienestar: ['ansiedad', 'depresion', 'sueno'],
  laboral:   ['burnout', 'ansiedad'],
  completo:  ['ansiedad', 'depresion', 'sueno', 'burnout'],
}

serve(async (req) => {
  const cors = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: cors })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: cors })

    const { packSlug, packName } = await req.json()
    if (!packSlug || !PACK_PRICES[packSlug]) {
      return new Response(JSON.stringify({ error: 'Pack inválido' }), { status: 400, headers: cors })
    }

    const amount = PACK_PRICES[packSlug]
    const tests  = PACK_TESTS[packSlug]

    // Crear registro de compra (pending)
    const { data: purchase, error: purchaseError } = await supabase
      .from('assessment_pack_purchases')
      .insert({
        user_id:  user.id,
        pack_slug: packSlug,
        tests,
        amount_paid: amount,
        paid: false,
        session_ids: [],
        completed: false,
      })
      .select('id')
      .single()

    if (purchaseError) throw purchaseError

    // Crear orden PayPal
    const PAYPAL_BASE = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
    const CLIENT_ID     = Deno.env.get('PAYPAL_CLIENT_ID')!
    const CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')!

    const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    const { access_token } = await tokenRes.json()

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: amount.toFixed(2) },
          description: `${packName ?? packSlug} — Psiconecta`,
          custom_id: JSON.stringify({ purchaseId: purchase.id, userId: user.id }),
        }],
        application_context: {
          brand_name: 'Psiconecta',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
        },
      }),
    })

    const order = await orderRes.json()
    if (!order.id) throw new Error(`PayPal error: ${JSON.stringify(order)}`)

    return new Response(
      JSON.stringify({ orderID: order.id, purchaseId: purchase.id }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('create-pack-order error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: getCorsHeaders(req) })
  }
})
