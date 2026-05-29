import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatSessionDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import { Select } from '@/components/ui/Input'

const STATUS_CONFIG = {
  scheduled:       { label: 'Programada',     color: 'text-primary-600 bg-primary-50' },
  in_progress:     { label: 'En curso',       color: 'text-amber-600 bg-amber-50' },
  completed:       { label: 'Completada',     color: 'text-emerald-600 bg-emerald-50' },
  cancelled:       { label: 'Cancelada',      color: 'text-red-600 bg-red-50' },
  payment_pending: { label: 'Pago pendiente', color: 'text-warm-500 bg-warm-100' },
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')

  // Métricas
  const [metrics, setMetrics] = useState({ total: 0, revenue: 0, completed: 0, cancelled: 0 })

  useEffect(() => { fetchSessions() }, [])

  const fetchSessions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('sessions')
      .select(`
        id, scheduled_at, status, price, is_urgent, paid_at, payment_intent_id, created_at,
        patient:profiles!sessions_patient_id_fkey(full_name),
        therapist:profiles!sessions_therapist_id_fkey(full_name)
      `)
      .order('scheduled_at', { ascending: false })

    const all = data ?? []
    setMetrics({
      total:     all.length,
      revenue:   all.filter(s => s.paid_at).reduce((a, s) => a + (s.price ?? 0), 0),
      completed: all.filter(s => s.status === 'completed').length,
      cancelled: all.filter(s => s.status === 'cancelled').length,
    })
    setSessions(all)
    setLoading(false)
  }

  const filtered = sessions.filter(s => filter === 'all' ? true : s.status === filter)

  const exportCSV = () => {
    const headers = ['ID', 'Paciente', 'Terapeuta', 'Fecha', 'Estado', 'Urgente', 'Monto (USD)', 'Pagado en']
    const rows = filtered.map(s => [
      s.id,
      s.patient?.full_name ?? '',
      s.therapist?.full_name ?? '',
      new Date(s.scheduled_at).toLocaleString('es-DO'),
      STATUS_CONFIG[s.status]?.label ?? s.status,
      s.is_urgent ? 'Sí' : 'No',
      s.paid_at ? (s.price ?? 0).toFixed(2) : '',
      s.paid_at ? new Date(s.paid_at).toLocaleString('es-DO') : '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `sesiones_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Sesiones y pagos</h1>
          <p className="text-warm-500 text-sm mt-1">Historial completo de sesiones</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors">
          ⬇ CSV
        </button>
      </div>

      {/* Métricas rápidas */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total sesiones', value: metrics.total, icon: '📅', color: 'bg-primary-50 text-primary-700' },
            { label: 'Ingresos',       value: formatPrice(metrics.revenue), icon: '💵', color: 'bg-emerald-50 text-emerald-700' },
            { label: 'Completadas',    value: metrics.completed, icon: '✅', color: 'bg-teal-50 text-teal-700' },
            { label: 'Canceladas',     value: metrics.cancelled, icon: '❌', color: 'bg-red-50 text-red-700' },
          ].map(m => (
            <div key={m.label} className={`rounded-2xl p-4 ${m.color}`}>
              <p className="text-xl mb-1">{m.icon}</p>
              <p className="text-xl font-bold">{m.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtro */}
      <Select value={filter} onChange={e => setFilter(e.target.value)} className="max-w-xs">
        <option value="all">Todas las sesiones</option>
        <option value="scheduled">Programadas</option>
        <option value="in_progress">En curso</option>
        <option value="completed">Completadas</option>
        <option value="cancelled">Canceladas</option>
        <option value="payment_pending">Pago pendiente</option>
      </Select>

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-warm-100 bg-warm-50">
                <th className="text-left px-4 py-3 text-warm-500 font-medium">Paciente</th>
                <th className="text-left px-4 py-3 text-warm-500 font-medium">Terapeuta</th>
                <th className="text-left px-4 py-3 text-warm-500 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 text-warm-500 font-medium">Estado</th>
                <th className="text-right px-4 py-3 text-warm-500 font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-warm-400">No hay sesiones</td></tr>
              ) : filtered.map((s, i) => {
                const st = STATUS_CONFIG[s.status] ?? { label: s.status, color: 'text-warm-500 bg-warm-50' }
                return (
                  <tr key={s.id} className={`border-b border-warm-50 ${i % 2 === 0 ? '' : 'bg-warm-50/30'}`}>
                    <td className="px-4 py-3 font-medium text-warm-900">{s.patient?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-warm-600">{s.therapist?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-warm-500 text-xs whitespace-nowrap">
                      {new Date(s.scheduled_at).toLocaleDateString('es-DO', { dateStyle: 'short' })}
                      {s.is_urgent && <span className="ml-1 text-orange-500">⚡</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-warm-900">
                      {s.paid_at ? formatPrice(s.price ?? 0) : <span className="text-warm-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
