import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function AdminPatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [toggling, setToggling] = useState(null) // userId being toggled

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

    setPatients((data ?? []).map(p => ({
      ...p,
      is_active:        p.is_active ?? true,
      totalSessions:    p.sessions_as_patient?.length ?? 0,
      completedSessions: (p.sessions_as_patient ?? []).filter(s => s.status === 'completed').length,
      lastSession:      p.sessions_as_patient?.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))[0]?.scheduled_at,
    })))
    setLoading(false)
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

    toast.success(newState ? '✅ Cuenta reactivada' : '🚫 Cuenta desactivada')
    setToggling(null)
    fetchPatients()
  }

  const filtered = patients.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Pacientes</h1>
        <p className="text-warm-500 text-sm mt-1">{patients.length} pacientes registrados</p>
      </div>

      <Input placeholder="Buscar por nombre..."
        value={search} onChange={e => setSearch(e.target.value)}
        prefix={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
      />

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-100 bg-warm-50">
                <th className="text-left px-4 py-3 text-warm-500 font-medium">Paciente</th>
                <th className="text-center px-4 py-3 text-warm-500 font-medium hidden sm:table-cell">Sesiones</th>
                <th className="text-center px-4 py-3 text-warm-500 font-medium hidden md:table-cell">Completadas</th>
                <th className="text-right px-4 py-3 text-warm-500 font-medium">Registrado</th>
                <th className="text-center px-4 py-3 text-warm-500 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-warm-400">No se encontraron pacientes</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} className={`border-b border-warm-50 ${i % 2 === 0 ? '' : 'bg-warm-50/30'} ${!p.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.full_name ?? ''} size="sm" />
                      <div>
                        <span className="font-medium text-warm-900">{p.full_name}</span>
                        {!p.is_active && <span className="ml-2 text-xs text-red-500 font-medium">Desactivada</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-warm-600 hidden sm:table-cell">{p.totalSessions}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-emerald-600 font-medium">{p.completedSessions}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-warm-400 text-xs">
                    {new Date(p.created_at).toLocaleDateString('es-DO', { dateStyle: 'short' })}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
