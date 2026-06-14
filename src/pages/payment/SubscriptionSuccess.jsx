/**
 * SubscriptionSuccess — Retorno tras pago de suscripción PayPal.
 *
 * Funciona con REDIRECT y con POPUP.
 * No requiere sesión activa — el orderId es suficiente para capturar.
 */
import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Loader2, Star, XCircle, RefreshCw } from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'

export default function SubscriptionSuccess() {
  const [searchParams]  = useSearchParams()
  const navigate         = useNavigate()
  const [status, setStatus]     = useState('capturing')
  const [errorMsg, setErrorMsg] = useState('')
  const [expiresAt, setExpiresAt] = useState(null)
  const hasCaptured = useRef(false)

  const orderId = searchParams.get('token')

  useEffect(() => {
    if (!orderId) {
      setErrorMsg('No se encontró el ID de la orden. Regresa e intenta de nuevo.')
      setStatus('error')
      return
    }
    if (!hasCaptured.current) {
      hasCaptured.current = true
      capturePayment()
    }
  }, [orderId])

  const capturePayment = async () => {
    setStatus('capturing')
    try {
      // Intentar adjuntar JWT si la sesión sigue activa (flujo redirect)
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const headers = { 'Content-Type': 'application/json' }
      if (authSession?.access_token) {
        headers['Authorization'] = `Bearer ${authSession.access_token}`
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-subscription-payment`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ orderId }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al activar la suscripción')

      setExpiresAt(data.expiresAt)
      setStatus('success')
    } catch (err) {
      console.error('[SubscriptionSuccess]', err)
      setErrorMsg(err.message ?? 'Error desconocido.')
      setStatus('error')
    }
  }

  const formatExpiry = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-dvh bg-psiconecta flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-calm">
            <PsiconectaLogo size={30} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-primary-800">
            Psico<span className="text-calm-500">necta</span>
          </h1>
        </div>

        {status === 'capturing' && (
          <div className="bg-white rounded-3xl shadow-float p-10 text-center">
            <Loader2 size={44} strokeWidth={1.8} className="mx-auto mb-4 animate-spin text-primary-400" />
            <h2 className="text-xl font-bold text-warm-900 mb-2">Activando tu suscripción...</h2>
            <p className="text-warm-500 text-sm">Estamos confirmando tu pago con PayPal.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-3xl shadow-float p-10 text-center">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star size={40} strokeWidth={1.8} className="text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-warm-900 mb-2">¡Plan Pro activado!</h2>
            <p className="text-warm-500 text-sm mb-4">
              Ahora tienes acceso completo a todas las herramientas clínicas.
            </p>
            {expiresAt && (
              <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 mb-8 inline-block">
                <p className="text-xs text-primary-600 font-medium">
                  Próxima renovación: {formatExpiry(expiresAt)}
                </p>
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 text-center">
              Tu suscripción está activa. Inicia sesión para acceder al dashboard.
            </div>
            <Button fullWidth onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-3xl shadow-float p-10 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} strokeWidth={1.8} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-warm-900 mb-2">Error al procesar</h2>
            <p className="text-warm-500 text-sm mb-2">{errorMsg}</p>
            <div className="flex flex-col gap-3 mt-6">
              <Button fullWidth onClick={() => { hasCaptured.current = false; capturePayment() }}>
                <RefreshCw size={15} strokeWidth={2} /> Reintentar
              </Button>
              <Button variant="outline" fullWidth onClick={() => navigate('/therapist/subscription')}>
                Volver a suscripciones
              </Button>
              <button
                onClick={() => navigate('/therapist/dashboard', { replace: true })}
                className="text-xs text-warm-400 hover:text-warm-600 underline transition-colors pt-1"
              >
                Ir al dashboard de todas formas →
              </button>
            </div>
            <p className="text-xs text-warm-400 mt-5">
              Soporte: <a href="mailto:soporte@psiconecta.app" className="text-primary-500">soporte@psiconecta.app</a>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
