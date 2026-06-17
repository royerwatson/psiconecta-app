/**
 * PackDetailPage — /evaluaciones/pack/:packSlug
 * Muestra el detalle del pack, los tests incluidos y el botón de pago PayPal.
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import { ASSESSMENT_PACKS, getPackTests, getPackOriginalPrice } from '@/data/assessmentPacks'
import { CheckCircle2, ChevronRight, ArrowLeft, Clock, Lock, Sparkles, Crown } from 'lucide-react'

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID
const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL

const COLOR_MAP = {
  violet:  'bg-violet-100 text-violet-700 border-violet-200',
  cyan:    'bg-cyan-100 text-cyan-700 border-cyan-200',
  primary: 'bg-primary-100 text-primary-700 border-primary-200',
}

const ICON_BG = {
  violet:  'from-violet-400 to-violet-600',
  cyan:    'from-cyan-400 to-cyan-600',
  primary: 'from-primary-400 to-primary-600',
}

export default function PackDetailPage() {
  const { packSlug }   = useParams()
  const navigate        = useNavigate()
  const { user }        = useAuthStore()
  const [sdkReady, setSdkReady]     = useState(false)
  const [paying, setPaying]         = useState(false)
  const [error, setError]           = useState(null)
  const containerRef = useRef(null)
  const renderedRef  = useRef(false)

  const pack = ASSESSMENT_PACKS[packSlug]

  useEffect(() => {
    if (!pack) return
    if (document.getElementById('paypal-sdk-pack')) { setSdkReady(true); return }
    const script = document.createElement('script')
    script.id  = 'paypal-sdk-pack'
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`
    script.onload = () => setSdkReady(true)
    document.head.appendChild(script)
  }, [pack])

  useEffect(() => {
    if (!sdkReady || !containerRef.current || renderedRef.current || !pack) return
    renderedRef.current = true

    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },

      createOrder: async () => {
        if (!user) {
          navigate(`/login?redirect=/evaluaciones/pack/${packSlug}`)
          return
        }
        setError(null)
        setPaying(true)
        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token
        const res = await fetch(`${SUPABASE_URL}/functions/v1/create-pack-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ packSlug, packName: pack.name }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Error creando orden'); setPaying(false); return }
        sessionStorage.setItem(`pack_purchase_${packSlug}`, data.purchaseId)
        return data.orderID
      },

      onApprove: async (data) => {
        const purchaseId = sessionStorage.getItem(`pack_purchase_${packSlug}`)
        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token
        const res = await fetch(`${SUPABASE_URL}/functions/v1/capture-pack-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderID: data.orderID, purchaseId }),
        })
        const result = await res.json()
        if (!res.ok) { setError(result.error ?? 'Error procesando pago'); setPaying(false); return }
        const firstTest = pack.tests[0]
        navigate(`/evaluaciones/pack/${packSlug}/test/${firstTest}?purchaseId=${purchaseId}`)
      },

      onError: (err) => {
        console.error('PayPal error:', err)
        setError('Error con PayPal. Intenta nuevamente.')
        setPaying(false)
      },

      onCancel: () => setPaying(false),
    }).render(containerRef.current)
  }, [sdkReady, pack])

  if (!pack) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Pack no encontrado.</p>
        <Link to="/evaluaciones" className="text-primary-600 text-sm font-semibold hover:underline">← Volver</Link>
      </div>
    )
  }

  const tests       = getPackTests(pack)
  const origPrice   = getPackOriginalPrice(pack)
  const totalMin    = tests.reduce((s, t) => s + parseInt(t.duration), 0)

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] text-slate-800 dark:text-slate-200">

      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center shadow-sm">
              <PsiconectaLogo size={22} color="white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
              Psico<span className="text-primary-600">necta</span>
            </span>
          </Link>
          {!user && (
            <Link to="/login" className="text-sm font-semibold text-primary-600 hover:underline">
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Volver */}
          <Link to="/evaluaciones" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-6 transition-colors">
            <ArrowLeft size={15} strokeWidth={2} /> Ver todos los packs
          </Link>

          {/* Header del pack */}
          <div className={`card p-6 sm:p-8 mb-6 border-2 ${pack.highlight ? 'border-primary-300 dark:border-primary-700' : 'border-slate-100 dark:border-slate-800'}`}>
            <div className="flex items-start gap-4 mb-5">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ICON_BG[pack.color] ?? ICON_BG.primary} flex items-center justify-center text-2xl shrink-0 shadow-md`}>
                {pack.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{pack.name}</h1>
                  {pack.highlight && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 text-xs font-bold">
                      <Crown size={10} strokeWidth={2} /> Más popular
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{pack.instruments}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
              {pack.description}
            </p>

            {/* Tests incluidos */}
            <div className="space-y-3 mb-5">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tests incluidos</p>
              {tests.map(t => (
                <div key={t.slug} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <CheckCircle2 size={16} strokeWidth={2} className="text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.instrumentFull} · {t.duration}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bonus */}
            {pack.bonus && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-5">
                <Sparkles size={15} strokeWidth={2} className="text-green-600 shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">{pack.bonus}</p>
              </div>
            )}

            {/* Precio */}
            <div className="flex items-end justify-between border-t border-slate-100 dark:border-slate-700 pt-5">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">${pack.price}</span>
                  <span className="text-sm text-slate-400 line-through">${origPrice.toFixed(2)}</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Ahorra {pack.save}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p className="flex items-center gap-1 justify-end"><Clock size={11} /> ~{totalMin} min total</p>
                <p>Reporte integrado cruzado</p>
              </div>
            </div>
          </div>

          {/* Pago */}
          <div className="card p-6">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Lock size={14} strokeWidth={2} className="text-primary-500" />
              Pago seguro con PayPal
            </h2>

            {!user && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Necesitas una cuenta para continuar.{' '}
                  <Link to={`/login?redirect=/evaluaciones/pack/${packSlug}`} className="font-semibold underline">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            {paying && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                Procesando pago…
              </div>
            )}

            <div ref={containerRef} className={paying ? 'hidden' : ''} />

            <p className="text-center text-xs text-slate-400 mt-3">
              Al pagar aceptas los <Link to="/terminos" className="underline">Términos de servicio</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
