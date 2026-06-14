/**
 * capture-subscription-payment
 *
 * Captura el pago y activa el plan Pro.
 *
 * Seguridad:
 *   - Si la petición incluye Authorization header: verifica el JWT y valida
 *     que user.id === therapistId (cross-check). Rechaza si no coincide.
 *   - Si no hay Authorization header: procede solo con validación PayPal
 *     (flujo redirect donde la sesión pudo haberse perdido). El orderId de
 *     PayPal es generado por sus servidores y de un solo uso — suficiente
 *     como prueba de posesión del pago.
 *
 * Identifica al terapeuta de dos formas:
 *   1. Por subscription_payments.paypal_order_id (si el insert funcionó)
 *   2. Por el reference_id de la orden PayPal (siempre contiene user_id)
 *
 * Body: { orderId: string }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, subscriptionActivatedEmail } from '../_shared/email.ts'

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
    const { orderId } = await req.json()
    if (!orderId) throw new Error('Falta orderId')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Verificar JWT si está presente ────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    let authenticatedUserId: string | null = null

    if (authHeader) {
      const supabaseAnon = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Token inválido o expirado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      authenticatedUserId = user.id
    }

    // ── Verificar si ya fue procesado (idempotencia) ──────────────────────
    const { data: existing } = await supabaseAdmin
      .from('subscription_payments')
      .select('therapist_id, status, period_end')
      .eq('paypal_order_id', orderId)
      .eq('status', 'completed')
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, expiresAt: existing.period_end, alreadyActivated: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Capturar el pago en PayPal ────────────────────────────────────────
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

    // ── Obtener therapist_id ──────────────────────────────────────────────
    // Fuente 1: reference_id en la orden PayPal (siempre contiene user.id)
    const referenceId = capture.purchase_units?.[0]?.reference_id
    const captureId   = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id
    const amountPaid  = parseFloat(
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? '50'
    )

    // Fuente 2: subscription_payments (si el insert funcionó)
    const { data: pendingPayment } = await supabaseAdmin
      .from('subscription_payments')
      .select('id, therapist_id, billing_cycle')
      .eq('paypal_order_id', orderId)
      .eq('status', 'pending')
      .single()

    // Determinar therapist_id — priorizar el de la BD, fallback al reference_id de PayPal
    const therapistId = pendingPayment?.therapist_id ?? referenceId

    if (!therapistId) {
      throw new Error('No se pudo identificar al terapeuta asociado a este pago')
    }

    // ── Cross-check: JWT user debe coincidir con el dueño del pago ────────
    if (authenticatedUserId && authenticatedUserId !== therapistId) {
      console.error(`[capture-subscription] SECURITY: JWT user ${authenticatedUserId} != therapistId ${therapistId}`)
      return new Response(
        JSON.stringify({ error: 'No autorizado: el pago no corresponde a tu cuenta' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Determinar ciclo de facturación ──────────────────────────────────
    // Priorizar el registro en BD; si no existe, inferir por monto pagado
    const billingCycle = pendingPayment?.billing_cycle
      ?? (amountPaid >= 300 ? 'annual' : 'monthly')
    const isAnnual = billingCycle === 'annual'

    // ── Activar plan Pro ──────────────────────────────────────────────────
    const expiresAt = new Date()
    if (isAnnual) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30)
    }

    // Usar .select() para verificar que el update afectó filas
    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from('therapist_profiles')
      .update({
        subscription_plan: 'pro',
        plan_expires_at:   expiresAt.toISOString(),
        billing_cycle:     billingCycle,
      })
      .eq('user_id', therapistId)
      .select('user_id, subscription_plan')

    if (updateError) throw new Error('Error activando plan: ' + updateError.message)

    if (!updatedRows || updatedRows.length === 0) {
      console.error(`[capture-subscription] WARN: No se actualizó therapist_profiles para user_id=${therapistId}. Verificando si el perfil existe...`)
      // Intentar insertar si no existe
      const { error: upsertError } = await supabaseAdmin
        .from('therapist_profiles')
        .upsert({
          user_id:           therapistId,
          subscription_plan: 'pro',
          plan_expires_at:   expiresAt.toISOString(),
          billing_cycle:     billingCycle,
        }, { onConflict: 'user_id' })
      if (upsertError) throw new Error('Error en upsert del plan: ' + upsertError.message)
    }

    console.log(`[capture-subscription] Plan Pro activado: user_id=${therapistId}, rows=${updatedRows?.length ?? 0}`)

    // ── Registrar pago ────────────────────────────────────────────────────
    if (pendingPayment?.id) {
      await supabaseAdmin
        .from('subscription_payments')
        .update({
          status:            'completed',
          paypal_capture_id: captureId,
          amount_usd:        amountPaid,
          billing_cycle:     billingCycle,
          period_end:        expiresAt.toISOString(),
        })
        .eq('id', pendingPayment.id)
    } else {
      // Si no había registro previo, insertar uno nuevo
      const periodStart = new Date()
      await supabaseAdmin.from('subscription_payments').insert({
        therapist_id:      therapistId,
        plan:              'pro',
        amount_usd:        amountPaid,
        billing_cycle:     billingCycle,
        paypal_order_id:   orderId,
        paypal_capture_id: captureId,
        status:            'completed',
        period_start:      periodStart.toISOString(),
        period_end:        expiresAt.toISOString(),
      }).then()
    }

    console.log(`[capture-subscription] Plan Pro activado para therapist ${therapistId}`)

    // ── Enviar email de confirmación ──────────────────────────────────────────
    try {
      const { data: therapistAuth } = await supabaseAdmin.auth.admin.getUserById(therapistId)
      const { data: therapistProfile } = await supabaseAdmin
        .from('profiles').select('full_name').eq('id', therapistId).single()

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
      // El email falla silenciosamente — no bloquea la activación del plan
      console.error('[capture-subscription] Email error:', emailErr)
    }

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
