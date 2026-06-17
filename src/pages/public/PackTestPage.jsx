/**
 * PackTestPage — /evaluaciones/pack/:packSlug/test/:testSlug?purchaseId=xxx
 * Toma un test dentro de un pack ya pagado. Sin cobro adicional.
 * Guarda la sesión en assessment_sessions (paid=true) y la registra en el pack.
 * Al terminar todos los tests, genera el reporte combinado y redirige.
 */
import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import { ASSESSMENT_TESTS, getSeverityBand, getDimensionScores } from '@/data/assessmentTests'
import { ASSESSMENT_PACKS } from '@/data/assessmentPacks'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function PackTestPage() {
  const { packSlug, testSlug } = useParams()
  const [searchParams]         = useSearchParams()
  const purchaseId              = searchParams.get('purchaseId')
  const navigate                = useNavigate()
  const { user }                = useAuthStore()

  const pack = ASSESSMENT_PACKS[packSlug]
  const test = ASSESSMENT_TESTS[testSlug]

  const [current, setCurrent]   = useState(0)
  const [responses, setResponses] = useState([])
  const [selected, setSelected] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const [purchaseValid, setPurchaseValid] = useState(null) // null=loading, true, false

  // Calcular posición del test en el pack
  const testIndex   = pack?.tests.indexOf(testSlug) ?? -1
  const totalTests  = pack?.tests.length ?? 0

  // Verificar que la compra existe y está pagada
  useEffect(() => {
    if (!pack || !test || !purchaseId || !user) {
      if (!user) navigate(`/login?redirect=/evaluaciones/pack/${packSlug}/test/${testSlug}?purchaseId=${purchaseId}`)
      else if (!pack || !test) navigate('/evaluaciones')
      return
    }

    supabase
      .from('assessment_pack_purchases')
      .select('id, paid, session_ids, tests')
      .eq('id', purchaseId)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data || !data.paid) {
          setPurchaseValid(false)
        } else {
          setPurchaseValid(true)
        }
      })
  }, [purchaseId, user, pack, test])

  if (!pack || !test) return null
  if (purchaseValid === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-500 text-sm">Acceso no válido. Asegúrate de haber completado el pago.</p>
        <Link to="/evaluaciones" className="text-primary-600 text-sm font-semibold hover:underline">← Volver</Link>
      </div>
    )
  }
  if (purchaseValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalQ    = test.items.length
  const progress  = Math.round((current / totalQ) * 100)
  const item      = test.items[current]
  const isObject  = typeof item === 'object'
  const questionText  = isObject ? item.text : item
  const scaleLabels   = isObject ? item.scale : test.scaleLabels

  async function handleSelect(value) {
    if (animating || saving) return
    setSelected(value)
    setAnimating(true)

    setTimeout(async () => {
      const newResponses = [...responses]
      newResponses[current] = { index: current, value, label: scaleLabels[value], text: questionText }
      setResponses(newResponses)

      if (current + 1 < totalQ) {
        setCurrent(current + 1)
        setSelected(null)
        setAnimating(false)
      } else {
        // Último ítem: calcular y guardar
        setSaving(true)
        setAnimating(false)
        setError(null)

        const totalScore  = newResponses.reduce((sum, r) => sum + (r?.value ?? 0), 0)
        const severity    = getSeverityBand(test, totalScore)
        const dimScores   = getDimensionScores(test, newResponses.map(r => r?.value ?? 0))

        try {
          // 1. Insertar assessment_session (paid=true — pack ya pagado)
          const { data: session, error: sessErr } = await supabase
            .from('assessment_sessions')
            .insert({
              user_id:          user.id,
              slug:             testSlug,
              instrument:       test.instrument,
              instrument_full:  test.instrumentFull,
              responses:        newResponses,
              total_score:      totalScore,
              max_score:        test.maxScore,
              severity_label:   severity.label,
              severity_hex:     severity.hex,
              dimension_scores: dimScores,
              paid:             true,
            })
            .select('id')
            .single()

          if (sessErr) throw sessErr

          // 2. Leer purchase actual y agregar session_id
          const { data: purchase, error: fetchErr } = await supabase
            .from('assessment_pack_purchases')
            .select('session_ids')
            .eq('id', purchaseId)
            .single()

          if (fetchErr) throw fetchErr

          const updatedIds = [...(purchase.session_ids ?? []), session.id]

          const { error: updateErr } = await supabase
            .from('assessment_pack_purchases')
            .update({ session_ids: updatedIds })
            .eq('id', purchaseId)

          if (updateErr) throw updateErr

          // 3. ¿Hay más tests en el pack?
          const nextTestSlug = pack.tests[testIndex + 1]

          if (nextTestSlug) {
            navigate(`/evaluaciones/pack/${packSlug}/test/${nextTestSlug}?purchaseId=${purchaseId}`)
          } else {
            // Todos los tests completados → generar reporte
            const { data: { session: authSession } } = await supabase.auth.getSession()
            const token = authSession?.access_token

            const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-pack-report`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization:  `Bearer ${token}`,
              },
              body: JSON.stringify({ purchaseId }),
            })

            if (!res.ok) {
              const err = await res.json()
              throw new Error(err.error ?? 'Error generando reporte')
            }

            navigate(`/evaluaciones/pack/${packSlug}/reporte/${purchaseId}`)
          }
        } catch (err) {
          console.error('PackTestPage error:', err)
          setError(err.message ?? 'Error guardando resultado. Intenta de nuevo.')
          setSaving(false)
        }
      }
    }, 120)
  }

  function handleBack() {
    if (current === 0) {
      navigate(`/evaluaciones/pack/${packSlug}`)
      return
    }
    setCurrent(current - 1)
    setSelected(responses[current - 1]?.value ?? null)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={`/evaluaciones/pack/${packSlug}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <PsiconectaLogo size={18} color="white" />
            </div>
            <span className="font-bold text-slate-900 text-base">Psico<span className="text-primary-600">necta</span></span>
          </Link>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 block">{test.instrument}</span>
            <span className="text-xs text-primary-500 font-bold">Test {testIndex + 1} de {totalTests}</span>
          </div>
        </div>
      </header>

      {/* Barra de progreso del test actual */}
      <div className="fixed top-14 inset-x-0 z-40 h-1 bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Barra de progreso del pack (tests completados) */}
      <div className="fixed top-[60px] inset-x-0 z-39 h-0.5 bg-slate-50">
        <div
          className="h-full bg-primary-200 transition-all duration-500"
          style={{ width: `${Math.round((testIndex / totalTests) * 100)}%` }}
        />
      </div>

      {/* Contenido */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-xl">

          {/* Indicador del pack */}
          {current === 0 && (
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-xs font-semibold text-primary-700">
                {pack.icon} {pack.name} · Test {testIndex + 1} de {totalTests}
              </span>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-4">
                {test.timeframe}
              </p>
            </div>
          )}

          {/* Número de pregunta */}
          <p className="text-xs font-bold text-slate-300 mb-3">
            {current + 1} / {totalQ}
          </p>

          {/* Pregunta */}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-8">
            {questionText}
          </h2>

          {/* Opciones */}
          <div className="space-y-2.5">
            {scaleLabels.map((label, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={saving}
                className={`w-full text-left px-5 py-4 rounded-2xl border font-semibold text-sm transition-all ${
                  selected === idx
                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg scale-[1.01]'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300 hover:bg-primary-50'
                } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="inline-flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected === idx ? 'border-white bg-white/20' : 'border-slate-300'
                  }`}>
                    {selected === idx && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </span>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Estado de guardado */}
          {saving && (
            <div className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-500">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              {testIndex + 1 < totalTests ? 'Guardando resultado…' : 'Generando tu reporte integrado…'}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
              {error}
              <button onClick={() => setError(null)} className="ml-2 text-xs underline">Reintentar</button>
            </div>
          )}

          {/* Botón volver */}
          {!saving && (
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft size={16} /> Volver
              </button>
              <span className="text-xs text-slate-300 font-medium">
                Toca una opción para continuar
              </span>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
