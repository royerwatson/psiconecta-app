import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatSessionDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import { Select } from '@/components/ui/Input'
import { Calendar, DollarSign, CheckCircle2, XCircle, Zap, Download } from 'lucide-react'

const STATUS_CONFIG = {
  scheduled:       { label: 'Programada',     color: 'text-primary-600 bg-primary-50' },
  in_progress:     { label: 'En curso',       color: 'text-amber-600 bg-amber-50' },
  completed:       { label: 'Completada',     color: 'text-emerald-600 bg-emerald-50' },
  cancelled:       { label: 'Cancelada',      color: 'text-red-600 bg-red-50' },
  payment_pending: { label: 'Pago pendiente', color: 'text-warm-500 bg-warm-100' },
}

const PAGE_SIZE = 50

export default function AdminSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [hasMore, setHasMore]   = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Métricas
  const [metrics, setMetrics] = useState({ total: 0, revenue: 0, completed: 0, cancelled: 0 })

  useEffect(() => { fetchSessions() }, [])

  const fetchSessions = async () => {
    setLoading(true)

    // Métricas globales (query ligera de todas las filas)
    const { data: allLight } = await supabase
      .from('sessions')
      .select('status, price, paid_at')
    const all = allLight ?? []
    setMetrics({
      total:     all.length,
      revenue:   all.filter(s => s.paid_at).reduce((a, s) => a + (s.price ?? 0), 0),
      completed: all.filter(s => s.status === 'completed').length,
      cancelled: all.filter(s => s.status === 'cancelled').length,
    })

    // Lista detallada paginada
    const { data } = await supabase
      .from('sessions')
      .select(`
        id, scheduled_at, status, price, is_urgent, paid_at, payment_intent_id, created_at,
        patient:profiles!sessions_patient_id_fkey(full_name),
        therapist:profiles!sessions_therapist_id_fkey(full_name)
      `)
      .order('scheduled_at', { ascending: false })
      .range(0, PAGE_SIZE - 1)

    setSessions(data ?? [])
    setHasMore((data ?? []).length === PAGE_SIZE)
    setLoading(false)
  }

  const loadMore = async () => {
    setLoadingMore(true)
    const { data } = await supabase
      .from('sessions')
      .select(`
        id, scheduled_at, status, price, is_urgent, paid_at, payment_intent_id, created_at,
        patient:profiles!sessions_patient_id_fkey(full_name),
        therapist:profiles!sessions_therapist_id_fkey(full_name)
      `)
      .order('scheduled_at', { ascending: false })
      .range(sessions.length, sessions.length + PAGE_SIZE - 1)
    setSessions(prev => [...prev, ...(data ?? [])])
    setHasMore((data ?? []).length === PAGE_SIZE)
    setLoadingMore(false)
  }

  const filtered = sessions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (s.patient?.full_name ?? '').toLowerCase().includes(q)
      || (s.therapist?.full_name ?? '').toLowerCase().includes(q)
  })

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
          <Download size={13} className="mr-1.5" strokeWidth={1.8} />CSV
        </button>
      </div>

      {/* Métricas rápidas */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total sesiones', value: metrics.total,              Icon: Calendar,    color: 'bg-primary-50 text-primary-700'  },
            { label: 'Ingresos',       value: formatPrice(metrics.revenue), Icon: DollarSign,  color: 'bg-emerald-50 text-emerald-700' },
            { label: 'Completadas',    value: metrics.completed,            Icon: CheckCircle2, color: 'bg-teal-50 text-teal-700'      },
            { label: 'Canceladas',     value: metrics.cancelled,            Icon: XCircle,     color: 'bg-red-50 text-red-700'         },
          ].map(m => (
            <div key={m.label} className={`rounded-2xl p-4 ${m.color}`}>
              <m.Icon size={18} strokeWidth={1.8} className="mb-1 opacity-80" />
              <p className="text-xl font-bold">{m.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Búsqueda + filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por paciente o terapeuta..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
        <Select value={filter} onChange={e => setFilter(e.target.value)} className="max-w-xs">
          <option value="all">Todas las sesiones</option>
          <option value="scheduled">Programadas</option>
          <option value="in_progress">En curso</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
          <option value="payment_pending">Pago pendiente</option>
        </Select>
      </div>

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
                      {s.is_urgent && <Zap size={12} className="ml-1 inline text-orange-500" fill="currentColor" />}
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

      {/* Paginación */}
      {!loading && hasMore && !search.trim() && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="mx-auto px-6 py-2.5 rounded-xl border border-warm-200 bg-white text-sm font-medium text-warm-600 hover:border-warm-300 transition-colors disabled:opacity-50"
        >
          {loadingMore ? 'Cargando...' : `Cargar más (mostrando ${sessions.length} de ${metrics.total})`}
        </button>
      )}
    </div>
  )
}
