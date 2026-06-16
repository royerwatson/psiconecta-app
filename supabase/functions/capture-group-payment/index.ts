import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

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
  if (!data.access_token) throw new Error('No se pudo obtener token de PayPal')
  return data.access_token
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { orderId, groupSessionId } = await req.json()
    if (!orderId || !groupSessionId) throw new Error('Faltan orderId y/o groupSessionId')

    // Capturar pago en PayPal
    const baseUrl = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
    const token   = await getPayPalAccessToken()

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    const capture = await captureRes.json()

    if (capture.status !== 'COMPLETED') {
      throw new Error('Pago no completado: ' + (capture.details?.[0]?.description ?? capture.status))
    }

    const captureUnit = capture.purchase_units?.[0]
    if (captureUnit?.reference_id !== groupSessionId) throw new Error('La orden no coincide con la sesión grupal')

    const captureId   = captureUnit?.payments?.captures?.[0]?.id
    const amountPaid  = Number(captureUnit?.payments?.captures?.[0]?.amount?.value ?? 0)

    // Leer custom_id para recuperar comisiones calculadas en create-group-order
    let platformFee = 0
    let therapistNet = amountPaid
    try {
      const customData = JSON.parse(captureUnit?.payments?.captures?.[0]?.custom_id ?? '{}')
      platformFee  = customData.platformFee  ?? 0
      therapistNet = customData.therapistNet ?? amountPaid
    } catch (_) {}

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Insertar participante con pago confirmado
    const { error: insertError } = await supabaseAdmin
      .from('group_session_participants')
      .insert({
        group_session_id:  groupSessionId,
        patient_id:        user.id,
        paid:              true,
        amount_paid:       amountPaid,
        platform_fee:      platformFee,
        therapist_net:     therapistNet,
        payment_intent_id: captureId ?? orderId,
        paid_at:           new Date().toISOString(),
      })

    if (insertError) {
      // Si ya existe (race condition), actualizar el pago
      if (insertError.code === '23505') {
        await supabaseAdmin
          .from('group_session_participants')
          .update({
            paid:              true,
            amount_paid:       amountPaid,
            platform_fee:      platformFee,
            therapist_net:     therapistNet,
            payment_intent_id: captureId ?? orderId,
            paid_at:           new Date().toISOString(),
          })
          .eq('group_session_id', groupSessionId)
          .eq('patient_id', user.id)
      } else {
        throw new Error('Error registrando participante: ' + insertError.message)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.warn('[capture-group-payment]', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
