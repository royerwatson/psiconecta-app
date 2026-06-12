/**
 * paypal-webhook — Valida y procesa eventos de PayPal vía IPN/Webhooks.
 *
 * Configurar en PayPal Developer Console → Webhooks:
 *   URL: https://<project>.supabase.co/functions/v1/paypal-webhook
 *   Eventos: PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED,
 *            CHECKOUT.ORDER.APPROVED, BILLING.SUBSCRIPTION.CANCELLED
 *
 * Secret requerido: PAYPAL_WEBHOOK_ID (ID del webhook en PayPal Developer Console)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, subscriptionActivatedEmail } from '../_shared/email.ts'

import { getCorsHeaders } from '../_shared/cors.ts'

// ── Verificar firma del webhook con PayPal ────────────────────────────────────

async function verifyPayPalWebhook(req: Request, body: string): Promise<boolean> {
  const webhookId    = Deno.env.get('PAYPAL_WEBHOOK_ID')
  const clientId     = Deno.env.get('PAYPAL_CLIENT_ID')!
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')!
  const baseUrl      = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'

  if (!webhookId) {
    console.warn('PAYPAL_WEBHOOK_ID not set — skipping signature verification')
    return true // En desarrollo sin webhook configurado
  }

  // Obtener token PayPal
  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  })
  const { access_token } = await tokenRes.json()
  if (!access_token) return false

  // Verificar firma con la API de PayPal
  const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      auth_algo:         req.headers.get('paypal-auth-algo'),
      cert_url:          req.headers.get('paypal-cert-url'),
      transmission_id:   req.headers.get('paypal-transmission-id'),
      transmission_sig:  req.headers.get('paypal-transmission-sig'),
      transmission_time: req.headers.get('paypal-transmission-time'),
      webhook_id:        webhookId,
      webhook_event:     JSON.parse(body),
    }),
  })

  const result = await verifyRes.json()
  return result.verification_status === 'SUCCESS'
}

// ── Handlers por tipo de evento ───────────────────────────────────────────────

async function handleCaptureCompleted(
  supabase: ReturnType<typeof createClient>,
  resource: any
) {
  const orderId     = resource.supplementary_data?.related_ids?.order_id
  const captureId   = resource.id
  const amount      = parseFloat(resource.amount?.value ?? '0')
  const referenceId = resource.purchase_units?.[0]?.reference_id ?? orderId

  if (!captureId) return

  // Actualizar subscription_payments si corresponde a una suscripción
  const { data: subPayment } = await supabase
    .from('subscription_payments')
    .select('id, therapist_id, amount')
    .eq('paypal_order_id', orderId ?? captureId)
    .single()

  if (subPayment) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Corregido: usar columnas reales de la BD (period_end, no expires_at)
    await supabase.from('subscription_payments').update({
      status:            'completed',
      paypal_capture_id: captureId,
      period_end:        expiresAt.toISOString(),
    }).eq('id', subPayment.id)

    // Activar plan Pro del terapeuta
    await supabase.from('therapist_profiles').update({
      subscription_plan: 'pro',
      plan_expires_at:   expiresAt.toISOString(),
    }).eq('user_id', subPayment.therapist_id)

    // Enviar email de confirmación
    try {
      const { data: therapistAuth } = await supabase.auth.admin.getUserById(subPayment.therapist_id)
      const { data: therapistProfile } = await supabase
        .from('profiles').select('full_name').eq('id', subPayment.therapist_id).single()

      if (therapistAuth?.user?.email && therapistProfile?.full_name) {
        await sendEmail({
          to: therapistAuth.user.email,
          subject: '¡Tu Plan Pro de Psiconecta está activo!',
          html: subscriptionActivatedEmail({
            therapistName: therapistProfile.full_name,
            expiresAt: expiresAt.toISOString(),
          }),
        })
      }
    } catch (emailErr) {
      console.error('[webhook] Email error:', emailErr)
    }

    console.log(`Suscripción activada para terapeuta ${subPayment.therapist_id}`)
    return
  }

  // Si es pago de sesión, actualizar sessions
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('id', referenceId)
    .single()

  if (session && session.status === 'payment_pending') {
    await supabase.from('sessions').update({
      status:            'scheduled',
      paypal_capture_id: captureId,
    }).eq('id', session.id)

    console.log(`Sesión ${session.id} confirmada por webhook`)
  }
}

async function handleCaptureDenied(
  supabase: ReturnType<typeof createClient>,
  resource: any
) {
  const orderId = resource.supplementary_data?.related_ids?.order_id
  if (!orderId) return

  // Marcar sesiones payment_pending como fallidas
  await supabase.from('sessions').update({ status: 'cancelled' })
    .eq('id', orderId).eq('status', 'payment_pending')

  // Marcar subscription_payments como fallidos
  await supabase.from('subscription_payments').update({ status: 'failed' })
    .eq('paypal_order_id', orderId).eq('status', 'pending')

  console.log(`Pago denegado para orden ${orderId}`)
}

async function handleSubscriptionCancelled(
  supabase: ReturnType<typeof createClient>,
  resource: any
) {
  // El resource.custom_id o resource.subscriber contiene el user_id
  // En nuestro caso usamos reference_id del purchase_unit = user_id del terapeuta
  const therapistId = resource.custom_id ?? resource.subscriber?.payer_id

  if (!therapistId) {
    console.warn('[webhook] Cancelación sin therapistId identificable:', JSON.stringify(resource))
    return
  }

  // Downgrade a basic
  await supabase.from('therapist_profiles').update({
    subscription_plan: 'basic',
    plan_expires_at:   null,
  }).eq('user_id', therapistId)

  // Marcar pago activo como cancelado
  await supabase.from('subscription_payments').update({ status: 'cancelled' })
    .eq('therapist_id', therapistId)
    .eq('status', 'completed')

  console.log(`Plan downgraded a basic para terapeuta ${therapistId}`)
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.text()

    // Verificar firma de PayPal
    const isValid = await verifyPayPalWebhook(req, body)
    if (!isValid) {
      console.error('Invalid PayPal webhook signature')
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const event = JSON.parse(body)
    const eventType = event.event_type as string
    const resource  = event.resource

    console.log(`PayPal webhook: ${eventType}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Registrar en audit_log
    await supabase.from('audit_log').insert({
      action:      `paypal.${eventType.toLowerCase()}`,
      target_id:   resource?.id,
      target_type: 'payment',
      details:     { event_type: eventType, resource_id: resource?.id, amount: resource?.amount },
    }).then()

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handleCaptureCompleted(supabase, resource)
        break
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REVERSED':
        await handleCaptureDenied(supabase, resource)
        break
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionCancelled(supabase, resource)
        break
      default:
        console.log(`Evento no manejado: ${eventType}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[paypal-webhook]', err)
    // Responder 200 siempre para que PayPal no reintente infinitamente
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
