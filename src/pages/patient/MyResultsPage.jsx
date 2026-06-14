import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { Brain, Scan, Microscope, Settings, AlertTriangle, Users, Puzzle, Baby, BarChart2, Calendar } from 'lucide-react'

// ─── Helpers visuales ────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  minimal:           { label: 'Mínimo',                   bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  normal:            { label: 'Normal',                    bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  mild:              { label: 'Leve',                      bg: 'bg-lime-100',   text: 'text-lime-700',   dot: 'bg-lime-400'   },
  moderate:          { label: 'Moderado',                  bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  moderately_severe: { label: 'Moderadamente severo',     bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  severe:            { label: 'Severo',                    bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  extreme:           { label: 'Extremadamente severo',    bg: 'bg-red-200',    text: 'text-red-900',    dot: 'bg-red-700'    },
  subclinical:       { label: 'Subclínico',                bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  mci:               { label: 'Deterioro cognitivo leve', bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  dementia:          { label: 'Posible demencia',          bg: 'bg-red-200',    text: 'text-red-900',    dot: 'bg-red-700'    },
  low_risk:          { label: 'Bajo riesgo',               bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  risky:             { label: 'Riesgo',                    bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  harmful:           { label: 'Perjudicial',               bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  dependence:        { label: 'Probable dependencia',      bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
}

const CATEGORY_ICON = {
  sintomas:        Brain,
  personalidad:    Scan,
  cognitivo:       Microscope,
  funcional:       Settings,
  riesgo:          AlertTriangle,
  relacional:      Users,
  neuropsicologia: Puzzle,
  infantil:        Baby,
}

// Agrupa sesiones por test slug
function groupByTest(sessions) {
  const map = {}
  sessions.forEach(s => {
    const slug = s.test_assignments?.tests?.slug ?? 'unknown'
    if (!map[slug]) map[slug] = []
    map[slug].push(s)
  })
  // Ordenar cada grupo por fecha desc (más reciente primero)
  Object.values(map).forEach(arr => arr.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at)))
  return map
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MyResultsPage() {
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const [groups, setGroups]   = useState({})  // slug → sessions[]
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchResults()
  }, [user])

  const fetchResults = async () => {
    setLoading(true)

    // Traer sesiones completadas
    const { data: sessions, error: sessErr } = await supabase
      .from('test_sessions')
      .select(`
        id, completed_at, status,
        test_assignments (
          id,
          tests ( id, slug, name, category, estimated_minutes )
        )
      `)
      .eq('respondent_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    if (sessErr || !sessions?.length) { setGroups({}); setLoading(false); return }

    // Traer resultados liberados (query separado, sin embed scoring_rules para evitar fallos)
    const sessionIds = sessions.map(s => s.id)
    const { data: results } = await supabase
      .from('test_results')
      .select('id, session_id, raw_score, adjusted_score, severity_label, severity_code, released_to_patient, scoring_rules!scoring_rule_id ( subscale_name, display_name )')
      .in('session_id', sessionIds)
      .eq('released_to_patient', true)

    // Mapear resultados a las sesiones
    const resultsMap = {}
    ;(results ?? []).forEach(r => {
      if (!resultsMap[r.session_id]) resultsMap[r.session_id] = []
      resultsMap[r.session_id].push(r)
    })

    // Filtrar solo sesiones con al menos 1 resultado liberado
    const released = sessions
      .map(s => ({ ...s, test_results: resultsMap[s.id] ?? [] }))
      .filter(s => s.test_results.length > 0)

    setGroups(groupByTest(released))
    setLoading(false)
  }

  const totalTests    = Object.keys(groups).length
  const totalSessions = Object.values(groups).reduce((acc, arr) => acc + arr.length, 0)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl mx-auto px-4 pb-10">

      {/* Header */}
      <div className="pt-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-warm-400 hover:text-warm-600 transition-colors mb-4 flex items-center gap-1"
        >
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-warm-900">Mis resultados</h1>
        <p className="text-sm text-warm-500 mt-1">
          {totalSessions === 0
            ? 'Aún no tienes resultados disponibles'
            : `${totalSessions} evaluación${totalSessions !== 1 ? 'es' : ''} · ${totalTests} test${totalTests !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Estado vacío */}
      {totalSessions === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4"><BarChart2 size={48} strokeWidth={1.8} className="text-warm-300" /></div>
          <p className="font-semibold text-warm-700 mb-1">Sin resultados todavía</p>
          <p className="text-sm text-warm-400 leading-relaxed max-w-xs">
            Cuando completes un test y tu terapeuta libere los resultados, aparecerán aquí.
          </p>
        </div>
      )}

      {/* Grupos por test */}
      {Object.entries(groups).map(([slug, sessions]) => {
        const test      = sessions[0].test_assignments?.tests
        const latest    = sessions[0]
        const IconComp  = CATEGORY_ICON[test?.category] ?? BarChart2

        // Resultados liberados de la sesión más reciente
        const latestResults = (latest.test_results ?? []).filter(r => r.released_to_patient)
        const primaryResult = latestResults[0]
        const cfg           = SEVERITY_CONFIG[primaryResult?.severity_code] ?? {}

        return (
          <div key={slug} className="bg-white border border-warm-100 rounded-2xl overflow-hidden shadow-sm">

            {/* Cabecera del test */}
            <div className="p-4 pb-3">
              <div className="flex items-start gap-3">
                <IconComp size={22} strokeWidth={1.8} className="text-warm-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-warm-900 text-sm leading-snug">{test?.name}</h2>
                  <p className="text-xs text-warm-400 mt-0.5">
                    {sessions.length} evaluación{sessions.length !== 1 ? 'es' : ''}
                    {' · '}Última: {formatDateTime(latest.completed_at)}
                  </p>
                </div>
                {primaryResult?.severity_code && (
                  <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>
                    {primaryResult.severity_label ?? cfg.label}
                  </span>
                )}
              </div>

              {/* Scores de la sesión más reciente */}
              {latestResults.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {latestResults.map(r => {
                    const rcfg = SEVERITY_CONFIG[r.severity_code] ?? {}
                    return (
                      <div key={r.id} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rcfg.dot ?? 'bg-warm-300'}`} />
                        <span className="text-xs text-warm-600">
                          {r.scoring_rules?.display_name ?? r.scoring_rules?.subscale_name}:
                          {' '}<strong>{r.adjusted_score ?? r.raw_score}</strong>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Historial de sesiones */}
            <div className="border-t border-warm-100">
              {sessions.map((s, idx) => {
                const sResults = (s.test_results ?? []).filter(r => r.released_to_patient)
                const sPrimary = sResults[0]
                const sCfg     = SEVERITY_CONFIG[sPrimary?.severity_code] ?? {}

                return (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/patient/results/${s.id}`)}
                    className="w-full text-left px-4 py-3 hover:bg-warm-50 transition-colors flex items-center gap-3 border-b border-warm-50 last:border-b-0"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sCfg.dot ?? 'bg-warm-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-warm-500">
                        {idx === 0 ? (
                          <span className="inline-flex items-center gap-1"><Calendar size={11} strokeWidth={1.8} className="inline" /> Más reciente · </span>
                        ) : ''}{formatDateTime(s.completed_at)}
                      </p>
                      {sPrimary && (
                        <p className={`text-xs font-semibold mt-0.5 ${sCfg.text ?? 'text-warm-600'}`}>
                          {sPrimary.severity_label ?? sCfg.label}
                          {sPrimary.adjusted_score != null && ` · ${sPrimary.adjusted_score} pts`}
                        </p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-warm-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>

          </div>
        )
      })}
    </div>
  )
}
