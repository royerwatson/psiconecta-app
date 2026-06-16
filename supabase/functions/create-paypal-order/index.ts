import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit } from '../_shared/rateLimit.ts'

const APP_ORIGIN = Deno.env.get('APP_URL') ?? 'https://psiconecta-app.vercel.app'

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  // Allow app origin and localhost for development
  const allowed = origin === APP_ORIGIN
    || origin.startsWith('http://localhost')
    || origin.startsWith('https://localhost')
  return {
    'Access-Control-Allow-Origin':  allowed ? origin : APP_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
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
    return new Response('ok', { headers: getCorsHeaders(req) })
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

    // Rate limiting: máx. 10 órdenes por usuario por hora
    const supabaseAdmin2 = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const rl = await checkRateLimit(supabaseAdmin2, user.id, {
      maxRequests: 10,
      windowSeconds: 3600,
      functionName: 'create-paypal-order',
      failOpen: false, // endpoint financiero: bloquear si falla la tabla
    })
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: 'Demasiadas peticiones. Intenta en unos minutos.' }),
        { status: 429, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Leer datos de la petición (priceBase viene del cliente solo como hint — se ignora)
    const { therapistId, scheduledAt, isUrgent, therapistName } = await req.json()
    if (!therapistId || !scheduledAt) throw new Error('Faltan campos requeridos')

    // Validar que la fecha es futura (al menos 30 min de margen)
    const scheduledMs = new Date(scheduledAt).getTime()
    if (isNaN(scheduledMs) || scheduledMs < Date.now() + 30 * 60 * 1000) {
      throw new Error('La fecha de la sesión debe ser en el futuro')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Obtener precio y comisión del terapeuta desde DB (nunca confiar en el cliente)
    const { data: therapistProfile, error: tpError } = await supabaseAdmin
      .from('therapist_profiles')
      .select('commission_rate, subscription_plan, price_per_session, verified, verification_status')
      .eq('user_id', therapistId)
      .single()

    if (tpError || !therapistProfile) throw new Error('Terapeuta no encontrado')
    if (!therapistProfile.verified || therapistProfile.verification_status !== 'verified') {
      throw new Error('El terapeuta no está habilitado para recibir citas')
    }

    const priceBase      = therapistProfile.price_per_session ?? 0
    const finalPrice     = +(priceBase * (isUrgent ? 1.3 : 1)).toFixed(2)
    const commissionRate  = therapistProfile?.commission_rate ?? 0.20
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
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
