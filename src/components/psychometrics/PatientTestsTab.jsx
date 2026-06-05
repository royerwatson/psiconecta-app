import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import AssignTestModal from './AssignTestModal'
import { formatDateTime } from '@/lib/utils'
import { ClipboardList, Clock, Pencil } from 'lucide-react'

const STATUS_CONFIG = {
  pending:     { label: 'Pendiente',    color: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'En progreso',  color: 'bg-blue-100 text-blue-700' },
  completed:   { label: 'Completado',   color: 'bg-green-100 text-green-700' },
  partial:     { label: 'Parcial',      color: 'bg-orange-100 text-orange-700' },
  expired:     { label: 'Vencido',      color: 'bg-red-100 text-red-700' },
  cancelled:   { label: 'Cancelado',    color: 'bg-warm-100 text-warm-500' },
}

const SEVERITY_COLORS = {
  minimal:           'text-green-600',
  normal:            'text-green-600',
  mild:              'text-lime-600',
  moderate:          'text-amber-600',
  moderately_severe: 'text-orange-600',
  severe:            'text-red-600',
  extreme:           'text-red-700 font-bold',
  subclinical:       'text-green-600',
  mci:               'text-amber-600',
  dementia:          'text-red-700',
  low_risk:          'text-green-600',
  risky:             'text-amber-600',
  harmful:           'text-orange-600',
  dependence:        'text-red-700',
}

