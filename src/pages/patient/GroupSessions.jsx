import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Avatar, { AvatarGroup } from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatSessionDate, formatPrice } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { Users, AlertTriangle, Calendar, Video } from 'lucide-react'

export default function GroupSessions() {
  const { user } = useAuthStore()
  const [groups, setGroups] = useState([])
  const [myGroups, setMyGroups] = useState([])
  const [tab, setTab] = useState('available')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { if (user) fetchGroups() }, [user])

  const fetchGroups = async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: all, error: e1 }, { data: mine, error: e2 }] = await Promise.all([
        supabase.from('group_sessions').select(`
          *,
          therapist:profiles!group_sessions_therapist_id_fkey(id, full_name, avatar_url),
          participants:group_session_participants(patient_id, profile:profiles!group_session_participants_patient_id_fkey(full_name))
        `).gte('scheduled_at', new Date().toISOString()).order('scheduled_at'),
        supabase.from('group_session_participants').select(`
          group_session:group_sessions(*, therapist:profiles!group_sessions_therapist_id_fkey(id, full_name))
        `).eq('patient_id', user.id),
      ])
      if (e1 || e2) throw e1 ?? e2
      setGroups(all ?? [])
      setMyGroups((mine ?? []).map(m => m.group_session).filter(Boolean))
    } catch (err) {
      console.error('Error cargando sesiones grupales:', err)
      setError('No pudimos cargar las sesiones grupales. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const joinGroup = async (group) => {
    const isFull = (group.participants?.length ?? 0) >= (group.max_participants ?? 10)
    if (isFull) { toast.error('Esta sesión está llena'); return }
    const alreadyJoined = group.participants?.some(p => p.patient_id === user.id)
    if (alreadyJoined) { toast('Ya estás inscrito en esta sesión'); return }

    const { error } = await supabase.from('group_session_participants').insert({
      group_session_id: group.id,
      patient_id: user.id,
    })
    if (error) { toast.error('Error al unirse'); return }
    toast.success('¡Te has inscrito a la sesión grupal!')
    fetchGroups()
  }

  const displayed = tab === 'available' ? groups : myGroups

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Terapia grupal</h1>
        <p className="text-warm-500 text-sm mt-1">Sesiones grupales facilitadas por terapeutas</p>
      </div>

      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
        <p className="text-sm font-medium text-primary-800 mb-1 flex items-center gap-1.5"><Users size={15} strokeWidth={1.8} className="shrink-0" /> ¿Qué es la terapia grupal?</p>
        <p className="text-xs text-primary-600">
          Sesiones guiadas por un terapeuta donde varios participantes comparten experiencias
          y se apoyan mutuamente en un ambiente seguro y confidencial.
        </p>
      </div>

      <div className="flex gap-1 bg-warm-100 p-1 rounded-2xl">
        {[
          { id: 'available', label: 'Disponibles' },
          { id: 'mine', label: 'Mis inscripciones' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 text-sm font-medium py-2.5 rounded-xl transition-all ${
              tab === t.id ? 'bg-white shadow-sm text-primary-700' : 'text-warm-500'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2].map(i => <Skeleton key={i} className="h-40" />)}</div>
      ) : error ? (
        <Card className="text-center py-10">
          <AlertTriangle size={40} strokeWidth={1.5} className="mx-auto mb-3 text-warm-300" />
          <p className="text-warm-600 font-medium">{error}</p>
          <Button size="sm" className="mt-4" onClick={fetchGroups}>Reintentar</Button>
        </Card>
      ) : displayed.length === 0 ? (
        <Card className="text-center py-10">
          <Users size={40} strokeWidth={1.5} className="mx-auto mb-3 text-warm-300" />
          <p className="text-warm-600 font-medium">
            {tab === 'available' ? 'No hay sesiones disponibles' : 'No estás inscrito en ninguna sesión'}
          </p>
        </Card>
      ) : displayed.map((group) => {
        const participants = group.participants ?? []
        const isFull = participants.length >= (group.max_participants ?? 10)
        const isJoined = participants.some(p => p.patient_id === user.id) ||
          myGroups.some(g => g.id === group.id)

        return (
          <Card key={group.id}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <p className="font-semibold text-warm-900">{group.title}</p>
                <p className="text-sm text-warm-500 mt-0.5">{group.description}</p>
              </div>
              <Badge variant={isFull ? 'danger' : isJoined ? 'success' : 'primary'}>
                {isFull ? 'Lleno' : isJoined ? 'Inscrito' : 'Disponible'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-warm-600 mb-3">
              <Avatar name={group.therapist?.full_name ?? ''} size="xs" />
              <span>{group.therapist?.full_name}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-warm-500 mb-4">
              <span className="flex items-center gap-1"><Calendar size={13} strokeWidth={1.8} className="shrink-0" /> {formatSessionDate(group.scheduled_at)}</span>
              <span className="flex items-center gap-1"><Users size={13} strokeWidth={1.8} className="shrink-0" /> {participants.length}/{group.max_participants ?? 10} participantes</span>
              <span className="font-medium text-primary-600">{formatPrice(group.price ?? 0)}</span>
            </div>

            {participants.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <AvatarGroup
                  names={participants.map(p => p.profile?.full_name ?? '?')}
                  max={4} size="xs"
                />
                <span className="text-xs text-warm-400">se han unido</span>
              </div>
            )}

            <div className="flex gap-2">
              {isJoined ? (
                <Button size="sm" variant="calm" fullWidth
                  onClick={() => navigate(`/video-call/${group.id}`)}>
                  <Video size={15} strokeWidth={1.8} className="inline mr-1" />Unirse a la sesión
                </Button>
              ) : (
                <Button size="sm" fullWidth disabled={isFull} onClick={() => joinGroup(group)}>
                  {isFull ? 'Sesión llena' : 'Inscribirme'}
                </Button>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
