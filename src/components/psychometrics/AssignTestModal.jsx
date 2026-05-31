import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Textarea, Select } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { Timer, RefreshCw } from 'lucide-react'

const CATEGORY_LABELS = {
  sintomas:       'Síntomas',
  personalidad:   'Personalidad',
  cognitivo:      'Cognitivo',
  funcional:      'Funcional',
  riesgo:         'Riesgo',
  relacional:     'Relacional',
  neuropsicologia:'Neuropsicología',
  infantil:       'Infantil',
}

const CATEGORY_COLORS = {
  sintomas:       'bg-blue-100 text-blue-700',
  personalidad:   'bg-purple-100 text-purple-700',
  cognitivo:      'bg-amber-100 text-amber-700',
  funcional:      'bg-green-100 text-green-700',
  riesgo:         'bg-red-100 text-red-700',
  relacional:     'bg-pink-100 text-pink-700',
  neuropsicologia:'bg-indigo-100 text-indigo-700',
  infantil:       'bg-teal-100 text-teal-700',
}

export default function AssignTestModal({ isOpen, onClose, therapistId, patientId, onAssigned }) {
  const [tests, setTests]           = useState([])
  const [selected, setSelected]     = useState(null)
  const [filterCat, setFilterCat]   = useState('all')
  const [reason, setReason]         = useState('')
  const [dueAt, setDueAt]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [fetching, setFetching]     = useState(true)
  const [blocked, setBlocked]       = useState([]) // slugs con asignación activa

  useEffect(() => {
    if (isOpen) { fetchTests(); fetchBlockedTests() }
  }, [isOpen])

  const fetchTests = async () => {
    setFetching(true)
    const { data } = await supabase
      .from('tests')
      .select('id, slug, name, description, category, estimated_minutes, min_reapplication_days, branches')
      .eq('is_active', true)
      .order('category')
      .order('name')
    setTests(data ?? [])
    setFetching(false)
  }

  // Tests que ya tienen una asignación pending/in_progress para este paciente
  const fetchBlockedTests = async () => {
    const { data: rel } = await supabase
      .from('therapeutic_relationships')
      .select('id')
      .eq('therapist_id', therapistId)
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .maybeSingle()

    if (!rel) return

    const { data: assignments } = await supabase
      .from('test_assignments')
      .select('test_id, tests(slug)')
      .eq('relationship_id', rel.id)
      .in('status', ['pending', 'in_progress'])

    setBlocked((assignments ?? []).map(a => a.tests?.slug).filter(Boolean))
  }

  // Asegurar que existe una relación terapéutica activa
  const ensureRelationship = async () => {
    const { data: existing } = await supabase
      .from('therapeutic_relationships')
      .select('id')
      .eq('therapist_id', therapistId)
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .maybeSingle()

    if (existing) return existing.id

    const { data: created, error } = await supabase
      .from('therapeutic_relationships')
      .insert({ therapist_id: therapistId, patient_id: patientId, status: 'active' })
      .select('id')
      .single()

    if (error) throw new Error('No se pudo crear la relación terapéutica')
    return created.id
  }

  const handleAssign = async () => {
    if (!selected) { toast.error('Selecciona un test'); return }
    if (!reason.trim()) { toast.error('Escribe el motivo clínico'); return }

    setLoading(true)
    try {
      const relId = await ensureRelationship()

      const { error } = await supabase.from('test_assignments').insert({
        relationship_id:  relId,
        test_id:          selected.id,
        assignee_user_id: patientId,
        assignment_mode:  'single',
        status:           'pending',
        reason:           reason.trim(),
        due_at:           dueAt || null,
      })

      if (error) throw error

      toast.success(`Test "${selected.name}" asignado correctamente`)
      onAssigned?.()
      handleClose()
    } catch (err) {
      toast.error(err.message ?? 'Error al asignar el test')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelected(null)
    setReason('')
    setDueAt('')
    setFilterCat('all')
    onClose()
  }

  const categories = ['all', ...new Set(tests.map(t => t.category))]
  const filtered = filterCat === 'all' ? tests : tests.filter(t => t.category === filterCat)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Asignar test psicométrico" size="lg">
      {fetching ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">

          {/* Filtro por categoría */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setFilterCat(cat); setSelected(null) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterCat === cat
                    ? 'bg-primary-500 text-white'
                    : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                }`}
              >
                {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>

          {/* Lista de tests */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <p className="text-sm text-warm-400 text-center py-6">No hay tests en esta categoría</p>
            )}
            {filtered.map(test => {
              const isBlocked  = blocked.includes(test.slug)
              const isSelected = selected?.id === test.id
              return (
                <button
                  key={test.id}
                  disabled={isBlocked}
                  onClick={() => setSelected(isSelected ? null : test)}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary-400 bg-primary-50'
                      : isBlocked
                      ? 'border-warm-100 bg-warm-50 opacity-50 cursor-not-allowed'
                      : 'border-warm-100 hover:border-primary-200 hover:bg-primary-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-warm-900">{test.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[test.category] ?? 'bg-gray-100 text-gray-600'}`}>
                          {CATEGORY_LABELS[test.category] ?? test.category}
                        </span>
                        {isBlocked && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
                            En progreso
                          </span>
                        )}
                      </div>
                      {test.description && (
                        <p className="text-xs text-warm-500 mt-1 line-clamp-2">{test.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-warm-400 flex items-center gap-1"><Timer size={11} /> ~{test.estimated_minutes} min</span>
                        {test.min_reapplication_days && (
                          <span className="text-xs text-warm-400 flex items-center gap-1"><RefreshCw size={11} /> Mín. {test.min_reapplication_days} días entre aplicaciones</span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Motivo clínico */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Motivo clínico <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Evaluación inicial de síntomas depresivos, seguimiento semana 4..."
              rows={3}
              className="w-full rounded-xl border border-warm-200 px-4 py-3 text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 resize-none"
            />
          </div>

          {/* Fecha límite opcional */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Fecha límite <span className="text-warm-400 font-normal">(opcional)</span>
            </label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleAssign}
              disabled={!selected || !reason.trim() || loading}
              loading={loading}
            >
              Asignar test
            </Button>
          </div>

        </div>
      )}
    </Modal>
  )
}