export default function PatientTestsTab({ therapistId, patientId }) {
  const navigate = useNavigate()
  const [assignments, setAssignments]       = useState([])
  const [loading, setLoading]               = useState(true)
  const [showAssign, setShowAssign]         = useState(false)
  const [expandedId, setExpandedId]         = useState(null)
  const [resultsMap, setResultsMap]         = useState({})  // sessionId → results[] | null (null = fetch error)
  const [fetchedSessions, setFetchedSessions] = useState(new Set()) // sessionIds ya consultados
  const [loadingResults, setLoadingResults] = useState({})

  useEffect(() => { fetchAssignments() }, [therapistId, patientId])

  const fetchAssignments = async () => {
    setLoading(true)

    // Obtener relación terapéutica activa
    const { data: rel } = await supabase
      .from('therapeutic_relationships')
      .select('id')
      .eq('therapist_id', therapistId)
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .maybeSingle()

    if (!rel) { setLoading(false); return }

    const { data } = await supabase
      .from('test_assignments')
      .select(`
        id, status, reason, assigned_at, due_at, completed_at,
        tests ( id, slug, name, category, estimated_minutes ),
        test_sessions ( id, status, completed_at, respondent_id )
      `)
      .eq('relationship_id', rel.id)
      .order('assigned_at', { ascending: false })

    setAssignments(data ?? [])
    setLoading(false)
  }

  const fetchResults = async (sessionId) => {
    if (fetchedSessions.has(sessionId)) return   // ya consultado (aunque esté vacío)
    setLoadingResults(prev => ({ ...prev, [sessionId]: true }))

    const { data, error } = await supabase
      .from('test_results')
      .select(`
        id, raw_score, adjusted_score, severity_label, severity_code,
        score_delta, is_clinically_significant, released_to_patient,
        scoring_rules ( subscale_name, display_name )
      `)
      .eq('session_id', sessionId)

    if (error) console.error('fetchResults error:', error)
    setResultsMap(prev => ({ ...prev, [sessionId]: data ?? [] }))
    setFetchedSessions(prev => new Set([...prev, sessionId]))
    setLoadingResults(prev => ({ ...prev, [sessionId]: false }))
  }

  const handleExpand = (assignmentId, session) => {
    if (expandedId === assignmentId) {
      setExpandedId(null)
    } else {
      setExpandedId(assignmentId)
      if (session?.id && session.status === 'completed') {
        fetchResults(session.id)
      }
    }
  }

  const releaseToPatient = async (sessionId) => {
    const { error } = await supabase
      .from('test_results')
      .update({ released_to_patient: true, released_at: new Date().toISOString(), released_by: therapistId })
      .eq('session_id', sessionId)

    if (error) { console.error(error); return }
    setResultsMap(prev => ({
      ...prev,
      [sessionId]: (prev[sessionId] ?? []).map(r => ({ ...r, released_to_patient: true }))
    }))
  }

  const cancelAssignment = async (assignmentId) => {
    await supabase.from('test_assignments').update({ status: 'cancelled' }).eq('id', assignmentId)
    setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, status: 'cancelled' } : a))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-warm-900">Tests psicométricos</h3>
          <p className="text-xs text-warm-400 mt-0.5">
            {assignments.length === 0 ? 'Ningún test asignado aún' : `${assignments.length} asignación${assignments.length !== 1 ? 'es' : ''}`}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAssign(true)}>
          + Asignar test
        </Button>
      </div>

      {/* Lista de asignaciones */}
      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList size={40} strokeWidth={1.5} className="mb-3 text-warm-300" />
          <p className="text-sm font-medium text-warm-700">Aún no has asignado tests a este paciente</p>
          <p className="text-xs text-warm-400 mt-1 mb-4">Los tests ayudan a medir y seguir el progreso clínico</p>
          <Button size="sm" onClick={() => setShowAssign(true)}>Asignar primer test</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            // Tomar la sesión completada más reciente (las sesiones no tienen orden garantizado)
            const session   = (a.test_sessions ?? [])
              .filter(s => s.status === 'completed')
              .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]
              ?? a.test_sessions?.[0]
              ?? null
            const isExpanded = expandedId === a.id
            const cfg       = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pending
            const results   = session ? (resultsMap[session.id] ?? []) : []
            const allReleased = results.length > 0 && results.every(r => r.released_to_patient)

            return (
              <div key={a.id} className="border border-warm-100 rounded-2xl overflow-hidden">

                {/* Cabecera de la asignación */}
                <button
                  className="w-full text-left p-4 hover:bg-warm-50 transition-colors"
                  onClick={() => handleExpand(a.id, session)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-warm-900">{a.tests?.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {a.status === 'completed' && !allReleased && results.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">
                            Resultados sin liberar
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-warm-400 mt-1">
                        Asignado: {formatDateTime(a.assigned_at)}
                        {a.due_at && ` · Vence: ${formatDateTime(a.due_at)}`}
                      </p>
                      {a.reason && (
                        <p className="text-xs text-warm-600 mt-1 italic">"{a.reason}"</p>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 text-warm-400 flex-shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Panel expandido */}
                {isExpanded && (
                  <div className="border-t border-warm-100 p-4 bg-warm-50/50 space-y-4">

                    {/* Sin sesión todavía */}
                    {!session && (
                      <div className="flex items-center gap-2 text-sm text-warm-500">
                        <Clock size={15} strokeWidth={1.8} className="text-warm-400" />
                        El paciente aún no ha iniciado este test
                      </div>
                    )}

                    {/* Sesión en progreso */}
                    {session && session.status === 'in_progress' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Pencil size={15} strokeWidth={1.8} className="text-blue-500" />
                        El paciente está completando este test ahora
                      </div>
                    )}

                    {/* Sesión completada — mostrar resultados */}
                    {session && session.status === 'completed' && (
                      <div className="space-y-3">
                        <p className="text-xs text-warm-400">
                          Completado: {formatDateTime(session.completed_at)}
                        </p>

                        {loadingResults[session.id] ? (
                          <div className="flex items-center gap-2 text-sm text-warm-500">
                            <div className="w-4 h-4 border-2 border-warm-300 border-t-primary-400 rounded-full animate-spin" />
                            Cargando resultados...
                          </div>
                        ) : results.length === 0 ? (
                          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-1">
                            <p className="text-sm font-medium text-amber-800">No hay resultados guardados</p>
                            <p className="text-xs text-amber-600">
                              Los resultados no se guardaron correctamente cuando el paciente completó el test.
                              Reasigna el test para que el paciente lo tome de nuevo.
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Scores por subescala */}
                            <div className="space-y-2">
                              {results.map(r => (
                                <div key={r.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-warm-100">
                                  <div>
                                    <p className="text-sm font-medium text-warm-800">
                                      {r.scoring_rules?.display_name ?? r.scoring_rules?.subscale_name}
                                    </p>
                                    {r.score_delta !== null && r.score_delta !== undefined && (
                                      <p className={`text-xs mt-0.5 ${r.score_delta < 0 ? 'text-green-500' : r.score_delta > 0 ? 'text-red-500' : 'text-warm-400'}`}>
                                        {r.score_delta > 0 ? '↑' : r.score_delta < 0 ? '↓' : '→'}
                                        {' '}{Math.abs(r.score_delta)} pts vs anterior
                                        {r.is_clinically_significant && ' · Cambio significativo'}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-warm-900">
                                      {r.adjusted_score ?? r.raw_score}
                                    </p>
                                    <p className={`text-xs font-semibold ${SEVERITY_COLORS[r.severity_code] ?? 'text-warm-600'}`}>
                                      {r.severity_label}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Acciones */}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => navigate(`/therapist/test-result/${session.id}`)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                              >
                                Ver resultado completo →
                              </button>
                              {allReleased && (
                                <span className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium">
                                  Resultado liberado
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Acciones de la asignación */}
                    {['pending', 'in_progress'].includes(a.status) && (
                      <button
                        onClick={() => cancelAssignment(a.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Cancelar asignación
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de asignación */}
      <AssignTestModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        therapistId={therapistId}
        patientId={patientId}
        onAssigned={fetchAssignments}
      />
    </div>
  )
}
