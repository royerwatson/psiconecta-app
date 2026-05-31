import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Spinner'
import {
  Calendar, CheckCircle2, XCircle, GraduationCap, Ban,
  User, Stethoscope, Star, Bot, ClipboardList, Pin, RefreshCw, Inbox,
} from 'lucide-react'

// ─── Config de eventos ────────────────────────────────────────────────────────

const EVENT_TYPES = {
  session_scheduled:  { Icon: Calendar,       color: 'bg-blue-100 text-blue-700',      label: 'Sesión programada'    },
  session_completed:  { Icon: CheckCircle2,   color: 'bg-emerald-100 text-emerald-700', label: 'Sesión completada'   },
  session_cancelled:  { Icon: XCircle,        color: 'bg-red-100 text-red-600',         label: 'Sesión cancelada'    },
  therapist_verified: { Icon: GraduationCap,  color: 'bg-violet-100 text-violet-700',   label: 'Terapeuta verificado'},
  therapist_rejected: { Icon: Ban,            color: 'bg-orange-100 text-orange-700',   label: 'Terapeuta rechazado' },
  new_patient:        { Icon: User,           color: 'bg-teal-100 text-teal-700',       label: 'Nuevo paciente'      },
  new_therapist:      { Icon: Stethoscope,    color: 'bg-indigo-100 text-indigo-700',   label: 'Nuevo terapeuta'     },
  review_posted:      { Icon: Star,           color: 'bg-amber-100 text-amber-700',     label: 'Reseña publicada'    },
  checkin_alert:      { Icon: Bot,            color: 'bg-red-100 text-red-600',         label: 'Alerta IA'           },
  task_created:       { Icon: ClipboardList,  color: 'bg-warm-100 text-warm-600',       label: 'Tarea creada'        },
}
const DEFAULT_EVENT = { Icon: Pin, color: 'bg-warm-100 text-warm-600' }

const ALL_TYPES = Object.keys(EVENT_TYPES)

// Genera un feed de actividad combinando varias tablas
async function buildActivityFeed(days) {
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const events = []

  // Sesiones
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, status, scheduled_at, patient_id, therapist_id, therapist:profiles!sessions_therapist_id_fkey(full_name), patient:profiles!sessions_patient_id_fkey(full_name)')
    .gte('scheduled_at', from)
    .order('scheduled_at', { ascending: false })
    .limit(200)

  ;(sessions ?? []).forEach(s => {
    const type =
      s.status === 'completed' ? 'session_completed' :
      s.status === 'cancelled' ? 'session_cancelled' : 'session_scheduled'
    events.push({
      id: `sess-${s.id}-${type}`,
      type,
      ts: s.scheduled_at,
      description: `${s.patient?.full_name ?? 'Paciente'} con ${s.therapist?.full_name ?? 'Terapeuta'}`,
    })
  })

  // Nuevos registros (patients + therapists)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .gte('created_at', from)
    .order('created_at', { ascending: false })
    .limit(100)

  ;(profiles ?? []).forEach(p => {
    events.push({
      id: `prof-${p.id}`,
      type: p.role === 'therapist' ? 'new_therapist' : 'new_patient',
      ts: p.created_at,
      description: p.full_name ?? 'Usuario nuevo',
    })
  })

  // Verificaciones de terapeutas
  const { data: therapistUpdates } = await supabase
    .from('therapist_profiles')
    .select('user_id, verification_status, updated_at, profile:profiles!therapist_profiles_user_id_fkey(full_name)')
    .in('verification_status', ['verified', 'rejected'])
    .gte('updated_at', from)
    .order('updated_at', { ascending: false })
    .limit(50)

  ;(therapistUpdates ?? []).forEach(t => {
    events.push({
      id: `verif-${t.user_id}`,
      type: t.verification_status === 'verified' ? 'therapist_verified' : 'therapist_rejected',
      ts: t.updated_at,
      description: t.profile?.full_name ?? 'Terapeuta',
    })
  })

  // Reseñas
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, created_at, therapist:profiles!reviews_therapist_id_fkey(full_name)')
    .gte('created_at', from)
    .order('created_at', { ascending: false })
    .limit(50)

  ;(reviews ?? []).forEach(r => {
    events.push({
      id: `rev-${r.id}`,
      type: 'review_posted',
      ts: r.created_at,
      description: `${r.rating}/5 estrellas para ${r.therapist?.full_name ?? 'Terapeuta'}`,
    })
  })

  // Alertas IA (checkins de riesgo alto)
  const { data: alerts } = await supabase
    .from('ai_checkins')
    .select('id, risk_level, created_at, patient:profiles!ai_checkins_patient_id_fkey(full_name)')
    .eq('risk_level', 'high')
    .gte('created_at', from)
    .order('created_at', { ascending: false })
    .limit(50)

  ;(alerts ?? []).forEach(a => {
    events.push({
      id: `alert-${a.id}`,
      type: 'checkin_alert',
      ts: a.created_at,
      description: `Riesgo alto detectado — ${a.patient?.full_name ?? 'Paciente'}`,
    })
  })

  // Tareas asignadas
  const { data: tasks } = await supabase
    .from('patient_tasks')
    .select('id, title, created_at, patient:profiles!patient_tasks_patient_id_fkey(full_name)')
    .gte('created_at', from)
    .order('created_at', { ascending: false })
    .limit(100)

  ;(tasks ?? []).forEach(t => {
    events.push({
      id: `task-${t.id}`,
      type: 'task_created',
      ts: t.created_at,
      description: `"${t.title ?? 'Tarea'}" → ${t.patient?.full_name ?? 'Paciente'}`,
    })
  })

  // Ordenar cronológico inverso
  return events.sort((a, b) => new Date(b.ts) - new Date(a.ts))
}

