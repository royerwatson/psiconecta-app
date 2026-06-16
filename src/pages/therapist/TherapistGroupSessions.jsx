import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Spinner'
import { formatSessionDate, formatPrice } from '@/lib/utils'
import { Users, Calendar, DollarSign, Video } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

export default function TherapistGroupSessions() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const [groups, setGroups]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchGroups() }, [user])

  const fetchGroups = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('group_sessions')
      .select(`
        *,
        participants:group_session_participants(
          patient_id,
          profile:profiles!group_session_participants_patient_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('therapist_id', user.id)
      .order('scheduled_at', { ascending: false })
    setGroups(data ?? [])
    setLoading(false)
  }

  const upcoming = groups.filter(g => g.status === 'scheduled')
  const past     = groups.filter(g => g.status !== 'scheduled')

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-warm-900">Mis sesiones grupales</h1>
        <p className="text-warm-500 text-sm mt-1">Sesiones grupales que tienes asignadas</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}</div>
      ) : groups.length === 0 ? (
        <Card className="text-center py-12">
          <Users size={40} strokeWidth={1.5} className="mx-auto mb-3 text-warm-300" />
          <p className="text-warm-500">No tienes sesiones grupales asignadas</p>
          <p className="text-warm-400 text-sm mt-1">El administrador las creará y te asignará como facilitador</p>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-warm-500 uppercase tracking-widest">Próximas</h2>
              {upcoming.map(g => <GroupCard key={g.id} group={g} navigate={navigate} />)}
            </section>
          )}
          {past.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-warm-500 uppercase tracking-widest">Anteriores</h2>
              {past.map(g => <GroupCard key={g.id} group={g} navigate={navigate} />)}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function GroupCard({ group, navigate }) {
  const participants = group.participants ?? []
  const isFull = participants.length >= (group.max_participants ?? 10)

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-warm-900">{group.title}</p>
            <Badge variant={
              group.status === 'completed' ? 'success' :
              group.status === 'cancelled' ? 'danger' : 'primary'
            } dot>
              {group.status === 'completed' ? 'Completada' :
               group.status === 'cancelled' ? 'Cancelada' : 'Programada'}
            </Badge>
            {isFull && <Badge variant="warning">Cupo lleno</Badge>}
          </div>

          {group.description && (
            <p className="text-sm text-warm-500 mt-1 line-clamp-2">{group.description}</p>
          )}

          <div className="flex flex-wrap gap-4 mt-2 text-xs text-warm-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} strokeWidth={1.8} />
              {formatSessionDate(group.scheduled_at)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} strokeWidth={1.8} />
              {participants.length}/{group.max_participants ?? 10} participantes
            </span>
            <span className="flex items-center gap-1">
              <DollarSign size={12} strokeWidth={1.8} />
              {formatPrice(group.price ?? 0)}/persona
            </span>
          </div>

          {participants.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-warm-400 mb-1.5">Participantes inscritos:</p>
              <div className="flex flex-wrap gap-1.5">
                {participants.map(p => (
                  <span key={p.patient_id}
                    className="text-xs bg-warm-100 text-warm-700 px-2 py-0.5 rounded-full">
                    {p.profile?.full_name ?? 'Paciente'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {group.status === 'scheduled' && group.video_room_url && (
          <Button size="sm" onClick={() => navigate(`/video-call/${group.id}`)}>
            <Video size={13} className="mr-1" strokeWidth={1.8} />
            Iniciar sesión
          </Button>
        )}
      </div>
    </Card>
  )
}
