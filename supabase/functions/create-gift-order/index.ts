/**
 * create-gift-order
 *
 * Crea una orden PayPal para comprar una gift card.
 * No requiere sesión — cualquier persona puede regalar.
 *
 * Body: {
 *   amountUsd:       number   (mínimo 25)
 *   senderName:      string
 *   senderEmail:     string
 *   recipientName:   string
 *   recipientEmail:  string
 *   message?:        string
 * }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders }  from '../_shared/cors.ts'

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin O,0,I,1 para evitar confusión
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `PSICO-${seg()}-${seg()}`
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
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { amountUsd, senderName, senderEmail, recipientName, recipientEmail, message } =
      await req.json().catch(() => ({}))

    if (!amountUsd || amountUsd < 25)   throw new Error('El monto mínimo es $25 USD')
    if (!senderName?.trim())             throw new Error('Falta el nombre del remitente')
    if (!senderEmail?.trim())            throw new Error('Falta el email del remitente')
    if (!recipientName?.trim())          throw new Error('Falta el nombre del destinatario')
    if (!recipientEmail?.trim())         throw new Error('Falta el email del destinatario')

    const amount = parseFloat(parseFloat(amountUsd).toFixed(2))

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Generar código único (reintentar si hay colisión)
    let code = generateGiftCode()
    for (let i = 0; i < 5; i++) {
      const { data } = await supabaseAdmin.from('gift_cards').select('id').eq('code', code).single()
      if (!data) break
      code = generateGiftCode()
    }

    // Insertar gift card con status pending_payment
    const { data: giftCard, error: insertError } = await supabaseAdmin
      .from('gift_cards')
      .insert({
        code,
        amount_usd:      amount,
        sender_name:     senderName.trim(),
        sender_email:    senderEmail.trim().toLowerCase(),
        recipient_name:  recipientName.trim(),
        recipient_email: recipientEmail.trim().toLowerCase(),
        message:         message?.trim() ?? null,
        status:          'pending_payment',
      })
      .select('id, code')
      .single()

    if (insertError) throw new Error('Error creando gift card: ' + insertError.message)

    // Crear orden PayPal
    const baseUrl = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
    const token   = await getPayPalToken()

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        Authorization:     `Bearer ${token}`,
        'PayPal-Request-Id': `gift-${giftCard.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id:  giftCard.id,
          description:   `Regalo Psiconecta para ${recipientName.trim()} — ${code}`,
          amount: {
            currency_code: 'USD',
            value:         amount.toFixed(2),
          },
        }],
        application_context: {
          brand_name:          'Psiconecta',
          locale:              'es-DO',
          user_action:         'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
        },
      }),
    })

    const order = await orderRes.json()
    if (!order.id) throw new Error('Error creando orden PayPal: ' + JSON.stringify(order))

    // Guardar paypal_order_id
    await supabaseAdmin
      .from('gift_cards')
      .update({ paypal_order_id: order.id })
      .eq('id', giftCard.id)

    return new Response(
      JSON.stringify({ orderId: order.id, giftCardId: giftCard.id, code }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[create-gift-order]', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
