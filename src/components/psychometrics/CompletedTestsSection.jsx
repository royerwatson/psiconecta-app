/**
 * CompletedTestsSection — Sección del dashboard del terapeuta.
 *
 * Muestra tests completados por pacientes que aún no han sido vistos/descartados.
 * Botón "Ver resultados" navega a la página de resultados.
 * Botón "Descartar" marca therapist_dismissed_at y lo oculta del dashboard.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { FlaskConical, Eye, X, CheckCircle2 } from 'lucide-react'

export default function CompletedTestsSection({ therapistId }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (therapistId) fetchCompleted()
  }, [therapistId])

  const fetchCompleted = async () => {
    setLoading(true)
    // Buscar test_assignments completados donde el terapeuta sea el asignador
    // y aún no hayan sido descartados del dashboard
    const { data } = await supabase
      .from('test_assignments')
      .select(`
        id,
        completed_at,
        therapist_dismissed_at,
        tests ( id, name, category ),
        patient:profiles!test_assignments_assignee_user_id_fkey ( id, full_name, avatar_url ),
        test_sessions ( id, status, completed_at )
      `)
      .eq('status', 'completed')
      .is('therapist_dismissed_at', null)
      .order('completed_at', { ascending: false })
      .limit(10)

    // Filtrar solo los que pertenecen a este terapeuta (via therapeutic_relationships)
    if (data && data.length > 0) {
      const assignmentIds = data.map(d => d.id)
      const { data: relationships } = await supabase
        .from('therapeutic_relationships')
        .select('id')
        .eq('therapist_id', therapistId)
        .eq('status', 'active')

      if (relationships && relationships.length > 0) {
        const relIds = new Set(relationships.map(r => r.id))
        // Re-fetch with relationship filter
        const { data: filtered } = await supabase
          .from('test_assignments')
          .select(`
            id,
            completed_at,
            relationship_id,
            tests ( id, name, category ),
            patient:profiles!test_assignments_assignee_user_id_fkey ( id, full_name, avatar_url ),
            test_sessions ( id, status )
          `)
          .eq('status', 'completed')
          .is('therapist_dismissed_at', null)
          .in('relationship_id', [...relIds])
          .order('completed_at', { ascending: false })
          .limit(10)

        setItems(filtered ?? [])
      } else {
        setItems([])
      }
    } else {
      setItems([])
    }
    setLoading(false)
  }

  const handleDismiss = async (assignmentId) => {
    const { error } = await supabase
      .from('test_assignments')
      .update({ therapist_dismissed_at: new Date().toISOString() })
      .eq('id', assignmentId)

    if (!error) {
      setItems(prev => prev.filter(i => i.id !== assignmentId))
    }
  }

  const handleViewResults = async (item) => {
    // Obtener el session_id del test completado
    const completedSession = item.test_sessions?.find(s => s.status === 'completed')
    const sessionId = completedSession?.id
    if (!sessionId) {
      // Marcar igual como descartado si no hay sesión
      await handleDismiss(item.id)
      return
    }
    // Marcar como descartado al ver resultados
    await supabase.from('test_assignments')
      .update({ therapist_dismissed_at: new Date().toISOString() })
      .eq('id', item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
    navigate(`/therapist/test-result/${sessionId}`)
  }

  if (loading || items.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <FlaskConical size={16} strokeWidth={1.8} className="text-indigo-500" />
          Tests completados
        </h2>
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold">
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {items.map(item => {
          const completedAt = item.completed_at
            ? new Date(item.completed_at).toLocaleDateString('es-DO', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })
            : null

          return (
            <div key={item.id}
              className="card p-4 flex items-center gap-3 hover-lift">

              {/* Avatar paciente */}
              <div className="shrink-0">
                <Avatar name={item.patient?.full_name ?? ''} size="md" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-slate-900 tracking-tight">
                    {item.patient?.full_name}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={9} strokeWidth={2.5} /> Completado
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {item.tests?.name}
                </p>
                {completedAt && (
                  <p className="text-[10px] text-slate-400 mt-0.5">{completedAt}</p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleViewResults(item)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                    gradient-brand text-white shadow-[0_3px_10px_rgba(79,70,229,0.3)]
                    hover:shadow-[0_4px_14px_rgba(79,70,229,0.4)] active:scale-95 transition-all"
                >
                  <Eye size={13} strokeWidth={2} /> Ver
                </button>
                <button
                  onClick={() => handleDismiss(item.id)}
                  title="Descartar del dashboard"
                  className="p-2 rounded-xl text-slate-300 hover:text-slate-500 hover:bg-slate-100
                    active:scale-95 transition-all"
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
