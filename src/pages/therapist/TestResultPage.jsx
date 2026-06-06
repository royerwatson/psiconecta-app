import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { CheckCircle2, Calendar, Check, Clock, AlertTriangle } from 'lucide-react'

// ─── Helpers visuales ────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  minimal:           { label: 'Mínimo',                  bg: 'bg-green-500',  text: 'text-green-700',  card: 'bg-green-50 border-green-200' },
  normal:            { label: 'Normal',                   bg: 'bg-green-500',  text: 'text-green-700',  card: 'bg-green-50 border-green-200' },
  mild:              { label: 'Leve',                     bg: 'bg-lime-400',   text: 'text-lime-700',   card: 'bg-lime-50 border-lime-200'   },
  moderate:          { label: 'Moderado',                 bg: 'bg-amber-400',  text: 'text-amber-700',  card: 'bg-amber-50 border-amber-200' },
  moderately_severe: { label: 'Moderadamente severo',    bg: 'bg-orange-500', text: 'text-orange-700', card: 'bg-orange-50 border-orange-200'},
  severe:            { label: 'Severo',                   bg: 'bg-red-500',    text: 'text-red-700',    card: 'bg-red-50 border-red-200'     },
  extreme:           { label: 'Extremadamente severo',   bg: 'bg-red-700',    text: 'text-red-800',    card: 'bg-red-100 border-red-300'    },
  subclinical:       { label: 'Subclínico',               bg: 'bg-green-500',  text: 'text-green-700',  card: 'bg-green-50 border-green-200' },
  mci:               { label: 'Deterioro cognitivo leve', bg: 'bg-amber-400', text: 'text-amber-700',  card: 'bg-amber-50 border-amber-200' },
  dementia:          { label: 'Posible demencia',         bg: 'bg-red-700',    text: 'text-red-800',    card: 'bg-red-100 border-red-300'    },
  low_risk:          { label: 'Bajo riesgo',              bg: 'bg-green-500',  text: 'text-green-700',  card: 'bg-green-50 border-green-200' },
  risky:             { label: 'Riesgo',                   bg: 'bg-amber-400',  text: 'text-amber-700',  card: 'bg-amber-50 border-amber-200' },
  harmful:           { label: 'Perjudicial',              bg: 'bg-orange-500', text: 'text-orange-700', card: 'bg-orange-50 border-orange-200'},
  dependence:        { label: 'Probable dependencia',     bg: 'bg-red-500',    text: 'text-red-700',    card: 'bg-red-50 border-red-200'     },
}

