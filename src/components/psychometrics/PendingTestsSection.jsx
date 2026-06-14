import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Timer, AlertTriangle, Calendar, Pencil } from 'lucide-react'

export default function PendingTestsSection({ userId }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading]         = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (userId) fetchPending()
  }, [userId])

  const fetchPending = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('test_assignments')
      .select(`
        id, status, reason, due_at, assigned_at,
        tests ( id, slug, name, estimated_minutes, category ),
        test_sessions ( id, status, last_item_index )
      `)
      .eq('assignee_user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('assigned_at', { ascending: false })

    setAssignments(data ?? [])
    setLoading(false)
  }

  if (loading || assignments.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-warm-900">
          Tests pendientes
        </h2>
        <span className="text-xs px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 font-semibold">
          {assignments.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {assignments.map(a => {
          const session     = a.test_sessions?.[0] ?? null
          const isResume    = session?.status === 'in_progress'
          const isOverdue   = a.due_at && new Date(a.due_at) < new Date()

          return (
            <div
              key={a.id}
              className="bg-white border border-warm-100 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-warm-900">{a.tests?.name}</p>
                  <p className="text-xs text-warm-500 mt-0.5">
                    Tu terapeuta te solicita este test
                    {a.reason ? `: "${a.reason}"` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-warm-400 flex items-center gap-1"><Timer size={11} /> ~{a.tests?.estimated_minutes} min</span>
                    {a.due_at && (
                      <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-warm-400'}`}>
                        {isOverdue ? <><AlertTriangle size={11} /> Vencido</> : <><Calendar size={11} /> Vence {new Date(a.due_at).toLocaleDateString('es-MX')}</>}
                      </span>
                    )}
                    {isResume && (
                      <span className="text-xs text-blue-500 font-medium flex items-center gap-1"><Pencil size={11} /> En progreso</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/patient/tests/${a.id}`)}
                  className="flex-shrink-0 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 active:scale-95 transition-all"
                >
                  {isResume ? 'Continuar' : 'Iniciar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
