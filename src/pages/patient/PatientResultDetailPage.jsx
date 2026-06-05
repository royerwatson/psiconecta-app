import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { Lock, Calendar, Lightbulb } from 'lucide-react'

// ─── Helpers visuales ────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  minimal:           { label: 'Mínimo',                   bg: 'bg-green-500',  card: 'bg-green-50 border-green-200',   text: 'text-green-700'  },
  normal:            { label: 'Normal',                    bg: 'bg-green-500',  card: 'bg-green-50 border-green-200',   text: 'text-green-700'  },
  mild:              { label: 'Leve',                      bg: 'bg-lime-400',   card: 'bg-lime-50 border-lime-200',     text: 'text-lime-700'   },
  moderate:          { label: 'Moderado',                  bg: 'bg-amber-400',  card: 'bg-amber-50 border-amber-200',   text: 'text-amber-700'  },
  moderately_severe: { label: 'Moderadamente severo',     bg: 'bg-orange-500', card: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  severe:            { label: 'Severo',                    bg: 'bg-red-500',    card: 'bg-red-50 border-red-200',       text: 'text-red-700'    },
  extreme:           { label: 'Extremadamente severo',    bg: 'bg-red-700',    card: 'bg-red-100 border-red-300',      text: 'text-red-900'    },
  subclinical:       { label: 'Subclínico',                bg: 'bg-green-500',  card: 'bg-green-50 border-green-200',   text: 'text-green-700'  },
  mci:               { label: 'Deterioro cognitivo leve', bg: 'bg-amber-400',  card: 'bg-amber-50 border-amber-200',   text: 'text-amber-700'  },
  dementia:          { label: 'Posible demencia',          bg: 'bg-red-700',    card: 'bg-red-100 border-red-300',      text: 'text-red-900'    },
  low_risk:          { label: 'Bajo riesgo',               bg: 'bg-green-500',  card: 'bg-green-50 border-green-200',   text: 'text-green-700'  },
  risky:             { label: 'Riesgo',                    bg: 'bg-amber-400',  card: 'bg-amber-50 border-amber-200',   text: 'text-amber-700'  },
  harmful:           { label: 'Perjudicial',               bg: 'bg-orange-500', card: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  dependence:        { label: 'Probable dependencia',      bg: 'bg-red-500',    card: 'bg-red-50 border-red-200',       text: 'text-red-700'    },
}

// Barra de severidad idéntica a la vista del terapeuta
function SeverityBar({ ranges, adjustedScore }) {
  if (!ranges?.length) return null
  const maxScore = Math.max(...ranges.map(r => r.score_max))
  const pct = Math.min(100, ((adjustedScore ?? 0) / maxScore) * 100)

  return (
    <div className="mt-3">
      <div className="relative h-3 rounded-full overflow-hidden flex">
        {ranges.map((r, i) => {
          const width = ((r.score_max - r.score_min) / maxScore) * 100
          const cfg   = SEVERITY_CONFIG[r.severity_code] ?? {}
          return (
            <div key={i} style={{ width: `${width}%` }} className={`${cfg.bg ?? 'bg-warm-300'} opacity-30`} />
          )
        })}
        <div
          className="absolute top-0 bottom-0 w-1 bg-warm-900 rounded-full shadow"
          style={{ left: `calc(${pct}% - 2px)` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-warm-400">{ranges[0]?.score_min ?? 0}</span>
        <span className="text-xs text-warm-400">{maxScore}</span>
      </div>
    </div>
  )
}

// Mini gráfica de tendencia (últimas 4 sesiones del mismo test)
function TrendChart({ history, subscaleKey }) {
  if (!history || history.length < 2) return null

  const points = history
    .map(s => {
      const r = (s.test_results ?? []).find(
        r => (r.scoring_rules?.subscale_name ?? 'total') === subscaleKey
      )
      return r ? (r.adjusted_score ?? r.raw_score) : null
    })
    .filter(v => v !== null)
    .slice(0, 4)
    .reverse()  // cronológico

  if (points.length < 2) return null

  const max = Math.max(...points) || 1
  const min = Math.min(...points)
  const range = max - min || 1
  const W = 120
  const H = 40
  const pad = 8

  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (W - pad * 2)
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return `${x},${y}`
  })

  const last  = points[points.length - 1]
  const prev  = points[points.length - 2]
  const delta = last - prev
  const trend = delta < 0 ? '↓ Mejora' : delta > 0 ? '↑ Aumento' : '→ Estable'
  const tColor = delta < 0 ? 'text-green-600' : delta > 0 ? 'text-red-500' : 'text-warm-400'

  return (
    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-warm-100">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-shrink-0">
        <polyline
          points={coords.join(' ')}
          fill="none"
          stroke="#4f87c5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((v, i) => {
          const [x, y] = coords[i].split(',')
          return <circle key={i} cx={x} cy={y} r="3" fill="#4f87c5" />
        })}
      </svg>
      <div>
        <p className="text-xs text-warm-400">Tendencia ({points.length} evaluaciones)</p>
        <p className={`text-xs font-semibold ${tColor}`}>{trend}</p>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PatientResultDetailPage() {
  const { sessionId } = useParams()
  const { user }      = useAuthStore()
  const navigate      = useNavigate()

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [test, setTest]       = useState(null)
  const [results, setResults] = useState([])     // solo released_to_patient
  const [history, setHistory] = useState([])     // sesiones previas del mismo test

  useEffect(() => { if (user) loadAll() }, [sessionId, user])

  const loadAll = async () => {
    setLoading(true)
    try {
      // 1. Sesión actual
      const { data: sess } = await supabase
        .from('test_sessions')
        .select(`
          id, completed_at, status, assignment_id,
          test_assignments (
            id,
            tests ( id, slug, name, description, category )
          )
        `)
        .eq('id', sessionId)
        .single()
      setSession(sess)
      setTest(sess?.test_assignments?.tests)

      // 2. Resultados liberados de esta sesión
      const { data: res } = await supabase
        .from('test_results')
        .select(`
          id, raw_score, adjusted_score, severity_label, severity_code,
          score_delta, is_clinically_significant,
          scoring_rules (
            id, subscale_name, display_name,
            interpretation_ranges (
              score_min, score_max, severity_label, severity_code, is_risk_level,
              description
            )
          )
        `)
        .eq('session_id', sessionId)
        .eq('released_to_patient', true)
      setResults(res ?? [])

      // 3. Historial de sesiones previas del mismo test (para tendencia)
      if (sess?.test_assignments?.tests?.slug) {
        // Obtener test_id del test actual para filtrar por test (no por slug en join)
        const { data: targetTest } = await supabase
          .from('tests').select('id').eq('slug', sess.test_assignments.tests.slug).maybeSingle()

        if (targetTest) {
          const { data: hist } = await supabase
            .from('test_sessions')
            .select(`
              id, completed_at,
              test_results (
                adjusted_score, raw_score, released_to_patient,
                scoring_rules!scoring_rule_id ( subscale_name, display_name )
              ),
              test_assignments!inner (
                tests!inner ( id, slug )
              )
            `)
            .eq('respondent_id', user.id)
            .eq('status', 'completed')
            .eq('test_assignments.test_id', targetTest.id)
            .neq('id', sessionId)
            .order('completed_at', { ascending: false })
            .limit(3)

          setHistory((hist ?? []).filter(s =>
            s.test_assignments?.tests?.id === targetTest.id &&
            s.test_results?.some(r => r.released_to_patient)
          ))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  if (!session || results.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <Lock size={40} strokeWidth={1.5} className="mx-auto mb-3 text-warm-300" />
      <p className="font-semibold text-warm-700">Resultado no disponible</p>
      <p className="text-sm text-warm-400 mt-1">Tu terapeuta aún no ha liberado este resultado.</p>
      <button
        onClick={() => navigate(-1)}
        className="mt-6 text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        ← Volver
      </button>
    </div>
  )

  const allHistory = [session, ...history]

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl mx-auto px-4 pb-10">

      {/* Botón volver */}
      <div className="pt-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-warm-400 hover:text-warm-600 transition-colors flex items-center gap-1 mb-4"
        >
          ← Volver a mis resultados
        </button>

        {/* Header */}
        <h1 className="font-serif text-xl font-bold text-warm-900">{test?.name}</h1>
        <p className="text-sm text-warm-400 mt-1 flex items-center gap-1.5"><Calendar size={13} strokeWidth={1.8} className="shrink-0" />{formatDateTime(session.completed_at)}</p>
      </div>

      {/* Nota informativa */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3">
        <p className="text-xs text-primary-700 leading-relaxed">
          <Lightbulb size={13} strokeWidth={1.8} className="inline mr-1 shrink-0" />Estos resultados son una herramienta de apoyo. Tu terapeuta los revisará contigo
          y te ayudará a interpretarlos en el contexto de tu proceso terapéutico.
        </p>
      </div>

      {/* Scores por subescala */}
      <div className="space-y-4">
        {results.map(r => {
          const rule   = r.scoring_rules
          const ranges = rule?.interpretation_ranges ?? []
          const cfg    = SEVERITY_CONFIG[r.severity_code] ?? {}
          const score  = r.adjusted_score ?? r.raw_score

          // Descripción del rango actual (orientada al paciente, sin recomendación clínica)
          const currentRange = ranges.find(rng => score >= rng.score_min && score <= rng.score_max)

          return (
            <div key={r.id} className={`border-2 rounded-2xl p-4 ${cfg.card ?? 'border-warm-100 bg-white'}`}>

              {/* Nombre de la subescala + score */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-warm-900 text-sm">
                    {rule?.display_name ?? rule?.subscale_name}
                  </p>
                  <p className={`text-sm font-bold mt-0.5 ${cfg.text ?? 'text-warm-600'}`}>
                    {r.severity_label ?? cfg.label}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-3xl font-bold text-warm-900">{score}</p>
                  {/* Delta vs sesión anterior */}
                  {r.score_delta !== null && r.score_delta !== undefined && (
                    <p className={`text-xs font-medium mt-0.5 ${
                      r.score_delta < 0 ? 'text-green-600' : r.score_delta > 0 ? 'text-red-500' : 'text-warm-400'
                    }`}>
                      {r.score_delta > 0 ? '▲' : r.score_delta < 0 ? '▼' : '—'}
                      {' '}{Math.abs(r.score_delta)} pts vs anterior
                      {r.is_clinically_significant && (
                        <span className="ml-1 text-primary-600">· Cambio significativo</span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Barra de severidad */}
              <SeverityBar ranges={ranges} adjustedScore={score} />

              {/* Rangos de referencia */}
              {ranges.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-3">
                  {ranges.map((rng, i) => {
                    const rcfg  = SEVERITY_CONFIG[rng.severity_code] ?? {}
                    const active = score >= rng.score_min && score <= rng.score_max
                    return (
                      <span key={i} className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                        active
                          ? `${rcfg.card ?? 'bg-warm-100 border-warm-200'} ${rcfg.text ?? 'text-warm-700'} ring-2 ring-offset-1 ring-current`
                          : 'bg-warm-50 border-warm-100 text-warm-400'
                      }`}>
                        {rng.score_min}–{rng.score_max} · {rng.severity_label}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Descripción del rango (orientada al paciente) */}
              {currentRange?.description && (
                <div className="mt-4 pt-4 border-t border-warm-100/60">
                  <p className="text-xs text-warm-600 leading-relaxed">
                    {currentRange.description}
                  </p>
                </div>
              )}

              {/* Tendencia */}
              <TrendChart
                history={allHistory}
                subscaleKey={rule?.subscale_name ?? 'total'}
              />
            </div>
          )
        })}
      </div>

      {/* Evaluaciones anteriores del mismo test */}
      {history.length > 0 && (
        <div className="bg-white border border-warm-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-warm-100">
            <p className="text-sm font-semibold text-warm-900">Evaluaciones anteriores</p>
          </div>
          {history.map(s => {
            const sRes     = (s.test_results ?? []).filter(r => r.released_to_patient)
            const sPrimary = sRes[0]
            const sCfg     = SEVERITY_CONFIG[sPrimary?.severity_code] ?? {}
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/patient/results/${s.id}`)}
                className="w-full text-left px-4 py-3 hover:bg-warm-50 transition-colors flex items-center gap-3 border-b border-warm-50 last:border-b-0"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sCfg.bg ?? 'bg-warm-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-warm-500">{formatDateTime(s.completed_at)}</p>
                  {sPrimary && (
                    <p className={`text-xs font-semibold mt-0.5 ${sCfg.text ?? 'text-warm-600'}`}>
                      {sPrimary.severity_label ?? sCfg.label}
                      {sPrimary.adjusted_score != null && ` · ${sPrimary.adjusted_score} pts`}
                    </p>
                  )}
                </div>
                <svg className="w-4 h-4 text-warm-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })}
        </div>
      )}

      {/* CTA — hablar con terapeuta */}
      <div className="bg-warm-50 border border-warm-100 rounded-2xl px-4 py-4 text-center">
        <p className="text-sm text-warm-600 mb-3">
          ¿Tienes dudas sobre estos resultados?
        </p>
        <button
          onClick={() => navigate('/patient/chat')}
          className="px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 active:scale-95 transition-all"
        >
          Hablar con mi terapeuta
        </button>
      </div>

    </div>
  )
}
