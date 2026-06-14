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
import ConsentModal from '@/components/patient/ConsentModal'
import toast from 'react-hot-toast'
import { DollarSign, Zap, AlertTriangle, Search, Calendar, Crown, Star, Clock } from 'lucide-react'
import { useCurrencyContext } from '@/context/CurrencyContext'
import { addDays, format, getISODay } from 'date-fns'
import { es } from 'date-fns/locale'

const SPECIALTIES = [
  'Todas', 'Psicología clínica', 'Psicología cognitivo-conductual', 'Psicoanálisis',
  'Terapia familiar y de pareja', 'Psicología infantil', 'Neuropsicología',
]

export default function FindTherapist() {
  const { user } = useAuthStore()
  const { formatWithLocal, formatLocal } = useCurrencyContext()
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
  const [bookingStep, setBookingStep] = useState('form') // 'consent' | 'form' | 'payment' | 'success'
  const [signingConsent, setSigningConsent] = useState(false)
  const [availSlots, setAvailSlots]     = useState({})
  const [selectedDate, setSelectedDate] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchTherapists() }, [specialty, isUrgent])

  const fetchTherapists = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      let query = supabase
        .from('therapist_profiles')
        .select(`
          user_id, specialty, bio, price_per_session, rating, review_count,
          subscription_plan, verified, available_urgent,
          languages, years_experience, approaches, education,
          profile:profiles(id, full_name, avatar_url)
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
      // Muestra el mensaje real de Supabase para facilitar el diagnóstico en producción
      const detail = err?.message ?? err?.details ?? JSON.stringify(err)
      setFetchError(`No pudimos cargar los terapeutas. ${detail}`)
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
    setAvailSlots({})
    setSelectedDate(null)
  }

  const loadSlots = async (therapist) => {
    setLoadingSlots(true)
    setAvailSlots({})
    setSelectedDate(null)
    const therapistId = therapist.user_id
    const today = new Date()
    const in28  = addDays(today, 28)

    const [{ data: avail }, { data: blocked }, { data: occupied }] = await Promise.all([
      supabase.from('therapist_availability').select('*').eq('therapist_id', therapistId),
      supabase.from('therapist_blocked_dates').select('blocked_date').eq('therapist_id', therapistId)
        .gte('blocked_date', format(today, 'yyyy-MM-dd')),
      supabase.from('sessions').select('scheduled_at').eq('therapist_id', therapistId)
        .in('status', ['scheduled', 'in_progress'])
        .gte('scheduled_at', today.toISOString())
        .lte('scheduled_at', in28.toISOString()),
    ])

    const blockedSet  = new Set((blocked ?? []).map(b => b.blocked_date))
    const occupiedSet = new Set((occupied ?? []).map(s => s.scheduled_at.slice(0, 16)))

    const slots = {}
    for (let i = 0; i <= 28; i++) {
      const day     = addDays(today, i)
      const dateKey = format(day, 'yyyy-MM-dd')
      if (blockedSet.has(dateKey)) continue
      const isoDay   = getISODay(day)
      const dayAvail = (avail ?? []).filter(a => a.day_of_week === isoDay)
      if (!dayAvail.length) continue
      const daySlots = []
      for (const a of dayAvail) {
        const [sh] = a.start_time.split(':').map(Number)
        const [eh] = a.end_time.split(':').map(Number)
        for (let h = sh; h < eh; h++) {
          const slotKey = `${dateKey}T${String(h).padStart(2,'0')}:00`
          if (!occupiedSet.has(slotKey)) daySlots.push(`${String(h).padStart(2,'0')}:00`)
        }
      }
      if (daySlots.length) slots[dateKey] = daySlots
    }
    setAvailSlots(slots)
    setLoadingSlots(false)
  }

  const openBooking = async (therapist) => {
    setSelectedTherapist(therapist)
    if (!user) { setBookingStep('form'); return }

    // Verificar si ya firmó el consentimiento con este terapeuta
    const { data: existing } = await supabase
      .from('consent_signatures')
      .select('id')
      .eq('patient_id', user.id)
      .eq('therapist_id', therapist.profile?.id ?? therapist.user_id)
      .maybeSingle()

    if (existing) {
      setBookingStep('form')
      loadSlots(therapist)
    } else {
      setBookingStep('consent')
    }
  }

  const handleSignConsent = async () => {
    if (!user || !selectedTherapist) return
    setSigningConsent(true)
    const { error } = await supabase.from('consent_signatures').insert({
      patient_id:   user.id,
      therapist_id: selectedTherapist.profile?.id ?? selectedTherapist.user_id,
    })
    setSigningConsent(false)
    if (error && error.code !== '23505') { // 23505 = unique violation (ya firmó)
      toast.error('Error al guardar el consentimiento')
      return
    }
    setBookingStep('form')
    loadSlots(selectedTherapist)
  }

  const handlePaymentSuccess = (bookingId) => {
    setBookingStep('success')
    if (bookingId) {
      setTimeout(() => navigate(`/payment/success?session=${bookingId}`), 1200)
    } else {
      toast.success('¡Pago exitoso! Tu cita ha sido confirmada.')
    }
  }

  const handlePaymentError = (msg) => {
    toast.error(msg ?? 'Error al procesar el pago. Intenta de nuevo.')
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-warm-900">Encontrar terapeuta</h1>
        <p className="text-slate-500 text-sm mt-1">Profesionales verificados listos para ayudarte</p>
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-[1.5px] text-sm font-semibold transition-all ${
              (priceMin || priceMax)
                ? 'bg-primary-100 border-primary-300 text-primary-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}>
            <DollarSign size={14} strokeWidth={1.8} className="mr-1" />Precio
          </button>
          <button onClick={() => setIsUrgent(!isUrgent)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-[1.5px] text-sm font-semibold transition-all ${
              isUrgent
                ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
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
        <div className="rounded-3xl p-4 bg-amber-50 border border-amber-200">
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
          <div className="w-16 h-16 gradient-calm rounded-3xl flex items-center justify-center mb-5 shadow-[0_4px_14px_rgba(99,102,241,0.25)]">
            <Search size={28} strokeWidth={1.5} className="text-white" />
          </div>
          <p className="font-bold text-slate-800 mb-1 tracking-tight">Sin terapeutas disponibles</p>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            No encontramos terapeutas con esos filtros. Prueba cambiando la especialidad o la fecha.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 stagger">
          {filteredTherapists.map((t) => (
            <div key={t.id}
              className="card hover-lift cursor-pointer group"
              onClick={() => navigate(`/patient/therapist/${t.user_id}`)}>

              {/* Top section */}
              <div className="flex items-start gap-4 p-5">
                {/* Avatar with ring */}
                <div className="relative shrink-0">
                  <div className={t.subscription_plan === 'pro' || t.subscription_plan === 'premium'
                    ? 'avatar-ring-pro rounded-full' : 'avatar-ring rounded-full'}>
                    <Avatar name={t.profile?.full_name ?? ''} size="lg" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 status-online" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name + badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 tracking-tight">{t.profile?.full_name}</p>
                        {(t.subscription_plan === 'pro' || t.subscription_plan === 'premium') && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1 shrink-0">
                            <Star size={9} strokeWidth={2.5} fill="currentColor" />Pro
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{t.specialty}</p>
                    </div>
                    <div className="shrink-0">
                      <VerificationBadge status="verified" />
                    </div>
                  </div>

                  {/* Rating + price */}
                  <div className="flex items-center justify-between mt-2.5 gap-2">
                    <RatingDisplay value={t.avg_rating} reviews={t.review_count} />
                    <div className="text-right">
                      <span className="text-base font-bold text-indigo-600 tracking-tight">
                        {formatWithLocal(t.price_per_session).split('≈')[0].trim()}
                      </span>
                      <span className="text-xs text-slate-400">/sesión</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {t.bio && (
                <p className="text-sm text-slate-500 px-5 pb-2 line-clamp-2 leading-relaxed -mt-1">
                  {t.bio}
                </p>
              )}

              {/* Experiencia, idiomas, enfoques */}
              <div className="flex flex-wrap gap-1.5 px-5 pb-4">
                {t.years_experience > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                    {t.years_experience} {t.years_experience === 1 ? 'año' : 'años'} de exp.
                  </span>
                )}
                {(t.languages ?? []).map(lang => (
                  <span key={lang} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                    {lang}
                  </span>
                ))}
                {(t.approaches ?? []).slice(0, 3).map(ap => (
                  <span key={ap} className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                    {ap}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 px-5 pb-5">
                <button
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border-[1.5px] border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                  onClick={(e) => { e.stopPropagation(); navigate(`/patient/therapist/${t.user_id}`) }}>
                  Ver perfil
                </button>
                <button
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white gradient-brand shadow-[0_4px_12px_rgba(79,70,229,0.30)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.40)] active:scale-[0.97] transition-all"
                  onClick={(e) => { e.stopPropagation(); openBooking(t) }}>
                  Agendar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal agendar */}
      <Modal isOpen={!!selectedTherapist} onClose={handleCloseBooking}
        title={
          bookingStep === 'consent'  ? 'Consentimiento informado' :
          bookingStep === 'success'  ? '¡Cita confirmada!' : 'Agendar sesión'
        }>
        {selectedTherapist && (
          <div className="flex flex-col gap-4">

            {/* ── PASO 0: Consentimiento ── */}
            {bookingStep === 'consent' && (
              <ConsentModal
                therapistName={selectedTherapist.profile?.full_name ?? 'el terapeuta'}
                onAccept={handleSignConsent}
                onClose={handleCloseBooking}
                loading={signingConsent}
              />
            )}

            {/* ── PASO 1: Formulario ── */}
            {bookingStep === 'form' && (
              <>
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                  <Avatar name={selectedTherapist.profile?.full_name ?? ''} size="md" />
                  <div>
                    <p className="font-semibold text-warm-900">{selectedTherapist.profile?.full_name}</p>
                    <p className="text-sm text-warm-500">{selectedTherapist.specialty}</p>
                  </div>
                </div>

                {/* ── Selector de slots ── */}
                {loadingSlots ? (
                  <div className="flex flex-col gap-2">
                    {[1,2,3].map(i => <div key={i} className="h-10 bg-warm-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : Object.keys(availSlots).length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center">
                    Este terapeuta no tiene disponibilidad en los próximos 28 días.
                    Puedes contactarlo por chat para coordinar.
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-warm-600 mb-2">Selecciona una fecha</p>
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                        {Object.keys(availSlots).map(dateKey => (
                          <button key={dateKey}
                            onClick={() => { setSelectedDate(dateKey); setBookingForm(f => ({ ...f, date: dateKey, time: '' })) }}
                            className={`py-2.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                              selectedDate === dateKey
                                ? 'border-primary-400 bg-primary-50 text-primary-700'
                                : 'border-warm-200 hover:border-warm-300 text-warm-700'
                            }`}>
                            {format(new Date(dateKey + 'T12:00'), "EEE d MMM", { locale: es })}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedDate && availSlots[selectedDate] && (
                      <div>
                        <p className="text-xs font-semibold text-warm-600 mb-2">Selecciona una hora</p>
                        <div className="flex flex-wrap gap-2">
                          {availSlots[selectedDate].map(time => (
                            <button key={time}
                              onClick={() => setBookingForm(f => ({ ...f, time }))}
                              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5 ${
                                bookingForm.time === time
                                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                                  : 'border-warm-200 hover:border-warm-300 text-warm-700'
                              }`}>
                              <Clock size={12} strokeWidth={1.8} />{time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

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
                        Total: <strong>{formatWithLocal(price)}</strong>
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
                  <div className="rounded-2xl p-4 text-sm bg-slate-50 border border-slate-100">
                    <p className="font-bold text-slate-800 mb-3 tracking-tight">Resumen de tu cita</p>
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
                      <span>{formatWithLocal(price)}</span>
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

                  <p className="text-[11px] text-warm-400 text-center leading-relaxed">
                    El cobro se realiza en <strong>USD</strong>. La conversión a tu moneda local
                    es referencial — el monto exacto lo determina PayPal según su
                    tipo de cambio al momento del pago.
                  </p>

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
                <h3 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">¡Pago exitoso!</h3>
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
