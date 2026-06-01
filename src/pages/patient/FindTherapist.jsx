import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input, { Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { RatingDisplay } from '@/components/ui/StarRating'
import { VerificationBadge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/Spinner'
import PayPalButton from '@/components/payment/PayPalButton'
import toast from 'react-hot-toast'
import { DollarSign, Zap, AlertTriangle, Search, Calendar, Crown, Star } from 'lucide-react'

const SPECIALTIES = [
  'Todas', 'Psicología clínica', 'Psicología cognitivo-conductual', 'Psicoanálisis',
  'Terapia familiar y de pareja', 'Psicología infantil', 'Neuropsicología',
]

export default function FindTherapist() {
  const { user } = useAuthStore()
  const [therapists, setTherapists] = useState([])
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('Todas')
  const [isUrgent, setIsUrgent] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [showPriceFilter, setShowPriceFilter] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [selectedTherapist, setSelectedTherapist] = useState(null)
  const [bookingForm, setBookingForm] = useState({ date: '', time: '' })
  const [bookingStep, setBookingStep] = useState('form') // 'form' | 'payment' | 'success'
  const navigate = useNavigate()

  useEffect(() => { fetchTherapists() }, [specialty, isUrgent])

  const fetchTherapists = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      let query = supabase
        .from('therapist_profiles')
        .select(`
          *,
          profile:profiles!therapist_profiles_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('verified', true)

      if (specialty !== 'Todas') query = query.eq('specialty', specialty)
      if (isUrgent) query = query.eq('available_urgent', true)

      const { data, error: queryError } = await query.order('rating', { ascending: false })
      if (queryError) throw queryError

      // Orden de visibilidad: premium → pro → basic, luego por rating
      const PLAN_ORDER = { premium: 0, pro: 1, basic: 2 }
      const withRating = (data ?? [])
        .map((t) => ({
          ...t,
          avg_rating:   t.rating ?? 0,
          review_count: t.review_count ?? 0,
          plan_order:   PLAN_ORDER[t.subscription_plan ?? 'basic'] ?? 2,
        }))
        .sort((a, b) => a.plan_order - b.plan_order || b.avg_rating - a.avg_rating)

      setTherapists(withRating)
    } catch (err) {
      console.error('fetchTherapists error:', err)
      setFetchError('No pudimos cargar los terapeutas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const filteredTherapists = therapists.filter((t) => {
    const nameMatch = t.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
    const minOk = priceMin === '' || (t.price_per_session ?? 0) >= Number(priceMin)
    const maxOk = priceMax === '' || (t.price_per_session ?? 0) <= Number(priceMax)
    return nameMatch && minOk && maxOk
  })

  const handleCloseBooking = () => {
    setSelectedTherapist(null)
    setBookingForm({ date: '', time: '' })
    setBookingStep('form')
  }

  const handlePaymentSuccess = () => {
    setBookingStep('success')
    toast.success('¡Pago exitoso! Tu cita ha sido confirmada.')
  }

  const handlePaymentError = (msg) => {
    toast.error(msg ?? 'Error al procesar el pago. Intenta de nuevo.')
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Encontrar terapeuta</h1>
        <p className="text-warm-500 text-sm mt-1">Profesionales verificados listos para ayudarte</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <Input placeholder="Buscar por nombre..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          prefix={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
        />
        <div className="flex gap-2">
          <Select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="flex-1">
            {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <button onClick={() => setShowPriceFilter(!showPriceFilter)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              (priceMin || priceMax)
                ? 'bg-primary-100 border-primary-300 text-primary-700'
                : 'bg-white border-warm-200 text-warm-600 hover:border-warm-300'
            }`}>
            <DollarSign size={14} strokeWidth={1.8} className="mr-1" />Precio
          </button>
          <button onClick={() => setIsUrgent(!isUrgent)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              isUrgent
                ? 'bg-orange-100 border-orange-300 text-orange-700'
                : 'bg-white border-warm-200 text-warm-600 hover:border-warm-300'
            }`}>
            <Zap size={14} strokeWidth={1.8} className="mr-1" />Urgente
          </button>
        </div>

        {showPriceFilter && (
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-primary-700 uppercase">Rango de precio (USD/sesión)</p>
            <div className="flex items-center gap-2">
              <Input placeholder="Mínimo" type="number" value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)} min="0" />
              <span className="text-warm-400 shrink-0">–</span>
              <Input placeholder="Máximo" type="number" value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)} min="0" />
              {(priceMin || priceMax) && (
                <button onClick={() => { setPriceMin(''); setPriceMax('') }}
                  className="text-xs text-warm-400 hover:text-red-500 shrink-0 px-1">Limpiar</button>
              )}
            </div>
          </div>
        )}
      </div>

      {isUrgent && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-sm font-medium text-orange-800 flex items-center gap-1.5"><Zap size={14} strokeWidth={1.8} />Modo cita urgente (&lt;24 horas)</p>
          <p className="text-xs text-orange-600 mt-1">
            Se muestran terapeutas con disponibilidad inmediata. Se aplica un cargo adicional del 30% por urgencia.
          </p>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : fetchError ? (
        <Card className="text-center py-10">
          <AlertTriangle size={40} strokeWidth={1.5} className="mx-auto mb-3 text-warm-300" />
          <p className="text-warm-600 font-medium">{fetchError}</p>
          <Button size="sm" className="mt-4" onClick={fetchTherapists}>Reintentar</Button>
        </Card>
      ) : filteredTherapists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <Search size={28} strokeWidth={1.5} className="text-primary-400" />
          </div>
          <p className="font-semibold text-warm-800 mb-1">Sin terapeutas disponibles</p>
          <p className="text-sm text-warm-400 max-w-xs leading-relaxed">
            No encontramos terapeutas con esos filtros. Prueba cambiando la especialidad o la fecha.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 stagger-children">
          {filteredTherapists.map((t) => (
            <Card key={t.id} hover onClick={() => navigate(`/patient/therapist/${t.user_id}`)}>
              <div className="flex items-start gap-4">
                <Avatar name={t.profile?.full_name ?? ''} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-warm-900">{t.profile?.full_name}</p>
                        {t.subscription_plan === 'premium' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Crown size={9} strokeWidth={2} />Premium
                          </span>
                        )}
                        {t.subscription_plan === 'pro' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 flex items-center gap-1">
                            <Star size={9} strokeWidth={2} />Pro
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-warm-500">{t.specialty}</p>
                    </div>
                    <VerificationBadge status="verified" />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <RatingDisplay value={t.avg_rating} reviews={t.review_count} />
                    <span className="text-sm font-medium text-primary-700">
                      {formatPrice(t.price_per_session)}/sesión
                    </span>
                  </div>
                  {t.bio && <p className="text-xs text-warm-500 mt-2 line-clamp-2">{t.bio}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="secondary" fullWidth
                  onClick={(e) => { e.stopPropagation(); navigate(`/patient/therapist/${t.user_id}`) }}>
                  Ver perfil
                </Button>
                <Button size="sm" fullWidth
                  onClick={(e) => { e.stopPropagation(); setSelectedTherapist(t) }}>
                  Agendar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal agendar */}
      <Modal isOpen={!!selectedTherapist} onClose={handleCloseBooking}
        title={bookingStep === 'success' ? '¡Cita confirmada!' : 'Agendar sesión'}>
        {selectedTherapist && (
          <div className="flex flex-col gap-4">

            {/* ── PASO 1: Formulario ── */}
            {bookingStep === 'form' && (
              <>
                <div className="flex items-center gap-3 bg-warm-50 rounded-xl p-3">
                  <Avatar name={selectedTherapist.profile?.full_name ?? ''} size="md" />
                  <div>
                    <p className="font-semibold text-warm-900">{selectedTherapist.profile?.full_name}</p>
                    <p className="text-sm text-warm-500">{selectedTherapist.specialty}</p>
                  </div>
                </div>

                <Input label="Fecha" type="date" value={bookingForm.date}
                  onChange={(e) => setBookingForm(f => ({ ...f, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]} required />
                <Input label="Hora" type="time" value={bookingForm.time}
                  onChange={(e) => setBookingForm(f => ({ ...f, time: e.target.value }))} required />

                {bookingForm.date && bookingForm.time && (() => {
                  const scheduledAt = new Date(`${bookingForm.date}T${bookingForm.time}`)
                  const hoursUntil  = (scheduledAt - new Date()) / 1000 / 60 / 60
                  const urgent      = hoursUntil < 24
                  const price       = selectedTherapist.price_per_session * (urgent ? 1.3 : 1)
                  return (
                    <div className={`rounded-xl p-3 text-sm ${urgent ? 'bg-orange-50 border border-orange-200' : 'bg-primary-50 border border-primary-100'}`}>
                      <p className={`font-medium ${urgent ? 'text-orange-800' : 'text-primary-800'}`}>
                        {urgent ? <><Zap size={13} strokeWidth={1.8} className="inline mr-1" />Cita urgente</> : <><Calendar size={13} strokeWidth={1.8} className="inline mr-1" />Cita estándar</>}
                      </p>
                      <p className={`text-xs mt-0.5 ${urgent ? 'text-orange-600' : 'text-primary-600'}`}>
                        Total: <strong>{formatPrice(price)} USD</strong>
                        {urgent && ' (incluye 30% de tarifa urgente)'}
                      </p>
                    </div>
                  )
                })()}

                <Button fullWidth
                  disabled={!bookingForm.date || !bookingForm.time}
                  onClick={() => {
                    const dt = new Date(`${bookingForm.date}T${bookingForm.time}`)
                    if (dt <= new Date()) {
                      toast.error('La fecha y hora deben ser en el futuro')
                      return
                    }
                    setBookingStep('payment')
                  }}>
                  Continuar al pago →
                </Button>
              </>
            )}

            {/* ── PASO 2: Pago con PayPal ── */}
            {bookingStep === 'payment' && (() => {
              const scheduledAt = new Date(`${bookingForm.date}T${bookingForm.time}`)
              const hoursUntil  = (scheduledAt - new Date()) / 1000 / 60 / 60
              const urgent      = hoursUntil < 24
              const price       = +(selectedTherapist.price_per_session * (urgent ? 1.3 : 1)).toFixed(2)

              return (
                <>
                  {/* Resumen de la cita */}
                  <div className="bg-warm-50 rounded-xl p-4 text-sm">
                    <p className="font-semibold text-warm-800 mb-2">Resumen de tu cita</p>
                    <div className="flex justify-between text-warm-600">
                      <span>Terapeuta</span>
                      <span className="font-medium">{selectedTherapist.profile?.full_name}</span>
                    </div>
                    <div className="flex justify-between text-warm-600 mt-1">
                      <span>Fecha</span>
                      <span className="font-medium">
                        {new Date(scheduledAt).toLocaleDateString('es-DO', { dateStyle: 'long' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-warm-600 mt-1">
                      <span>Hora</span>
                      <span className="font-medium">{bookingForm.time}</span>
                    </div>
                    {urgent && (
                      <div className="flex justify-between text-orange-600 mt-1">
                        <span className="flex items-center gap-1"><Zap size={12} strokeWidth={1.8} />Cargo urgente (30%)</span>
                        <span className="font-medium">incluido</span>
                      </div>
                    )}
                    <div className="flex justify-between text-warm-900 font-bold mt-2 pt-2 border-t border-warm-200">
                      <span>Total</span>
                      <span>{formatPrice(price)} USD</span>
                    </div>
                  </div>

                  <PayPalButton
                    therapistId={selectedTherapist.user_id}
                    scheduledAt={scheduledAt.toISOString()}
                    isUrgent={urgent}
                    priceBase={selectedTherapist.price_per_session}
                    therapistName={selectedTherapist.profile?.full_name ?? 'el terapeuta'}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />

                  <button onClick={() => setBookingStep('form')}
                    className="text-xs text-warm-400 hover:text-warm-600 text-center transition-colors">
                    ← Volver y cambiar fecha/hora
                  </button>
                </>
              )
            })()}

            {/* ── PASO 3: Éxito ── */}
            {bookingStep === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-serif text-lg font-bold text-warm-900 mb-1">¡Pago exitoso!</h3>
                <p className="text-sm text-warm-500 mb-6">
                  Tu cita con <strong>{selectedTherapist.profile?.full_name}</strong> está confirmada.
                  La verás en tu agenda de citas.
                </p>
                <div className="flex flex-col gap-2">
                  <Button fullWidth onClick={() => navigate('/patient/appointments')}>
                    Ver mis citas
                  </Button>
                  <Button variant="secondary" fullWidth onClick={handleCloseBooking}>
                    Seguir explorando
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>
    </div>
  )
}