function SeverityBar({ score, ranges, adjustedScore }) {
  if (!ranges?.length) return null
  const maxScore = Math.max(...ranges.map(r => r.score_max))
  const pct = Math.min(100, ((adjustedScore ?? score) / maxScore) * 100)

  return (
    <div className="mt-3">
      {/* Barra de rangos */}
      <div className="relative h-3 rounded-full overflow-hidden flex">
        {ranges.map((r, i) => {
          const width = ((r.score_max - r.score_min) / maxScore) * 100
          const cfg   = SEVERITY_CONFIG[r.severity_code] ?? {}
          return (
            <div key={i} style={{ width: `${width}%` }} className={`${cfg.bg ?? 'bg-warm-300'} opacity-30`} />
          )
        })}
        {/* Indicador actual */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-warm-900 rounded-full shadow"
          style={{ left: `calc(${pct}% - 2px)` }}
        />
      </div>
      {/* Etiquetas min/max */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-warm-400">{ranges[0]?.score_min}</span>
        <span className="text-xs text-warm-400">{maxScore}</span>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TestResultPage() {
  const { sessionId } = useParams()
  const { user }      = useAuthStore()
  const navigate      = useNavigate()

  const [loading, setLoading]       = useState(true)
  const [session, setSession]       = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [test, setTest]             = useState(null)
  const [patient, setPatient]       = useState(null)
  const [results, setResults]       = useState([])        // [{...result, scoring_rules, interpretation_ranges}]
  const [itemResponses, setItemResponses] = useState([])  // [{item, response_value}]
  const [riskAlerts, setRiskAlerts] = useState([])
  const [opinion, setOpinion]       = useState('')
  const [savedOpinion, setSavedOpinion] = useState(null)
  const [savingOpinion, setSavingOpinion] = useState(false)
  const [releasing, setReleasing]   = useState(false)
  const [allReleased, setAllReleased] = useState(false)
  const [isReviewed, setIsReviewed] = useState(false)
  const [markingReviewed, setMarkingReviewed] = useState(false)
  const [activeTab, setActiveTab]   = useState('scores')  // 'scores' | 'items' | 'opinion'

  useEffect(() => { loadAll() }, [sessionId])

  const loadAll = async () => {
    setLoading(true)
    try {
      // 1. Sesión
      const { data: sess, error: sessErr } = await supabase
        .from('test_sessions')
        .select('id, status, completed_at, respondent_id, assignment_id')
        .eq('id', sessionId)
        .single()
      if (sessErr || !sess) throw new Error('Sesión no encontrada')
      setSession(sess)

      // 2. Asignación y test
      const { data: assign } = await supabase
        .from('test_assignments')
        .select('id, reason, relationship_id, therapist_dismissed_at, tests(id, slug, name, description, estimated_minutes)')
        .eq('id', sess.assignment_id)
        .single()
      setAssignment(assign)
      setTest(assign?.tests)

      // 3. Paciente
      const { data: pat } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', sess.respondent_id)
        .single()
      setPatient(pat)

      // 4. Resultados con scoring rules y rangos
      const { data: res } = await supabase
        .from('test_results')
        .select(`
          id, raw_score, adjusted_score, severity_label, severity_code,
          score_delta, rci_value, is_clinically_significant,
          released_to_patient, ai_reviewed,
          scoring_rules (
            id, subscale_name, display_name, formula, multiply_by,
            interpretation_ranges ( score_min, score_max, severity_label, severity_code, color_hex, is_risk_level, description, recommendation )
          )
        `)
        .eq('session_id', sessionId)
      setResults(res ?? [])
      setAllReleased((res ?? []).length > 0 && (res ?? []).every(r => r.released_to_patient))

      // 5. Respuestas a ítems
      const { data: respData } = await supabase
        .from('item_responses')
        .select(`
          response_value, response_text,
          items ( id, order_index, text, item_code, subscale, alert_threshold,
            response_options ( label, value )
          )
        `)
        .eq('session_id', sessionId)
        .order('items(order_index)')
      setItemResponses(respData ?? [])

      // 6. Alertas de riesgo
      const { data: alerts } = await supabase
        .from('risk_alerts')
        .select('id, alert_type, description, severity, is_acknowledged, action_taken')
        .eq('session_id', sessionId)
      setRiskAlerts(alerts ?? [])

      // 7. Opinión clínica existente
      const { data: op } = await supabase
        .from('clinical_opinions')
        .select('id, opinion_text, created_at, updated_at, edit_count')
        .eq('session_id', sessionId)
        .eq('therapist_id', user.id)
        .maybeSingle()
      if (op) { setSavedOpinion(op); setOpinion(op.opinion_text) }

      // 8. Estado revisado (therapist_dismissed_at != null)
      setIsReviewed(!!assign?.therapist_dismissed_at)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const saveOpinion = async () => {
    if (!opinion.trim()) { toast.error('Escribe tu opinión clínica'); return }
    setSavingOpinion(true)
    try {
      if (savedOpinion) {
        // Actualizar
        const { error } = await supabase
          .from('clinical_opinions')
          .update({ opinion_text: opinion.trim(), updated_at: new Date().toISOString(), edit_count: (savedOpinion.edit_count ?? 0) + 1 })
          .eq('id', savedOpinion.id)
        if (error) throw error
        setSavedOpinion(prev => ({ ...prev, opinion_text: opinion.trim(), edit_count: (prev.edit_count ?? 0) + 1 }))
        toast.success('Opinión actualizada')
      } else {
        // Crear
        const { data, error } = await supabase
          .from('clinical_opinions')
          .insert({ session_id: sessionId, therapist_id: user.id, opinion_text: opinion.trim() })
          .select()
          .single()
        if (error) throw error
        setSavedOpinion(data)
        toast.success('Opinión clínica guardada')
      }
    } catch { toast.error('Error al guardar') }
    finally { setSavingOpinion(false) }
  }

  const releaseToPatient = async () => {
    setReleasing(true)
    const { error } = await supabase
      .from('test_results')
      .update({ released_to_patient: true, released_at: new Date().toISOString(), released_by: user.id })
      .eq('session_id', sessionId)
    if (error) { toast.error('Error al liberar'); setReleasing(false); return }
    setAllReleased(true)
    setResults(prev => prev.map(r => ({ ...r, released_to_patient: true })))
    toast.success('Resultados liberados al paciente')
    setReleasing(false)

    // Notificar al paciente por email (best-effort)
    if (patient?.id && test?.name) {
      supabase.functions.invoke('notify-test-result', {
        body: { patientId: patient.id, testName: test.name },
      }).catch(() => {})
    }
  }

  const markAsReviewed = async () => {
    if (!assignment?.id) return
    setMarkingReviewed(true)
    const { error } = await supabase
      .from('test_assignments')
      .update({ therapist_dismissed_at: new Date().toISOString() })
      .eq('id', assignment.id)
    if (error) { toast.error('Error al marcar como revisado'); setMarkingReviewed(false); return }
    setIsReviewed(true)
    toast.success('Test marcado como revisado')
    setMarkingReviewed(false)
  }

  const acknowledgeAlert = async (alertId) => {
    const action = prompt('Describe la acción tomada ante esta alerta:')
    if (!action) return
    await supabase.from('risk_alerts').update({
      is_acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
      action_taken: action,
    }).eq('id', alertId)
    setRiskAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_acknowledged: true, action_taken: action } : a))
    toast.success('Alerta registrada')
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  const hasRisk = riskAlerts.length > 0
  const unacknowledged = riskAlerts.filter(a => !a.is_acknowledged)

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl mx-auto pb-10">

      {/* Botón volver */}
      <Button size="sm" variant="ghost" onClick={() => navigate(-1)} className="self-start">
        ← Volver
      </Button>

      {/* ── BANNER DE RIESGO ── Solo si hay alertas no reconocidas */}
      {unacknowledged.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-5 h-5 rounded-full bg-red-500 inline-block flex-shrink-0" />
            <div>
              <p className="font-bold text-red-900 text-base">Alerta clínica — Acción requerida</p>
              <p className="text-xs text-red-600 mt-0.5">Las alertas deben ser reconocidas y documentadas</p>
            </div>
          </div>
          <div className="space-y-2">
            {unacknowledged.map(alert => (
              <div key={alert.id} className="bg-red-100 rounded-xl p-3 flex items-start justify-between gap-3">
                <p className="text-sm text-red-800 leading-snug">{alert.description}</p>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  Registrar acción
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas reconocidas */}
      {riskAlerts.filter(a => a.is_acknowledged).map(alert => (
        <div key={alert.id} className="bg-warm-50 border border-warm-200 rounded-xl p-3 flex items-center gap-2 text-xs text-warm-500">
          <CheckCircle2 size={15} strokeWidth={1.8} className="text-emerald-500 shrink-0" />
          <span><strong>Alerta resuelta:</strong> {alert.description}</span>
          {alert.action_taken && <span>· Acción: "{alert.action_taken}"</span>}
        </div>
      ))}

      {/* ── HEADER DEL RESULTADO ── */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-warm-400 mb-1">Resultado de test</p>
            <h1 className="font-serif text-xl font-bold text-warm-900">{test?.name}</h1>
            <p className="text-sm text-warm-500 mt-1">
              Paciente: <strong>{patient?.full_name}</strong>
            </p>
            {assignment?.reason && (
              <p className="text-xs text-warm-400 mt-1 italic">Motivo: "{assignment.reason}"</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-warm-100 flex-wrap">
          <span className="text-xs text-warm-400 flex items-center gap-1"><Calendar size={11} strokeWidth={1.8} className="inline" /> Completado: {formatDateTime(session?.completed_at)}</span>
          {allReleased
            ? <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1"><Check size={11} strokeWidth={1.8} /> Resultado liberado</span>
            : <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1"><Clock size={11} strokeWidth={1.8} /> Sin liberar al paciente</span>
          }
        </div>
      </Card>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-warm-100 p-1 rounded-2xl">
        {[
          { id: 'scores',  label: 'Scores'    },
          { id: 'items',   label: 'Respuestas' },
          { id: 'opinion', label: 'Mi opinión' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 text-sm font-medium py-2.5 rounded-xl transition-all ${
              activeTab === t.id ? 'bg-white shadow-sm text-primary-700' : 'text-warm-500 hover:text-warm-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: SCORES ══════════════════════════════════════════════════════ */}
      {activeTab === 'scores' && (
        <div className="space-y-4">
          {results.map(r => {
            const rule   = r.scoring_rules
            const ranges = rule?.interpretation_ranges ?? []
            const cfg    = SEVERITY_CONFIG[r.severity_code] ?? {}
            const score  = r.adjusted_score ?? r.raw_score

            // Rango actual para descripción y recomendación
            const currentRange = ranges.find(rng => score >= rng.score_min && score <= rng.score_max)

            return (
              <Card key={r.id} className={`border-2 ${cfg.card ?? 'border-warm-100'}`}>
                {/* Score y severidad */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-warm-900">
                      {rule?.display_name ?? rule?.subscale_name}
                    </p>
                    <p className={`text-sm font-bold mt-0.5 ${cfg.text ?? 'text-warm-600'}`}>
                      {r.severity_label ?? cfg.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-warm-900">{score}</p>
                    {r.score_delta !== null && r.score_delta !== undefined && (
                      <p className={`text-xs font-medium mt-0.5 ${
                        r.score_delta < 0 ? 'text-green-600' : r.score_delta > 0 ? 'text-red-500' : 'text-warm-400'
                      }`}>
                        {r.score_delta > 0 ? '▲' : r.score_delta < 0 ? '▼' : '—'}
                        {' '}{Math.abs(r.score_delta)} pts
                        {r.is_clinically_significant && (
                          <span className="ml-1 text-primary-600">· Cambio significativo</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Barra de severidad */}
                <SeverityBar score={r.raw_score} adjustedScore={score} ranges={ranges} />

                {/* Rangos de referencia */}
                {ranges.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {ranges.map((rng, i) => {
                      const rcfg   = SEVERITY_CONFIG[rng.severity_code] ?? {}
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

                {/* Descripción y recomendación del rango actual */}
                {currentRange && (
                  <div className="mt-4 pt-4 border-t border-warm-100 space-y-2">
                    {currentRange.description && (
                      <p className="text-xs text-warm-600 leading-relaxed">
                        <strong>Interpretación:</strong> {currentRange.description}
                      </p>
                    )}
                    {currentRange.recommendation && (
                      <p className="text-xs text-warm-600 leading-relaxed">
                        <strong>Recomendación clínica:</strong> {currentRange.recommendation}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ══ TAB: RESPUESTAS (mapa de ítems) ══════════════════════════════════ */}
      {activeTab === 'items' && (
        <Card>
          <h3 className="font-semibold text-warm-900 mb-4">Respuestas del paciente</h3>
          <div className="space-y-2">
            {itemResponses.map((r, idx) => {
              const item    = r.items
              const selOpt  = item?.response_options?.find(o => o.value === r.response_value)
              const isAlert = item?.alert_threshold != null && r.response_value >= item.alert_threshold
              return (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl ${
                  isAlert ? 'bg-red-50 border border-red-200' : 'bg-warm-50'
                }`}>
                  <span className="text-xs font-bold text-warm-400 mt-0.5 w-5 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-warm-800 leading-snug">{item?.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isAlert ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700'
                      }`}>
                        {selOpt?.label ?? `Valor: ${r.response_value}`}
                      </span>
                      {isAlert && <span className="text-xs text-red-500 flex items-center gap-0.5"><AlertTriangle size={10} strokeWidth={1.8} className="inline" /> Ítem elevado</span>}
                      {item?.subscale && (
                        <span className="text-xs text-warm-400">{item.subscale}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-warm-500 flex-shrink-0">{r.response_value}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ══ TAB: OPINIÓN CLÍNICA ══════════════════════════════════════════════ */}
      {activeTab === 'opinion' && (
        <div className="space-y-4">
          {savedOpinion && (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-primary-700">Opinión guardada</span>
                <span className="text-xs text-warm-400">
                  {formatDateTime(savedOpinion.updated_at ?? savedOpinion.created_at)}
                  {savedOpinion.edit_count > 0 && ` · Editada ${savedOpinion.edit_count} vez${savedOpinion.edit_count > 1 ? 'es' : ''}`}
                </span>
              </div>
              <p className="text-sm text-warm-700 leading-relaxed">{savedOpinion.opinion_text}</p>
            </div>
          )}

          <Card>
            <h3 className="font-semibold text-warm-900 mb-1">
              {savedOpinion ? 'Editar opinión clínica' : 'Agregar opinión clínica'}
            </h3>
            <p className="text-xs text-warm-400 mb-4">
              Tu opinión es un documento interno del expediente — el paciente nunca la verá.
            </p>
            <textarea
              value={opinion}
              onChange={e => setOpinion(e.target.value)}
              rows={6}
              placeholder="Describe tu interpretación clínica de estos resultados, observaciones relevantes, hipótesis diagnósticas o consideraciones para el plan terapéutico..."
              className="w-full rounded-xl border border-warm-200 px-4 py-3 text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 resize-none"
            />
            <Button
              className="w-full mt-3"
              onClick={saveOpinion}
              disabled={!opinion.trim() || savingOpinion}
              loading={savingOpinion}
            >
              {savedOpinion ? 'Actualizar opinión' : 'Guardar opinión clínica'}
            </Button>
          </Card>
        </div>
      )}

      {/* ── PANEL DE ACCIONES ── */}
      <Card className="border-2 border-primary-100 bg-primary-50/30">
        <h3 className="font-semibold text-warm-900 mb-4">Acciones</h3>
        <div className="space-y-3">
          {/* Liberar resultado */}
          {!allReleased ? (
            <button
              onClick={releaseToPatient}
              disabled={releasing}
              className="w-full py-3 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 disabled:opacity-60 transition-colors"
            >
              {releasing ? 'Liberando…' : 'Liberar resultado al paciente'}
            </button>
          ) : (
            <div className="w-full py-3 rounded-xl bg-green-100 text-green-700 font-semibold text-sm text-center">
              Resultado ya liberado al paciente
            </div>
          )}

          {/* Marcar como revisado */}
          {!isReviewed ? (
            <button
              onClick={markAsReviewed}
              disabled={markingReviewed}
              className="w-full py-3 rounded-xl border-2 border-emerald-400 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} strokeWidth={1.8} />
              {markingReviewed ? 'Marcando…' : 'Marcar como revisado'}
            </button>
          ) : (
            <div className="w-full py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={16} strokeWidth={1.8} /> Test revisado
            </div>
          )}

          {/* Volver al perfil del paciente */}
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-xl border border-warm-200 text-warm-600 font-medium text-sm hover:bg-warm-50 transition-colors"
          >
            ← Volver al perfil del paciente
          </button>
        </div>
      </Card>

    </div>
  )
}
