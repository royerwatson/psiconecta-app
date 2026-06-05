/**
 * SubscriptionSuccess — Página de retorno tras pago de suscripción PayPal.
 *
 * PayPal redirige a: /payment/subscription-success?token=<order_token>
 *
 * IMPORTANTE: Esta página NO usa ProtectedRoute para evitar el problema de
 * redirección al login tras el full-page reload del retorno de PayPal.
 * La autenticación se verifica directamente con supabase.auth.getSession().
 */
import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Loader2, Star, XCircle, RefreshCw } from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'

export default function SubscriptionSuccess() {
  const [searchParams]  = useSearchParams()
  const { fetchProfile } = useAuthStore()
  const navigate         = useNavigate()
  const [status, setStatus]   = useState('capturing')
  const [errorMsg, setErrorMsg] = useState('')
  const [expiresAt, setExpiresAt] = useState(null)
  const hasCaptured = useRef(false)           // evitar doble captura en StrictMode

  // PayPal envía el order ID como ?token= en la URL de retorno
  const orderId = searchParams.get('token')

  useEffect(() => {
    if (!orderId) {
      setErrorMsg('No se encontró el token de pago. Vuelve a intentarlo.')
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
      // Obtener sesión directamente de Supabase (no depende del store de Zustand)
      // Esto es crítico: tras el full-page redirect de PayPal, el store puede no
      // estar hidratado aún, pero la sesión SÍ está en localStorage.
      let authToken = null
      let authUser  = null

      // Intentar hasta 3 veces con pequeño delay por si el session refresh está en curso
      for (let i = 0; i < 3; i++) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          authToken = session.access_token
          authUser  = session.user
          break
        }
        // Esperar 800ms y reintentar
        await new Promise(r => setTimeout(r, 800))
      }

      if (!authToken) {
        // Sesión no encontrada — redirigir al login preservando la URL de retorno
        navigate('/login?redirect=/therapist/subscription&msg=session', { replace: true })
        return
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-subscription-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ orderId }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al capturar el pago')

      // Refrescar perfil en el store para que ProGate se actualice inmediatamente
      if (authUser) {
        await fetchProfile(authUser).catch(() => {})
      }

      setExpiresAt(data.expiresAt)
      setStatus('success')
      toast.success('¡Suscripción activada! Bienvenido al Plan Pro.')
    } catch (err) {
      console.error('[SubscriptionSuccess] Error:', err)
      setErrorMsg(err.message ?? 'Error desconocido. Si ya se realizó el cargo, contacta soporte.')
      setStatus('error')
    }
  }

  const formatExpiry = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('es-DO', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  return (
    <div className="min-h-dvh bg-psiconecta flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-calm">
            <PsiconectaLogo size={30} color="white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-primary-800">
            Psico<span className="text-calm-500">necta</span>
          </h1>
        </div>

        {/* Capturando */}
        {status === 'capturing' && (
          <div className="bg-white rounded-3xl shadow-float p-10 text-center">
            <Loader2 size={44} strokeWidth={1.8} className="mx-auto mb-4 animate-spin text-primary-400" />
            <h2 className="font-serif text-xl font-bold text-warm-900 mb-2">
              Activando tu suscripción...
            </h2>
            <p className="text-warm-500 text-sm">Estamos procesando tu pago. Esto solo toma un momento.</p>
          </div>
        )}

        {/* Éxito */}
        {status === 'success' && (
          <div className="bg-white rounded-3xl shadow-float p-10 text-center">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star size={40} strokeWidth={1.8} className="text-primary-500" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">
              ¡Plan Pro activado!
            </h2>
            <p className="text-warm-500 text-sm mb-4">
              Tu suscripción mensual está activa. Ahora tienes acceso a todas las herramientas clínicas.
            </p>
            {expiresAt && (
              <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 mb-8 inline-block">
                <p className="text-xs text-primary-600 font-medium">
                  Próxima renovación: {formatExpiry(expiresAt)}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Button fullWidth onClick={() => navigate('/therapist/dashboard')}>
                Ir al dashboard
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate('/therapist/tests')}>
                Explorar tests psicométricos
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-white rounded-3xl shadow-float p-10 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} strokeWidth={1.8} className="text-red-400" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">
              Error al procesar
            </h2>
            <p className="text-warm-500 text-sm mb-2">
              {errorMsg}
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <Button fullWidth loading={status === 'capturing'}
                onClick={() => { hasCaptured.current = false; capturePayment() }}>
                <RefreshCw size={15} strokeWidth={2} /> Reintentar
              </Button>
              <Button variant="outline" fullWidth onClick={() => navigate('/therapist/subscription')}>
                Volver a suscripciones
              </Button>
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
