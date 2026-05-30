import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Spinner'
import { RatingDisplay } from '@/components/ui/StarRating'
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { subWeeks, startOfWeek, endOfWeek, parseISO, format, eachWeekOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

const PIE_COLORS = {
  scheduled: '#2d6a9f',
  completed:  '#10b981',
  cancelled:  '#ef4444',
  payment_pending: '#f59e0b',
}

const SPECIALTY_COLORS = [
  '#2d6a9f','#10b981','#7ec8e3','#f59e0b','#8b5cf6',
  '#ec4899','#14b8a6','#f97316','#64748b','#a3e635',
]

export default function AdminStats() {
  const [loading, setLoading]           = useState(true)
  const [revenueData, setRevenueData]   = useState([])
  const [statusData, setStatusData]     = useState([])
  const [specialtyData, setSpecialtyData] = useState([])
  const [topTherapists, setTopTherapists] = useState([])
  const [period, setPeriod]             = useState('8w') // 8w | 12w
  const [checkinData, setCheckinData]   = useState([])
  const [engagementStats, setEngagementStats] = useState(null)

  useEffect(() => { fetchStats() }, [period])

  const fetchStats = async () => {
    setLoading(true)

    const weeks   = period === '8w' ? 8 : 12
    const since   = subWeeks(new Date(), weeks).toISOString()

    // ── Sesiones del período ──────────────────────────────────
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, status, price, scheduled_at, therapist_id')
      .gte('scheduled_at', since)

    // ── Ingresos por semana ───────────────────────────────────
    const weekRange = eachWeekOfInterval({
      start: subWeeks(new Date(), weeks),
      end:   new Date(),
    })

    const weeklyRevenue = weekRange.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      const label   = format(weekStart, "d MMM", { locale: es })
      const revenue = (sessions ?? [])
        .filter(s =>
          s.status === 'completed' &&
          parseISO(s.scheduled_at) >= weekStart &&
          parseISO(s.scheduled_at) <= weekEnd
        )
        .reduce((sum, s) => sum + (s.price ?? 0), 0)
      return { semana: label, ingresos: revenue }
    })
    setRevenueData(weeklyRevenue)

    // ── Sesiones por estado ───────────────────────────────────
    const counts = {}
    ;(sessions ?? []).forEach(s => { counts[s.status] = (counts[s.status] ?? 0) + 1 })
    const statusLabels = {
      scheduled:       'Programadas',
      completed:       'Completadas',
      cancelled:       'Canceladas',
      payment_pending: 'Pago pendiente',
    }
    setStatusData(
      Object.entries(counts).map(([status, value]) => ({
        name:  statusLabels[status] ?? status,
        value,
        status,
      }))
    )

    // ── Top terapeutas ────────────────────────────────────────
    const { data: therapistProfiles } = await supabase
      .from('therapist_profiles')
      .select(`
        user_id, specialty, rating, review_count, price_per_session,
        profile:profiles!therapist_profiles_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('verified', true)
      .order('rating', { ascending: false })
      .limit(10)

    const therapistMap = {}
    ;(sessions ?? []).forEach(s => {
      therapistMap[s.therapist_id] = (therapistMap[s.therapist_id] ?? 0) + 1
    })

    const ranked = (therapistProfiles ?? []).map(t => ({
      ...t,
      sessionCount: therapistMap[t.user_id] ?? 0,
    })).sort((a, b) => b.sessionCount - a.sessionCount || b.rating - a.rating)

    setTopTherapists(ranked)

    // ── Check-ins por semana y riesgo ─────────────────────────
    const { data: checkins } = await supabase
      .from('ai_checkins')
      .select('risk_level, created_at')
      .gte('created_at', since)

    const weeklyCheckins = weekRange.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      const label   = format(weekStart, "d MMM", { locale: es })
      const week    = (checkins ?? []).filter(c =>
        parseISO(c.created_at) >= weekStart && parseISO(c.created_at) <= weekEnd
      )
      return {
        semana: label,
        alto:   week.filter(c => c.risk_level === 'high').length,
        medio:  week.filter(c => c.risk_level === 'medium').length,
        bajo:   week.filter(c => c.risk_level === 'low').length,
      }
    })
    setCheckinData(weeklyCheckins)

    // ── Engagement: tareas y diarios ─────────────────────────
    const [
      { count: totalTasks },
      { count: completedTasks },
      { count: journalEntries },
      { count: highRiskCheckins },
    ] = await Promise.all([
      supabase.from('patient_tasks').select('*', { count: 'exact', head: true }),
      supabase.from('patient_tasks').select('*', { count: 'exact', head: true }).not('completed_at', 'is', null),
      supabase.from('patient_journal').select('*', { count: 'exact', head: true }),
      supabase.from('ai_checkins').select('*', { count: 'exact', head: true }).eq('risk_level', 'high'),
    ])

    setEngagementStats({
      totalTasks:      totalTasks ?? 0,
      completedTasks:  completedTasks ?? 0,
      journalEntries:  journalEntries ?? 0,
      highRiskCheckins: highRiskCheckins ?? 0,
      completionRate:  totalTasks ? Math.round(((completedTasks ?? 0) / totalTasks) * 100) : 0,
    })

    // ── Sesiones por especialidad ─────────────────────────────
    const specMap = {}
    ;(sessions ?? []).forEach(s => {
      const tp = (therapistProfiles ?? []).find(t => t.user_id === s.therapist_id)
      const spec = tp?.specialty ?? 'Otra'
      specMap[spec] = (specMap[spec] ?? 0) + 1
    })
    setSpecialtyData(
      Object.entries(specMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, sesiones]) => ({ name: name.replace('Psicología ', '').replace('Terapia ', ''), sesiones }))
    )

    setLoading(false)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-warm-200 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold text-warm-800 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.name === 'ingresos' ? formatPrice(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  }

  const exportRevenueCSV = () => {
    const headers = ['Semana', 'Ingresos (USD)']
    const rows = revenueData.map(r => [r.semana, r.ingresos.toFixed(2)])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `ingresos_${period}_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const exportTherapistsCSV = () => {
    const headers = ['Terapeuta', 'Especialidad', 'Sesiones', 'Calificación', 'Precio/sesión (USD)']
    const rows = topTherapists.map(t => [
      t.profile?.full_name ?? '',
      t.specialty ?? '',
      t.sessionCount,
      t.rating ?? 0,
      (t.price_per_session ?? 0).toFixed(2),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `terapeutas_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Estadísticas</h1>
          <p className="text-warm-500 text-sm mt-1">Análisis de rendimiento de la plataforma</p>
        </div>
        <div className="flex gap-2">
          {[
            { id: '8w',  label: '8 semanas' },
            { id: '12w', label: '12 semanas' },
          ].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                period === p.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : (
        <>
          {/* ── Ingresos por semana ── */}
          <div className="bg-white rounded-2xl border border-warm-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-warm-900">💰 Ingresos por semana</h2>
              <button onClick={exportRevenueCSV}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200">
                ⬇ CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2d6a9f" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2d6a9f" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ingresos" name="ingresos"
                  stroke="#2d6a9f" strokeWidth={2.5}
                  fill="url(#revenueGrad)" dot={{ r: 3, fill: '#2d6a9f' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Sesiones por estado + Especialidades ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pie chart */}
            <div className="bg-white rounded-2xl border border-warm-100 p-5">
              <h2 className="font-semibold text-warm-900 mb-4">📊 Sesiones por estado</h2>
              {statusData.length === 0 ? (
                <p className="text-warm-400 text-sm text-center py-8">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={70}
                      dataKey="value" label={({ name, percent }) =>
                        `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={11}>
                      {statusData.map((entry) => (
                        <Cell key={entry.status} fill={PIE_COLORS[entry.status] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [val, name]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar chart especialidades */}
            <div className="bg-white rounded-2xl border border-warm-100 p-5">
              <h2 className="font-semibold text-warm-900 mb-4">🎓 Sesiones por especialidad</h2>
              {specialtyData.length === 0 ? (
                <p className="text-warm-400 text-sm text-center py-8">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={specialtyData} layout="vertical"
                    margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false} axisLine={false} width={80} />
                    <Tooltip />
                    <Bar dataKey="sesiones" radius={[0, 6, 6, 0]}>
                      {specialtyData.map((_, i) => (
                        <Cell key={i} fill={SPECIALTY_COLORS[i % SPECIALTY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Engagement de pacientes ── */}
          {engagementStats && (
            <div className="bg-white rounded-2xl border border-warm-100 p-5">
              <h2 className="font-semibold text-warm-900 mb-4">🎯 Engagement y bienestar del paciente</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: '📋', label: 'Tareas totales',    value: engagementStats.totalTasks,      color: 'text-primary-700' },
                  { icon: '✅', label: 'Tareas completadas', value: engagementStats.completedTasks,   color: 'text-emerald-700' },
                  { icon: '📓', label: 'Entradas de diario', value: engagementStats.journalEntries,   color: 'text-violet-700' },
                  { icon: '🔴', label: 'Check-ins riesgo alto', value: engagementStats.highRiskCheckins, color: 'text-red-700' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className="text-2xl mb-1">{m.icon}</p>
                    <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-xs text-warm-500 mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Barra de progreso de tareas */}
              {engagementStats.totalTasks > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-warm-500 mb-1.5">
                    <span>Tasa de completación de tareas</span>
                    <span className="font-semibold text-emerald-600">{engagementStats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-warm-100 rounded-full h-2.5">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${engagementStats.completionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Check-ins por riesgo por semana ── */}
          {checkinData.length > 0 && (
            <div className="bg-white rounded-2xl border border-warm-100 p-5">
              <h2 className="font-semibold text-warm-900 mb-4">🤖 Check-ins IA por semana y nivel de riesgo</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={checkinData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                  <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="bajo"  name="Sin riesgo"   stackId="a" fill="#10b981" radius={[0,0,0,0]} />
                  <Bar dataKey="medio" name="Riesgo medio" stackId="a" fill="#f59e0b" radius={[0,0,0,0]} />
                  <Bar dataKey="alto"  name="Riesgo alto"  stackId="a" fill="#ef4444" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Top terapeutas ── */}
          <div className="bg-white rounded-2xl border border-warm-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-warm-900">🏆 Terapeutas más activos</h2>
              <button onClick={exportTherapistsCSV}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200">
                ⬇ CSV
              </button>
            </div>
            {topTherapists.length === 0 ? (
              <p className="text-warm-400 text-sm text-center py-8">Sin datos</p>
            ) : (
              <div className="flex flex-col divide-y divide-warm-100">
                {topTherapists.slice(0, 8).map((t, i) => (
                  <div key={t.user_id} className="flex items-center gap-3 py-3">
                    <span className={`text-sm font-bold w-5 text-center ${
                      i === 0 ? 'text-yellow-500' :
                      i === 1 ? 'text-warm-400' :
                      i === 2 ? 'text-amber-600' : 'text-warm-300'
                    }`}>{i + 1}</span>
                    <Avatar name={t.profile?.full_name ?? ''} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-warm-900 truncate">{t.profile?.full_name}</p>
                      <p className="text-xs text-warm-400 truncate">{t.specialty}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-warm-800">{t.sessionCount} ses.</p>
                      {t.rating > 0 && (
                        <RatingDisplay value={t.rating} reviews={t.review_count ?? 0} compact />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
