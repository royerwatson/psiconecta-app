/**
 * Dashboard principal del terapeuta.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card, { StatCard } from '@/components/ui/Card'
import Badge, { VerificationBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { formatSessionDate, formatPrice, canStartVideo, getGreeting, getDisplayName } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import CompletedTestsSection from '@/components/psychometrics/CompletedTestsSection'
import {
  Calendar, Users, DollarSign, Bot, MessageCircle,
  Clock, Star, Video, ClipboardList, Pencil, AlertTriangle,
  ChevronDown, ChevronUp,
} from 'lucide-react'

const QUICK_LINKS = [
  { Icon: Users,         label: 'Mis pacientes',     to: '/therapist/patients'  },
  { Icon: ClipboardList, label: 'Historial clínico',  to: '/therapist/patients'  },
  { Icon: Calendar,      label: 'Mi agenda',          to: '/therapist/schedule'  },
  { Icon: Star,          label: 'Mis reseñas',        to: '/therapist/profile'   },
]

export default function TherapistDashboard() {
  const { profile, user } = useAuthStore()
  const [sessions, setSessions]     = useState([])
  const [stats, setStats]           = useState({ today: 0, week: 0, patients: 0, earnings: 0 })
  const [alerts, setAlerts]         = useState([])
  const [expandedAlert, setExpandedAlert] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: sessionsData } = await supabase
        .from('sessions')
        .select(`*, patient:profiles!sessions_patient_id_fkey(id, full_name, avatar_url, is_anonymous)`)
        .eq('therapist_id', user.id)
        .in('status', ['scheduled', 'in_progress'])
        .gte('scheduled_at', new Date(Date.now() - 90 * 60 * 1000).toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5)

      const { count: todayCount } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .eq('therapist_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', today + 'T00:00:00')
        .lt('scheduled_at', today + 'T23:59:59')

      // COUNT DISTINCT patient_id para no contar duplicados
      const { data: patientsRaw } = await supabase
        .from('sessions')
        .select('patient_id')
        .eq('therapist_id', user.id)
        .eq('status', 'completed')
      const patientsCount = new Set((patientsRaw ?? []).map(r => r.patient_id)).size

      const { data: alertsData } = await supabase
        .from('ai_checkins')
        .select('*, patient:profiles!ai_checkins_patient_id_fkey(id, full_name, avatar_url)')
        .eq('therapist_id', user.id)
        .in('risk_level', ['high', 'medium'])
        .order('created_at', { ascending: false })
        .limit(5)

      // Ingresos del mes actual (sesiones completadas)
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
      const { data: completedThisMonth } = await supabase
        .from('sessions')
        .select('therapist_net, price')
        .eq('therapist_id', user.id)
        .eq('status', 'completed')
        .gte('scheduled_at', monthStart.toISOString())
      const monthEarnings = (completedThisMonth ?? []).reduce((acc, s) => acc + (s.therapist_net ?? s.price ?? 0), 0)

      setSessions(sessionsData ?? [])
      setStats({
        today:    todayCount ?? 0,
        week:     (sessionsData ?? []).length,
        patients: patientsCount ?? 0,
        earnings: monthEarnings,
      })
      setAlerts(alertsData ?? [])
    } catch (err) {
      console.error('Error cargando dashboard terapeuta:', err)
      setError('No pudimos cargar tu información. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  const therapist = profile?.therapist_profiles?.[0]

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle size={48} className="text-amber-400" />
        <p className="font-medium text-warm-800">{error}</p>
        <Button onClick={fetchData} size="sm">Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Bienvenida */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">
            {getGreeting()}, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-warm-500 text-sm mt-1">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {therapist && (
          <VerificationBadge status={therapist.verification_status ?? 'pending'} />
        )}
      </div>

      {/* Alerta verificación pendiente */}
      {therapist?.verification_status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
          <Clock size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 text-sm">Verificación en proceso</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Estamos revisando tus credenciales. Esto puede tardar 24-48 horas.
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/therapist/profile')}>
            Ver estado
          </Button>
        </div>
      )}

      {/* Banner perfil incompleto */}
      {therapist && !therapist.bio && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex gap-3 items-center">
          <Pencil size={18} className="text-primary-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-primary-800 text-sm">Completa tu perfil</p>
            <p className="text-xs text-primary-600 mt-0.5">
              Los pacientes eligen a sus terapeutas basándose en tu bio y especialidades.
            </p>
          </div>
          <Button size="sm" onClick={() => navigate('/therapist/profile')}>Completar</Button>
        </div>
      )}

      {/* Check-ins IA de pacientes */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-warm-900">
              <Bot size={18} className="text-warm-500" /> Check-ins de bienestar
            </h2>
            <span className="text-xs text-warm-400">Últimas respuestas de tus pacientes</span>
          </div>

          {alerts.map((alert) => {
            const isHigh   = alert.risk_level === 'high'
            const isExp    = expandedAlert === alert.id
            const qa       = (alert.questions_answers ?? '')
              .split('\n').filter(Boolean)
              .map(line => { const i = line.indexOf(':'); return i === -1 ? { q: line, a: '' } : { q: line.slice(0, i).trim(), a: line.slice(i + 1).trim() } })

            return (
              <div key={alert.id}
                className={`rounded-2xl border ${
                  isHigh ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                }`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={alert.patient?.full_name ?? ''} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-warm-900">{alert.patient?.full_name}</p>
                          <p className="text-xs text-warm-500 mt-0.5">
                            {new Date(alert.created_at).toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}
                            {' — '}
                            {new Date(alert.created_at).toLocaleTimeString('es-DO', { timeStyle: 'short' })}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                          isHigh ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`} />
                          {isHigh ? 'Riesgo alto' : 'Riesgo medio'}
                        </span>
                      </div>

                      {alert.ai_message && (
                        <p className={`text-sm mt-2 leading-relaxed flex items-start gap-1.5 ${isHigh ? 'text-red-800' : 'text-amber-800'}`}>
                          <MessageCircle size={14} className="shrink-0 mt-0.5" />
                          {alert.ai_message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-current/10">
                    <button
                      onClick={() => setExpandedAlert(isExp ? null : alert.id)}
                      className={`flex-1 text-xs font-medium py-2 rounded-xl border transition-colors flex items-center justify-center gap-1 ${
                        isHigh
                          ? 'border-red-200 text-red-700 hover:bg-red-100'
                          : 'border-amber-200 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {isExp
                        ? <><ChevronUp size={13} /> Ocultar respuestas</>
                        : <><ChevronDown size={13} /> Ver {qa.length} respuestas</>}
                    </button>
                    <Button
                      size="sm"
                      variant={isHigh ? 'danger' : 'secondary'}
                      onClick={() => navigate(`/therapist/patients/${alert.patient?.id}`)}
                    >
                      Ver paciente →
                    </Button>
                  </div>
                </div>

                {isExp && qa.length > 0 && (
                  <div className={`border-t px-4 pb-4 pt-3 ${isHigh ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
                    <p className="text-xs font-semibold opacity-60 uppercase tracking-wider mb-3">
                      Respuestas del paciente
                    </p>
                    <div className="flex flex-col gap-2">
                      {qa.map((item, idx) => (
                        <div key={idx} className="bg-white/70 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-warm-500 mb-0.5">{item.q}</p>
                          <p className="text-sm font-semibold text-warm-800">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Hoy"         value={stats.today}              subtitle="sesiones programadas" icon={<Calendar size={18} />}  color="primary" />
        <StatCard title="Esta semana" value={stats.week}               subtitle="próximas citas"        icon={<Clock size={18} />}     color="calm"    />
        <StatCard title="Pacientes"   value={stats.patients}           subtitle="atendidos en total"    icon={<Users size={18} />}     color="success" />
        <StatCard title="Ingresos"    value={formatPrice(stats.earnings)} subtitle="este mes (completadas)" icon={<DollarSign size={18} />} color="warning" />
      </div>

      {/* Próximas sesiones */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold text-warm-900">Próximas sesiones</h2>
          <Button size="sm" variant="ghost" onClick={() => navigate('/therapist/schedule')}>
            Ver agenda →
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="text-center py-10">
            <Calendar size={40} className="text-warm-200 mx-auto mb-2" />
            <p className="text-warm-600 font-medium">No tienes sesiones programadas</p>
            <p className="text-warm-400 text-sm mt-1">Actualiza tu disponibilidad para recibir citas</p>
            <Button size="sm" className="mt-4" onClick={() => navigate('/therapist/schedule')}>
              Gestionar agenda
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 stagger">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onStart={() => navigate(`/video-call/${session.id}`)}
                onView={() => navigate(`/therapist/patients/${session.patient?.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="font-serif text-lg font-semibold text-warm-900 mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ Icon, label, to }) => (
            <Card key={label} hover padding className="flex flex-col items-center gap-2 py-5 text-center"
              onClick={() => navigate(to)}>
              <Icon size={22} className="text-primary-500" strokeWidth={1.8} />
              <span className="text-sm font-medium text-warm-700">{label}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Tests completados por pacientes */}
      <CompletedTestsSection therapistId={user?.id} />

    </div>
  )
}

function SessionCard({ session, onStart, onView }) {
  const canVideo = canStartVideo(session.scheduled_at)
  return (
    <Card className="flex items-center gap-4">
      <Avatar name={getDisplayName(session.patient)} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-warm-900 truncate">{getDisplayName(session.patient)}</p>
        <p className="text-sm text-warm-500">{formatSessionDate(session.scheduled_at)}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={session.is_urgent ? 'urgent' : 'primary'} dot>
            {session.is_urgent ? 'Urgente' : 'Sesión individual'}
          </Badge>
          <span className="text-xs text-warm-400">{formatPrice(session.price ?? 0)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        {canVideo && (
          <Button size="sm" variant="calm" onClick={onStart}
            className="flex items-center gap-1.5">
            <Video size={14} /> Iniciar
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={onView}>
          Ver detalle
        </Button>
      </div>
    </Card>
  )
}
