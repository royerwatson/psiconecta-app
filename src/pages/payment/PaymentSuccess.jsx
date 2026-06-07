/**
 * PaymentSuccess — Página de éxito de pago genérica.
 *
 * NOTA: El flujo de pago real de PayPal usa el callback onSuccess en PayPalButton,
 * que navega directamente a /patient/appointments tras capturar la orden
 * vía la Edge Function capture-paypal-order. Esta página es un fallback
 * accesible en /payment/success.
 *
 * La versión anterior llamaba a verify-payment (Stripe) — eliminado porque
 * Psiconecta migró completamente a PayPal.
 */
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'

export default function PaymentSuccess() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-psiconecta flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
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
      </div>
    </div>
  )
}
