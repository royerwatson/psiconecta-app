/**
 * EvaluacionesTestPage — Toma del test, una pregunta a la vez.
 * Ruta: /evaluaciones/test/:slug (pública)
 * Guarda respuestas en localStorage → redirige a /evaluaciones/resultado/:slug
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import { ASSESSMENT_TESTS, getSeverityBand, getDimensionScores } from '@/data/assessmentTests'

const LS_KEY = (slug) => `psiconecta_test_${slug}`

export default function EvaluacionesTestPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const test = ASSESSMENT_TESTS[slug]

  const [current, setCurrent] = useState(0)
  const [responses, setResponses] = useState([])
  const [selected, setSelected] = useState(null)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!test) navigate('/evaluaciones/elegir')
  }, [test, navigate])

  if (!test) return null

  const totalQ = test.items.length
  const progress = Math.round((current / totalQ) * 100)
  const item = test.items[current]
  const isObject = typeof item === 'object'
  const questionText = isObject ? item.text : item
  const scaleLabels = isObject ? item.scale : test.scaleLabels

  function handleSelect(value) {
    if (animating) return
    setSelected(value)

    setAnimating(true)
    setTimeout(() => {
      const newResponses = [...responses]
      newResponses[current] = {
        index: current,
        value,
        label: scaleLabels[value],
        text: questionText,
      }
      setResponses(newResponses)

      if (current + 1 < totalQ) {
        setCurrent(current + 1)
        setSelected(null)
      } else {
        // Test completado — calcular score y guardar
        const totalScore = newResponses.reduce((sum, r) => sum + (r?.value ?? 0), 0)
        const severity = getSeverityBand(test, totalScore)
        const dimScores = getDimensionScores(test, newResponses.map(r => r?.value ?? 0))

        localStorage.setItem(LS_KEY(slug), JSON.stringify({
          slug,
          instrument: test.instrument,
          instrumentFull: test.instrumentFull,
          responses: newResponses,
          totalScore,
          maxScore: test.maxScore,
          severityLabel: severity.label,
          severityHex: severity.hex,
          dimensionScores: dimScores,
          completedAt: new Date().toISOString(),
        }))

        navigate(`/evaluaciones/resultado/${slug}`)
      }
      setAnimating(false)
    }, 120)
  }

  function handleBack() {
    if (current === 0) { navigate('/evaluaciones/elegir'); return }
    setCurrent(current - 1)
    setSelected(responses[current - 1]?.value ?? null)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Navbar mínimo */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/evaluaciones/elegir" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <PsiconectaLogo size={18} color="white" />
            </div>
            <span className="font-bold text-slate-900 text-base">Psico<span className="text-primary-600">necta</span></span>
          </Link>
          <span className="text-xs font-semibold text-slate-400">{test.instrument}</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="fixed top-14 inset-x-0 z-40 h-1 bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Contenido */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-xl">

          {/* Instrucción (solo en Q1) */}
          {current === 0 && (
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-8">
              {test.timeframe}
            </p>
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
                className={`w-full text-left px-5 py-4 rounded-2xl border font-semibold text-sm transition-all ${
                  selected === idx
                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg scale-[1.01]'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300 hover:bg-primary-50'
                }`}
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

          {/* Botón volver */}
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

        </div>
      </main>
    </div>
  )
}
