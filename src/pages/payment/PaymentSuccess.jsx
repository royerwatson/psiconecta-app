/**
 * PaymentSuccess — Confirmación de pago con resumen de la cita.
 *
 * Recibe ?session=<id> desde el flujo de PayPal (PayPalButton → onSuccess).
 * Muestra los datos de la sesión, cuánto falta, y permite añadirla al
 * calendario del paciente (.ics — funciona con Google Calendar, Apple
 * Calendar y Outlook). Sin parámetro, muestra la confirmación genérica.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { CheckCircle2, CalendarPlus, Video, Clock } from 'lucide-react'

function formatDateLong(iso) {
  return new Date(iso).toLocaleDateString('es-DO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function daysUntil(iso) {
  const diff = new Date(iso).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  return Math.round(diff / 86400000)
}

/** Genera y descarga un archivo .ics con la cita */
function downloadIcs(session) {
  const start = new Date(session.scheduled_at)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const therapistName = session.therapist?.full_name ?? 'tu terapeuta'

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Psiconecta//ES',
    'BEGIN:VEVENT',
    `UID:psiconecta-${session.id}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Sesión de terapia con ${therapistName} — Psiconecta`,
    'DESCRIPTION:Tu sesión por videollamada. Únete desde psiconecta.app → Mis citas.',
    'LOCATION:https://psiconecta.app/patient/appointments',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Tu sesión de Psiconecta comienza en 30 minutos',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sesion-psiconecta.ics'
  a.click()
  URL.revokeObjectURL(url)
}

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const sessionId = params.get('session')
  const [session, setSession] = useState(null)

  useEffect(() => {
    if (!sessionId) return
    supabase
      .from('sessions')
      .select(`
        id, scheduled_at, price, is_urgent,
        therapist:profiles!sessions_therapist_id_fkey(full_name, avatar_url)
      `)
      .eq('id', sessionId)
      .single()
      .then(({ data }) => setSession(data))
  }, [sessionId])

  const days = session ? daysUntil(session.scheduled_at) : null
  const countdown =
    days === 0 ? '¡Es hoy!'
    : days === 1 ? 'Es mañana'
    : days > 1 ? `Faltan ${days} días`
    : null

  return (
    <div className="min-h-dvh bg-psiconecta flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-float p-8 sm:p-10 text-center">

          {/* Check animado */}
          <div className="hero-reveal hero-reveal-1 w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={42} strokeWidth={1.6} className="text-emerald-500" />
          </div>

          <h2 className="hero-reveal hero-reveal-1 text-2xl font-bold text-warm-900 dark:text-white mb-2">
            ¡Tu cita está confirmada!
          </h2>
          <p className="hero-reveal hero-reveal-2 text-warm-500 dark:text-slate-400 text-sm mb-7">
            Te enviamos los detalles por correo y te recordaremos antes de la sesión.
          </p>

          {/* Resumen de la cita */}
          {session && (
            <div className="hero-reveal hero-reveal-3 rounded-2xl border border-warm-100 dark:border-slate-700 bg-warm-50 dark:bg-slate-900/40 p-5 mb-6 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-brand flex items-center justify-center shrink-0">
                  <Video size={18} strokeWidth={1.8} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-warm-900 dark:text-white text-sm truncate">
                    Sesión con {session.therapist?.full_name ?? 'tu terapeuta'}
                  </p>
                  <p className="text-xs text-warm-500 dark:text-slate-400 capitalize">
                    {formatDateLong(session.scheduled_at)} · {formatTime(session.scheduled_at)}
                  </p>
                </div>
              </div>
              {countdown && (
                <div className="flex items-center gap-2 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 rounded-xl px-3 py-2">
                  <Clock size={13} strokeWidth={2} />
                  {countdown}
                </div>
              )}
            </div>
          )}

          <div className="hero-reveal hero-reveal-4 flex flex-col gap-3">
            {session && (
              <Button fullWidth onClick={() => downloadIcs(session)}>
                <CalendarPlus size={16} strokeWidth={1.8} className="mr-2" />
                Añadir a mi calendario
              </Button>
            )}
            <Button variant={session ? 'secondary' : 'primary'} fullWidth onClick={() => navigate('/patient/appointments')}>
              Ver mis citas
            </Button>
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="text-sm text-warm-400 dark:text-slate-500 hover:text-warm-600 transition-colors py-1"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
