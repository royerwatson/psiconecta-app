import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, reminderEmail, subscriptionExpiryReminderEmail } from '../_shared/email.ts'
import { sendPushToUser } from '../_shared/push.ts'

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

    let sent = 0

    // ── Helper para enviar recordatorio a ambas partes ────────────────────────
    async function sendSessionReminder(session: any, label: string) {
      const date = formatDate(session.scheduled_at)
      const time = formatTime(session.scheduled_at)

      const [patientAuth, therapistAuth] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(session.patient?.id),
        supabaseAdmin.auth.admin.getUserById(session.therapist?.id),
      ])

      const emails: Promise<any>[] = []

      if (patientAuth.data?.user?.email) {
        emails.push(sendEmail({
          to: patientAuth.data.user.email,
          subject: `⏰ Recordatorio: tienes una sesión ${label}`,
          html: reminderEmail({
            recipientName:   session.patient?.full_name ?? 'Paciente',
            otherPersonName: session.therapist?.full_name ?? 'Terapeuta',
            role: 'patient', date, time,
          }),
        }))
      }

      if (therapistAuth.data?.user?.email) {
        emails.push(sendEmail({
          to: therapistAuth.data.user.email,
          subject: `⏰ Recordatorio: tienes una sesión ${label}`,
          html: reminderEmail({
            recipientName:   session.therapist?.full_name ?? 'Terapeuta',
            otherPersonName: session.patient?.full_name ?? 'Paciente',
            role: 'therapist', date, time,
          }),
        }))
      }

      await Promise.all(emails)
      sent += emails.length

      // Push nativa a ambas partes (best-effort)
      await Promise.all([
        sendPushToUser(supabaseAdmin, session.patient?.id, {
          title: `Sesión ${label}`,
          body: `Tu sesión con ${session.therapist?.full_name ?? 'tu terapeuta'} es el ${date} a las ${time}`,
          route: '/patient/appointments',
        }),
        sendPushToUser(supabaseAdmin, session.therapist?.id, {
          title: `Sesión ${label}`,
          body: `Tu sesión con ${session.patient?.full_name ?? 'tu paciente'} es el ${date} a las ${time}`,
          route: '/therapist/schedule',
        }),
      ])
    }

    // NOTA: el cron corre cada 15 min (migration_reminder_flags.sql).
    // Las banderas reminder_*_sent_at evitan envíos duplicados.

    // ── Recordatorios 24 horas antes ──────────────────────────────────────────
    const from24 = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()
    const to24   = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()

    const { data: sessions24 } = await supabaseAdmin
      .from('sessions')
      .select(`
        id, scheduled_at,
        patient:profiles!sessions_patient_id_fkey(id, full_name),
        therapist:profiles!sessions_therapist_id_fkey(id, full_name)
      `)
      .eq('status', 'scheduled')
      .is('reminder_24h_sent_at', null)
      .gte('scheduled_at', from24)
      .lte('scheduled_at', to24)

    for (const session of sessions24 ?? []) {
      await sendSessionReminder(session, 'mañana')
      await supabaseAdmin.from('sessions')
        .update({ reminder_24h_sent_at: new Date().toISOString() })
        .eq('id', session.id)
    }

    // ── Recordatorios 1 hora antes ────────────────────────────────────────────
    const from1h = new Date(Date.now() + 50 * 60 * 1000).toISOString()
    const to1h   = new Date(Date.now() + 70 * 60 * 1000).toISOString()

    const { data: sessions1h } = await supabaseAdmin
      .from('sessions')
      .select(`
        id, scheduled_at,
        patient:profiles!sessions_patient_id_fkey(id, full_name),
        therapist:profiles!sessions_therapist_id_fkey(id, full_name)
      `)
      .eq('status', 'scheduled')
      .is('reminder_1h_sent_at', null)
      .gte('scheduled_at', from1h)
      .lte('scheduled_at', to1h)

    for (const session of sessions1h ?? []) {
      await sendSessionReminder(session, 'en 1 hora')
      await supabaseAdmin.from('sessions')
        .update({ reminder_1h_sent_at: new Date().toISOString() })
        .eq('id', session.id)
    }

    // ── Recordatorio 30 minutos antes (solo push, con acceso directo a la sala) ─
    const from30 = new Date(Date.now() + 25 * 60 * 1000).toISOString()
    const to30   = new Date(Date.now() + 40 * 60 * 1000).toISOString()

    const { data: sessions30 } = await supabaseAdmin
      .from('sessions')
      .select(`
        id, scheduled_at,
        patient:profiles!sessions_patient_id_fkey(id, full_name),
        therapist:profiles!sessions_therapist_id_fkey(id, full_name)
      `)
      .eq('status', 'scheduled')
      .is('reminder_30m_sent_at', null)
      .gte('scheduled_at', from30)
      .lte('scheduled_at', to30)

    for (const session of sessions30 ?? []) {
      const t = formatTime(session.scheduled_at)
      await Promise.all([
        sendPushToUser(supabaseAdmin, session.therapist?.id, {
          title: 'Tu sesión comienza en 30 minutos',
          body: `Sesión con ${session.patient?.full_name ?? 'tu paciente'} a las ${t}. Toca para ir a la sala.`,
          route: `/video-call/${session.id}`,
        }),
        sendPushToUser(supabaseAdmin, session.patient?.id, {
          title: 'Tu sesión comienza en 30 minutos',
          body: `Sesión con ${session.therapist?.full_name ?? 'tu terapeuta'} a las ${t}. Toca para ir a la sala.`,
          route: `/video-call/${session.id}`,
        }),
      ])
      await supabaseAdmin.from('sessions')
        .update({ reminder_30m_sent_at: new Date().toISOString() })
        .eq('id', session.id)
      sent += 2
    }

    // ── Recordatorios de vencimiento de suscripción (7 días antes) ────────────
    const in7days     = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const in7daysFrom = new Date(in7days); in7daysFrom.setHours(0, 0, 0, 0)
    const in7daysTo   = new Date(in7days); in7daysTo.setHours(23, 59, 59, 999)

    const { data: expiringTherapists } = await supabaseAdmin
      .from('therapist_profiles')
      .select('user_id, plan_expires_at, profile:profiles!therapist_profiles_user_id_fkey(full_name)')
      .eq('subscription_plan', 'pro')
      .gte('plan_expires_at', in7daysFrom.toISOString())
      .lte('plan_expires_at', in7daysTo.toISOString())

    for (const t of expiringTherapists ?? []) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(t.user_id)
        if (!authUser?.user?.email) continue

        const daysLeft = Math.ceil(
          (new Date(t.plan_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )

        await sendEmail({
          to: authUser.user.email,
          subject: `Tu Plan Pro de Psiconecta vence en ${daysLeft} días`,
          html: subscriptionExpiryReminderEmail({
            therapistName: (t.profile as any)?.full_name ?? 'Terapeuta',
            expiresAt: t.plan_expires_at,
            daysLeft,
          }),
        })
        sent++
      } catch (err) {
        console.error(`Error enviando recordatorio de vencimiento a ${t.user_id}:`, err)
      }
    }

    // ── Downgrade automático de planes vencidos ───────────────────────────────
    const { data: expiredTherapists } = await supabaseAdmin
      .from('therapist_profiles')
      .select('user_id')
      .eq('subscription_plan', 'pro')
      .lt('plan_expires_at', new Date().toISOString())

    for (const t of expiredTherapists ?? []) {
      await supabaseAdmin.from('therapist_profiles').update({
        subscription_plan: 'basic',
        plan_expires_at:   null,
      }).eq('user_id', t.user_id)
      console.log(`Plan expirado → downgrade a basic: ${t.user_id}`)
    }

    console.log(`Recordatorios enviados: ${sent}`)
    return new Response(JSON.stringify({ sent, expired: expiredTherapists?.length ?? 0 }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
