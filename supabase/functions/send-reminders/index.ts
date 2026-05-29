import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, reminderEmail } from '../_shared/email.ts'

// Esta función se ejecuta diariamente (configurar en Supabase como cron job)
// Busca sesiones programadas para las próximas 24-25 horas y envía recordatorios

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
  // Verificar que la petición viene de Supabase (cron job) o tiene autorización
  const authHeader = req.headers.get('Authorization')
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Sesiones en las próximas 24-25 horas
    const from = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()
    const to   = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()

    const { data: sessions } = await supabaseAdmin
      .from('sessions')
      .select(`
        id, scheduled_at,
        patient:profiles!sessions_patient_id_fkey(id, full_name),
        therapist:profiles!sessions_therapist_id_fkey(id, full_name)
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', from)
      .lte('scheduled_at', to)

    if (!sessions?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    let sent = 0

    for (const session of sessions) {
      const date = formatDate(session.scheduled_at)
      const time = formatTime(session.scheduled_at)

      const [patientAuth, therapistAuth] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(session.patient?.id),
        supabaseAdmin.auth.admin.getUserById(session.therapist?.id),
      ])

      const emails = []

      if (patientAuth.data?.user?.email) {
        emails.push(sendEmail({
          to: patientAuth.data.user.email,
          subject: '⏰ Recordatorio: tienes una sesión mañana',
          html: reminderEmail({
            recipientName:  session.patient?.full_name ?? 'Paciente',
            otherPersonName: session.therapist?.full_name ?? 'Terapeuta',
            role: 'patient', date, time,
          }),
        }))
      }

      if (therapistAuth.data?.user?.email) {
        emails.push(sendEmail({
          to: therapistAuth.data.user.email,
          subject: '⏰ Recordatorio: tienes una sesión mañana',
          html: reminderEmail({
            recipientName:  session.therapist?.full_name ?? 'Terapeuta',
            otherPersonName: session.patient?.full_name ?? 'Paciente',
            role: 'therapist', date, time,
          }),
        }))
      }

      await Promise.all(emails)
      sent += emails.length
    }

    console.log(`Recordatorios enviados: ${sent}`)
    return new Response(JSON.stringify({ sent }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
