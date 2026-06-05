import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, ClipboardList, Timer, FileText, AlertCircle, Heart, CheckCircle2 } from 'lucide-react'

// ─── Cálculo de scores en cliente ────────────────────────────────────────────
function calculateScores(scoringRules, itemResponses, items) {
  return scoringRules.map(rule => {
    const codes = rule.item_codes ?? []
    const relevantItems = items.filter(i => codes.includes(i.item_code))
    let raw = 0

    relevantItems.forEach(item => {
      const resp = itemResponses[item.id]
      if (resp == null) return
      const val = item.is_reverse_scored
        ? (Math.max(...item.response_options.map(o => o.value)) - resp)
        : resp
      raw += val
    })

    const adjusted = raw * (rule.multiply_by ?? 1)

    // Buscar rango de interpretación
    const range = rule.interpretation_ranges?.find(
      r => adjusted >= r.score_min && adjusted <= r.score_max
    )

    return {
      scoring_rule_id:  rule.id,
      raw_score:        raw,
      adjusted_score:   adjusted,
      severity_label:   range?.severity_label ?? null,
      severity_code:    range?.severity_code  ?? null,
      is_risk_level:    range?.is_risk_level  ?? false,
    }
  })
}

// ─── Colores de severidad ─────────────────────────────────────────────────────
const SEVERITY_BG = {
  minimal:           'bg-green-50  border-green-200  text-green-800',
  normal:            'bg-green-50  border-green-200  text-green-800',
  mild:              'bg-lime-50   border-lime-200   text-lime-800',
  moderate:          'bg-amber-50  border-amber-200  text-amber-800',
  moderately_severe: 'bg-orange-50 border-orange-200 text-orange-800',
  severe:            'bg-red-50    border-red-200    text-red-800',
  extreme:           'bg-red-100   border-red-300    text-red-900',
  subclinical:       'bg-green-50  border-green-200  text-green-800',
  mci:               'bg-amber-50  border-amber-200  text-amber-800',
  dementia:          'bg-red-100   border-red-300    text-red-900',
  low_risk:          'bg-green-50  border-green-200  text-green-800',
  risky:             'bg-amber-50  border-amber-200  text-amber-800',
  harmful:           'bg-orange-50 border-orange-200 text-orange-800',
  dependence:        'bg-red-100   border-red-300    text-red-900',
}

