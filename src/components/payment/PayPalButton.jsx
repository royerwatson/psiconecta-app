/**
 * PayPalButton — Botón de pago integrado con PayPal SDK.
 *
 * Flujo de pago:
 *   1. createOrder  → llama a Edge Function `create-paypal-order`
 *                     que crea la sesión en DB con status='payment_pending'
 *                     y devuelve { orderId, bookingId }
 *   2. onApprove    → llama a Edge Function `capture-paypal-order`
 *                     que captura el pago y actualiza la sesión a 'scheduled'
 *   3. onSuccess    → callback del padre para navegar al paso de éxito
 *   4. onCancel     → elimina la sesión payment_pending (best-effort)
 *
 * Variables de entorno requeridas:
 *   VITE_PAYPAL_CLIENT_ID — Client ID de la app PayPal (sandbox o producción)
 *   VITE_SUPABASE_URL     — Para llamar a las Edge Functions
 *
 * Props:
 *   therapistId   — ID del terapeuta
 *   scheduledAt   — ISO string de la fecha/hora de la sesión
 *   isUrgent      — boolean, aplica el 30% extra
 *   priceBase     — precio base de la sesión (USD)
 *   therapistName — nombre del terapeuta (para el resumen en PayPal)
 *   onSuccess     — callback cuando el pago es exitoso
 *   onError       — callback con mensaje de error
 */
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
export default function PayPalButton({
  therapistId,
  scheduledAt,
  isUrgent,
  priceBase,
  therapistName,
  onSuccess,
  onError,
}) {
  const containerRef = useRef(null)
  const [sdkReady, setSdkReady]     = useState(false)
  const [sdkError, setSdkError]     = useState(false)
  const [processing, setProcessing] = useState(false)
  const rendered = useRef(false)

  // Reset al desmontar para evitar duplicación si se reabre el modal
  useEffect(() => {
    return () => { rendered.current = false }
  }, [])

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID

  // Cargar el SDK de PayPal (solo una vez)
  useEffect(() => {
    if (window.paypal) { setSdkReady(true); return }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`
    script.async = true
    script.onload  = () => setSdkReady(true)
    script.onerror = () => setSdkError(true)
    document.body.appendChild(script)
  }, [clientId])

  // Renderizar botones cuando el SDK esté listo
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

      // Paso 1: crear la orden en nuestro backend
      createOrder: async () => {
        setProcessing(true)
        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token
        if (!token) throw new Error('No autenticado')

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-paypal-order`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ therapistId, scheduledAt, isUrgent, priceBase, therapistName }),
          }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Error creando orden')
        // Guardar bookingId para usarlo en onApprove
        containerRef.current.dataset.bookingId = data.bookingId
        return data.orderId
      },

      // Paso 2: capturar el pago tras aprobación del usuario
      onApprove: async (paypalData) => {
        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token
        const bookingId = containerRef.current.dataset.bookingId

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-paypal-order`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId: paypalData.orderID, bookingId }),
          }
        )
        const result = await res.json()
        setProcessing(false)

        if (!res.ok) {
          onError?.(result.error ?? 'Error capturando el pago')
          return
        }
        onSuccess?.()
      },

      onError: (err) => {
        console.error('PayPal error:', err)
        setProcessing(false)
        onError?.('Hubo un error con PayPal. Intenta de nuevo.')
      },

      onCancel: () => {
        setProcessing(false)
        // Limpiar la sesión payment_pending (best-effort)
        const bookingId = containerRef.current?.dataset?.bookingId
        if (bookingId) {
          supabase.from('sessions').delete()
            .eq('id', bookingId).eq('status', 'payment_pending').then()
        }
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
