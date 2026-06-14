import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import {
  Users, Stethoscope, Calendar, DollarSign, Bot,
  AlertCircle, AlertTriangle, ClipboardList, BookOpen,
  CheckCircle2, TrendingUp, UsersRound, Bell, ChevronRight,
} from 'lucide-react'

function StatCard({ Icon, label, value, sub, color = 'primary', onClick }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-700 border-primary-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber:   'bg-amber-50 text-amber-700 border-amber-100',
    violet:  'bg-violet-50 text-violet-700 border-violet-100',
    red:     'bg-red-50 text-red-700 border-red-100',
    teal:    'bg-teal-50 text-teal-700 border-teal-100',
  }
  return (
    <div
      className={`rounded-2xl border p-5 ${colors[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      {Icon && <Icon size={22} strokeWidth={1.8} className="mb-2 opacity-80" />}
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  )
}

const statusLabel = {
  scheduled:       { label: 'Programada',      color: 'text-primary-600 bg-primary-50' },
  in_progress:     { label: 'En curso',         color: 'text-amber-600 bg-amber-50' },
  completed:       { label: 'Completada',        color: 'text-emerald-600 bg-emerald-50' },
  cancelled:       { label: 'Cancelada',         color: 'text-red-600 bg-red-50' },
  payment_pending: { label: 'Pago pendiente',    color: 'text-warm-500 bg-warm-50' },
}

const RISK_CONFIG = {
  high:   { label: 'Riesgo alto',   color: 'text-red-700 bg-red-50 border-red-100',          dot: 'bg-red-500'     },
  medium: { label: 'Riesgo medio',  color: 'text-amber-700 bg-amber-50 border-amber-100',    dot: 'bg-amber-500'   },
  low:    { label: 'Bien',          color: 'text-emerald-700 bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
}

const QUICK_LINKS = [
  { Icon: Bot,          label: 'Alertas IA',          to: '/admin/ai-alerts',  color: 'bg-red-50 border-red-100 text-red-700'         },
  { Icon: Stethoscope,  label: 'Verificar terapeutas', to: '/admin/therapists', color: 'bg-violet-50 border-violet-100 text-violet-700' },
  { Icon: TrendingUp,   label: 'Estadísticas',         to: '/admin/stats',      color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
  { Icon: Users,        label: 'Pacientes',            to: '/admin/patients',   color: 'bg-primary-50 border-primary-100 text-primary-700' },
  { Icon: Calendar,     label: 'Sesiones',             to: '/admin/sessions',   color: 'bg-amber-50 border-amber-100 text-amber-700'   },
  { Icon: UsersRound,   label: 'Sesiones grupales',    to: '/admin/groups',     color: 'bg-teal-50 border-teal-100 text-teal-700'      },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [recentSessions, setRecentSessions] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [engagement, setEngagement]     = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [
      { count: totalPatients },
      { count: totalTherapists },
      { count: pendingTherapists },
      { data: sessions },
      { data: recent },
      { count: highRiskUnread },
      { count: mediumRiskUnread },
      { count: totalCheckins },
      { count: pendingTasks },
      { count: completedTasks },
      { count: journalEntries },
      { count: pendingCreds },
      { count: pendingRefunds },
      { count: pendingDeletions },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['patient', 'client']),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'therapist'),
      supabase.from('therapist_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('sessions').select('price, status, paid_at'),
      supabase.from('sessions').select(`
        id, scheduled_at, status, price,
        patient:profiles!sessions_patient_id_fkey(full_name),
        therapist:profiles!sessions_therapist_id_fkey(full_name)
      `).order('created_at', { ascending: false }).limit(5),
      supabase.from('ai_checkins').select('*', { count: 'exact', head: true }).eq('risk_level', 'high').eq('notified', false),
      supabase.from('ai_checkins').select('*', { count: 'exact', head: true }).eq('risk_level', 'medium').eq('notified', false),
      supabase.from('ai_checkins').select('*', { count: 'exact', head: true }),
      supabase.from('patient_tasks').select('*', { count: 'exact', head: true }).is('completed_at', null),
      supabase.from('patient_tasks').select('*', { count: 'exact', head: true }).not('completed_at', 'is', null),
      supabase.from('patient_journal').select('*', { count: 'exact', head: true }),
      supabase.from('therapist_credentials').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('refunds').select('*', { count: 'exact', head: true }).in('status', ['pending', 'disputed', 'failed']),
      supabase.from('deletion_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    const completedSessions = (sessions ?? []).filter(s => s.status === 'completed')
    const totalRevenue = (sessions ?? [])
      .filter(s => s.paid_at)
      .reduce((sum, s) => sum + (s.price ?? 0), 0)
    const thisMonth = new Date(); thisMonth.setDate(1)
    const monthRevenue = (sessions ?? [])
      .filter(s => s.paid_at && new Date(s.paid_at) >= thisMonth)
      .reduce((sum, s) => sum + (s.price ?? 0), 0)

    setStats({
      totalPatients:    totalPatients ?? 0,
      totalTherapists:  totalTherapists ?? 0,
      pendingTherapists: pendingTherapists ?? 0,
      totalSessions:    sessions?.length ?? 0,
      completedSessions: completedSessions.length,
      totalRevenue,
      monthRevenue,
      highRiskUnread:   highRiskUnread ?? 0,
      mediumRiskUnread: mediumRiskUnread ?? 0,
      totalCheckins:    totalCheckins ?? 0,
      pendingCreds:     pendingCreds ?? 0,
      pendingRefunds:   pendingRefunds ?? 0,
      pendingDeletions: pendingDeletions ?? 0,
    })

    setEngagement({
      pendingTasks:   pendingTasks ?? 0,
      completedTasks: completedTasks ?? 0,
      journalEntries: journalEntries ?? 0,
    })

    setRecentSessions(recent ?? [])

    const { data: alerts } = await supabase
      .from('ai_checkins')
      .select(`
        id, risk_level, ai_message, created_at, notified,
        patient:profiles!ai_checkins_patient_id_fkey(id, full_name)
      `)
      .in('risk_level', ['high', 'medium'])
      .order('created_at', { ascending: false })
      .limit(6)
    setRecentAlerts(alerts ?? [])
    setLoading(false)
  }

  const markReviewed = async (checkinId) => {
    await supabase.from('ai_checkins').update({ notified: true }).eq('id', checkinId)
    setRecentAlerts(prev => prev.map(a => a.id === checkinId ? { ...a, notified: true } : a))
    setStats(prev => prev ? { ...prev, highRiskUnread: Math.max(0, prev.highRiskUnread - 1) } : prev)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-warm-900">Panel de administración</h1>
        <p className="text-warm-500 text-sm mt-1">Resumen general de Psiconecta</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          {/* ── Bandeja: requiere tu atención hoy ── */}
          {(() => {
            const inbox = [
              {
                count: stats.highRiskUnread + stats.mediumRiskUnread,
                label: 'alertas de riesgo IA sin revisar',
                sub: stats.highRiskUnread > 0
                  ? `${stats.highRiskUnread} de riesgo ALTO — atención urgente`
                  : 'Riesgo medio — revisar pronto',
                to: '/admin/ai-alerts',
                Icon: AlertCircle,
                tone: stats.highRiskUnread > 0
                  ? 'bg-red-50 border-red-200 hover:bg-red-100 text-red-800 sub:text-red-600 icon:text-red-500'
                  : 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-800 sub:text-amber-600 icon:text-amber-500',
              },
              {
                count: stats.pendingCreds,
                label: 'credenciales esperando verificación',
                sub: 'Terapeutas bloqueados hasta que las revises',
                to: '/admin/therapists',
                Icon: AlertTriangle,
                tone: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-800 sub:text-amber-600 icon:text-amber-500',
              },
              {
                count: stats.pendingRefunds,
                label: 'reembolsos por gestionar',
                sub: 'Pendientes, fallidos o en disputa',
                to: '/admin/refunds',
                Icon: AlertTriangle,
                tone: 'bg-primary-50 border-primary-200 hover:bg-primary-100 text-primary-800 sub:text-primary-600 icon:text-primary-500',
              },
              {
                count: stats.pendingDeletions,
                label: 'solicitudes de eliminación de datos',
                sub: 'Plazo legal: 30 días desde la solicitud',
                to: '/admin/deletions',
                Icon: AlertTriangle,
                tone: 'bg-warm-100 border-warm-200 hover:bg-warm-200 text-warm-800 sub:text-warm-500 icon:text-warm-500',
              },
            ].filter(i => i.count > 0)

            if (inbox.length === 0) {
              return (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                  <p className="text-sm font-medium text-emerald-800">
                    Todo al día — sin pendientes que requieran tu atención.
                  </p>
                </div>
              )
            }
            return (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-warm-400 uppercase tracking-wider">
                  Requiere tu atención hoy · {inbox.reduce((a, i) => a + i.count, 0)} pendiente{inbox.reduce((a, i) => a + i.count, 0) !== 1 ? 's' : ''}
                </p>
                {inbox.map(({ count, label, sub, to, Icon, tone }) => {
                  const [bg, border, hover, text, subC, iconC] = tone.split(' ')
                  return (
                    <button
                      key={to}
                      onClick={() => navigate(to)}
                      className={`w-full text-left ${bg} border ${border} rounded-2xl p-4 flex items-center gap-3 ${hover} transition-colors`}
                    >
                      <Icon size={22} className={`${iconC.replace('icon:', '')} shrink-0`} />
                      <div className="flex-1">
                        <p className={`font-semibold ${text} text-sm`}>{count} {label}</p>
                        <p className={`text-xs ${subC.replace('sub:', '')} mt-0.5`}>{sub}</p>
                      </div>
                      <ChevronRight size={16} className="opacity-40 shrink-0" />
                    </button>
                  )
                })}
              </div>
            )
          })()}

          {/* ── KPIs principales ── */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard Icon={Users}       label="Pacientes"        value={stats.totalPatients}  color="primary"
              onClick={() => navigate('/admin/patients')} />
            <StatCard Icon={Stethoscope} label="Terapeutas"       value={stats.totalTherapists}
              sub={stats.pendingTherapists > 0 ? `${stats.pendingTherapists} por verificar` : 'Todos verificados'}
              color="violet" onClick={() => navigate('/admin/therapists')} />
            <StatCard Icon={Calendar}    label="Sesiones totales" value={stats.totalSessions}
              sub={`${stats.completedSessions} completadas`} color="amber"
              onClick={() => navigate('/admin/sessions')} />
            <StatCard Icon={DollarSign}  label="Ingresos totales" value={formatPrice(stats.totalRevenue)}
              sub={`Este mes: ${formatPrice(stats.monthRevenue)}`} color="emerald"
              onClick={() => navigate('/admin/stats')} />
          </div>

          {/* ── Métricas de IA y engagement ── */}
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-warm-800 mb-3">
              <Bot size={17} className="text-warm-500" /> Bienestar y engagement del paciente
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard Icon={AlertCircle}   label="Check-ins riesgo alto"
                value={stats.highRiskUnread} sub="Sin revisar hoy"
                color={stats.highRiskUnread > 0 ? 'red' : 'teal'}
                onClick={() => navigate('/admin/ai-alerts')} />
              <StatCard Icon={Bot}            label="Check-ins totales"
                value={stats.totalCheckins} sub="Histórico" color="primary" />
              <StatCard Icon={ClipboardList}  label="Tareas pendientes"
                value={engagement.pendingTasks}
                sub={`${engagement.completedTasks} completadas`} color="amber" />
              <StatCard Icon={BookOpen}       label="Entradas de diario"
                value={engagement.journalEntries} sub="Escritura reflexiva" color="violet" />
              <StatCard Icon={CheckCircle2}   label="Tareas completadas"
                value={engagement.completedTasks} sub="Por pacientes" color="emerald" />
              <StatCard Icon={AlertTriangle}  label="Riesgo medio"
                value={stats.mediumRiskUnread} sub="Sin revisar"
                color={stats.mediumRiskUnread > 0 ? 'amber' : 'teal'}
                onClick={() => navigate('/admin/ai-alerts')} />
            </div>
          </div>

          {/* ── Alertas IA recientes ── */}
          {recentAlerts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="flex items-center gap-2 font-semibold text-warm-800">
                  <Bell size={16} className="text-warm-500" /> Alertas de bienestar recientes
                </h2>
                <button
                  onClick={() => navigate('/admin/ai-alerts')}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  Ver todas →
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {recentAlerts.map(alert => {
                  const rc = RISK_CONFIG[alert.risk_level] ?? RISK_CONFIG.low
                  return (
                    <div key={alert.id}
                      className={`rounded-2xl border p-4 ${rc.color} ${alert.notified ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${rc.dot}`} />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {alert.patient?.full_name ?? 'Paciente'}
                            </p>
                            <p className="text-xs opacity-80 mt-0.5 line-clamp-1">{alert.ai_message}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {new Date(alert.created_at).toLocaleDateString('es-DO', { dateStyle: 'short' })}{' '}
                              {new Date(alert.created_at).toLocaleTimeString('es-DO', { timeStyle: 'short' })}
                            </p>
                          </div>
                        </div>
                        {!alert.notified ? (
                          <button
                            onClick={() => markReviewed(alert.id)}
                            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-current opacity-70 hover:opacity-100 transition-opacity"
                          >
                            Revisar
                          </button>
                        ) : (
                          <span className="shrink-0 text-xs font-medium opacity-60 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Revisado
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Sesiones recientes ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-warm-800">Sesiones recientes</h2>
              <button
                onClick={() => navigate('/admin/sessions')}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                Ver todas →
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-warm-100 overflow-hidden">
              {recentSessions.length === 0 ? (
                <p className="text-center py-8 text-warm-400 text-sm">No hay sesiones aún</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-warm-100 bg-warm-50">
                      <th className="text-left px-4 py-3 text-warm-500 font-medium">Paciente</th>
                      <th className="text-left px-4 py-3 text-warm-500 font-medium hidden sm:table-cell">Terapeuta</th>
                      <th className="text-left px-4 py-3 text-warm-500 font-medium">Estado</th>
                      <th className="text-right px-4 py-3 text-warm-500 font-medium">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((s, i) => {
                      const st = statusLabel[s.status] ?? { label: s.status, color: 'text-warm-500 bg-warm-50' }
                      return (
                        <tr key={s.id} className={`border-b border-warm-50 ${i % 2 === 0 ? '' : 'bg-warm-50/30'}`}>
                          <td className="px-4 py-3 font-medium text-warm-900">{s.patient?.full_name ?? '—'}</td>
                          <td className="px-4 py-3 text-warm-600 hidden sm:table-cell">{s.therapist?.full_name ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-warm-900">{formatPrice(s.price ?? 0)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Accesos rápidos ── */}
          <div>
            <h2 className="font-semibold text-warm-800 mb-3">Accesos rápidos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {QUICK_LINKS.map(({ Icon: QIcon, label, to, color }) => (
                <button key={to}
                  onClick={() => navigate(to)}
                  className={`rounded-2xl border p-4 text-left hover:shadow-md transition-shadow ${color}`}>
                  <QIcon size={20} strokeWidth={1.8} className="mb-2" />
                  <p className="text-sm font-medium">{label}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
