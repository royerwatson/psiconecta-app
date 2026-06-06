/**
 * notify-reschedule
 * Envía email a paciente y terapeuta cuando se reagenda una sesión.
 * Body: { sessionId, oldScheduledAt }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, rescheduleEmail } from '../_shared/email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error } = await supabaseUser.auth.getUser()
    if (error || !user) throw new Error('No autorizado')

    const { sessionId, oldScheduledAt } = await req.json()
    if (!sessionId || !oldScheduledAt) throw new Error('Faltan sessionId u oldScheduledAt')

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

    const oldDate = fmtDate(oldScheduledAt)
    const oldTime = fmtTime(oldScheduledAt)
    const newDate = fmtDate(session.scheduled_at)
    const newTime = fmtTime(session.scheduled_at)

    const [patientAuth, therapistAuth] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(session.patient?.id),
      supabaseAdmin.auth.admin.getUserById(session.therapist?.id),
    ])

    const sends: Promise<any>[] = []

    if (patientAuth.data?.user?.email) {
      sends.push(sendEmail({
        to: patientAuth.data.user.email,
        subject: 'Tu sesión en Psiconecta fue reagendada',
        html: rescheduleEmail({
          recipientName:   session.patient?.full_name ?? 'Paciente',
          otherPersonName: session.therapist?.full_name ?? 'Terapeuta',
          role: 'patient', oldDate, oldTime, newDate, newTime,
        }),
      }))
    }

    if (therapistAuth.data?.user?.email) {
      sends.push(sendEmail({
        to: therapistAuth.data.user.email,
        subject: 'Una sesión fue reagendada en Psiconecta',
        html: rescheduleEmail({
          recipientName:   session.therapist?.full_name ?? 'Terapeuta',
          otherPersonName: session.patient?.full_name ?? 'Paciente',
          role: 'therapist', oldDate, oldTime, newDate, newTime,
        }),
      }))
    }

    await Promise.all(sends)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[notify-reschedule]', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
