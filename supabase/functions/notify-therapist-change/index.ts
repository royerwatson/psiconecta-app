import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import {
  sendEmail,
  therapistChangedPatientEmail,
  therapistChangedNotifyEmail,
} from '../_shared/email.ts'
import { format } from 'https://esm.sh/date-fns@3/format'
import { parseISO } from 'https://esm.sh/date-fns@3/parseISO'
import { es } from 'https://esm.sh/date-fns@3/locale/es'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { sessionId, oldTherapistId, newTherapistId } = await req.json()

    if (!sessionId || !oldTherapistId || !newTherapistId) {
      return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400, headers: corsHeaders })
    }

    // Obtener datos de la sesión
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('scheduled_at, patient_id')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404, headers: corsHeaders })
    }

    // Obtener emails y nombres de los involucrados
    const [
      { data: { user: patientAuthUser } },
      { data: { user: oldTherapistAuthUser } },
      { data: { user: newTherapistAuthUser } },
    ] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(session.patient_id),
      supabaseAdmin.auth.admin.getUserById(oldTherapistId),
      supabaseAdmin.auth.admin.getUserById(newTherapistId),
    ])

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', [session.patient_id, oldTherapistId, newTherapistId])

    const getName = (id: string) => profiles?.find(p => p.id === id)?.full_name ?? 'Usuario'

    const patientName      = getName(session.patient_id)
    const oldTherapistName = getName(oldTherapistId)
    const newTherapistName = getName(newTherapistId)

    const dt   = parseISO(session.scheduled_at)
    const date = format(dt, "EEEE d 'de' MMMM yyyy", { locale: es })
    const time = format(dt, 'hh:mm a')

    // Enviar los 3 emails en paralelo (best-effort)
    await Promise.allSettled([
      // Al paciente
      patientAuthUser?.email && sendEmail({
        to: patientAuthUser.email,
        subject: '🔄 Cambio de terapeuta confirmado — Psiconecta',
        html: therapistChangedPatientEmail({ patientName, oldTherapistName, newTherapistName, date, time }),
      }),

      // Al terapeuta anterior (le quitamos la sesión)
      oldTherapistAuthUser?.email && sendEmail({
        to: oldTherapistAuthUser.email,
        subject: 'Sesión reasignada — Psiconecta',
        html: therapistChangedNotifyEmail({ therapistName: oldTherapistName, patientName, date, time, isNew: false }),
      }),

      // Al nuevo terapeuta (le llega la sesión)
      newTherapistAuthUser?.email && sendEmail({
        to: newTherapistAuthUser.email,
        subject: '📅 Nueva sesión asignada — Psiconecta',
        html: therapistChangedNotifyEmail({ therapistName: newTherapistName, patientName, date, time, isNew: true }),
      }),
    ])

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('notify-therapist-change error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
