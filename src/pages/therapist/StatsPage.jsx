/**
 * StatsPage — Dashboard de estadísticas avanzadas.
 * Exclusivo para terapeutas con plan Pro o Premium.
 *
 * Métricas:
 *   · Ingresos: mes actual vs anterior, neto vs comisión
 *   · Sesiones: completadas, canceladas, urgentes (gráfica semanal)
 *   · Retención: pacientes nuevos vs recurrentes, promedio sesiones/paciente
 *   · Rating: promedio actual y distribución de estrellas
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/lib/utils'
import { useCurrencyContext } from '@/context/CurrencyContext'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { startOfMonth, endOfMonth, subMonths, format, subDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Crown, Star, TrendingUp, TrendingDown, DollarSign,
  Calendar, Users, RotateCcw, Lock } from 'lucide-react'
import Button from '@/components/ui/Button'

// ── Helpers ───────────────────────────────────────────────────────────────────

const pct = (a, b) => b === 0 ? null : (((a - b) / b) * 100).toFixed(1)

function DeltaBadge({ current, previous }) {
  const delta = pct(current, previous)
  if (delta === null) return null
  const up = parseFloat(delta) >= 0
  return (
    <span className={`text-xs font-semibold flex items-center gap-0.5 ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? '+' : ''}{delta}%
    </span>
  )
}

function MetricCard({ label, value, sub, delta, prev, icon: Icon, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green:   'bg-green-50 text-green-600',
    amber:   'bg-amber-50 text-amber-600',
    rose:    'bg-rose-50 text-rose-600',
  }
  return (
    <div className="bg-white border border-warm-100 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} strokeWidth={1.8} />
        </div>
        <DeltaBadge current={delta?.current} previous={delta?.previous} />
      </div>
      <p className="text-2xl font-bold text-warm-900">{value}</p>
      <p className="text-xs text-warm-500 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-warm-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function StatsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { formatWithLocal } = useCurrencyContext()

  const [plan, setPlan]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [sessions, setSessions]   = useState([])
  const [reviews, setReviews]     = useState([])

  useEffect(() => { if (user) fetchAll() }, [user])

  const fetchAll = async () => {
    setLoading(true)

    // Plan del terapeuta
    const { data: profile } = await supabase
      .from('therapist_profiles')
      .select('subscription_plan')
      .eq('user_id', user.id)
      .single()
    setPlan(profile?.subscription_plan ?? 'basic')

    if (!['pro', 'premium'].includes(profile?.subscription_plan)) {
      setLoading(false)
      return
    }

    // Sesiones de los últimos 60 días
    const since = subDays(new Date(), 60).toISOString()
    const { data: sessData } = await supabase
      .from('sessions')
      .select('id, status, price, platform_commission, therapist_net, scheduled_at, patient_id, is_urgent')
      .eq('therapist_id', user.id)
      .gte('scheduled_at', since)

    setSessions(sessData ?? [])

    // Reseñas
    const { data: revData } = await supabase
      .from('reviews')
      .select('rating, created_at')
      .eq('therapist_id', user.id)

    setReviews(revData ?? [])
    setLoading(false)
  }

  // ── Cálculos ─────────────────────────────────────────────────────────────────

  const now       = new Date()
  const thisStart = startOfMonth(now)
  const thisEnd   = endOfMonth(now)
  const prevStart = startOfMonth(subMonths(now, 1))
  const prevEnd   = endOfMonth(subMonths(now, 1))

  const inRange = (s, start, end) => {
    const d = new Date(s.scheduled_at)
    return d >= start && d <= end && s.status === 'completed'
  }

  const thisSessions = sessions.filter(s => inRange(s, thisStart, thisEnd))
  const prevSessions = sessions.filter(s => inRange(s, prevStart, prevEnd))

  const thisRevenue  = thisSessions.reduce((a, s) => a + (s.therapist_net ?? s.price ?? 0), 0)
  const prevRevenue  = prevSessions.reduce((a, s) => a + (s.therapist_net ?? s.price ?? 0), 0)
  const thisComm     = thisSessions.reduce((a, s) => a + (s.platform_commission ?? 0), 0)
  const thisGross    = thisSessions.reduce((a, s) => a + (s.price ?? 0), 0)

  // Sesiones del mes por tipo
  const thisAll      = sessions.filter(s => {
    const d = new Date(s.scheduled_at); return d >= thisStart && d <= thisEnd
  })
  const completed    = thisAll.filter(s => s.status === 'completed').length
  const cancelled    = thisAll.filter(s => s.status === 'cancelled').length
  const urgent       = thisAll.filter(s => s.is_urgent && s.status === 'completed').length

  // Retención
  const allPatients  = [...new Set(sessions.map(s => s.patient_id))]
  const thisPatients = [...new Set(thisSessions.map(s => s.patient_id))]
  const prevPatients = [...new Set(prevSessions.map(s => s.patient_id))]
  const returning    = thisPatients.filter(id => prevPatients.includes(id)).length
  const newPatients  = thisPatients.filter(id => !prevPatients.includes(id)).length
  const avgPerPatient = allPatients.length
    ? (sessions.filter(s => s.status === 'completed').length / allPatients.length).toFixed(1)
    : 0

  // Rating
  const avgRating    = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : '—'
  const ratingDist   = [5,4,3,2,1].map(s => ({
    star: s,
    count: reviews.filter(r => r.rating === s).length,
  }))

  // Gráfica de sesiones por día (últimos 14 días)
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d    = subDays(now, 13 - i)
    const key  = format(d, 'yyyy-MM-dd')
    const daySessions = sessions.filter(s =>
      s.scheduled_at?.startsWith(key) && s.status === 'completed'
    )
    return {
      label: format(d, 'dd MMM', { locale: es }),
      sesiones: daySessions.length,
      ingresos: daySessions.reduce((a, s) => a + (s.therapist_net ?? s.price ?? 0), 0),
    }
  })

  // ── Gate: solo Pro/Premium ────────────────────────────────────────────────────

  if (!loading && plan === 'basic') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 max-w-sm mx-auto">
        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center">
          <Lock size={28} strokeWidth={1.5} className="text-primary-400" />
        </div>
        <h2 className="font-serif text-xl font-bold text-warm-900">Estadísticas avanzadas</h2>
        <p className="text-warm-500 text-sm leading-relaxed">
          Esta funcionalidad está disponible para los planes <strong>Pro</strong> y <strong>Premium</strong>.
          Actualiza tu plan para acceder a métricas detalladas de ingresos, retención y más.
        </p>
        <Button onClick={() => navigate('/therapist/subscription')}>
          <Crown size={15} strokeWidth={1.8} className="mr-1.5" />Ver planes
        </Button>
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Estadísticas</h1>
          <p className="text-warm-500 text-sm mt-0.5">
            {format(thisStart, 'MMMM yyyy', { locale: es })} · Plan{' '}
            <span className={plan === 'premium' ? 'text-amber-600 font-semibold' : 'text-primary-600 font-semibold'}>
              {plan === 'premium' ? 'Premium' : 'Pro'}
            </span>
          </p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Ingresos netos (mes)"
          value={formatWithLocal(thisRevenue)}
          sub={`Comisión: ${formatPrice(thisComm)}`}
          icon={DollarSign}
          color="green"
          delta={{ current: thisRevenue, previous: prevRevenue }}
        />
        <MetricCard
          label="Sesiones completadas"
          value={completed}
          sub={`${urgent} urgentes · ${cancelled} canceladas`}
          icon={Calendar}
          color="primary"
          delta={{ current: completed, previous: prevSessions.length }}
        />
        <MetricCard
          label="Pacientes activos"
          value={thisPatients.length}
          sub={`${newPatients} nuevos · ${returning} recurrentes`}
          icon={Users}
          color="amber"
          delta={{ current: thisPatients.length, previous: prevPatients.length }}
        />
        <MetricCard
          label="Rating promedio"
          value={`${avgRating} / 5`}
          sub={`${reviews.length} reseñas totales`}
          icon={Star}
          color="rose"
        />
      </div>

      {/* Gráfica de ingresos y sesiones */}
      <div className="bg-white border border-warm-100 rounded-2xl p-5">
        <p className="font-semibold text-warm-800 mb-4 text-sm">Últimos 14 días</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={last14} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2d6a9f" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2d6a9f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(v, name) => [
                name === 'ingresos' ? `$${v.toFixed(2)} USD` : v,
                name === 'ingresos' ? 'Ingresos netos' : 'Sesiones',
              ]}
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="ingresos" stroke="#2d6a9f" strokeWidth={2}
              fill="url(#ingGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Retención + Rating */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Retención */}
        <div className="bg-white border border-warm-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <RotateCcw size={15} strokeWidth={1.8} className="text-primary-500" />
            <p className="font-semibold text-warm-800 text-sm">Retención de pacientes</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-warm-600">Pacientes recurrentes</p>
              <p className="font-bold text-warm-900">{returning}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-warm-600">Pacientes nuevos</p>
              <p className="font-bold text-warm-900">{newPatients}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-warm-600">Total únicos (60 días)</p>
              <p className="font-bold text-warm-900">{allPatients.length}</p>
            </div>
            <div className="flex items-center justify-between border-t border-warm-100 pt-3">
              <p className="text-sm text-warm-600">Sesiones / paciente</p>
              <p className="font-bold text-primary-600">{avgPerPatient}</p>
            </div>
          </div>

          {/* Barra de retención */}
          {thisPatients.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-warm-400 mb-1">
                <span>Nuevos</span>
                <span>Recurrentes</span>
              </div>
              <div className="h-2 bg-warm-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-primary-400 h-full transition-all"
                  style={{ width: `${(newPatients / thisPatients.length) * 100}%` }}
                />
                <div
                  className="bg-green-400 h-full transition-all"
                  style={{ width: `${(returning / thisPatients.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Distribución de rating */}
        <div className="bg-white border border-warm-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star size={15} strokeWidth={1.8} className="text-amber-500" />
            <p className="font-semibold text-warm-800 text-sm">Distribución de reseñas</p>
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-warm-400 text-center py-6">Sin reseñas aún</p>
          ) : (
            <div className="space-y-2">
              {ratingDist.map(({ star, count }) => {
                const pctVal = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="text-warm-500 w-4 text-right shrink-0">{star}</span>
                    <Star size={10} strokeWidth={0} className="fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 h-1.5 bg-warm-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pctVal}%` }} />
                    </div>
                    <span className="text-warm-400 w-4 text-right shrink-0">{count}</span>
                  </div>
                )
              })}
              <p className="text-center text-2xl font-bold text-warm-900 pt-2">
                {avgRating}
                <span className="text-sm font-normal text-warm-400"> / 5</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Desglose ingresos mes */}
      <div className="bg-white border border-warm-100 rounded-2xl p-5">
        <p className="font-semibold text-warm-800 text-sm mb-4">
          Desglose de ingresos — {format(thisStart, 'MMMM', { locale: es })}
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-warm-900">{formatWithLocal(thisGross)}</p>
            <p className="text-xs text-warm-400 mt-0.5">Facturado</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-500">−{formatWithLocal(thisComm)}</p>
            <p className="text-xs text-warm-400 mt-0.5">Comisión plataforma</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{formatWithLocal(thisRevenue)}</p>
            <p className="text-xs text-warm-400 mt-0.5">Tu ingreso neto</p>
          </div>
        </div>
      </div>

    </div>
  )
}
