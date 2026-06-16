/**
 * EvaluacionesResultadoPage — Resultados parciales + paywall PayPal.
 * Ruta: /evaluaciones/resultado/:slug (pública, pago requiere auth)
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Sparkles, ArrowRight, RotateCcw, ChevronRight, Mail, CheckCircle2 } from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import { ASSESSMENT_TESTS } from '@/data/assessmentTests'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const LS_KEY = (slug) => `psiconecta_test_${slug}`
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/* ── Gauge SVG ────────────────────────────────────────────── */
function ScoreGauge({ score, maxScore, hex }) {
  const R = 70
  const halfCirc = Math.PI * R
  const pct = Math.min(score / maxScore, 1)
  const filled = halfCirc * pct

  return (
    <svg viewBox="0 0 160 100" className="w-full max-w-[240px] mx-auto">
      {/* Track */}
      <path d="M 15,88 A 70,70 0 0 1 145,88" fill="none" stroke="#e2e8f0" strokeWidth="13" strokeLinecap="round" />
      {/* Fill */}
      <path
        d="M 15,88 A 70,70 0 0 1 145,88"
        fill="none"
        stroke={hex}
        strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${halfCirc}`}
        style={{ transition: 'stroke-dasharray 1s ease-out' }}
      />
      {/* Score text */}
      <text x="80" y="78" textAnchor="middle" fontSize="30" fontWeight="900" fill="#0f172a">{score}</text>
      <text x="80" y="90" textAnchor="middle" fontSize="10" fill="#94a3b8">de {maxScore}</text>
    </svg>
  )
}

/* ── Barra de dimensión bloqueada ─────────────────────────── */
function LockedDimBar({ name }) {
  return (
    <div className="opacity-60 blur-[2px] select-none pointer-events-none">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{name}</span>
        <span className="font-bold text-slate-800">••%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-primary-300" style={{ width: '60%' }} />
      </div>
    </div>
  )
}

/* ── Bloque de texto bloqueado ────────────────────────────── */
function LockedTextBlock({ lines = 5 }) {
  return (
    <div className="blur-[3px] select-none pointer-events-none space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-slate-100 rounded-full ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

/* ── Componente PayPal ────────────────────────────────────── */
function PayPalButton({ testData, session, onSuccess }) {
  const containerRef = useRef(null)
  const sessionIdRef = useRef(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (document.getElementById('paypal-sdk-assessment')) { setSdkReady(true); return }
    const script = document.createElement('script')
    script.id = 'paypal-sdk-assessment'
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`
    script.onload = () => setSdkReady(true)
    script.onerror = () => setError('No se pudo cargar PayPal. Intenta de nuevo.')
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!sdkReady || !containerRef.current) return
    containerRef.current.innerHTML = ''

    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'blue', shape: 'pill', label: 'pay' },
      createOrder: async () => {
        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token
        const res = await fetch(`${SUPABASE_URL}/functions/v1/create-assessment-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            slug: testData.slug,
            instrument: testData.instrument,
            instrumentFull: testData.instrumentFull,
            responses: testData.responses,
            totalScore: testData.totalScore,
            maxScore: testData.maxScore,
            severityLabel: testData.severityLabel,
            severityHex: testData.severityHex,
            dimensionScores: testData.dimensionScores,
          }),
        })
        const data = await res.json()
        if (!data.orderID) throw new Error(data.error || 'Error al crear la orden')
        sessionIdRef.current = data.sessionId
        return data.orderID
      },
      onApprove: async (data) => {
        const { data: { session: authSession } } = await supabase.auth.getSession()
        const token = authSession?.access_token
        const res = await fetch(`${SUPABASE_URL}/functions/v1/capture-assessment-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ orderID: data.orderID, sessionId: sessionIdRef.current }),
        })
        const result = await res.json()
        if (result.success || result.alreadyPaid) {
          localStorage.removeItem(LS_KEY(testData.slug))
          onSuccess({ sessionId: sessionIdRef.current, email: result.email })
        } else {
          throw new Error(result.error || 'Error al procesar el pago')
        }
      },
      onError: (err) => setError('El pago no se pudo procesar. Intenta de nuevo.'),
    }).render(containerRef.current)
  }, [sdkReady])

  if (error) return <p className="text-red-600 text-sm text-center">{error}</p>
  if (!sdkReady) return <div className="h-12 bg-slate-100 rounded-full animate-pulse" />
  return <div ref={containerRef} />
}

