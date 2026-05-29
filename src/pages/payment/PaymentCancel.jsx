import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'

export default function PaymentCancel() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = searchParams.get('booking_id')

  useEffect(() => {
    // Eliminar la sesión en estado payment_pending para liberar el slot
    if (bookingId) {
      supabase
        .from('sessions')
        .delete()
        .eq('id', bookingId)
        .eq('status', 'payment_pending')
        .then()
    }
  }, [bookingId])

  return (
    <div className="min-h-dvh bg-psiconecta flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-3xl shadow-float p-10 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">
            Pago cancelado
          </h2>
          <p className="text-warm-500 text-sm mb-8">
            Cancelaste el proceso de pago. Tu cita <strong>no ha sido reservada</strong>. Puedes intentarlo nuevamente cuando quieras.
          </p>

          <div className="flex flex-col gap-3">
            <Button fullWidth onClick={() => navigate('/patient/find')}>
              Buscar terapeuta
            </Button>
            <Button variant="secondary" fullWidth onClick={() => navigate('/patient/dashboard')}>
              Ir al inicio
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
