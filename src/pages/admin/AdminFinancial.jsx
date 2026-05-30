import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Skeleton } from '@/components/ui/Spinner'

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })

const isoDate = (d) => d.toISOString().split('T')[0]

const addDays = (d, n) => {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

const PERIODS = [
  { label: '7 días',  days: 7  },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-warm-100 rounded-xl p-3 shadow-float text-xs">
      <p className="font-semibold text-warm-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="leading-5">
          {p.name}: {formatPrice(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function AdminFinancial() {
  const [period, setPeriod]           = useState(30)
  const [sessions, setSessions]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [revenueByDay, setRevenueByDay]         = useState([])
  const [revenueByTherapist, setRevenueByTherapist] = useState([])
  const [revenueByType, setRevenueByType]       = useState([])
  const [kpis, setKpis]               = useState({ total: 0, completed: 0, pending: 0, cancelled: 0 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const from = isoDate(addDays(new Date(), -period))

    const { data } = await supabase
      .from('sessions')
      .select(`
        id, status, price, scheduled_at, session_type,
        therapist:profiles!sessions_therapist_id_fkey(id, full_name)
      `)
      .gte('scheduled_at', from + 'T00:00:00')
      .order('scheduled_at', { ascending: true })

    const rows = data ?? []
    setSessions(rows)

    // KPIs
    const completed  = rows.filter(s => s.status === 'completed')
    const pending    = rows.filter(s => s.status === 'scheduled')
    const cancelled  = rows.filter(s => s.status === 'cancelled')
    const total      = completed.reduce((a, s) => a + (s.price ?? 0), 0)
    setKpis({
      total,
      completed: completed.reduce((a, s) => a + (s.price ?? 0), 0),
      pending:   pending.reduce((a, s)   => a + (s.price ?? 0), 0),
      cancelled: cancelled.length,
    })

    // Ingresos por día
    const byDay = {}
    rows.forEach(s => {
      const d = s.scheduled_at?.split('T')[0] ?? ''
      if (!byDay[d]) byDay[d] = { date: fmtDate(d), completado: 0, pendiente: 0 }
      if (s.status === 'completed') byDay[d].completado += s.price ?? 0
      if (s.status === 'scheduled') byDay[d].pendiente  += s.price ?? 0
    })
    setRevenueByDay(Object.values(byDay))

    // Ingresos por terapeuta (top 8)
    const byT = {}
    completed.forEach(s => {
      const name = s.therapist?.full_name ?? 'Sin nombre'
      byT[name] = (byT[name] ?? 0) + (s.price ?? 0)
    })
    setRevenueByTherapist(
      Object.entries(byT)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, value]) => ({ name: name.split(' ')[0], value }))
    )

    // Ingresos por tipo de sesión
    const byType = {}
    completed.forEach(s => {
      const t = s.session_type ?? 'individual'
      byType[t] = (byType[t] ?? 0) + (s.price ?? 0)
    })
    setRevenueByType(
      Object.entries(byType).map(([name, value]) => ({ name, value }))
    )

    setLoading(false)
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  // ── CSV export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Fecha', 'Terapeuta', 'Tipo', 'Estado', 'Precio']
    const rows = sessions.map(s => [
      s.scheduled_at?.split('T')[0],
      s.therapist?.full_name ?? '',
      s.session_type ?? 'individual',
      s.status,
      s.price ?? 0,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `psiconecta-ingresos-${isoDate(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Reportes Financieros</h1>
          <p className="text-warm-500 text-sm mt-1">Ingresos y facturación de la plataforma</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PERIODS.map(p => (
            <button key={p.days} onClick={() => setPeriod(p.days)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                period === p.days
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
              }`}>
              {p.label}
            </button>
          ))}
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            ⬇️ CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Ingresos totales',   value: formatPrice(kpis.total),     color: 'from-emerald-50 to-emerald-100/40', icon: '💰' },
            { label: 'Sesiones cobradas',  value: formatPrice(kpis.completed), color: 'from-primary-50 to-primary-100/40', icon: '✅' },
            { label: 'Por cobrar',         value: formatPrice(kpis.pending),   color: 'from-amber-50 to-amber-100/40',     icon: '⏳' },
            { label: 'Cancelaciones',      value: kpis.cancelled,              color: 'from-red-50 to-red-100/40',         icon: '❌' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className={`bg-gradient-to-br ${color} border border-warm-100 rounded-2xl p-4`}>
              <p className="text-xs text-warm-400 font-medium">{icon} {label}</p>
              <p className="text-xl font-bold text-warm-900 mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Gráfica ingresos por día */}
      <div className="bg-white border border-warm-100 rounded-2xl p-4">
        <p className="font-semibold text-warm-800 mb-4">Ingresos diarios</p>
        {loading ? (
          <Skeleton className="h-48" />
        ) : revenueByDay.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-warm-400 text-sm">
            Sin datos para el período seleccionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByDay} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f0eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9e9589' }}
                interval={Math.max(0, Math.floor(revenueByDay.length / 7) - 1)} />
              <YAxis tick={{ fontSize: 10, fill: '#9e9589' }}
                tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="completado" name="Completado"
                stroke="#6366f1" fill="url(#gc)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="pendiente" name="Pendiente"
                stroke="#f59e0b" fill="url(#gp)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Ingresos por terapeuta */}
      <div className="bg-white border border-warm-100 rounded-2xl p-4">
        <p className="font-semibold text-warm-800 mb-4">Ingresos por terapeuta (Top 8)</p>
        {loading ? (
          <Skeleton className="h-48" />
        ) : revenueByTherapist.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-warm-400 text-sm">
            Sin datos aún
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByTherapist} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f0eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9e9589' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9e9589' }}
                tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} width={40} />
              <Tooltip
                formatter={(v) => [formatPrice(v), 'Ingresos']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #ede9e0', fontSize: '12px' }}
              />
              <Bar dataKey="value" name="Ingresos" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabla resumen por tipo */}
      {!loading && revenueByType.length > 0 && (
        <div className="bg-white border border-warm-100 rounded-2xl p-4">
          <p className="font-semibold text-warm-800 mb-3">Desglose por tipo de sesión</p>
          <div className="flex flex-col gap-2">
            {revenueByType.map(({ name, value }) => {
              const total = revenueByType.reduce((a, r) => a + r.value, 0)
              const pct   = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <div key={name} className="flex items-center gap-3">
                  <p className="text-sm text-warm-700 w-24 capitalize shrink-0">{name}</p>
                  <div className="flex-1 bg-warm-100 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-sm font-semibold text-warm-800 w-20 text-right shrink-0">
                    {formatPrice(value)}
                  </p>
                  <p className="text-xs text-warm-400 w-10 text-right shrink-0">{pct}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabla detalle sesiones */}
      {!loading && sessions.length > 0 && (
        <div className="bg-white border border-warm-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-warm-100">
            <p className="font-semibold text-warm-800">Detalle de sesiones ({sessions.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-50 text-warm-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-2 text-left font-medium">Fecha</th>
                  <th className="px-4 py-2 text-left font-medium">Terapeuta</th>
                  <th className="px-4 py-2 text-left font-medium">Tipo</th>
                  <th className="px-4 py-2 text-left font-medium">Estado</th>
                  <th className="px-4 py-2 text-right font-medium">Precio</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 50).map((s, i) => (
                  <tr key={s.id} className={`border-t border-warm-50 ${i % 2 ? 'bg-warm-50/30' : ''}`}>
                    <td className="px-4 py-2.5 text-warm-600 whitespace-nowrap">
                      {fmtDate(s.scheduled_at)}
                    </td>
                    <td className="px-4 py-2.5 text-warm-800 font-medium">
                      {s.therapist?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-warm-500 capitalize">
                      {s.session_type ?? 'individual'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.status === 'completed'  ? 'bg-emerald-100 text-emerald-700' :
                        s.status === 'scheduled'  ? 'bg-blue-100 text-blue-700'     :
                        s.status === 'cancelled'  ? 'bg-red-100 text-red-600'       :
                        'bg-warm-100 text-warm-500'
                      }`}>
                        {s.status === 'completed' ? 'Completada' :
                         s.status === 'scheduled' ? 'Programada' :
                         s.status === 'cancelled' ? 'Cancelada'  : s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-warm-800">
                      {formatPrice(s.price ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length > 50 && (
              <p className="text-xs text-warm-400 px-4 py-2 border-t border-warm-100">
                Mostrando 50 de {sessions.length} sesiones. Exporta en CSV para ver todas.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
