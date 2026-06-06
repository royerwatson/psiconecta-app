import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, cancellationEmail } from '../_shared/email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://psiconecta.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { sessionId, reason } = await req.json()
    if (!sessionId) throw new Error('Falta sessionId')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select(`
        scheduled_at,
        patient:profiles!sessions_patient_id_fkey(id, full_name),
        therapist:profiles!sessions_therapist_id_fkey(id, full_name)
      `)
      .eq('id', sessionId)
      .single()

    if (!session) throw new Error('Sesión no encontrada')

    const date = formatDate(session.scheduled_at)
    const time = formatTime(session.scheduled_at)

    // Obtener emails reales
    const { data: patientAuth }   = await supabaseAdmin.auth.admin.getUserById(session.patient?.id)
    const { data: therapistAuth } = await supabaseAdmin.auth.admin.getUserById(session.therapist?.id)

    const sends = []

    if (patientAuth?.user?.email) {
      sends.push(sendEmail({
        to: patientAuth.user.email,
        subject: 'Sesión cancelada en Psiconecta',
        html: cancellationEmail({
          recipientName:  session.patient?.full_name ?? 'Paciente',
          otherPersonName: session.therapist?.full_name ?? 'Terapeuta',
          role: 'patient', date, time,
        }),
      }))
    }

    if (therapistAuth?.user?.email) {
      sends.push(sendEmail({
        to: therapistAuth.user.email,
        subject: 'Una sesión ha sido cancelada',
        html: cancellationEmail({
          recipientName:   session.therapist?.full_name ?? 'Terapeuta',
          otherPersonName: session.patient?.full_name ?? 'Paciente',
          role: 'therapist', date, time,
          reason: reason ?? undefined,
        }),
      }))
    }

    await Promise.all(sends)

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
