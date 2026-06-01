import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Obtener token de acceso de PayPal
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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Autenticar usuario
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Leer datos de la petición
    const { therapistId, scheduledAt, isUrgent, priceBase, therapistName } = await req.json()
    if (!therapistId || !scheduledAt || priceBase == null) throw new Error('Faltan campos requeridos')

    const finalPrice = +(priceBase * (isUrgent ? 1.3 : 1)).toFixed(2)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Obtener tasa de comisión del terapeuta según su plan
    const { data: therapistProfile } = await supabaseAdmin
      .from('therapist_profiles')
      .select('commission_rate, subscription_plan')
      .eq('user_id', therapistId)
      .single()

    const commissionRate  = therapistProfile?.commission_rate ?? 0.10
    const platformCommission = +(finalPrice * commissionRate).toFixed(2)
    const therapistNet       = +(finalPrice - platformCommission).toFixed(2)

    // Crear sesión en Supabase con status payment_pending
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        therapist_id:        therapistId,
        patient_id:          user.id,
        scheduled_at:        scheduledAt,
        status:              'payment_pending',
        price:               finalPrice,
        is_urgent:           isUrgent ?? false,
        duration:            60,
        commission_rate:     commissionRate,
        platform_commission: platformCommission,
        therapist_net:       therapistNet,
      })
      .select('id')
      .single()

    if (sessionError || !session) throw new Error('Error creando sesión: ' + sessionError?.message)

    // Crear orden de PayPal
    const baseUrl = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
    const token   = await getPayPalAccessToken()

    const sessionDate = new Date(scheduledAt).toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: session.id,
            description: `Psiconecta — Sesión con ${therapistName}${isUrgent ? ' (urgente)' : ''} el ${sessionDate}`,
            amount: {
              currency_code: 'USD',
              value: finalPrice.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'Psiconecta',
          locale: 'es-DO',
          user_action: 'PAY_NOW',
        },
      }),
    })

    const order = await orderRes.json()
    if (!order.id) throw new Error('Error creando orden PayPal: ' + JSON.stringify(order))

    return new Response(
      JSON.stringify({ orderId: order.id, bookingId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
