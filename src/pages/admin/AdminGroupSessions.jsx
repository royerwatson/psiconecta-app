import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatSessionDate, formatPrice } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input, { Select, Textarea } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { differenceInHours, parseISO } from 'date-fns'

const EMPTY_FORM = {
  therapist_id:    '',
  topic:           '',
  description:     '',
  scheduled_at:    '',
  max_participants: 8,
  price_per_person: 30,
}

export default function AdminGroupSessions() {
  const [groups, setGroups]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [therapists, setTherapists] = useState([])
  const [saving, setSaving]       = useState(false)
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: gs }, { data: th }] = await Promise.all([
      supabase
        .from('group_sessions')
        .select(`
          *,
          therapist:profiles!group_sessions_therapist_id_fkey(id, full_name, avatar_url),
          participants:group_session_participants(patient_id)
        `)
        .order('scheduled_at', { ascending: false }),
      supabase
        .from('therapist_profiles')
        .select('user_id, specialty, profile:profiles!therapist_profiles_user_id_fkey(id, full_name)')
        .eq('verified', true),
    ])

    setGroups(gs ?? [])
    setTherapists(th ?? [])
    setLoading(false)
  }

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const createGroup = async () => {
    if (!form.therapist_id || !form.topic || !form.scheduled_at) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('group_sessions').insert({
      therapist_id:     form.therapist_id,
      topic:            form.topic,
      description:      form.description,
      scheduled_at:     new Date(form.scheduled_at).toISOString(),
      max_participants: Number(form.max_participants),
      price_per_person: Number(form.price_per_person),
      status:           'scheduled',
    })
    if (error) { toast.error('Error al crear sesión grupal'); setSaving(false); return }
    toast.success('✅ Sesión grupal creada')
    setCreateModal(false)
    setForm(EMPTY_FORM)
    setSaving(false)
    fetchAll()
  }

  const cancelGroup = async (group) => {
    const hours = differenceInHours(parseISO(group.scheduled_at), new Date())
    if (hours < 2) { toast.error('No puedes cancelar con menos de 2 horas'); return }
    setCancelling(group.id)
    const { error } = await supabase
      .from('group_sessions')
      .update({ status: 'cancelled' })
      .eq('id', group.id)
    if (error) { toast.error('Error al cancelar'); setCancelling(null); return }
    toast.success('Sesión grupal cancelada')
    setCancelling(null)
    fetchAll()
  }

  const filtered = filter === 'all' ? groups : groups.filter(g => g.status === filter)

  const counts = {
    all:       groups.length,
    scheduled: groups.filter(g => g.status === 'scheduled').length,
    completed: groups.filter(g => g.status === 'completed').length,
    cancelled: groups.filter(g => g.status === 'cancelled').length,
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Sesiones grupales</h1>
          <p className="text-warm-500 text-sm mt-1">Gestión de terapia grupal</p>
        </div>
        <Button onClick={() => setCreateModal(true)}>+ Nueva sesión grupal</Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all',       label: 'Todas' },
          { id: 'scheduled', label: '📅 Programadas' },
          { id: 'completed', label: '✅ Completadas' },
          { id: 'cancelled', label: '❌ Canceladas' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filter === f.id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
            }`}>
            {f.label} <span className="ml-1 opacity-70">({counts[f.id]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-warm-400">
          <div className="text-4xl mb-2">👥</div>
          <p>No hay sesiones grupales en esta categoría</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(g => {
            const slots     = g.max_participants - (g.participants?.length ?? 0)
            const isFull    = slots <= 0
            return (
              <div key={g.id} className="bg-white rounded-2xl border border-warm-100 p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={g.therapist?.full_name ?? ''} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-warm-900">{g.topic}</p>
                        <p className="text-sm text-warm-500">{g.therapist?.full_name}</p>
                      </div>
                      <Badge variant={
                        g.status === 'completed' ? 'success' :
                        g.status === 'cancelled' ? 'danger' : 'primary'
                      } dot>
                        {g.status === 'completed' ? 'Completada' :
                         g.status === 'cancelled' ? 'Cancelada' : 'Programada'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-warm-500">
                      <span>📅 {formatSessionDate(g.scheduled_at)}</span>
                      <span>👥 {g.participants?.length ?? 0}/{g.max_participants} participantes</span>
                      <span>💵 {formatPrice(g.price_per_person)}/persona</span>
                      {isFull && <span className="text-amber-600 font-medium">Cupo lleno</span>}
                    </div>

                    {g.description && (
                      <p className="text-xs text-warm-400 mt-1 line-clamp-1">{g.description}</p>
                    )}
                  </div>
                </div>

                {g.status === 'scheduled' && (
                  <div className="mt-3 pt-3 border-t border-warm-100 flex justify-end">
                    <Button size="sm" variant="outline" loading={cancelling === g.id}
                      onClick={() => cancelGroup(g)}>
                      ❌ Cancelar sesión
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal crear */}
      <Modal isOpen={createModal} onClose={() => { setCreateModal(false); setForm(EMPTY_FORM) }}
        title="Nueva sesión grupal">
        <div className="flex flex-col gap-4">
          <Select label="Terapeuta *" name="therapist_id" value={form.therapist_id} onChange={handleChange}>
            <option value="">Seleccionar terapeuta...</option>
            {therapists.map(t => (
              <option key={t.user_id} value={t.user_id}>
                {t.profile?.full_name} — {t.specialty}
              </option>
            ))}
          </Select>

          <Input label="Tema / título de la sesión *" name="topic" value={form.topic}
            onChange={handleChange} placeholder="Ej: Manejo de la ansiedad" />

          <Textarea label="Descripción" name="description" value={form.description}
            onChange={handleChange} rows={3}
            placeholder="Describe brevemente de qué tratará esta sesión..." />

          <Input label="Fecha y hora *" name="scheduled_at" type="datetime-local"
            value={form.scheduled_at} onChange={handleChange} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Máx. participantes" name="max_participants" type="number"
              value={form.max_participants} onChange={handleChange} min={2} max={20} />
            <Input label="Precio por persona (USD)" name="price_per_person" type="number"
              value={form.price_per_person} onChange={handleChange} min={0} />
          </div>

          <Button fullWidth loading={saving} onClick={createGroup}>
            Crear sesión grupal
          </Button>
        </div>
      </Modal>
    </div>
  )
}
