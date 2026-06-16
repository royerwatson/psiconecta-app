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

    const { groupSessionId } = await req.json()
    if (!groupSessionId) throw new Error('Falta groupSessionId')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Obtener sesión grupal y datos del terapeuta
    const { data: group, error: groupError } = await supabaseAdmin
      .from('group_sessions')
      .select(`
        id, title, price, scheduled_at, max_participants, status,
        therapist:profiles!group_sessions_therapist_id_fkey(id, full_name),
        participants:group_session_participants(patient_id)
      `)
      .eq('id', groupSessionId)
      .single()

    if (groupError || !group) throw new Error('Sesión grupal no encontrada')
    if (group.status !== 'scheduled') throw new Error('Esta sesión ya no está disponible')

    // Verificar cupo
    const participantCount = group.participants?.length ?? 0
    if (participantCount >= (group.max_participants ?? 10)) throw new Error('La sesión está llena')

    // Verificar que no esté ya inscrito
    const alreadyIn = group.participants?.some((p: any) => p.patient_id === user.id)
    if (alreadyIn) throw new Error('Ya estás inscrito en esta sesión')

    // Obtener group_commission_rate del terapeuta
    const { data: tp } = await supabaseAdmin
      .from('therapist_profiles')
      .select('group_commission_rate, subscription_plan')
      .eq('user_id', group.therapist?.id)
      .single()

    const groupCommissionRate = tp?.group_commission_rate ?? 0.25
    const price = Number(group.price ?? 0)
    const platformFee   = +(price * groupCommissionRate).toFixed(2)
    const therapistNet  = +(price - platformFee).toFixed(2)

    if (price <= 0) throw new Error('Usa el flujo gratuito para sesiones sin costo')

    // Crear orden PayPal
    const baseUrl = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
    const token   = await getPayPalAccessToken()

    const sessionDate = new Date(group.scheduled_at).toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: groupSessionId,
          description:  `Psiconecta — Terapia grupal: ${group.title} el ${sessionDate}`,
          amount: { currency_code: 'USD', value: price.toFixed(2) },
          custom_id: JSON.stringify({
            groupSessionId,
            patientId:        user.id,
            groupCommissionRate,
            platformFee,
            therapistNet,
          }),
        }],
        application_context: {
          brand_name: 'Psiconecta',
          locale:     'es-DO',
          user_action: 'PAY_NOW',
        },
      }),
    })

    const order = await orderRes.json()
    if (!order.id) throw new Error('Error creando orden PayPal: ' + JSON.stringify(order))

    return new Response(
      JSON.stringify({ orderId: order.id, price, groupCommissionRate, platformFee, therapistNet }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.warn('[create-group-order]', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
