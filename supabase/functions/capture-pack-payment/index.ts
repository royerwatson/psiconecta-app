/**
 * capture-pack-payment
 * Captura el pago PayPal de un paquete temático y marca la compra como pagada.
 * Body: { orderID, purchaseId }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

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

    const { orderID, purchaseId } = await req.json()
    if (!orderID || !purchaseId) {
      return new Response(JSON.stringify({ error: 'Datos incompletos' }), { status: 400, headers: cors })
    }

    // Verificar que la compra pertenece al usuario
    const { data: purchase, error: fetchErr } = await supabase
      .from('assessment_pack_purchases')
      .select('id, user_id, pack_slug, tests, paid')
      .eq('id', purchaseId)
      .single()

    if (fetchErr || !purchase) return new Response(JSON.stringify({ error: 'Compra no encontrada' }), { status: 404, headers: cors })
    if (purchase.user_id !== user.id) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403, headers: cors })
    if (purchase.paid) return new Response(JSON.stringify({ success: true, purchaseId, alreadyPaid: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })

    // Capturar pago en PayPal
    const PAYPAL_BASE   = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
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

    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const captureData = await captureRes.json()

    if (captureData.status !== 'COMPLETED') {
      throw new Error(`PayPal capture failed: ${JSON.stringify(captureData)}`)
    }

    const paymentIntentId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? orderID

    // Marcar compra como pagada
    const { error: updateErr } = await supabase
      .from('assessment_pack_purchases')
      .update({
        paid: true,
        paid_at: new Date().toISOString(),
        payment_intent_id: paymentIntentId,
      })
      .eq('id', purchaseId)

    if (updateErr) throw updateErr

    console.log(`[capture-pack-payment] Pack ${purchase.pack_slug} pagado — user ${user.id} — purchase ${purchaseId}`)

    return new Response(
      JSON.stringify({ success: true, purchaseId, packSlug: purchase.pack_slug, tests: purchase.tests }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('capture-pack-payment error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: getCorsHeaders(req) })
  }
})
