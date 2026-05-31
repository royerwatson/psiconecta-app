import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { formatSessionDate, formatPrice, canStartVideo } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import StarRating from '@/components/ui/StarRating'
import { Textarea } from '@/components/ui/Input'
import { differenceInHours, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { AlertTriangle, Calendar, BookOpen, Zap, Video, RefreshCw, Star, MessageCircle, Check } from 'lucide-react'

export default function MyAppointments() {
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [tab, setTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' })
  const [changeModal, setChangeModal] = useState(null)
  const [therapists, setTherapists] = useState([])
  const [loadingTherapists, setLoadingTherapists] = useState(false)
  const [selectedTherapist, setSelectedTherapist] = useState(null)
  const [changing, setChanging] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null) // { type: 'cancel'|'change', session }
  const navigate = useNavigate()

  useEffect(() => { if (user) fetchSessions() }, [user])

  const fetchSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select(`
          *,
          therapist:profiles!sessions_therapist_id_fkey(
            id, full_name, avatar_url,
            therapist_profiles(specialty)
          ),
          reviews(id)
        `)
        .eq('patient_id', user.id)
        .order('scheduled_at', { ascending: false })

      if (fetchError) throw fetchError
      setSessions(data ?? [])
    } catch (err) {
      console.error('fetchSessions error:', err)
      setError('No pudimos cargar tus citas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const cancelSession = async (session) => {
    const hoursUntil = differenceInHours(parseISO(session.scheduled_at), new Date())
    if (hoursUntil < 48) {
      toast.error('No puedes cancelar con menos de 48 horas de anticipación')
      return
    }
    setConfirmModal({ type: 'cancel', session })
  }

  const confirmCancel = async () => {
    const session = confirmModal.session
    setConfirmModal(null)
    await supabase.from('sessions').update({ status: 'cancelled' }).eq('id', session.id)
    toast.success('Sesión cancelada')
    fetchSessions()

    // Enviar emails de cancelación (best-effort)
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      if (!authSession?.access_token) return
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-cancellation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({ sessionId: session.id }),
      }).catch(() => {})
    })
  }

  const openChangeModal = async (session) => {
    const hoursUntil = differenceInHours(parseISO(session.scheduled_at), new Date())
    if (hoursUntil < 48) {
      toast.error('Solo puedes cambiar de terapeuta hasta 48 horas antes de la sesión')
      return
    }
    setChangeModal(session)
    setSelectedTherapist(null)
    setLoadingTherapists(true)

    const { data, error } = await supabase
      .from('therapist_profiles')
      .select(`
        *,
        profile:profiles!therapist_profiles_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('verified', true)
      .neq('user_id', session.therapist_id)   // exclude current therapist
      .order('rating', { ascending: false })

    if (error) console.error(error)
    setTherapists(data ?? [])
    setLoadingTherapists(false)
  }

  const requestTherapistChange = () => {
    if (!selectedTherapist || !changeModal) return
    setConfirmModal({ type: 'change', session: changeModal })
  }

  const confirmTherapistChange = async () => {
    if (!selectedTherapist || !changeModal) return
    setConfirmModal(null)
    setChanging(true)

    const oldTherapistId = changeModal.therapist_id

    const { error } = await supabase
      .from('sessions')
      .update({ therapist_id: selectedTherapist.user_id })
      .eq('id', changeModal.id)

    if (error) {
      toast.error('Error al cambiar de terapeuta')
      setChanging(false)
      return
    }

    toast.success(`Terapeuta cambiado a ${selectedTherapist.profile?.full_name}`)
    setChangeModal(null)
    setSelectedTherapist(null)
    setChanging(false)
    fetchSessions()

    // Notificar por email (best-effort, no bloqueante)
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      if (!authSession?.access_token) return
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-therapist-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          sessionId:      changeModal.id,
          oldTherapistId: oldTherapistId,
          newTherapistId: selectedTherapist.user_id,
        }),
      }).catch(() => {})
    })
  }

  const submitReview = async () => {
    if (!reviewForm.rating) { toast.error('Selecciona una calificación'); return }
    const { error } = await supabase.from('reviews').insert({
      session_id: reviewModal.id,
      therapist_id: reviewModal.therapist?.id,
      patient_id: user.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    })
    if (error) { toast.error('Error al enviar reseña'); return }
    toast.success('¡Gracias por tu reseña!')
    setReviewModal(null)
    setReviewForm({ rating: 0, comment: '' })
    fetchSessions()
  }

  const upcoming = sessions.filter((s) => s.status === 'scheduled')
  const past      = sessions.filter((s) => s.status !== 'scheduled')
  const displayed = tab === 'upcoming' ? upcoming : past

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle size={48} strokeWidth={1.5} className="text-warm-300" />
        <p className="font-medium text-warm-800">{error}</p>
        <Button onClick={fetchSessions} size="sm">Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Mis citas</h1>
        <p className="text-warm-500 text-sm mt-1">{upcoming.length} próximas, {past.length} anteriores</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 p-1 rounded-2xl">
        {[
          { id: 'upcoming', label: 'Próximas', count: upcoming.length },
          { id: 'past',     label: 'Anteriores', count: past.length  },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 text-sm font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              tab === t.id ? 'bg-white shadow-sm text-primary-700' : 'text-warm-500'
            }`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-primary-100 text-primary-600' : 'bg-warm-200 text-warm-500'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}</div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            {tab === 'upcoming' ? <Calendar size={28} strokeWidth={1.8} className="text-primary-500" /> : <BookOpen size={28} strokeWidth={1.8} className="text-primary-500" />}
          </div>
          <p className="font-semibold text-warm-800 mb-1">
            {tab === 'upcoming' ? 'Sin citas próximas' : 'Sin sesiones anteriores'}
          </p>
          <p className="text-sm text-warm-400 max-w-xs leading-relaxed">
            {tab === 'upcoming'
              ? 'Encuentra un terapeuta y agenda tu primera sesión cuando quieras.'
              : 'Aquí verás el historial de todas tus sesiones completadas.'
            }
          </p>
          {tab === 'upcoming' && (
            <button
              onClick={() => navigate('/patient/find')}
              className="mt-5 px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 active:scale-95 transition-all"
            >
              Buscar terapeuta
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 stagger-children">
          {displayed.map((session) => {
            const canVideo = canStartVideo(session.scheduled_at)
            const hasReview = (session.reviews ?? []).length > 0
            const hoursUntil = differenceInHours(parseISO(session.scheduled_at), new Date())
            const canChange = hoursUntil >= 48 && session.status === 'scheduled'

            return (
              <Card key={session.id}>
                <div className="flex items-start gap-3">
                  <Avatar name={session.therapist?.full_name ?? ''} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-warm-900">{session.therapist?.full_name}</p>
                        <p className="text-xs text-warm-500">{session.therapist?.therapist_profiles?.[0]?.specialty}</p>
                      </div>
                      <Badge variant={
                        session.status === 'completed' ? 'success' :
                        session.status === 'cancelled' ? 'danger' :
                        session.is_urgent ? 'urgent' : 'primary'
                      } dot>
                        {session.status === 'completed' ? 'Completada' :
                         session.status === 'cancelled' ? 'Cancelada' :
                         session.is_urgent ? <span className="flex items-center gap-1"><Zap size={12} strokeWidth={1.8} className="inline" />Urgente</span> : 'Programada'}
                      </Badge>
                    </div>
                    <p className="text-sm text-warm-600 mt-1.5">{formatSessionDate(session.scheduled_at)}</p>
                    <p className="text-xs text-warm-400">{formatPrice(session.price ?? 0)}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {canVideo && (
                    <Button size="sm" variant="calm" onClick={() => navigate(`/video-call/${session.id}`)}>
                      <Video size={14} strokeWidth={1.8} className="inline mr-1" />Unirse
                    </Button>
                  )}
                  {canChange && (
                    <Button size="sm" variant="secondary" onClick={() => openChangeModal(session)}>
                      <RefreshCw size={14} strokeWidth={1.8} className="inline mr-1" />Cambiar terapeuta
                    </Button>
                  )}
                  {session.status === 'scheduled' && !canVideo && (
                    <Button size="sm" variant="outline" onClick={() => cancelSession(session)}>
                      Cancelar
                    </Button>
                  )}
                  {session.status === 'completed' && !hasReview && (
                    <Button size="sm" variant="secondary" onClick={() => setReviewModal(session)}>
                      <Star size={14} strokeWidth={1.8} className="inline mr-1" />Dejar reseña
                    </Button>
                  )}
                  {session.status === 'completed' && (
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/patient/chat?therapist=${session.therapist?.id}`)}>
                      <MessageCircle size={14} strokeWidth={1.8} className="inline mr-1" />Chat
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal cambio de terapeuta */}
      <Modal isOpen={!!changeModal} onClose={() => { setChangeModal(null); setSelectedTherapist(null) }} title="Cambiar terapeuta">
        {changeModal && (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800">
              Puedes cambiar de terapeuta hasta 48 horas antes de la sesión. Tu cita mantendrá la misma fecha y hora.
            </div>

            {loadingTherapists ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : therapists.length === 0 ? (
              <p className="text-center text-warm-500 py-4 text-sm">No hay otros terapeutas disponibles.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {therapists.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTherapist(t)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedTherapist?.id === t.id
                        ? 'border-primary-400 bg-primary-50 shadow-sm'
                        : 'border-warm-200 hover:border-warm-300 bg-white'
                    }`}
                  >
                    <Avatar name={t.profile?.full_name ?? ''} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-warm-900 truncate">{t.profile?.full_name}</p>
                      <p className="text-xs text-warm-500 truncate">{t.specialty}</p>
                      <p className="text-xs text-warm-400">{formatPrice(t.price_per_session)}/sesión</p>
                    </div>
                    {selectedTherapist?.id === t.id && (
                      <Check size={16} strokeWidth={2.5} className="text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <Button
              fullWidth
              disabled={!selectedTherapist}
              loading={changing}
              onClick={requestTherapistChange}
            >
              Confirmar cambio
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal confirmación */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)}
        title={confirmModal?.type === 'cancel' ? '¿Cancelar sesión?' : '¿Cambiar terapeuta?'}>
        {confirmModal && (
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              {confirmModal.type === 'cancel' ? (
                <>
                  <p className="font-semibold mb-1">Esta acción no se puede deshacer.</p>
                  <p>Se cancelará tu sesión con <strong>{confirmModal.session.therapist?.full_name}</strong>. No se realizará ningún reembolso automático.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-1">Confirma el cambio de terapeuta.</p>
                  <p>Tu sesión se mantendrá en la misma fecha y hora pero será atendida por <strong>{selectedTherapist?.profile?.full_name}</strong>.</p>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setConfirmModal(null)}>
                Cancelar
              </Button>
              <Button variant="danger" fullWidth
                onClick={confirmModal.type === 'cancel' ? confirmCancel : confirmTherapistChange}>
                {confirmModal.type === 'cancel' ? 'Sí, cancelar sesión' : 'Sí, cambiar terapeuta'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal reseña */}
      <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)} title="Califica tu sesión">
        {reviewModal && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-warm-50 rounded-xl p-3">
              <Avatar name={reviewModal.therapist?.full_name ?? ''} size="md" />
              <p className="font-semibold text-warm-900">{reviewModal.therapist?.full_name}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-warm-600 mb-3">¿Cómo fue tu experiencia?</p>
              <StarRating value={reviewForm.rating} onChange={(r) => setReviewForm(f => ({ ...f, rating: r }))} size="lg" />
            </div>
            <Textarea label="Comentario (opcional)" value={reviewForm.comment} rows={3}
              onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Comparte cómo fue tu experiencia..." />
            <Button fullWidth onClick={submitReview}>Enviar reseña</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
