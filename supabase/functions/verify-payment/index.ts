import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { getCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Autenticar al usuario
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { bookingId, stripeSessionId } = await req.json()
    if (!bookingId || !stripeSessionId) throw new Error('Missing fields')

    // Verificar el pago con Stripe (server-side, seguro)
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    })

    const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId)

    if (checkoutSession.payment_status !== 'paid') {
      throw new Error('Payment not completed')
    }

    // Verificar que el booking pertenece al usuario
    if (checkoutSession.metadata?.patient_id !== user.id) {
      throw new Error('Booking does not belong to this user')
    }

    // Actualizar el estado de la sesión a 'scheduled'
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        status: 'scheduled',
        payment_intent_id: checkoutSession.payment_intent as string,
        paid_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('patient_id', user.id)

    if (updateError) throw new Error('Error updating session: ' + updateError.message)

    return new Response(
      JSON.stringify({ success: true }),
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
