/**
 * GiftPage — Compra de gift card para sesiones de terapia.
 * Ruta: /regalo (pública, sin login requerido)
 *
 * Flujo:
 *   1. Formulario: monto libre (mín $50), datos del remitente y destinatario + mensaje
 *   2. Pago PayPal popup
 *   3. Éxito: confirmación + "El código llegará por email a {destinatario}"
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gift, Heart, ChevronRight, Check, Star, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const PRESET_AMOUNTS = [50, 100, 150]

function PayPalGiftButton({ formData, amountUsd, onSuccess, onError }) {
  const containerRef = useRef(null)
  const rendered     = useRef(false)
  const [sdkReady, setSdkReady]     = useState(false)
  const [sdkError, setSdkError]     = useState(false)
  const [processing, setProcessing] = useState(false)

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID

  useEffect(() => {
    if (window.paypal) { setSdkReady(true); return }
    const s = document.createElement('script')
    s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&locale=es_DO`
    s.async = true
    s.onload = () => setSdkReady(true)
    s.onerror = () => setSdkError(true)
    document.body.appendChild(s)
    return () => { rendered.current = false }
  }, [clientId])

  useEffect(() => {
    if (!sdkReady || !containerRef.current || rendered.current) return
    rendered.current = true

    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', height: 48 },

      createOrder: async () => {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-gift-order`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amountUsd:      amountUsd,
              senderName:     formData.senderName,
              senderEmail:    formData.senderEmail,
              recipientName:  formData.recipientName,
              recipientEmail: formData.recipientEmail,
              message:        formData.message,
            }),
          }
        )
        const data = await res.json()
        if (!res.ok || !data.orderId) throw new Error(data.error ?? 'Error creando orden')
        return data.orderId
      },

      onApprove: async (paypalData) => {
        setProcessing(true)
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-gift-payment`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: paypalData.orderID }),
            }
          )
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Error capturando pago')
          onSuccess(data)
        } catch (e) {
          onError(e.message)
        } finally {
          setProcessing(false)
        }
      },

      onError: (err) => {
        console.error('[PayPalGiftButton]', err)
        onError('Error con PayPal. Intenta de nuevo.')
      },

      onCancel: () => toast('Pago cancelado', { icon: '↩️' }),
    }).render(containerRef.current)
  }, [sdkReady])

  if (sdkError) return (
    <p className="text-sm text-red-500 text-center">No se pudo cargar PayPal. Recarga la página.</p>
  )

  return (
    <div className="relative">
      {processing && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
          <Loader2 size={28} className="animate-spin text-primary-500" />
        </div>
      )}
      {!sdkReady && (
        <div className="h-12 bg-warm-100 rounded-xl animate-pulse" />
      )}
      <div ref={containerRef} className={sdkReady ? '' : 'hidden'} />
    </div>
  )
}

export default function GiftPage() {
  const navigate = useNavigate()
  const [step, setStep]     = useState('form')   // 'form' | 'payment' | 'success'
  const [amount, setAmount] = useState(100)
  const [customAmt, setCustomAmt] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [result, setResult] = useState(null)

  const [form, setForm] = useState({
    senderName:     '',
    senderEmail:    '',
    recipientName:  '',
    recipientEmail: '',
    message:        '',
  })

  const finalAmount = useCustom
    ? Math.max(50, parseFloat(customAmt) || 50)
    : amount

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.senderName || !form.senderEmail || !form.recipientName || !form.recipientEmail) {
      toast.error('Completa todos los campos requeridos')
      return
    }
    if (useCustom && (parseFloat(customAmt) < 50 || isNaN(parseFloat(customAmt)))) {
      toast.error('El monto mínimo es $50 USD')
      return
    }
    setStep('payment')
  }

  const handleSuccess = (data) => {
    setResult(data)
    setStep('success')
  }

  return (
    <div className="min-h-dvh bg-psiconecta">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-brand rounded-xl flex items-center justify-center">
            <PsiconectaLogo size={20} color="white" />
          </div>
          <span className="font-bold text-warm-900">Psico<span className="text-primary-600">necta</span></span>
        </button>
        <button onClick={() => navigate('/login')} className="text-sm text-warm-600 hover:text-warm-900 transition-colors">
          Iniciar sesión
        </button>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8">

        {/* ── FORMULARIO ─────────────────────────────────────────────── */}
        {step === 'form' && (
          <>
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gift size={32} strokeWidth={1.6} className="text-primary-600" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-warm-900 mb-2">
                El mejor regalo es<br/>el autocuidado
              </h1>
              <p className="text-warm-500 text-base leading-relaxed">
                Regala sesiones de terapia online a alguien que te importa.
                Un pequeño empujón para que dé el primer paso.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Monto */}
              <div className="bg-white rounded-2xl border border-warm-100 p-5 shadow-sm">
                <p className="font-semibold text-warm-900 mb-4">¿Cuánto quieres regalar?</p>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {PRESET_AMOUNTS.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => { setAmount(a); setUseCustom(false) }}
                      className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                        !useCustom && amount === a
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'bg-white border-warm-200 text-warm-700 hover:border-primary-300'
                      }`}
                    >
                      ${a}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setUseCustom(true)}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    useCustom
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-warm-200 text-warm-500 hover:border-warm-300'
                  }`}
                >
                  Otro monto (mín. $50)
                </button>

                {useCustom && (
                  <div className="mt-3 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-500 font-semibold">$</span>
                    <input
                      type="number"
                      min="50"
                      step="1"
                      placeholder="50"
                      value={customAmt}
                      onChange={e => setCustomAmt(e.target.value)}
                      className="w-full pl-7 pr-12 py-2.5 border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 text-sm">USD</span>
                  </div>
                )}

                <div className="mt-3 bg-primary-50 rounded-xl px-4 py-2 flex items-center justify-between">
                  <span className="text-sm text-primary-700">Total a pagar</span>
                  <span className="font-bold text-primary-800 text-lg">${finalAmount} USD</span>
                </div>
              </div>

              {/* De parte de */}
              <div className="bg-white rounded-2xl border border-warm-100 p-5 shadow-sm space-y-3">
                <p className="font-semibold text-warm-900">De parte de</p>
                <Input
                  label="Tu nombre *"
                  name="senderName"
                  value={form.senderName}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                />
                <Input
                  label="Tu email *"
                  name="senderEmail"
                  type="email"
                  value={form.senderEmail}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {/* Para */}
              <div className="bg-white rounded-2xl border border-warm-100 p-5 shadow-sm space-y-3">
                <p className="font-semibold text-warm-900 flex items-center gap-2">
                  <Heart size={15} strokeWidth={1.8} className="text-pink-400" />
                  Para
                </p>
                <Input
                  label="Nombre del destinatario *"
                  name="recipientName"
                  value={form.recipientName}
                  onChange={handleChange}
                  placeholder="Nombre de quien recibe el regalo"
                  required
                />
                <Input
                  label="Email del destinatario *"
                  name="recipientEmail"
                  type="email"
                  value={form.recipientEmail}
                  onChange={handleChange}
                  placeholder="su@email.com"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">
                    Mensaje personal (opcional)
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Escríbele algo especial..."
                    rows={3}
                    className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none text-warm-800 placeholder:text-warm-300"
                  />
                </div>
              </div>

              <Button fullWidth type="submit" size="lg">
                Continuar al pago <ChevronRight size={16} strokeWidth={2} className="ml-1" />
              </Button>

              <p className="text-xs text-warm-400 text-center">
                El código de regalo llegará por email al destinatario inmediatamente después del pago.
                Válido por 12 meses.
              </p>
            </form>
          </>
        )}

        {/* ── PAGO ───────────────────────────────────────────────────── */}
        {step === 'payment' && (
          <div className="space-y-5">
            <button onClick={() => setStep('form')} className="text-sm text-warm-400 hover:text-warm-700 transition-colors">
              ← Editar datos
            </button>

            {/* Resumen */}
            <div className="bg-white rounded-2xl border border-warm-100 p-5 shadow-sm">
              <p className="font-semibold text-warm-900 mb-4">Resumen del regalo</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-warm-600">
                  <span>De</span><span className="font-medium text-warm-800">{form.senderName}</span>
                </div>
                <div className="flex justify-between text-warm-600">
                  <span>Para</span><span className="font-medium text-warm-800">{form.recipientName}</span>
                </div>
                <div className="flex justify-between text-warm-600">
                  <span>Email del destinatario</span><span className="font-medium text-warm-800">{form.recipientEmail}</span>
                </div>
                <div className="flex justify-between text-warm-900 font-bold pt-2 border-t border-warm-100 mt-2">
                  <span>Total</span><span>${finalAmount} USD</span>
                </div>
              </div>
            </div>

            {/* PayPal */}
            <div className="bg-white rounded-2xl border border-warm-100 p-5 shadow-sm">
              <PayPalGiftButton
                formData={form}
                amountUsd={finalAmount}
                onSuccess={handleSuccess}
                onError={(msg) => toast.error(msg)}
              />
              <p className="text-[11px] text-warm-400 text-center mt-3 leading-relaxed">
                Pago seguro vía PayPal en USD. La conversión a moneda local la determina PayPal.
              </p>
            </div>
          </div>
        )}

        {/* ── ÉXITO ──────────────────────────────────────────────────── */}
        {step === 'success' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} strokeWidth={2} className="text-green-500" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">
              ¡Regalo enviado! 🎁
            </h2>
            <p className="text-warm-500 mb-6 leading-relaxed">
              El código de regalo llegará en minutos al email de <strong>{form.recipientName}</strong>.
            </p>

            {/* Gift card preview */}
            <div className="bg-gradient-to-br from-primary-600 to-purple-700 rounded-2xl p-6 text-center mb-6 text-white">
              <p className="text-xs text-primary-200 font-semibold uppercase tracking-widest mb-2">Código de regalo</p>
              <p className="text-3xl font-black tracking-widest mb-1">{result?.code}</p>
              <p className="text-sm text-primary-200">De {form.senderName} → Para {form.recipientName}</p>
            </div>

            <div className="bg-warm-50 rounded-xl p-4 text-sm text-warm-600 mb-6">
              <Star size={14} className="inline mr-1 text-amber-400" />
              Guarda este código como referencia. El destinatario lo usará para canjear su regalo.
            </div>

            <div className="flex flex-col gap-3">
              <Button fullWidth onClick={() => navigate('/')}>
                Volver al inicio
              </Button>
              <button
                onClick={() => { setStep('form'); setResult(null); setForm({ senderName:'', senderEmail:'', recipientName:'', recipientEmail:'', message:'' }) }}
                className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
              >
                Enviar otro regalo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
