import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Badge, { VerificationBadge } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { RatingDisplay } from '@/components/ui/StarRating'
import StarRating from '@/components/ui/StarRating'
import { formatDate, formatPrice, formatRelative } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

export default function TherapistProfileView() {
  const { therapistId } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [therapist, setTherapist] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBook, setShowBook] = useState(false)
  const [bookForm, setBookForm] = useState({ date: '', time: '' })
  const [booking, setBooking] = useState(false)

  useEffect(() => { fetchTherapist() }, [therapistId])

  const fetchTherapist = async () => {
    setLoading(true)
    const [{ data: t }, { data: r }] = await Promise.all([
      supabase.from('therapist_profiles').select(`
        *, profile:profiles!therapist_profiles_user_id_fkey(id, full_name, avatar_url, email)
      `).eq('user_id', therapistId).single(),
      supabase.from('reviews').select(`
        *, patient:profiles!reviews_patient_id_fkey(full_name)
      `).eq('therapist_id', therapistId).order('created_at', { ascending: false }).limit(10),
    ])
    setTherapist(t)
    setReviews(r ?? [])
    setLoading(false)
  }

  const bookSession = async () => {
    // Validaciones
    if (!bookForm.date || !bookForm.time) {
      toast.error('Selecciona fecha y hora para tu cita')
      return
    }
    const scheduledAt = new Date(`${bookForm.date}T${bookForm.time}`)
    if (scheduledAt <= new Date()) {
      toast.error('La fecha y hora deben ser en el futuro')
      return
    }

    setBooking(true)
    const hoursUntil = (scheduledAt - new Date()) / 1000 / 60 / 60
    const isUrgent   = hoursUntil < 24
    const price      = (therapist?.price_per_session ?? 0) * (isUrgent ? 1.3 : 1)

    const { error } = await supabase.from('sessions').insert({
      therapist_id: therapistId,
      patient_id:   user.id,
      scheduled_at: scheduledAt.toISOString(),
      status:       'scheduled',
      price:        Math.round(price),
      is_urgent:    isUrgent,
      duration:     60,
    })
    if (error) {
      toast.error('Error al agendar la sesión. Intenta de nuevo.')
      setBooking(false)
      return
    }
    toast.success('✅ Cita agendada exitosamente')
    setShowBook(false)
    navigate('/patient/appointments')
  }

  const avgRating = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : 0

  if (loading) return <div className="flex flex-col gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>
  if (!therapist) return <p className="text-center text-warm-500 mt-20">Terapeuta no encontrado</p>

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>← Volver</Button>

      {/* Header */}
      <Card>
        <div className="flex items-start gap-4">
          <Avatar name={therapist.profile?.full_name ?? ''} size="xl" />
          <div className="flex-1">
            <h1 className="font-serif text-xl font-bold text-warm-900">{therapist.profile?.full_name}</h1>
            <p className="text-warm-500 text-sm">{therapist.specialty}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <VerificationBadge status={therapist.verified ? 'verified' : 'pending'} />
              <RatingDisplay value={avgRating} reviews={reviews.length} />
            </div>
            <p className="text-primary-600 font-semibold mt-2">{formatPrice(therapist.price_per_session)}/sesión</p>
          </div>
        </div>
        {therapist.bio && (
          <div className="mt-4 pt-4 border-t border-warm-100">
            <p className="text-sm text-warm-700 leading-relaxed">{therapist.bio}</p>
          </div>
        )}
        <Button fullWidth className="mt-4" onClick={() => setShowBook(true)}>
          Agendar sesión
        </Button>
      </Card>

      {/* Reseñas */}
      {reviews.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-semibold text-warm-900 mb-3">
            Reseñas ({reviews.length})
          </h2>
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.patient?.full_name ?? ''} size="sm" />
                    <p className="text-sm font-medium text-warm-800">{r.patient?.full_name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={s <= r.rating ? 'text-amber-400' : 'text-warm-200'}>★</span>
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-sm text-warm-600">{r.comment}</p>}
                <p className="text-xs text-warm-400 mt-2">{formatRelative(r.created_at)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal agendar */}
      <Modal isOpen={showBook} onClose={() => !booking && setShowBook(false)} title="Agendar sesión">
        <div className="flex flex-col gap-4">
          {/* Info del terapeuta */}
          <div className="flex items-center gap-3 bg-warm-50 rounded-xl p-3">
            <Avatar name={therapist.profile?.full_name ?? ''} size="md" />
            <div>
              <p className="font-semibold">{therapist.profile?.full_name}</p>
              <p className="text-sm text-warm-500">{therapist.specialty}</p>
            </div>
          </div>

          <Input label="Fecha" type="date" value={bookForm.date}
            onChange={(e) => setBookForm(f => ({ ...f, date: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            required />

          <Input label="Hora" type="time" value={bookForm.time}
            onChange={(e) => setBookForm(f => ({ ...f, time: e.target.value }))}
            required />

          {/* Vista previa del precio al seleccionar fecha y hora */}
          {bookForm.date && bookForm.time && (() => {
            const dt = new Date(`${bookForm.date}T${bookForm.time}`)
            const hoursUntil = (dt - new Date()) / 1000 / 60 / 60
            const urgent = hoursUntil < 24
            const price  = (therapist?.price_per_session ?? 0) * (urgent ? 1.3 : 1)
            return (
              <div className={`rounded-xl p-3 text-sm ${urgent ? 'bg-orange-50 border border-orange-200' : 'bg-primary-50 border border-primary-100'}`}>
                <p className={`font-medium ${urgent ? 'text-orange-800' : 'text-primary-800'}`}>
                  {urgent ? '⚡ Cita urgente' : '📅 Cita estándar'}
                </p>
                <p className={`text-xs mt-0.5 ${urgent ? 'text-orange-600' : 'text-primary-600'}`}>
                  Total: <strong>{formatPrice(price)} USD</strong>
                  {urgent && ' · tarifa urgente +30%'}
                </p>
              </div>
            )
          })()}

          <Button
            fullWidth
            loading={booking}
            disabled={!bookForm.date || !bookForm.time}
            onClick={bookSession}
          >
            Confirmar cita
          </Button>
        </div>
      </Modal>
    </div>
  )
}
