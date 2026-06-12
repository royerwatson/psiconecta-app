import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  sendEmail,
  bookingConfirmationPatient,
  bookingNotificationTherapist,
} from '../_shared/email.ts'

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
  if (!data.access_token) throw new Error('No se pudo obtener el token de PayPal')
  return data.access_token
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-DO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-DO', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    const { orderId, bookingId } = await req.json()
    if (!orderId || !bookingId) throw new Error('Faltan orderId y/o bookingId')

    // Capturar pago en PayPal
    const baseUrl = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
    const token   = await getPayPalAccessToken()

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    const capture = await captureRes.json()

    if (capture.status !== 'COMPLETED') {
      throw new Error('El pago no fue completado: ' + (capture.details?.[0]?.description ?? capture.status))
    }

    const captureUnit = capture.purchase_units?.[0]
    if (captureUnit?.reference_id !== bookingId) throw new Error('La orden no coincide con la sesión')
    const captureId = captureUnit?.payments?.captures?.[0]?.id

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Actualizar sesión a 'scheduled'
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({ status: 'scheduled', payment_intent_id: captureId ?? orderId, paid_at: new Date().toISOString() })
      .eq('id', bookingId)
      .eq('patient_id', user.id)

    if (updateError) throw new Error('Error actualizando sesión: ' + updateError.message)

    // Obtener datos completos para los emails
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select(`
        scheduled_at, price, is_urgent,
        patient:profiles!sessions_patient_id_fkey(full_name, email:id),
        therapist:profiles!sessions_therapist_id_fkey(full_name, email:id)
      `)
      .eq('id', bookingId)
      .single()

    // Obtener emails reales desde auth.users
    if (session) {
      const { data: patientAuth }   = await supabaseAdmin.auth.admin.getUserById(session.patient?.email)
      const { data: therapistAuth } = await supabaseAdmin.auth.admin.getUserById(session.therapist?.email)

      const patientEmail   = patientAuth?.user?.email
      const therapistEmail = therapistAuth?.user?.email
      const date = formatDate(session.scheduled_at)
      const time = formatTime(session.scheduled_at)

      // Email al paciente
      if (patientEmail) {
        await sendEmail({
          to: patientEmail,
          subject: '✅ Tu cita en Psiconecta está confirmada',
          html: bookingConfirmationPatient({
            patientName:   session.patient?.full_name ?? 'Paciente',
            therapistName: session.therapist?.full_name ?? 'Terapeuta',
            date, time,
            price:    session.price,
            isUrgent: session.is_urgent,
          }),
        })
      }

      // Email al terapeuta
      if (therapistEmail) {
        await sendEmail({
          to: therapistEmail,
          subject: '📅 Nueva cita agendada en Psiconecta',
          html: bookingNotificationTherapist({
            therapistName: session.therapist?.full_name ?? 'Terapeuta',
            patientName:   session.patient?.full_name ?? 'Paciente',
            date, time,
            price:    session.price,
            isUrgent: session.is_urgent,
          }),
        })
      }
    }

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