/* ── Página principal ─────────────────────────────────────── */
export default function EvaluacionesResultadoPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const test = ASSESSMENT_TESTS[slug]

  const [testData, setTestData] = useState(null)
  const [existingReport, setExistingReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paid, setPaid] = useState(null) // { sessionId, email } after payment

  useEffect(() => {
    if (!test) { navigate('/evaluaciones/elegir'); return }

    // Cargar datos del test desde localStorage
    const stored = localStorage.getItem(LS_KEY(slug))
    if (!stored) { navigate(`/evaluaciones/test/${slug}`); return }
    setTestData(JSON.parse(stored))

    // Si usuario autenticado, verificar si ya tiene reporte pagado
    if (user) {
      supabase
        .from('assessment_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('slug', slug)
        .eq('paid', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data?.[0]) setExistingReport(data[0].id)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [slug, user, test, navigate])

  if (!test || !testData) return null

  const severity = test.bands.find(b => testData.totalScore >= b.min && testData.totalScore <= b.max) || test.bands.at(-1)

  function handlePaySuccess({ sessionId, email }) {
    setPaid({ sessionId, email })
  }

  // ── Pantalla de éxito post-pago ──────────────────────────────
  if (paid) {
    return (
      <div className="min-h-screen bg-psiconecta flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full">

          {/* Ícono animado */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={44} className="text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>

          {/* Texto principal */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">¡Tu reporte está listo!</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Lo enviamos a{' '}
              <span className="font-semibold text-slate-700">{paid.email}</span>.
              Revisa también la carpeta de spam si no lo ves en unos minutos.
            </p>
          </div>

          {/* Tarjeta de correo */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 mb-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Enviado a</p>
              <p className="text-sm font-bold text-slate-800 truncate">{paid.email}</p>
            </div>
          </div>

          {/* CTA ver en app */}
          <Link
            to={`/patient/evaluaciones/${paid.sessionId}`}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold rounded-2xl mb-3 hover:opacity-90 transition-opacity"
          >
            Ver reporte en la app <ArrowRight size={16} />
          </Link>

          {/* Buscar terapeuta */}
          <Link
            to="/patient/find"
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-2xl text-sm hover:bg-slate-50 transition-colors"
          >
            Buscar un terapeuta
          </Link>

          <p className="text-xs text-slate-400 text-center mt-5">
            El reporte también queda guardado en tu cuenta
          </p>
        </div>
      </div>
    )
  }

  function handleUnlock() {
    // Si no está logueado, mandar a registro con redirect de vuelta
    if (!user) {
      navigate(`/register?redirect=/evaluaciones/resultado/${slug}`)
    }
    // Si ya está logueado, el botón PayPal ya está visible
  }

  return (
    <div className="min-h-screen bg-psiconecta">

      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <PsiconectaLogo size={18} color="white" />
            </div>
            <span className="font-bold text-slate-900 text-base">Psico<span className="text-primary-600">necta</span></span>
          </Link>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Resultados</span>
        </div>
      </header>

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-xl mx-auto space-y-4">

          {/* Header del test */}
          <div className="text-center pt-4 pb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{test.instrument}</p>
            <h1 className="text-2xl font-extrabold text-slate-900">{test.name}</h1>
          </div>

          {/* Tarjeta: puntuación + gauge */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-4">Tu puntuación</p>
            <ScoreGauge score={testData.totalScore} maxScore={testData.maxScore} hex={severity.hex} />
            <div className="text-center mt-4">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: severity.hex }}
              >
                {severity.label}
              </span>
              <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">{severity.description}</p>
            </div>
          </div>

          {/* Tarjeta: desglose dimensional (bloqueado) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Desglose por dimensión</p>
            <div className="space-y-3">
              {test.dimensions.map(d => <LockedDimBar key={d.name} name={d.name} />)}
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[2px] rounded-3xl">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center mb-2 shadow">
                <Lock size={18} className="text-white" />
              </div>
              <p className="text-sm font-bold text-slate-700 text-center">En tu reporte completo</p>
            </div>
          </div>

          {/* Tarjeta: interpretación (bloqueada) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Interpretación personalizada</p>
            <LockedTextBlock lines={4} />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[2px] rounded-3xl">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center mb-2 shadow">
                <Lock size={18} className="text-white" />
              </div>
              <p className="text-sm font-bold text-slate-700 text-center">En tu reporte completo</p>
            </div>
          </div>

          {/* Tarjeta: comparación normativa (bloqueada) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">¿Cómo estás vs. la población?</p>
            <LockedTextBlock lines={3} />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[2px] rounded-3xl">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center mb-2 shadow">
                <Lock size={18} className="text-white" />
              </div>
              <p className="text-sm font-bold text-slate-700 text-center">En tu reporte completo</p>
            </div>
          </div>

          {/* Tarjeta: recomendaciones (bloqueadas) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Recomendaciones específicas</p>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="blur-[3px] select-none pointer-events-none flex gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-200 rounded-full w-1/2" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-4/5" />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[2px] rounded-3xl">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center mb-2 shadow">
                <Lock size={18} className="text-white" />
              </div>
              <p className="text-sm font-bold text-slate-700 text-center">En tu reporte completo</p>
            </div>
          </div>

          {/* CTA desbloqueo */}
          {existingReport ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center">
              <p className="font-bold text-emerald-700 mb-2">Ya tienes un reporte para esta área</p>
              <Link
                to={`/patient/evaluaciones/${existingReport}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors"
              >
                Ver mi reporte <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-primary-200 shadow-lg p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Reporte completo — <span className="text-primary-600">${test.price.toFixed(2)}</span></p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Interpretación personalizada · Desglose dimensional · Comparación normativa · 4 recomendaciones específicas · PDF descargable
                  </p>
                </div>
              </div>

              {user ? (
                <PayPalButton testData={testData} onSuccess={handlePaySuccess} />
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleUnlock}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-colors"
                  >
                    Ver mi reporte completo <ChevronRight size={18} />
                  </button>
                  <p className="text-xs text-slate-400 text-center">
                    Crea tu cuenta gratis para pagar y guardar el reporte
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Repetir test */}
          <button
            onClick={() => {
              localStorage.removeItem(LS_KEY(slug))
              navigate(`/evaluaciones/test/${slug}`)
            }}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RotateCcw size={14} /> Repetir el test
          </button>

        </div>
      </main>
    </div>
  )
}
