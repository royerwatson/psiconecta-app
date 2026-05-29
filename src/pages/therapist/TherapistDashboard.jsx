import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card, { StatCard } from '@/components/ui/Card'
import Badge, { VerificationBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { formatSessionDate, formatPrice, canStartVideo } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'

export default function TherapistDashboard() {
  const { profile, user } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [stats, setStats]       = useState({ today: 0, week: 0, patients: 0, earnings: 0 })
  const [alerts, setAlerts]     = useState([])
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      // Próximas sesiones
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select(`
          *,
          patient:profiles!sessions_patient_id_fkey(id, full_name, avatar_url)
        `)
        .eq('therapist_id', user.id)
        .in('status', ['scheduled', 'in_progress'])
        .gte('scheduled_at', new Date(Date.now() - 90 * 60 * 1000).toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5)

      // Estadísticas
      const { count: todayCount } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .eq('therapist_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', today + 'T00:00:00')
        .lt('scheduled_at', today + 'T23:59:59')

      const { count: patientsCount } = await supabase
        .from('sessions')
        .select('patient_id', { count: 'exact' })
        .eq('therapist_id', user.id)
        .eq('status', 'completed')

      // Alertas de IA (check-ins de riesgo)
      const { data: alertsData } = await supabase
        .from('ai_checkins')
        .select('*, patient:profiles!ai_checkins_patient_id_fkey(full_name)')
        .eq('therapist_id', user.id)
        .eq('risk_level', 'high')
        .eq('notified', false)
        .order('created_at', { ascending: false })
        .limit(3)

      setSessions(sessionsData ?? [])
      setStats({
        today:    todayCount ?? 0,
        week:     (sessionsData ?? []).length,
        patients: patientsCount ?? 0,
        earnings: (sessionsData ?? []).reduce((acc, s) => acc + (s.price ?? 0), 0),
      })
      setAlerts(alertsData ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const therapist = profile?.therapist_profiles

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Bienvenida */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">
            Buenos días, {profile?.full_name?.split(' ')[0]} 👋
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
          <span className="text-xl">⏳</span>
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

      {/* Alertas IA de riesgo */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="font-semibold text-red-800 text-sm mb-3 flex items-center gap-2">
            🚨 Alertas de bienestar — Revisión urgente
          </p>
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between py-2 border-t border-red-100 first:border-0">
              <div className="flex items-center gap-2">
                <Avatar name={alert.patient?.full_name ?? ''} size="xs" />
                <span className="text-sm text-red-700 font-medium">{alert.patient?.full_name}</span>
              </div>
              <Button size="sm" variant="danger" onClick={() => navigate(`/therapist/patients/${alert.patient_id}`)}>
                Ver paciente
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Hoy" value={stats.today} subtitle="sesiones programadas" icon="📅" color="primary" />
        <StatCard title="Esta semana" value={stats.week} subtitle="próximas citas" icon="📆" color="calm" />
        <StatCard title="Pacientes" value={stats.patients} subtitle="atendidos en total" icon="👥" color="success" />
        <StatCard title="Ingresos" value={formatPrice(stats.earnings)} subtitle="sesiones próximas" icon="💰" color="warning" />
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
            <div className="text-4xl mb-2">📅</div>
            <p className="text-warm-600 font-medium">No tienes sesiones programadas</p>
            <p className="text-warm-400 text-sm mt-1">Actualiza tu disponibilidad para recibir citas</p>
            <Button size="sm" className="mt-4" onClick={() => navigate('/therapist/schedule')}>
              Gestionar agenda
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onStart={() => navigate(`/video-call/${session.id}`)}
                onView={() => navigate(`/therapist/session/${session.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="font-serif text-lg font-semibold text-warm-900 mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '👥', label: 'Mis pacientes', to: '/therapist/patients' },
            { icon: '📋', label: 'Historial clínico', to: '/therapist/patients' },
            { icon: '📅', label: 'Mi agenda', to: '/therapist/schedule' },
            { icon: '⭐', label: 'Mis reseñas', to: '/therapist/profile' },
          ].map(({ icon, label, to }) => (
            <Card key={label} hover padding className="flex flex-col items-center gap-2 py-5 text-center"
              onClick={() => navigate(to)}>
              <span className="text-2xl">{icon}</span>
              <span className="text-sm font-medium text-warm-700">{label}</span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function SessionCard({ session, onStart, onView }) {
  const canVideo = canStartVideo(session.scheduled_at)
  return (
    <Card className="flex items-center gap-4">
      <Avatar name={session.patient?.full_name ?? ''} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-warm-900 truncate">{session.patient?.full_name}</p>
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
          <Button size="sm" variant="calm" onClick={onStart}>
            📹 Iniciar
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={onView}>
          Ver detalle
        </Button>
      </div>
    </Card>
  )
}