export default function TakeTestPage() {
  const { assignmentId } = useParams()
  const { user }         = useAuthStore()
  const navigate         = useNavigate()

  // ── Estado ────────────────────────────────────────────────────────────────
  const [phase, setPhase]               = useState('loading')  // loading | intro | taking | saving | results | error
  const [assignment, setAssignment]     = useState(null)
  const [test, setTest]                 = useState(null)
  const [sections, setSections]         = useState([])          // [{...section, items:[...]}]
  const [allItems, setAllItems]         = useState([])          // items planos en orden
  const [scoringRules, setScoringRules] = useState([])
  const [sessionId, setSessionId]       = useState(null)
  const [responses, setResponses]       = useState({})          // { item_id: value }
  const [currentIdx, setCurrentIdx]     = useState(0)
  const [results, setResults]           = useState([])
  const [saving, setSaving]             = useState(false)
  const [errorMsg, setErrorMsg]         = useState('')

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => { if (assignmentId && user?.id) loadAssignment() }, [assignmentId, user?.id])

  const loadAssignment = async () => {
    try {
      // 1. Cargar asignación
      const { data: assign, error: aErr } = await supabase
        .from('test_assignments')
        .select('id, status, test_id, assignee_user_id, reason, tests(id, slug, name, description, estimated_minutes)')
        .eq('id', assignmentId)
        .single()

      if (aErr || !assign) throw new Error('No se encontró la asignación')
      if (assign.assignee_user_id !== user.id) throw new Error('No tienes acceso a este test')
      if (['completed', 'cancelled', 'expired'].includes(assign.status)) {
        throw new Error(`Este test ya fue ${assign.status === 'completed' ? 'completado' : 'cancelado'}`)
      }

      setAssignment(assign)
      setTest(assign.tests)

      // 2. Cargar items y opciones
      const { data: sects } = await supabase
        .from('test_sections')
        .select(`
          id, order_index, title, instructions,
          items (
            id, order_index, text, item_code, item_type, is_reverse_scored, subscale, alert_threshold,
            response_options ( id, order_index, label, value )
          )
        `)
        .eq('test_id', assign.test_id)
        .order('order_index')

      if (!sects?.length) throw new Error('No se encontraron preguntas para este test')

      // Ordenar ítems dentro de cada sección y aplanar
      const sectsSorted = (sects ?? []).map(s => ({
        ...s,
        items: [...(s.items ?? [])].sort((a, b) => a.order_index - b.order_index).map(item => ({
          ...item,
          response_options: [...(item.response_options ?? [])].sort((a, b) => a.order_index - b.order_index)
        }))
      })).sort((a, b) => a.order_index - b.order_index)

      setSections(sectsSorted)
      const flat = sectsSorted.flatMap(s => s.items)
      setAllItems(flat)

      // 3. Cargar scoring rules con rangos
      const { data: rules } = await supabase
        .from('scoring_rules')
        .select('id, subscale_name, display_name, formula, item_codes, multiply_by, interpretation_ranges(*)')
        .eq('test_id', assign.test_id)

      setScoringRules(rules ?? [])

      // 4. Buscar sesión existente (para reanudar)
      const { data: existingSession } = await supabase
        .from('test_sessions')
        .select('id, status, last_item_index')
        .eq('assignment_id', assignmentId)
        .eq('respondent_id', user.id)
        .eq('status', 'in_progress')
        .maybeSingle()

      if (existingSession) {
        setSessionId(existingSession.id)

        // Cargar respuestas ya dadas
        const { data: prevResponses } = await supabase
          .from('item_responses')
          .select('item_id, response_value')
          .eq('session_id', existingSession.id)

        const respMap = {}
        ;(prevResponses ?? []).forEach(r => { respMap[r.item_id] = r.response_value })
        setResponses(respMap)
        setCurrentIdx(existingSession.last_item_index ?? 0)
        setPhase('taking')
      } else {
        setPhase('intro')
      }
    } catch (err) {
      setErrorMsg(err.message)
      setPhase('error')
    }
  }

  // ── Iniciar sesión nueva ──────────────────────────────────────────────────
  const startSession = async () => {
    const { data: sess, error } = await supabase
      .from('test_sessions')
      .insert({
        assignment_id:   assignmentId,
        respondent_id:   user.id,
        respondent_role: 'self',
        status:          'in_progress',
        last_item_index: 0,
      })
      .select('id')
      .single()

    if (error || !sess) { setErrorMsg('No se pudo iniciar la sesión'); setPhase('error'); return }

    // Marcar asignación como in_progress
    await supabase.from('test_assignments').update({ status: 'in_progress' }).eq('id', assignmentId)

    setSessionId(sess.id)
    setCurrentIdx(0)
    setPhase('taking')
  }

  // ── Seleccionar respuesta ─────────────────────────────────────────────────
  const selectAnswer = useCallback(async (itemId, value) => {
    if (saving) return

    // Guardar en estado local inmediatamente (UX fluido)
    setResponses(prev => ({ ...prev, [itemId]: value }))

    // Guardar en Supabase en tiempo real (upsert)
    await supabase.from('item_responses').upsert({
      session_id:     sessionId,
      item_id:        itemId,
      response_value: value,
    }, { onConflict: 'session_id,item_id' })

    const nextIdx = currentIdx + 1

    if (nextIdx < allItems.length) {
      // Actualizar progreso en sesión
      await supabase.from('test_sessions').update({ last_item_index: nextIdx }).eq('id', sessionId)
      setCurrentIdx(nextIdx)
    } else {
      // Último ítem — completar
      await finishTest({ ...responses, [itemId]: value })
    }
  }, [saving, sessionId, currentIdx, allItems.length, responses])

  // ── Finalizar test ────────────────────────────────────────────────────────
  const finishTest = async (finalResponses) => {
    setSaving(true)
    setPhase('saving')

    try {
      // Calcular scores
      const scores = calculateScores(scoringRules, finalResponses, allItems)

      // Guardar resultados
      const resultsToInsert = scores.map(s => ({
        session_id:      sessionId,
        scoring_rule_id: s.scoring_rule_id,
        raw_score:       s.raw_score,
        adjusted_score:  s.adjusted_score,
        severity_label:  s.severity_label,
        severity_code:   s.severity_code,
      }))

      const { error: insertError } = await supabase.from('test_results').insert(resultsToInsert)
      if (insertError) throw new Error('No se pudieron guardar los resultados: ' + insertError.message)

      // Marcar sesión y asignación como completadas
      const now = new Date().toISOString()
      await Promise.all([
        supabase.from('test_sessions').update({ status: 'completed', completed_at: now }).eq('id', sessionId),
        supabase.from('test_assignments').update({ status: 'completed', completed_at: now }).eq('id', assignmentId),
      ])

      // Alertas de riesgo (hardcoded, sin IA)
      await checkRiskAlerts(scores, finalResponses)

      setResults(scores)
      setPhase('results')
    } catch (err) {
      setErrorMsg('Error al guardar resultados. Tus respuestas están guardadas, intenta de nuevo.')
      setPhase('error')
    } finally {
      setSaving(false)
    }
  }

  // ── Alertas de riesgo deterministas ──────────────────────────────────────
  const checkRiskAlerts = async (scores, finalResponses) => {
    const alerts = []
    const slug   = test?.slug

    // PHQ-9 ítem 9 (ideación suicida)
    if (slug === 'phq9') {
      const q9Item = allItems.find(i => i.item_code === 'PHQ9_Q9')
      if (q9Item && (finalResponses[q9Item.id] ?? 0) > 0) {
        alerts.push({ type: 'phq9_item9', severity: 'critical', description: 'PHQ-9 Ítem 9 activado: pensamientos de hacerse daño o de muerte.' })
      }
      const totalScore = scores.find(s => s.severity_code === 'severe' || s.adjusted_score >= 20)
      if (totalScore) {
        alerts.push({ type: 'phq9_severe', severity: 'high', description: `PHQ-9 score severo (${totalScore.adjusted_score} pts). Intervención urgente recomendada.` })
      }
    }

    // DASS-21 depresión extrema
    if (slug === 'dass21') {
      const dep = scores.find(s => s.severity_code === 'extreme')
      if (dep) alerts.push({ type: 'dass21_extreme', severity: 'high', description: `DASS-21 nivel extremo en subescala. Score: ${dep.adjusted_score}` })
    }

    // PCL-5 severo
    if (slug === 'pcl5') {
      const total = scores.find(s => (s.adjusted_score ?? s.raw_score) >= 50)
      if (total) alerts.push({ type: 'pcl5_severe', severity: 'high', description: `PCL-5 score ≥50 (${total.adjusted_score}). Evaluación de PTSD urgente.` })
    }

    // AUDIT dependencia
    if (slug === 'audit') {
      const total = scores.find(s => s.severity_code === 'dependence')
      if (total) alerts.push({ type: 'audit_dependence', severity: 'high', description: `AUDIT indica probable dependencia al alcohol (${total.adjusted_score} pts).` })
    }

    // MoCA posible demencia
    if (slug === 'moca') {
      const total = scores.find(s => s.severity_code === 'dementia')
      if (total) alerts.push({ type: 'moca_low', severity: 'high', description: `MoCA score bajo (${total.adjusted_score}). Posible deterioro cognitivo moderado.` })
    }

    if (alerts.length === 0) return

    // Obtener terapeuta desde la relación terapéutica
    const { data: rel } = await supabase
      .from('therapeutic_relationships')
      .select('therapist_id')
      .eq('patient_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (!rel) return

    const alertRows = alerts.map(a => ({
      session_id:   sessionId,
      patient_id:   user.id,
      therapist_id: rel.therapist_id,
      alert_type:   a.type,
      description:  a.description,
      severity:     a.severity,
    }))

    await supabase.from('risk_alerts').insert(alertRows)
  }

  // ── Retroceder ítem ───────────────────────────────────────────────────────
  const goBack = () => {
    if (currentIdx > 0) setCurrentIdx(idx => idx - 1)
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  // Loading
  if (phase === 'loading') return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-calm-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  // Error
  if (phase === 'error') return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-calm-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="flex justify-center mb-4"><AlertTriangle size={48} strokeWidth={1.8} className="text-warm-400" /></div>
        <h2 className="font-serif text-xl font-semibold text-warm-900 mb-2">Algo salió mal</h2>
        <p className="text-sm text-warm-500 mb-6">{errorMsg}</p>
        <button onClick={() => navigate(-1)}
          className="w-full py-3 rounded-2xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors">
          Volver
        </button>
      </div>
    </div>
  )

  // Guardando
  if (phase === 'saving') return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-calm-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      <p className="text-sm font-medium text-primary-700">Guardando tus respuestas…</p>
    </div>
  )

  // Pantalla de introducción
  if (phase === 'intro') return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-calm-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4"><ClipboardList size={48} strokeWidth={1.8} className="text-warm-400" /></div>
          <h1 className="font-serif text-2xl font-semibold text-warm-900 mb-2">{test?.name}</h1>
          {assignment?.reason && (
            <p className="text-sm text-warm-500 italic">"{assignment.reason}"</p>
          )}
        </div>

        {test?.description && (
          <div className="bg-primary-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-primary-800 leading-relaxed">{test.description}</p>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6 text-sm text-warm-500">
          <span className="flex items-center gap-1.5"><Timer size={15} strokeWidth={1.8} /> ~{test?.estimated_minutes} minutos</span>
          <span>·</span>
          <span className="flex items-center gap-1.5"><FileText size={15} strokeWidth={1.8} /> {allItems.length} preguntas</span>
        </div>

        <div className="bg-warm-50 rounded-2xl p-4 mb-6 text-xs text-warm-500 leading-relaxed">
          No hay respuestas correctas o incorrectas. Responde con honestidad según cómo te has sentido. Puedes pausar y retomar cuando quieras — tu progreso se guarda automáticamente.
        </div>

        <button
          onClick={startSession}
          className="w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold text-base hover:bg-primary-600 active:scale-[0.98] transition-all"
        >
          Comenzar
        </button>

        <button onClick={() => navigate(-1)} className="w-full mt-3 py-3 text-sm text-warm-400 hover:text-warm-600 transition-colors">
          Volver
        </button>
      </div>
    </div>
  )

  // Completando el test
  if (phase === 'taking') {
    const currentItem = allItems[currentIdx]
    const progress    = ((currentIdx) / allItems.length) * 100
    const answered    = responses[currentItem?.id] !== undefined

    // Encontrar la sección actual
    let sectionTitle = ''
    let sectionInstructions = ''
    let itemSectionChanged = false
    if (currentItem) {
      const sect = sections.find(s => s.items.some(i => i.id === currentItem.id))
      sectionTitle = sect?.title ?? ''
      sectionInstructions = sect?.instructions ?? ''
      // Verificar si es el primer ítem de la sección
      const firstOfSection = sect?.items?.[0]?.id === currentItem.id
      itemSectionChanged = firstOfSection && currentIdx > 0
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-calm-50 flex flex-col">
        {/* Header fijo */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-warm-100 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => navigate(-1)} className="text-warm-400 hover:text-warm-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <p className="text-xs font-medium text-warm-600 truncate mx-4">{test?.name}</p>
              <span className="text-xs text-warm-400 whitespace-nowrap">{currentIdx + 1} / {allItems.length}</span>
            </div>
            {/* Barra de progreso */}
            <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-lg">

            {/* Instrucciones de sección (solo si cambia) */}
            {sectionInstructions && currentIdx === 0 && (
              <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3 mb-5 text-sm text-primary-800 leading-relaxed">
                {sectionInstructions}
              </div>
            )}

            {/* Pregunta */}
            <div className="animate-fade-in">
              <p className="text-xs font-medium text-warm-400 mb-2 uppercase tracking-wide">
                Pregunta {currentIdx + 1}
              </p>
              <p className="text-lg font-semibold text-warm-900 leading-snug mb-6">
                {currentItem?.text}
              </p>

              {/* Opciones */}
              <div className="flex flex-col gap-3">
                {currentItem?.response_options?.map(opt => {
                  const isSelected = responses[currentItem.id] === opt.value
                  return (
                    <button
                      key={opt.id}
                      onClick={() => selectAnswer(currentItem.id, opt.value)}
                      className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-sm font-medium transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary-400 bg-primary-50 text-primary-800'
                          : 'border-warm-100 bg-white text-warm-700 hover:border-primary-200 hover:bg-primary-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          isSelected ? 'border-primary-400 bg-primary-400' : 'border-warm-200'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        {opt.label}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Botón atrás */}
              {currentIdx > 0 && (
                <button
                  onClick={goBack}
                  className="w-full mt-4 py-3 text-sm text-warm-400 hover:text-warm-600 transition-colors"
                >
                  ← Pregunta anterior
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Pantalla de agradecimiento (sin mostrar resultados al paciente)
  if (phase === 'results') {
    const hasRisk = results.some(r => r.is_risk_level)

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-calm-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center">

          {/* Ícono */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6
            bg-gradient-to-br from-primary-500 to-calm-500 shadow-lg">
            <CheckCircle2 size={40} strokeWidth={1.8} className="text-white" />
          </div>

          <h2 className="font-serif text-2xl font-bold text-warm-900 mb-3">
            ¡Gracias por completar el test!
          </h2>

          <p className="text-warm-600 leading-relaxed mb-4">
            Tus respuestas han sido enviadas a tu terapeuta. Él o ella revisará los resultados
            y los compartirá contigo en el momento oportuno.
          </p>

          {hasRisk && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium flex items-center justify-center gap-1.5">
                <AlertCircle size={14} strokeWidth={1.8} /> Tu terapeuta ha sido notificado
              </p>
              <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                Tus respuestas requieren atención. Tu terapeuta se pondrá en contacto contigo pronto.
              </p>
            </div>
          )}

          <div className="bg-warm-50 rounded-2xl p-4 mb-6 text-xs text-warm-500 leading-relaxed">
            Los resultados serán revisados por tu terapeuta antes de ser compartidos contigo.
            Los encontrarás en la sección <strong>Mis Resultados</strong> cuando estén disponibles.
          </div>

          <button
            onClick={() => navigate('/patient/dashboard')}
            className="w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold hover:bg-primary-600 active:scale-[0.98] transition-all"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return null
}
