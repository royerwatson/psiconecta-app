import { useState, useEffect, useRef } from 'react'
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
import { Users, AlertTriangle, Calendar, Video, X, CreditCard } from 'lucide-react'

// ── PayPal button para sesiones grupales ─────────────────────────────────────
function GroupPayPalButton({ group, onSuccess, onError }) {
  const containerRef = useRef(null)
  const rendered     = useRef(false)
  const [sdkReady, setSdkReady]     = useState(false)
  const [sdkError, setSdkError]     = useState(false)
  const [processing, setProcessing] = useState(false)

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID

  useEffect(() => {
    if (window.paypal) { setSdkReady(true); return }
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`
    script.async = true
    script.onload  = () => setSdkReady(true)
    script.onerror = () => setSdkError(true)
    document.body.appendChild(script)
  }, [clientId])

  useEffect(() => {
    if (!sdkReady || !containerRef.current || rendered.current) return
    rendered.current = true

    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'blue', shape: 'pill', label: 'pay', height: 48 },

      createOrder: async () => {
        setProcessing(true)
        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token
        if (!token) throw new Error('No autenticado')

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-group-order`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ groupSessionId: group.id }),
          }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Error creando orden')
        return data.orderId
      },

      onApprove: async (paypalData) => {
        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-group-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ orderId: paypalData.orderID, groupSessionId: group.id }),
          }
        )
        const result = await res.json()
        setProcessing(false)
        if (!res.ok) { onError?.(result.error ?? 'Error capturando el pago'); return }
        onSuccess?.()
      },

      onError: (err) => {
        console.error('PayPal group error:', err)
        setProcessing(false)
        onError?.('Hubo un error con PayPal. Intenta de nuevo.')
      },

      onCancel: () => { setProcessing(false) },
    }).render(containerRef.current)
  }, [sdkReady])

  if (sdkError) {
    return <p className="text-center py-4 text-red-500 text-sm">No se pudo cargar PayPal. Verifica tu conexión.</p>
  }

  return (
    <div className="relative">
      {processing && (
        <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-sm text-primary-700 font-medium">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Procesando pago...
          </div>
        </div>
      )}
      {!sdkReady && (
        <div className="h-12 rounded-full bg-warm-100 animate-pulse flex items-center justify-center">
          <span className="text-xs text-warm-400">Cargando PayPal...</span>
        </div>
      )}
      <div ref={containerRef} className={sdkReady ? 'block' : 'hidden'} />
    </div>
  )
}

// ── Modal de pago ─────────────────────────────────────────────────────────────
function PaymentModal({ group, onClose, onPaid }) {
  const handleSuccess = () => {
    toast.success('¡Pago completado! Te has inscrito a la sesión grupal.')
    onPaid()
    onClose()
  }
  const handleError = (msg) => {
    toast.error(msg ?? 'Error procesando el pago')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 text-primary-700">
            <CreditCard size={18} strokeWidth={1.8} />
            <span className="font-semibold text-sm">Completar inscripción</span>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Resumen */}
        <div className="px-5 pb-4 border-b border-warm-100">
          <p className="font-medium text-warm-900">{group.title}</p>
          <p className="text-sm text-warm-500 mt-0.5">{formatSessionDate(group.scheduled_at)}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-warm-500">Terapeuta</span>
            <span className="text-sm font-medium text-warm-800">{group.therapist?.full_name}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-warm-500">Precio</span>
            <span className="text-lg font-bold text-primary-700">{formatPrice(group.price ?? 0)}</span>
          </div>
        </div>

        {/* PayPal */}
        <div className="px-5 py-5">
          <GroupPayPalButton group={group} onSuccess={handleSuccess} onError={handleError} />
        </div>

        <p className="text-center text-xs text-warm-400 pb-5 px-5">
          Pago seguro procesado por PayPal. Al completar el pago quedarás inscrito en la sesión.
        </p>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function GroupSessions() {
  const { user } = useAuthStore()
  const [groups, setGroups]     = useState([])
  const [myGroups, setMyGroups] = useState([])
  const [tab, setTab]           = useState('available')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [payingGroup, setPayingGroup] = useState(null)  // grupo para el modal de pago
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
          group_session:group_sessions(*, therapist:profiles!group_sessions_therapist_id_fkey(id, full_name, avatar_url))
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

  const handleJoin = async (group) => {
    const isFull = (group.participants?.length ?? 0) >= (group.max_participants ?? 10)
    if (isFull) { toast.error('Esta sesión está llena'); return }
    const alreadyJoined = group.participants?.some(p => p.patient_id === user.id)
    if (alreadyJoined) { toast('Ya estás inscrito en esta sesión'); return }

    // Sesión con costo → abrir modal de pago
    if ((group.price ?? 0) > 0) {
      setPayingGroup(group)
      return
    }

    // Sesión gratuita → inscripción directa
    const { error } = await supabase.from('group_session_participants').insert({
      group_session_id: group.id,
      patient_id: user.id,
      paid: false,
    })
    if (error) { toast.error('Error al unirse'); return }
    toast.success('¡Te has inscrito a la sesión grupal!')
    fetchGroups()
  }

  const displayed = tab === 'available' ? groups : myGroups

  return (
    <>
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Terapia grupal</h1>
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
          const isPaid = (group.price ?? 0) > 0

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
                <Avatar name={group.therapist?.full_name ?? ''} src={group.therapist?.avatar_url} size="xs" />
                <span>{group.therapist?.full_name}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-warm-500 mb-4">
                <span className="flex items-center gap-1"><Calendar size={13} strokeWidth={1.8} className="shrink-0" /> {formatSessionDate(group.scheduled_at)}</span>
                <span className="flex items-center gap-1"><Users size={13} strokeWidth={1.8} className="shrink-0" /> {participants.length}/{group.max_participants ?? 10} participantes</span>
                <span className={`font-medium ${isPaid ? 'text-primary-600' : 'text-emerald-600'}`}>
                  {isPaid ? formatPrice(group.price) : 'Gratis'}
                </span>
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
                    onClick={() => navigate(`/video-call/${group.id}?type=group&max=${group.max_participants ?? 20}`)}>
                    <Video size={15} strokeWidth={1.8} className="inline mr-1" />Unirse a la sesión
                  </Button>
                ) : (
                  <Button size="sm" fullWidth disabled={isFull} onClick={() => handleJoin(group)}>
                    {isFull ? 'Sesión llena' : isPaid ? `Inscribirme — ${formatPrice(group.price)}` : 'Inscribirme gratis'}
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Modal de pago PayPal */}
      {payingGroup && (
        <PaymentModal
          group={payingGroup}
          onClose={() => setPayingGroup(null)}
          onPaid={fetchGroups}
        />
      )}
    </>
  )
}