// ─── Componente ──────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: '24 h',    days: 1  },
  { label: '7 días',  days: 7  },
  { label: '30 días', days: 30 },
]

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'Ahora mismo'
  if (mins < 60)  return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `Hace ${hrs} h`
  const d = Math.floor(hrs / 24)
  return d === 1 ? 'Ayer' : `Hace ${d} días`
}

const fullDate = (dateStr) =>
  new Date(dateStr).toLocaleString('es-DO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export default function AdminActivityLog() {
  const [period, setPeriod]       = useState(7)
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(0)
  const PAGE_SIZE = 40

  const load = useCallback(async () => {
    setLoading(true)
    setPage(0)
    const feed = await buildActivityFeed(period)
    setEvents(feed)
    setLoading(false)
  }, [period])

  useEffect(() => { load() }, [load])

  const filtered = events.filter(e => {
    const matchType   = typeFilter === 'all' || e.type === typeFilter
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const paginated = filtered.slice(0, (page + 1) * PAGE_SIZE)
  const hasMore   = paginated.length < filtered.length

  // Agrupar por día para mostrar separadores
  const grouped = paginated.reduce((acc, ev) => {
    const day = new Date(ev.ts).toLocaleDateString('es-DO', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    if (!acc[day]) acc[day] = []
    acc[day].push(ev)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Registro de Actividad</h1>
          <p className="text-warm-500 text-sm mt-1">
            Feed cronológico de eventos en la plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          {PERIOD_OPTIONS.map(p => (
            <button key={p.days} onClick={() => setPeriod(p.days)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                period === p.days
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Buscador + filtro tipo */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 bg-white"
        />
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(0) }}
          className="px-3 py-2 text-sm border border-warm-200 rounded-xl bg-white text-warm-700 focus:outline-none focus:border-primary-400"
        >
          <option value="all">Todos los eventos</option>
          {ALL_TYPES.map(t => (
            <option key={t} value={t}>{EVENT_TYPES[t].label}</option>
          ))}
        </select>
        <button onClick={load}
          className="px-3 py-2 rounded-xl text-sm border border-warm-200 bg-white text-warm-600 hover:bg-warm-50 transition-colors"
          title="Actualizar">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Resumen rápido */}
      {!loading && (
        <div className="flex flex-wrap gap-2">
          {ALL_TYPES.slice(0, 5).map(t => {
            const count = events.filter(e => e.type === t).length
            if (!count) return null
            const cfg = EVENT_TYPES[t]
            return (
              <button key={t} onClick={() => { setTypeFilter(t === typeFilter ? 'all' : t); setPage(0) }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  typeFilter === t ? 'border-primary-400 ring-1 ring-primary-400' : 'border-transparent'
                } ${cfg.color}`}>
                {(() => { const BIcon = cfg.Icon; return <BIcon size={12} strokeWidth={1.8} /> })()}
                {cfg.label} <span className="opacity-70">({count})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <Inbox size={40} strokeWidth={1.5} className="mx-auto mb-3 text-warm-300" />
          <p>No hay eventos que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {Object.entries(grouped).map(([day, dayEvents]) => (
            <div key={day}>
              {/* Separador de día */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-warm-100" />
                <span className="text-xs text-warm-400 font-medium capitalize whitespace-nowrap px-1">
                  {day}
                </span>
                <div className="flex-1 h-px bg-warm-100" />
              </div>

              {/* Eventos del día */}
              <div className="flex flex-col gap-1">
                {dayEvents.map(ev => {
                  const cfg = EVENT_TYPES[ev.type] ?? { color: 'bg-warm-100 text-warm-600', label: ev.type }
                  return (
                    <div key={ev.id}
                      className="bg-white border border-warm-100 rounded-xl px-4 py-3 flex items-start gap-3 hover:border-warm-200 transition-colors">
                      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.color}`}>
                        {(() => { const EIcon = cfg.Icon ?? DEFAULT_EVENT.Icon; return <EIcon size={15} strokeWidth={1.8} /> })()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-0.5">
                          {cfg.label}
                        </p>
                        <p className="text-sm text-warm-800 truncate">{ev.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-warm-400 whitespace-nowrap">{timeAgo(ev.ts)}</p>
                        <p className="text-[10px] text-warm-300 mt-0.5 hidden sm:block">
                          {fullDate(ev.ts)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Cargar más */}
          {hasMore && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="mt-3 w-full py-2.5 rounded-xl border border-warm-200 text-sm text-warm-500 hover:bg-warm-50 transition-colors">
              Cargar más ({filtered.length - paginated.length} restantes)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
