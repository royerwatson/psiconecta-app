/**
 * capture-gift-payment
 *
 * Captura el pago PayPal de una gift card y la activa.
 * Envía email al destinatario con el código.
 *
 * Body: { orderId: string }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders }               from '../_shared/cors.ts'
import { sendEmail, giftCardEmail }     from '../_shared/email.ts'

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
    // Requerir JWT — previene que terceros activen gift cards con orderId ajenos
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { orderId } = await req.json().catch(() => ({}))
    if (!orderId) throw new Error('Falta orderId')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Idempotencia — si ya fue procesado devolver éxito
    const { data: existing } = await supabaseAdmin
      .from('gift_cards')
      .select('id, code, amount_usd, recipient_name, recipient_email, sender_name')
      .eq('paypal_order_id', orderId)
      .eq('status', 'paid')
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, code: existing.code, alreadyActivated: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Capturar pago en PayPal
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

    const captureId   = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id
    const giftCardId  = capture.purchase_units?.[0]?.reference_id

    // Obtener y actualizar gift card
    const { data: giftCard, error: gcError } = await supabaseAdmin
      .from('gift_cards')
      .update({
        status:            'paid',
        paypal_capture_id: captureId,
      })
      .eq('id', giftCardId)
      .eq('status', 'pending_payment')
      .select('id, code, amount_usd, sender_name, sender_email, recipient_name, recipient_email, message')
      .single()

    if (gcError || !giftCard) {
      // Intentar por paypal_order_id como fallback
      const { data: fallback } = await supabaseAdmin
        .from('gift_cards')
        .update({ status: 'paid', paypal_capture_id: captureId })
        .eq('paypal_order_id', orderId)
        .eq('status', 'pending_payment')
        .select('id, code, amount_usd, sender_name, sender_email, recipient_name, recipient_email, message')
        .single()
      if (!fallback) throw new Error('No se encontró la gift card asociada a este pago')
      Object.assign(giftCard ?? {}, fallback)
    }

    const gc = giftCard!

    // Enviar email al destinatario
    const appUrl    = Deno.env.get('APP_URL') ?? 'https://psiconecta.app'
    const redeemUrl = `${appUrl}/canjear?code=${gc.code}`

    try {
      await sendEmail({
        to:      gc.recipient_email,
        subject: `🎁 ${gc.sender_name} te regaló sesiones de terapia en Psiconecta`,
        html:    giftCardEmail({
          recipientName: gc.recipient_name,
          senderName:    gc.sender_name,
          message:       gc.message ?? undefined,
          code:          gc.code,
          amountUsd:     gc.amount_usd,
          redeemUrl,
        }),
      })
    } catch (emailErr) {
      console.error('[capture-gift] Email error:', emailErr)
      // No bloqueamos — el pago ya fue capturado
    }

    console.log(`[capture-gift] Gift card activada: ${gc.code} — $${gc.amount_usd} para ${gc.recipient_email}`)

    return new Response(
      JSON.stringify({ success: true, code: gc.code, amountUsd: gc.amount_usd }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[capture-gift-payment]', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
