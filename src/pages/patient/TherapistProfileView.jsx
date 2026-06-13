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
import { useCurrencyContext } from '@/context/CurrencyContext'
import { Skeleton } from '@/components/ui/Spinner'
import PayPalButton from '@/components/payment/PayPalButton'
import toast from 'react-hot-toast'
import { Star, MessageCircle, Calendar, Search, Zap } from 'lucide-react'

/** Barra de distribución de estrellas (5→1) */
function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-warm-500 w-3">{star}</span>
      <Star size={11} strokeWidth={1.8} className="text-amber-400" fill="currentColor" />
      <div className="flex-1 h-1.5 bg-warm-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-warm-400 w-4 text-right">{count}</span>
    </div>
  )
}

export default function TherapistProfileView() {
  const { therapistId } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { formatWithLocal, formatLocal } = useCurrencyContext()
  const [therapist, setTherapist] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBook, setShowBook] = useState(false)
  const [bookForm, setBookForm] = useState({ date: '', time: '' })
  const [booking, setBooking] = useState(false)
  const [bookStep, setBookStep] = useState('form') // 'form' | 'payment' | 'success'

  useEffect(() => { fetchTherapist() }, [therapistId])

  // Si el terapeuta desactiva urgentes y hoy estaba seleccionado, limpiar la fecha
  useEffect(() => {
    if (!therapist?.available_urgent && bookForm.date === todayStr) {
      setBookForm({ date: '', time: '' })
    }
  }, [therapist?.available_urgent])

  const fetchTherapist = async () => {
    setLoading(true)
    const [{ data: t }, { data: r }] = await Promise.all([
      supabase.from('therapist_profiles').select(`
        *, profile:profiles!therapist_profiles_user_id_fkey(id, full_name, avatar_url, email),
        subscription_plan, commission_rate
      `).eq('user_id', therapistId).single(),
      supabase.from('reviews').select(`
        *, patient:profiles!reviews_patient_id_fkey(full_name)
      `).eq('therapist_id', therapistId).order('created_at', { ascending: false }).limit(20),
    ])
    setTherapist(t)
    setReviews(r ?? [])
    setLoading(false)
  }

  // ── Helpers para citas urgentes ──────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]

  // Fecha mínima seleccionable: hoy si acepta urgentes, mañana si no
  const minDate = (() => {
    if (therapist?.available_urgent) return todayStr
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()

  const isToday = bookForm.date === todayStr

  // Hora mínima cuando el paciente selecciona hoy: ahora + 2h redondeado al siguiente cuarto
  const getMinTime = () => {
    const minDt = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const h = minDt.getHours()
    const m = minDt.getMinutes()
    const roundedM = Math.ceil(m / 15) * 15
    const finalH = roundedM >= 60 ? h + 1 : h
    const finalM = roundedM >= 60 ? 0 : roundedM
    if (finalH >= 23) return '23:00'
    return `${String(finalH).padStart(2,'0')}:${String(finalM).padStart(2,'0')}`
  }

  // Si ya es tan tarde que no quedan franjas disponibles hoy
  const noUrgentSlotsToday = isToday && getMinTime() >= '23:00'

  const handleBookContinue = () => {
    if (!bookForm.date || !bookForm.time) {
      toast.error('Selecciona fecha y hora para tu cita')
      return
    }
    const scheduledAt = new Date(`${bookForm.date}T${bookForm.time}`)
    if (scheduledAt <= new Date()) {
      toast.error('La fecha y hora deben ser en el futuro')
      return
    }
    if (isToday) {
      const minT = getMinTime()
      if (bookForm.time < minT) {
        toast.error(`La hora mínima para citas urgentes es ${minT} (2 horas desde ahora)`)
        return
      }
      if (bookForm.time > '23:00') {
        toast.error('Las citas urgentes deben programarse hasta las 23:00')
        return
      }
    }
    setBookStep('payment')
  }

  const handlePaymentSuccess = (bookingId) => {
    setBookStep('success')
    setTimeout(() => {
      setShowBook(false)
      setBookStep('form')
      setBookForm({ date: '', time: '' })
      navigate(bookingId ? `/payment/success?session=${bookingId}` : '/patient/appointments')
    }, 1200)
  }

  const handleCloseBook = () => {
    setShowBook(false)
    setBookStep('form')
    setBookForm({ date: '', time: '' })
  }

  // Métricas de reseñas
  const avgRating = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : 0

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  // Vista previa de precio en el modal
  const bookingPreview = bookForm.date && bookForm.time ? (() => {
    const dt = new Date(`${bookForm.date}T${bookForm.time}`)
    const hoursUntil = (dt - new Date()) / 1000 / 60 / 60
    const urgent = hoursUntil < 24
    const price  = (therapist?.price_per_session ?? 0) * (urgent ? 1.3 : 1)
    return { urgent, price }
  })() : null

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-fade-in">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
      </div>
    )
  }
  if (!therapist) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Search size={48} strokeWidth={1.8} className="text-warm-300" />
        <p className="font-semibold text-warm-700">Terapeuta no encontrado</p>
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>← Volver</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Button size="sm" variant="ghost" onClick={() => navigate(-1)} className="self-start">
        ← Volver
      </Button>

      {/* ── Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl gradient-brand text-white p-6 shadow-[0_8px_32px_rgba(79,70,229,0.30)]">
        {/* Orbs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-purple-400/20 blur-2xl pointer-events-none" />

        <div className="relative flex items-start gap-4">
          <div className={`shrink-0 ${(therapist.subscription_plan === 'pro' || therapist.subscription_plan === 'premium') ? 'avatar-ring-pro' : 'ring-2 ring-white/40'} rounded-full`}>
            <Avatar name={therapist.profile?.full_name ?? ''} size="xl" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h1 className="text-xl font-bold leading-tight tracking-tight">
                {therapist.profile?.full_name}
              </h1>
              {(therapist.subscription_plan === 'pro' || therapist.subscription_plan === 'premium') && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold shrink-0 border border-white/30">
                  <Star size={9} strokeWidth={2.5} fill="currentColor" />Pro
                </span>
              )}
            </div>
            <p className="text-indigo-200 text-sm mt-0.5">{therapist.specialty}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <VerificationBadge status={therapist.verified ? 'verified' : 'pending'} />
              {reviews.length > 0 && <RatingDisplay value={avgRating} reviews={reviews.length} />}
            </div>
            <p className="font-bold text-xl mt-2 tracking-tight">
              {formatWithLocal(therapist.price_per_session).split('≈')[0].trim()}
              <span className="text-sm font-normal text-indigo-200">/sesión</span>
            </p>
          </div>
        </div>

        {therapist.bio && (
          <p className="relative text-sm text-indigo-100 leading-relaxed mt-4 line-clamp-3">{therapist.bio}</p>
        )}

        {/* Action buttons */}
        <div className="relative grid grid-cols-2 gap-3 mt-5">
          <button
            onClick={() => navigate(`/patient/chat?therapist=${therapistId}`)}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold transition-all border border-white/20 active:scale-[0.97]"
          >
            <MessageCircle size={15} strokeWidth={2} /> Escribir
          </button>
          <button
            onClick={() => setShowBook(true)}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white hover:bg-white/90 text-indigo-700 text-sm font-bold transition-all shadow-lg active:scale-[0.97]"
          >
            <Calendar size={15} strokeWidth={2} /> Agendar
          </button>
        </div>
      </div>

      {/* ── Sección de reseñas ── */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-3">
          Reseñas {reviews.length > 0 && <span className="text-warm-400 font-normal text-base">({reviews.length})</span>}
        </h2>

        {reviews.length === 0 ? (
          <Card className="text-center py-8">
            <div className="flex justify-center mb-2"><Star size={32} strokeWidth={1.8} className="text-amber-300" fill="currentColor" /></div>
            <p className="font-medium text-warm-700 text-sm">Aún sin reseñas</p>
            <p className="text-xs text-warm-400 mt-1 max-w-xs mx-auto">
              Sé el primero en dejar una reseña después de tu sesión
            </p>
          </Card>
        ) : (
          <>
            {/* Resumen de rating */}
            <div className="card p-5 mb-3">
              <div className="flex items-center gap-6">
                {/* Promedio grande */}
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-5xl font-bold text-slate-900 tracking-tight">{avgRating.toFixed(1)}</span>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={14} strokeWidth={1.8} className={s <= Math.round(avgRating) ? 'text-amber-400' : 'text-warm-200'} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-xs text-warm-400 mt-1">{reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</span>
                </div>
                {/* Barras de distribución */}
                <div className="flex-1 flex flex-col gap-1.5">
                  {ratingDist.map(({ star, count }) => (
                    <RatingBar key={star} star={star} count={count} total={reviews.length} />
                  ))}
                </div>
              </div>
            </div>

            {/* Lista de reseñas */}
            <div className="flex flex-col gap-3 stagger-children">
              {reviews.map((r) => (
                <Card key={r.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.patient?.full_name ?? ''} size="sm" />
                      <p className="text-sm font-medium text-warm-800">{r.patient?.full_name}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={13} strokeWidth={1.8} className={s <= r.rating ? 'text-amber-400' : 'text-warm-200'} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-warm-600 leading-relaxed">"{r.comment}"</p>
                  )}
                  <p className="text-xs text-warm-300 mt-2">{formatRelative(r.created_at)}</p>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modal agendar ── */}
      <Modal
        isOpen={showBook}
        onClose={handleCloseBook}
        title={bookStep === 'success' ? '¡Cita confirmada!' : 'Agendar sesión'}
      >
        <div className="flex flex-col gap-4">

          {/* PASO 1: Formulario de fecha/hora */}
          {bookStep === 'form' && (
            <>
              <div className="flex items-center gap-3 bg-warm-50 rounded-xl p-3">
                <Avatar name={therapist.profile?.full_name ?? ''} size="md" />
                <div>
                  <p className="font-semibold text-warm-900">{therapist.profile?.full_name}</p>
                  <p className="text-sm text-warm-500">{therapist.specialty}</p>
                </div>
              </div>

              {/* Aviso urgente si acepta citas urgentes */}
              {therapist?.available_urgent && (
                <div className="flex items-center gap-2 text-xs bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 text-orange-700">
                  <Zap size={13} strokeWidth={1.8} className="shrink-0" />
                  Este terapeuta acepta citas urgentes para hoy — disponibles desde 2 horas a partir de ahora hasta las 23:00 (+30% precio)
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Fecha"
                  type="date"
                  value={bookForm.date}
                  min={minDate}
                  onChange={(e) => {
                    const newDate = e.target.value
                    const newIsToday = newDate === todayStr
                    // Si cambia a hoy y la hora seleccionada ya no sería válida, limpiarla
                    if (newIsToday && bookForm.time) {
                      const minT = getMinTime()
                      if (bookForm.time < minT || bookForm.time > '23:00') {
                        setBookForm(f => ({ ...f, date: newDate, time: '' }))
                        return
                      }
                    }
                    setBookForm(f => ({ ...f, date: newDate }))
                  }}
                  required
                />
                <Input
                  label="Hora"
                  type="time"
                  value={bookForm.time}
                  min={isToday ? getMinTime() : undefined}
                  max={isToday ? '23:00' : undefined}
                  onChange={(e) => setBookForm(f => ({ ...f, time: e.target.value }))}
                  required
                />
              </div>

              {/* Sin horarios urgentes disponibles hoy */}
              {noUrgentSlotsToday && (
                <div className="text-xs bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-amber-700 flex items-center gap-2">
                  <Zap size={13} strokeWidth={1.8} className="shrink-0" />
                  No hay franjas urgentes disponibles para hoy. Selecciona otro día.
                </div>
              )}

              {bookingPreview && (
                <div className={`rounded-xl p-4 text-sm ${bookingPreview.urgent ? 'bg-orange-50 border border-orange-200' : 'bg-primary-50 border border-primary-100'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold inline-flex items-center gap-1 ${bookingPreview.urgent ? 'text-orange-800' : 'text-primary-800'}`}>
                      {bookingPreview.urgent
                        ? <><Zap size={14} strokeWidth={1.8} />Cita urgente</>
                        : <><Calendar size={14} strokeWidth={1.8} />Cita estándar</>}
                    </p>
                    <p className={`text-lg font-bold ${bookingPreview.urgent ? 'text-orange-700' : 'text-primary-700'}`}>
                      {formatWithLocal(bookingPreview.price)}
                    </p>
                  </div>
                  {bookingPreview.urgent && (
                    <p className="text-orange-600 text-xs mt-1">Tarifa urgente (+30%) por ser menos de 24 horas</p>
                  )}
                </div>
              )}

              <Button fullWidth disabled={!bookForm.date || !bookForm.time || noUrgentSlotsToday} onClick={handleBookContinue}>
                Continuar al pago →
              </Button>
              <p className="text-xs text-warm-400 text-center">
                Puedes cambiar de terapeuta hasta 48 horas antes
              </p>
            </>
          )}

          {/* PASO 2: Pago PayPal */}
          {bookStep === 'payment' && bookingPreview && (
            <>
              <div className="bg-warm-50 rounded-xl p-4 text-sm">
                <p className="font-semibold text-warm-800 mb-2">Resumen de tu cita</p>
                <div className="flex justify-between text-warm-600">
                  <span>Terapeuta</span>
                  <span className="font-medium">{therapist.profile?.full_name}</span>
                </div>
                <div className="flex justify-between text-warm-600 mt-1">
                  <span>Fecha</span>
                  <span className="font-medium">
                    {new Date(`${bookForm.date}T${bookForm.time}`).toLocaleDateString('es-DO', { dateStyle: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between text-warm-600 mt-1">
                  <span>Hora</span>
                  <span className="font-medium">{bookForm.time}</span>
                </div>
                <div className="flex justify-between text-warm-900 font-bold mt-2 pt-2 border-t border-warm-200">
                  <span>Total</span>
                  <span>{formatWithLocal(bookingPreview.price)}</span>
                </div>
              </div>

              <PayPalButton
                therapistId={therapistId}
                scheduledAt={new Date(`${bookForm.date}T${bookForm.time}`).toISOString()}
                isUrgent={bookingPreview.urgent}
                priceBase={therapist.price_per_session}
                therapistName={therapist.profile?.full_name ?? 'el terapeuta'}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => toast.error(msg)}
              />

              <p className="text-[11px] text-warm-400 text-center leading-relaxed">
                El cobro se realiza en <strong>USD</strong>. La conversión a tu moneda local
                es referencial — el monto exacto lo determina PayPal según su
                tipo de cambio al momento del pago.
              </p>

              <button onClick={() => setBookStep('form')} className="text-xs text-warm-400 hover:text-warm-600 text-center transition-colors">
                ← Cambiar fecha u hora
              </button>
            </>
          )}

          {/* PASO 3: Éxito */}
          {bookStep === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-serif text-xl font-bold text-warm-900 mb-2">¡Pago exitoso!</p>
              <p className="text-sm text-warm-500">Tu cita ha sido confirmada. Redirigiendo...</p>
            </div>
          )}

        </div>
      </Modal>
    </div>
  )
}
