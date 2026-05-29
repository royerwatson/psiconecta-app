import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying | success | error

  const bookingId  = searchParams.get('booking_id')
  const sessionId  = searchParams.get('session_id')

  useEffect(() => {
    if (bookingId && sessionId && user) {
      verifyPayment()
    }
  }, [bookingId, sessionId, user])

  const verifyPayment = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const token = authSession?.access_token
      if (!token) throw new Error('No auth token')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bookingId, stripeSessionId: sessionId }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Verification failed')

      setStatus('success')
      toast.success('¡Pago confirmado! Tu cita está agendada.')
    } catch (err) {
      console.error(err)
      setStatus('error')
      toast.error('No se pudo verificar el pago. Contacta soporte.')
    }
  }

  return (
    <div className="min-h-dvh bg-psiconecta flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">

        {status === 'verifying' && (
          <div className="bg-white rounded-3xl shadow-float p-10 text-center">
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <h2 className="font-serif text-xl font-bold text-warm-900 mb-2">
              Confirmando tu pago...
            </h2>
            <p className="text-warm-500 text-sm">Estamos verificando tu transacción. Esto solo toma un momento.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-3xl shadow-float p-10 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">
              ¡Pago exitoso!
            </h2>
            <p className="text-warm-500 text-sm mb-8">
              Tu cita ha sido confirmada. Puedes verla en tu agenda de citas.
            </p>
            <div className="flex flex-col gap-3">
              <Button fullWidth onClick={() => navigate('/patient/appointments')}>
                Ver mis citas
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate('/patient/dashboard')}>
                Ir al inicio
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-3xl shadow-float p-10 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">
              Error al verificar
            </h2>
            <p className="text-warm-500 text-sm mb-8">
              Hubo un problema verificando tu pago. Si ya se realizó el cargo, contacta a nuestro soporte.
            </p>
            <div className="flex flex-col gap-3">
              <Button fullWidth onClick={verifyPayment}>
                Intentar de nuevo
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate('/patient/appointments')}>
                Ver mis citas
              </Button>
            </div>
            <p className="text-xs text-warm-400 mt-6">
              Soporte:{' '}
              <a href="mailto:soporte@psiconecta.app" className="text-primary-500">
                soporte@psiconecta.app
              </a>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
