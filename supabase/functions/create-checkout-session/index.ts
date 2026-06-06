import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://psiconecta.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Autenticar al usuario via JWT de Supabase
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Leer el cuerpo de la petición
    const { therapistId, scheduledAt, isUrgent, priceBase, therapistName } = await req.json()

    if (!therapistId || !scheduledAt || priceBase == null) {
      throw new Error('Missing required fields')
    }

    // Calcular precio final (en centavos USD)
    const finalPrice = Math.round(priceBase * (isUrgent ? 1.3 : 1))
    const priceInCents = finalPrice * 100 // Stripe usa centavos

    // Crear la sesión en Supabase con status 'payment_pending'
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        therapist_id: therapistId,
        patient_id: user.id,
        scheduled_at: scheduledAt,
        status: 'payment_pending',
        price: finalPrice,
        is_urgent: isUrgent ?? false,
        duration: 60,
      })
      .select('id')
      .single()

    if (sessionError || !session) throw new Error('Error creating session: ' + sessionError?.message)

    // Crear Stripe Checkout Session
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    })

    const appUrl = Deno.env.get('APP_URL') ?? 'https://psiconecta-app.vercel.app'

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: priceInCents,
            product_data: {
              name: `Sesión con ${therapistName}`,
              description: isUrgent
                ? `Cita urgente el ${new Date(scheduledAt).toLocaleDateString('es-ES', { dateStyle: 'full' })} — Incluye cargo del 30% por urgencia`
                : `Cita el ${new Date(scheduledAt).toLocaleDateString('es-ES', { dateStyle: 'full' })}`,
              images: ['https://psiconecta-app.vercel.app/psiconecta-og.png'],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: session.id,
        patient_id: user.id,
        therapist_id: therapistId,
      },
      success_url: `${appUrl}/payment/success?booking_id=${session.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancel?booking_id=${session.id}`,
    })

    return new Response(
      JSON.stringify({ url: checkoutSession.url, bookingId: session.id }),
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
