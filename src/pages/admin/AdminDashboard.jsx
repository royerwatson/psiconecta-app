import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'

function StatCard({ icon, label, value, sub, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-700 border-primary-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber:   'bg-amber-50 text-amber-700 border-amber-100',
    violet:  'bg-violet-50 text-violet-700 border-violet-100',
  }
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentSessions, setRecentSessions] = useState([])

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    setLoading(true)

    const [
      { count: totalPatients },
      { count: totalTherapists },
      { count: pendingTherapists },
      { data: sessions },
      { data: recent },
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
    ])

    const completedSessions = (sessions ?? []).filter(s => s.status === 'completed')
    const totalRevenue = (sessions ?? [])
      .filter(s => s.paid_at)
      .reduce((sum, s) => sum + (s.price ?? 0), 0)
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const monthRevenue = (sessions ?? [])
      .filter(s => s.paid_at && new Date(s.paid_at) >= thisMonth)
      .reduce((sum, s) => sum + (s.price ?? 0), 0)

    setStats({
      totalPatients: totalPatients ?? 0,
      totalTherapists: totalTherapists ?? 0,
      pendingTherapists: pendingTherapists ?? 0,
      totalSessions: sessions?.length ?? 0,
      completedSessions: completedSessions.length,
      totalRevenue,
      monthRevenue,
    })
    setRecentSessions(recent ?? [])
    setLoading(false)
  }

  const statusLabel = {
    scheduled:   { label: 'Programada', color: 'text-primary-600 bg-primary-50' },
    in_progress: { label: 'En curso',   color: 'text-amber-600 bg-amber-50' },
    completed:   { label: 'Completada', color: 'text-emerald-600 bg-emerald-50' },
    cancelled:   { label: 'Cancelada',  color: 'text-red-600 bg-red-50' },
    payment_pending: { label: 'Pago pendiente', color: 'text-warm-500 bg-warm-50' },
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Panel de administración</h1>
        <p className="text-warm-500 text-sm mt-1">Resumen general de Psiconecta</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon="👥" label="Pacientes" value={stats.totalPatients} color="primary" />
            <StatCard icon="🧠" label="Terapeutas" value={stats.totalTherapists}
              sub={stats.pendingTherapists > 0 ? `${stats.pendingTherapists} pendientes de verificar` : 'Todos verificados'}
              color="violet" />
            <StatCard icon="📅" label="Sesiones totales" value={stats.totalSessions}
              sub={`${stats.completedSessions} completadas`} color="amber" />
            <StatCard icon="💵" label="Ingresos totales" value={formatPrice(stats.totalRevenue)}
              sub={`Este mes: ${formatPrice(stats.monthRevenue)}`} color="emerald" />
          </div>

          {/* Alerta terapeutas pendientes */}
          {stats.pendingTherapists > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-amber-800 text-sm">
                  {stats.pendingTherapists} terapeuta{stats.pendingTherapists > 1 ? 's' : ''} esperando verificación
                </p>
                <p className="text-xs text-amber-600 mt-0.5">Ve a "Terapeutas" para revisar sus credenciales</p>
              </div>
            </div>
          )}

          {/* Sesiones recientes */}
          <div>
            <h2 className="font-semibold text-warm-800 mb-3">Sesiones recientes</h2>
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
        </>
      )}
    </div>
  )
}
