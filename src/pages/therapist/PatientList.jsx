import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { formatDate, truncate, getDisplayName } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import { Search, Users, Calendar, EyeOff } from 'lucide-react'

export default function PatientList() {
  const { user } = useAuthStore()
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) fetchPatients()
  }, [user])

  const fetchPatients = async () => {
    setLoading(true)
    const now = new Date().toISOString()

    const { data } = await supabase
      .from('sessions')
      .select(`
        patient_id,
        scheduled_at,
        status,
        patient:profiles!sessions_patient_id_fkey(id, full_name, avatar_url, email, is_anonymous),
        clinical_history(id, diagnosis, created_at)
      `)
      .eq('therapist_id', user.id)
      .order('scheduled_at', { ascending: true })

    if (!data) { setLoading(false); return }

    // Agrupar por paciente para encontrar próxima y última sesión
    const patientMap = {}
    data.forEach(s => {
      const pid = s.patient_id
      if (!patientMap[pid]) {
        patientMap[pid] = { ...s, nextSession: null, lastSession: null }
      }
      // Próxima sesión futura programada
      if (s.status === 'scheduled' && s.scheduled_at >= now) {
        if (!patientMap[pid].nextSession || s.scheduled_at < patientMap[pid].nextSession) {
          patientMap[pid].nextSession = s.scheduled_at
        }
      }
      // Última sesión pasada
      if (s.scheduled_at < now) {
        if (!patientMap[pid].lastSession || s.scheduled_at > patientMap[pid].lastSession) {
          patientMap[pid].lastSession = s.scheduled_at
          patientMap[pid].scheduled_at = s.scheduled_at
          patientMap[pid].status = s.status
        }
      }
    })

    // Ordenar: primero los que tienen próxima cita (más cercana primero), luego los sin cita
    const sorted = Object.values(patientMap).sort((a, b) => {
      if (a.nextSession && b.nextSession) return a.nextSession.localeCompare(b.nextSession)
      if (a.nextSession) return -1
      if (b.nextSession) return 1
      return (b.lastSession ?? '').localeCompare(a.lastSession ?? '')
    })

    setPatients(sorted)
    setLoading(false)
  }

  const filtered = patients.filter(({ patient }) =>
    patient?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Mis pacientes</h1>
          <p className="text-warm-500 text-sm mt-1">{patients.length} pacientes en total</p>
        </div>
      </div>

      <Input
        placeholder="Buscar paciente por nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        prefix={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            {search ? <Search size={28} strokeWidth={1.8} className="text-primary-400" /> : <Users size={28} strokeWidth={1.8} className="text-primary-400" />}
          </div>
          <p className="font-semibold text-warm-800 mb-1">
            {search ? 'Sin resultados' : 'Aún no tienes pacientes'}
          </p>
          <p className="text-sm text-warm-400 max-w-xs leading-relaxed">
            {search
              ? `No encontramos pacientes con el nombre "${search}"`
              : 'Cuando un paciente agende una sesión contigo, aparecerá aquí automáticamente.'
            }
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 stagger-children">
          {filtered.map(({ patient, scheduled_at, status, clinical_history, nextSession, lastSession }) => (
            <Card key={patient.id} hover onClick={() => navigate(`/therapist/patients/${patient.id}`)}>
              <div className="flex items-center gap-4">
                <Avatar name={getDisplayName(patient)} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-warm-900">{getDisplayName(patient)}</p>
                    {patient.is_anonymous && (
                      <span className="text-[10px] text-warm-400 flex items-center gap-0.5">
                        <EyeOff size={10} strokeWidth={1.8} />Anónimo
                      </span>
                    )}
                  </div>
                  {nextSession ? (
                    <p className="text-xs text-primary-600 font-medium mt-0.5 flex items-center gap-1">
                      <Calendar size={11} strokeWidth={1.8} /> Próxima cita: {formatDate(nextSession)}
                    </p>
                  ) : (
                    <p className="text-xs text-warm-400 mt-0.5">
                      Última sesión: {formatDate(lastSession ?? scheduled_at)}
                    </p>
                  )}
                  {clinical_history?.[0]?.diagnosis && (
                    <p className="text-xs text-warm-400 mt-0.5 truncate">
                      {truncate(clinical_history[0].diagnosis, 55)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={nextSession ? 'primary' : status === 'completed' ? 'neutral' : 'calm'} dot>
                    {nextSession ? 'Cita próxima' : status === 'completed' ? 'Atendido' : 'Activo'}
                  </Badge>
                  <span className="text-xs text-warm-400">
                    {clinical_history?.length ?? 0} notas
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
