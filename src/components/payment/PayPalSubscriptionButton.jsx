/**
 * PayPalSubscriptionButton — Botón PayPal para suscripción mensual $50.
 *
 * Usa el mismo patrón que PayPalButton (sesiones) para evitar
 * el redirect completo que borra la sesión de Supabase.
 *
 * Flujo:
 *   1. createOrder  → llama create-subscription-order → devuelve { orderId }
 *   2. onApprove    → llama capture-subscription-payment → activa plan Pro
 *   3. onSuccess    → callback del padre
 */
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PayPalSubscriptionButton({ onSuccess, onError }) {
  const containerRef = useRef(null)
  const rendered     = useRef(false)
  const [sdkReady, setSdkReady]   = useState(false)
  const [sdkError, setSdkError]   = useState(false)
  const [processing, setProcessing] = useState(false)

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID

  useEffect(() => {
    return () => { rendered.current = false }
  }, [])

  // Cargar el SDK de PayPal (reutilizar si ya está cargado)
  useEffect(() => {
    if (window.paypal) { setSdkReady(true); return }

    // Verificar si ya hay un script de PayPal cargando
    const existing = document.querySelector('script[src*="paypal.com/sdk"]')
    if (existing) {
      existing.addEventListener('load', () => setSdkReady(true))
      existing.addEventListener('error', () => setSdkError(true))
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`
    script.async = true
    script.onload  = () => setSdkReady(true)
    script.onerror = () => setSdkError(true)
    document.body.appendChild(script)
  }, [clientId])

  // Renderizar botones cuando SDK esté listo
  useEffect(() => {
    if (!sdkReady || !containerRef.current || rendered.current) return
    rendered.current = true

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color:  'blue',
        shape:  'pill',
        label:  'pay',
        height: 48,
      },

      // Paso 1: crear orden de suscripción
      createOrder: async () => {
        setProcessing(true)
        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token
        if (!token) throw new Error('Sesión expirada. Recarga la página.')

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription-order`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ plan: 'pro', amount: 50 }),
          }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Error creando la orden')
        // Guardar en localStorage por si el popup es bloqueado y PayPal hace redirect
        localStorage.setItem('psiconecta_pending_sub', JSON.stringify({
          orderId: data.orderId,
          timestamp: Date.now(),
        }))
        return data.orderId  // SDK de PayPal usa el orderId directamente
      },

      // Paso 2: capturar pago tras aprobación (sin redirect — popup se cierra solo)
      onApprove: async (paypalData) => {
        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token
        if (!token) { onError?.('Sesión expirada. Recarga la página.'); return }

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-subscription-payment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId: paypalData.orderID }),
          }
        )
        const result = await res.json()
        setProcessing(false)

        if (!res.ok) {
          onError?.(result.error ?? 'Error activando la suscripción')
          return
        }
        localStorage.removeItem('psiconecta_pending_sub')
        onSuccess?.(result.expiresAt)
      },

      onError: (err) => {
        console.error('PayPal error:', err)
        setProcessing(false)
        onError?.('Hubo un error con PayPal. Intenta de nuevo.')
      },

      onCancel: () => {
        setProcessing(false)
      },
    }).render(containerRef.current)
  }, [sdkReady])

  if (sdkError) {
    return (
      <div className="text-center py-4 text-red-500 text-sm">
        No se pudo cargar PayPal. Verifica tu conexión e intenta de nuevo.
      </div>
    )
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
