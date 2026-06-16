import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  const cors = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    // Auth required
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: cors })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: cors })

    const body = await req.json()
    const { slug, instrument, instrumentFull, responses, totalScore, maxScore, severityLabel, severityHex, dimensionScores } = body

    if (!slug || !responses || totalScore === undefined) {
      return new Response(JSON.stringify({ error: 'Datos incompletos' }), { status: 400, headers: cors })
    }

    // Determinar precio según slug
    const priceMap: Record<string, number> = {
      ansiedad: 4.99,
      depresion: 4.99,
      sueno: 4.99,
      burnout: 6.99,
      relaciones: 9.99,
      personalidad: 9.99,
    }
    const amount = priceMap[slug] ?? 4.99

    // Crear assessment_session (pending)
    const { data: session, error: sessionError } = await supabase
      .from('assessment_sessions')
      .insert({
        user_id: user.id,
        slug,
        instrument,
        instrument_full: instrumentFull,
        responses,
        total_score: totalScore,
        max_score: maxScore,
        severity_label: severityLabel,
        severity_hex: severityHex,
        dimension_scores: dimensionScores,
        paid: false,
      })
      .select('id')
      .single()

    if (sessionError) throw sessionError

    // Crear orden PayPal
    const PAYPAL_BASE = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
    const CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')!
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
          description: `Reporte ${instrument} — Psiconecta`,
          custom_id: JSON.stringify({ sessionId: session.id, userId: user.id }),
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
      JSON.stringify({ orderID: order.id, sessionId: session.id }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('create-assessment-order error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: getCorsHeaders(req) })
  }
})
