import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APP_ORIGIN = Deno.env.get('APP_URL') ?? 'https://psiconecta-app.vercel.app'

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    // Autenticar usuario con anon key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { therapistId, scheduledAt, isUrgent, priceBase, therapistName, creditUsed } = await req.json()
    if (!therapistId || !scheduledAt || priceBase == null || creditUsed == null) {
      throw new Error('Faltan campos requeridos')
    }

    const finalPrice   = +(priceBase * (isUrgent ? 1.3 : 1)).toFixed(2)
    const creditAmount = +Math.min(creditUsed, finalPrice).toFixed(2)

    if (creditAmount < finalPrice) {
      throw new Error('Crédito insuficiente para cubrir la sesión')
    }

    // Admin client con service role para operaciones privilegiadas
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Obtener comisión del terapeuta
    const { data: tp } = await admin
      .from('therapist_profiles')
      .select('commission_rate, subscription_plan')
      .eq('user_id', therapistId)
      .single()

    const commissionRate      = tp?.commission_rate ?? 0.20
    const platformCommission  = +(finalPrice * commissionRate).toFixed(2)
    const therapistNet        = +(finalPrice - platformCommission).toFixed(2)

    // 2. Crear sesión directamente como scheduled (sin PayPal)
    const { data: session, error: sessionError } = await admin
      .from('sessions')
      .insert({
        therapist_id:        therapistId,
        patient_id:          user.id,
        scheduled_at:        scheduledAt,
        status:              'scheduled',
        price:               finalPrice,
        is_urgent:           isUrgent ?? false,
        duration:            60,
        commission_rate:     commissionRate,
        platform_commission: platformCommission,
        therapist_net:       therapistNet,
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      throw new Error('Error creando sesión: ' + sessionError?.message)
    }

    // 3. Descontar crédito de patient_credits (filas más antiguas primero)
    const now = new Date().toISOString()
    const { data: credits, error: creditsError } = await admin
      .from('patient_credits')
      .select('id, amount_usd, expires_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (creditsError) throw new Error('Error leyendo créditos: ' + creditsError.message)

    let remaining = creditAmount
    for (const credit of (credits ?? [])) {
      if (remaining <= 0) break
      // Ignorar créditos vencidos
      if (credit.expires_at && credit.expires_at <= now) continue

      const rowAmount = parseFloat(credit.amount_usd)
      const deduct    = Math.min(remaining, rowAmount)
      const newAmount = +(rowAmount - deduct).toFixed(2)
      remaining = +(remaining - deduct).toFixed(2)

      if (newAmount <= 0) {
        // Fila completamente usada — eliminar
        await admin.from('patient_credits').delete().eq('id', credit.id)
      } else {
        // Fila parcialmente usada — actualizar
        await admin.from('patient_credits').update({ amount_usd: newAmount }).eq('id', credit.id)
      }
    }

    if (remaining > 0.01) {
      // No había suficiente crédito — rollback eliminando la sesión
      await admin.from('sessions').delete().eq('id', session.id)
      throw new Error('Crédito insuficiente al intentar descontar')
    }

    return new Response(
      JSON.stringify({ bookingId: session.id }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[confirm-credit-booking]', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
