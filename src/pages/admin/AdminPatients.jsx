import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'
import { Calendar, ClipboardList, Bot } from 'lucide-react'

const RISK_CONFIG = {
  high:   { label: 'Alto',  badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500'   },
  medium: { label: 'Medio', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  low:    { label: 'Bien',  badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
}

export default function AdminPatients() {
  const [patients, setPatients]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [toggling, setToggling]   = useState(null)
  const [selected, setSelected]   = useState(null)   // patient id for detail modal
  const [detail, setDetail]       = useState(null)   // detail data
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [riskFilter, setRiskFilter] = useState('all') // all | high | medium | active | inactive

  useEffect(() => { fetchPatients() }, [])

  const fetchPatients = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select(`
        id, full_name, avatar_url, created_at, is_active,
        sessions_as_patient:sessions!sessions_patient_id_fkey(id, status, price, scheduled_at)
      `)
      .in('role', ['patient', 'client'])
      .order('created_at', { ascending: false })

    // Fetch last check-in risk per patient
    const ids = (data ?? []).map(p => p.id)
    let riskMap = {}
    if (ids.length > 0) {
      const { data: checkins } = await supabase
        .from('ai_checkins')
        .select('patient_id, risk_level, created_at, notified')
        .in('patient_id', ids)
        .order('created_at', { ascending: false })

      // Keep only most recent per patient
      ;(checkins ?? []).forEach(c => {
        if (!riskMap[c.patient_id]) riskMap[c.patient_id] = c
      })
    }

    // Fetch pending tasks count per patient
    let tasksMap = {}
    if (ids.length > 0) {
      const { data: tasks } = await supabase
        .from('patient_tasks')
        .select('patient_id, completed_at')
        .in('patient_id', ids)
      ;(tasks ?? []).forEach(t => {
        if (!tasksMap[t.patient_id]) tasksMap[t.patient_id] = { pending: 0, total: 0 }
        tasksMap[t.patient_id].total += 1
        if (!t.completed_at) tasksMap[t.patient_id].pending += 1
      })
    }

    setPatients((data ?? []).map(p => ({
      ...p,
      is_active:         p.is_active ?? true,
      totalSessions:     p.sessions_as_patient?.length ?? 0,
      completedSessions: (p.sessions_as_patient ?? []).filter(s => s.status === 'completed').length,
      totalRevenue:      (p.sessions_as_patient ?? []).filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.price ?? 0), 0),
      lastSession:       p.sessions_as_patient?.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))[0]?.scheduled_at,
      lastCheckin:       riskMap[p.id] ?? null,
      tasks:             tasksMap[p.id] ?? { pending: 0, total: 0 },
    })))
    setLoading(false)
  }

  const openDetail = async (patient) => {
    setSelected(patient.id)
    setLoadingDetail(true)
    setDetail(null)

    const [
      { data: sessions },
      { data: checkins },
      { data: tasks },
    ] = await Promise.all([
      supabase.from('sessions')
        .select(`id, scheduled_at, status, price, therapist:profiles!sessions_therapist_id_fkey(full_name)`)
        .eq('patient_id', patient.id)
        .order('scheduled_at', { ascending: false })
        .limit(10),
      supabase.from('ai_checkins')
        .select('id, risk_level, ai_message, created_at, notified')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('patient_tasks')
        .select('id, title, status, completed_at, due_date, created_at')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    setDetail({ patient, sessions: sessions ?? [], checkins: checkins ?? [], tasks: tasks ?? [] })
    setLoadingDetail(false)
  }

  const toggleActive = async (patient) => {
    const newState = !patient.is_active
    setToggling(patient.id)

    const { data: { session: authSession } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-toggle-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authSession?.access_token}`,
      },
      body: JSON.stringify({ userId: patient.id, activate: newState }),
    })

    if (!res.ok) {
      toast.error('Error al cambiar estado de la cuenta')
      setToggling(null)
      return
    }

    toast.success(newState ? 'Cuenta reactivada' : 'Cuenta desactivada')
    setToggling(null)
    fetchPatients()
  }

  const filtered = patients.filter(p => {
    if (!p.full_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (riskFilter === 'high')     return p.lastCheckin?.risk_level === 'high'
    if (riskFilter === 'medium')   return p.lastCheckin?.risk_level === 'medium'
    if (riskFilter === 'active')   return p.is_active
    if (riskFilter === 'inactive') return !p.is_active
    return true
  })

  const STATUS_MAP = {
    scheduled:   { label: 'Programada', color: 'text-primary-600 bg-primary-50' },
    in_progress: { label: 'En curso',   color: 'text-amber-600 bg-amber-50' },
    completed:   { label: 'Completada', color: 'text-emerald-600 bg-emerald-50' },
    cancelled:   { label: 'Cancelada',  color: 'text-red-600 bg-red-50' },
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Pacientes</h1>
        <p className="text-warm-500 text-sm mt-1">{patients.length} pacientes registrados</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por nombre..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1"
          prefix={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all',      label: 'Todos' },
            { id: 'high',     label: 'Riesgo alto',  dot: 'bg-red-500'   },
            { id: 'medium',   label: 'Riesgo medio', dot: 'bg-amber-500' },
            { id: 'active',   label: 'Activos' },
            { id: 'inactive', label: 'Inactivos' },
          ].map(f => (
            <button key={f.id} onClick={() => setRiskFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
                riskFilter === f.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
              }`}>
              {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${riskFilter === f.id ? 'bg-white' : f.dot}`} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-100 bg-warm-50">
                <th className="text-left px-4 py-3 text-warm-500 font-medium">Paciente</th>
                <th className="text-center px-4 py-3 text-warm-500 font-medium hidden sm:table-cell">Sesiones</th>
                <th className="text-center px-4 py-3 text-warm-500 font-medium hidden md:table-cell">Tareas</th>
                <th className="text-center px-4 py-3 text-warm-500 font-medium hidden md:table-cell">Último check-in</th>
                <th className="text-right px-4 py-3 text-warm-500 font-medium hidden lg:table-cell">Ingresos</th>
                <th className="text-center px-4 py-3 text-warm-500 font-medium">Estado</th>
                <th className="text-center px-4 py-3 text-warm-500 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-warm-400">No se encontraron pacientes</td></tr>
              ) : filtered.map((p, i) => {
                const rc = p.lastCheckin ? (RISK_CONFIG[p.lastCheckin.risk_level] ?? RISK_CONFIG.low) : null
                return (
                  <tr key={p.id}
                    className={`border-b border-warm-50 ${i % 2 === 0 ? '' : 'bg-warm-50/30'} ${!p.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.full_name ?? ''} size="sm" />
                        <div>
                          <span className="font-medium text-warm-900">{p.full_name}</span>
                          {!p.is_active && <span className="ml-2 text-xs text-red-500 font-medium">Desactivada</span>}
                          <p className="text-xs text-warm-400 mt-0.5">
                            Desde {new Date(p.created_at).toLocaleDateString('es-DO', { dateStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="font-medium text-warm-700">{p.completedSessions}</span>
                      <span className="text-warm-300">/{p.totalSessions}</span>
                    </td>

                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {p.tasks.total > 0 ? (
                        <div>
                          <span className="text-amber-600 font-medium">{p.tasks.pending}</span>
                          <span className="text-warm-300 text-xs"> pend.</span>
                        </div>
                      ) : <span className="text-warm-300 text-xs">—</span>}
                    </td>

                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {rc ? (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${rc.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />{rc.label}
                        </span>
                      ) : <span className="text-warm-300 text-xs">Sin datos</span>}
                    </td>

                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-emerald-600 font-medium text-xs">{formatPrice(p.totalRevenue)}</span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        disabled={toggling === p.id}
                        onClick={() => toggleActive(p)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          p.is_active ? 'bg-emerald-500' : 'bg-warm-300'
                        } ${toggling === p.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                        title={p.is_active ? 'Desactivar cuenta' : 'Reactivar cuenta'}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          p.is_active ? 'translate-x-4' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openDetail(p)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200 transition-colors"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalle del paciente */}
      <Modal
        isOpen={!!selected}
        onClose={() => { setSelected(null); setDetail(null) }}
        title={detail?.patient?.full_name ?? 'Detalle del paciente'}
      >
        {loadingDetail ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : detail ? (
          <div className="flex flex-col gap-5">

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary-700">{detail.sessions.filter(s => s.status === 'completed').length}</p>
                <p className="text-xs text-primary-500 mt-0.5">Sesiones</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-700">{detail.tasks.filter(t => !t.completed_at).length}</p>
                <p className="text-xs text-amber-500 mt-0.5">Tareas pend.</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${
                detail.checkins[0]?.risk_level === 'high'   ? 'bg-red-50' :
                detail.checkins[0]?.risk_level === 'medium' ? 'bg-amber-50' : 'bg-green-50'
              }`}>
                <div className="flex justify-center">
                  <span className={`w-5 h-5 rounded-full ${
                    RISK_CONFIG[detail.checkins[0]?.risk_level ?? 'low']?.dot ?? 'bg-warm-200'
                  }`} />
                </div>
                <p className={`text-xs mt-0.5 ${
                  detail.checkins[0]?.risk_level === 'high'   ? 'text-red-500' :
                  detail.checkins[0]?.risk_level === 'medium' ? 'text-amber-500' : 'text-green-500'
                }`}>Último check-in</p>
              </div>
            </div>

            {/* Sesiones recientes */}
            <div>
              <h3 className="font-semibold text-warm-800 mb-2 text-sm flex items-center gap-1.5"><Calendar size={13} className="text-warm-400" />Sesiones recientes</h3>
              {detail.sessions.length === 0 ? (
                <p className="text-warm-400 text-sm">Sin sesiones registradas</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {detail.sessions.slice(0, 5).map(s => {
                    const st = STATUS_MAP[s.status] ?? { label: s.status, color: 'text-warm-500 bg-warm-50' }
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-2 p-2.5 bg-warm-50 rounded-xl text-sm">
                        <div>
                          <p className="text-xs font-medium text-warm-700">{s.therapist?.full_name ?? '—'}</p>
                          <p className="text-xs text-warm-400">
                            {new Date(s.scheduled_at).toLocaleDateString('es-DO', { dateStyle: 'medium' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                          {s.price > 0 && <span className="text-xs text-emerald-600 font-medium">{formatPrice(s.price)}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Tareas */}
            <div>
              <h3 className="font-semibold text-warm-800 mb-2 text-sm flex items-center gap-1.5"><ClipboardList size={13} className="text-warm-400" />Tareas asignadas</h3>
              {detail.tasks.length === 0 ? (
                <p className="text-warm-400 text-sm">Sin tareas asignadas</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {detail.tasks.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between gap-2 p-2.5 bg-warm-50 rounded-xl text-sm">
                      <span className={`font-medium ${t.completed_at ? 'line-through text-warm-400' : 'text-warm-800'}`}>
                        {t.title}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.completed_at ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {t.completed_at ? 'Completada' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Check-ins recientes */}
            <div>
              <h3 className="font-semibold text-warm-800 mb-2 text-sm flex items-center gap-1.5"><Bot size={13} className="text-warm-400" />Últimos check-ins</h3>
              {detail.checkins.length === 0 ? (
                <p className="text-warm-400 text-sm">Sin check-ins registrados</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {detail.checkins.slice(0, 5).map(c => {
                    const rc = RISK_CONFIG[c.risk_level] ?? RISK_CONFIG.low
                    return (
                      <div key={c.id} className={`p-2.5 rounded-xl text-sm border ${
                        c.risk_level === 'high'   ? 'bg-red-50 border-red-100' :
                        c.risk_level === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${rc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />{rc.label}
                          </span>
                          <span className="text-xs text-warm-400">
                            {new Date(c.created_at).toLocaleDateString('es-DO', { dateStyle: 'short' })}
                          </span>
                        </div>
                        {c.ai_message && (
                          <p className="text-xs mt-1.5 opacity-80 line-clamp-2">{c.ai_message}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

const STATUS_MAP = {
  scheduled:   { label: 'Programada', color: 'text-primary-600 bg-primary-50' },
  in_progress: { label: 'En curso',   color: 'text-amber-600 bg-amber-50' },
  completed:   { label: 'Completada', color: 'text-emerald-600 bg-emerald-50' },
  cancelled:   { label: 'Cancelada',  color: 'text-red-600 bg-red-50' },
}
