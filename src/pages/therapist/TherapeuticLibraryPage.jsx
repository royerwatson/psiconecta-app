/**
 * TherapeuticLibraryPage — Biblioteca de ejercicios terapéuticos.
 * Búsqueda · Filtro por categoría · Panel de detalle · Asignación a paciente con un clic.
 */
import { useState, useMemo, useEffect, useCallback } from 'react'
import { LIBRARY, CATEGORIES, CATEGORY_MAP, searchLibrary } from '@/data/therapeuticLibrary'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { Timer, RefreshCw, Check, Search, Brain, Waves, Leaf, Focus2, Dumbbell, Smile, Wind, BookOpen } from 'lucide-react'

// ── Mapa de iconos de categoría ───────────────────────────────────────────────
const CAT_ICON_MAP = {
  Brain, Waves, Leaf, Focus2, Dumbbell, Smile, Wind, BookOpen
}
function CatIcon({ name, ...props }) {
  const Icon = CAT_ICON_MAP[name]
  return Icon ? <Icon {...props} /> : null
}

// ── Paleta de colores de categoría ───────────────────────────────────────────
const CAT_STYLE = {
  blue:   { pill: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-400'   },
  teal:   { pill: 'bg-teal-100 text-teal-700 border-teal-200',     dot: 'bg-teal-400'   },
  green:  { pill: 'bg-green-100 text-green-700 border-green-200',  dot: 'bg-green-400'  },
  purple: { pill: 'bg-purple-100 text-purple-700 border-purple-200',dot: 'bg-purple-400'},
  amber:  { pill: 'bg-amber-100 text-amber-700 border-amber-200',  dot: 'bg-amber-400'  },
  rose:   { pill: 'bg-rose-100 text-rose-700 border-rose-200',     dot: 'bg-rose-400'   },
  sky:    { pill: 'bg-sky-100 text-sky-700 border-sky-200',        dot: 'bg-sky-400'    },
  orange: { pill: 'bg-orange-100 text-orange-700 border-orange-200',dot: 'bg-orange-400'},
}

const DIFFICULTY_STYLE = {
  básico:      'bg-emerald-100 text-emerald-700',
  intermedio:  'bg-amber-100 text-amber-700',
  avanzado:    'bg-red-100 text-red-700',
}

const FREQUENCY_OPTIONS = [
  'Diario',
  'Cada 2 días',
  'Semanal',
  'Quincenal',
  'Única vez',
  'Según necesidad',
]

// ── Tarjeta de ejercicio ──────────────────────────────────────────────────────
function ExerciseCard({ exercise, isSelected, onClick }) {
  const cat = CATEGORY_MAP[exercise.category]
  const cs  = CAT_STYLE[cat?.color ?? 'blue']
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl border p-4 transition-all',
        isSelected
          ? 'border-primary-300 bg-primary-50 shadow-sm'
          : 'border-warm-100 bg-white hover:border-warm-300 hover:shadow-sm',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 flex items-center gap-0.5', cs.pill)}>
          <CatIcon name={cat?.icon} size={10} strokeWidth={1.8} /> {cat?.label}
        </span>
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0', DIFFICULTY_STYLE[exercise.difficulty])}>
          {exercise.difficulty}
        </span>
      </div>
      <h3 className="font-semibold text-sm text-warm-900 leading-snug mb-1">{exercise.title}</h3>
      <p className="text-xs text-warm-500 leading-relaxed line-clamp-2">{exercise.summary}</p>
      <div className="flex items-center gap-3 mt-2">
        <span className="text-[10px] text-warm-400 flex items-center gap-0.5"><Timer size={10} strokeWidth={1.8} /> {exercise.duration}</span>
        <span className="text-[10px] text-warm-400 flex items-center gap-0.5"><RefreshCw size={10} strokeWidth={1.8} /> {exercise.frequency}</span>
      </div>
    </button>
  )
}

// ── Panel de detalle ──────────────────────────────────────────────────────────
function ExerciseDetail({ exercise, onAssign, onClose }) {
  const cat = CATEGORY_MAP[exercise.category]
  const cs  = CAT_STYLE[cat?.color ?? 'blue']
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 p-5 border-b border-warm-100">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-0.5', cs.pill)}>
              <CatIcon name={cat?.icon} size={10} strokeWidth={1.8} /> {cat?.label}
            </span>
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', DIFFICULTY_STYLE[exercise.difficulty])}>
              {exercise.difficulty}
            </span>
          </div>
          <h2 className="font-serif font-bold text-warm-900 text-base leading-snug">{exercise.title}</h2>
          <p className="text-xs text-warm-500 mt-1">{exercise.summary}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors shrink-0">
          <svg className="w-4 h-4 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-3 divide-x divide-warm-100 border-b border-warm-100">
        {[
          { label: 'Duración', value: exercise.duration },
          { label: 'Frecuencia', value: exercise.frequency },
          { label: 'Dificultad', value: exercise.difficulty },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-3 text-center">
            <p className="text-[10px] text-warm-400 uppercase tracking-wider">{label}</p>
            <p className="text-xs font-semibold text-warm-700 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Objetivo */}
        <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-1">Objetivo terapéutico</p>
          <p className="text-sm text-primary-800 leading-relaxed">{exercise.goal}</p>
        </div>

        {/* Instrucciones */}
        <div>
          <p className="text-[10px] font-bold text-warm-500 uppercase tracking-wider mb-2">Instrucciones para el paciente</p>
          <div className="bg-white border border-warm-100 rounded-xl px-4 py-4">
            <p className="text-sm text-warm-700 leading-relaxed whitespace-pre-line">{exercise.instructions}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {exercise.tags.map((tag, i) => (
            <span key={i} className="text-[10px] px-2 py-1 bg-warm-100 text-warm-500 rounded-lg">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Botón asignar */}
      <div className="p-4 border-t border-warm-100">
        <button
          onClick={onAssign}
          className="w-full py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          Asignar a paciente →
        </button>
      </div>
    </div>
  )
}

// ── Modal de asignación ───────────────────────────────────────────────────────
function AssignModal({ exercise, therapistId, onClose, onAssigned }) {
  const [patients,  setPatients]  = useState([])
  const [selected,  setSelected]  = useState(null)
  const [title,     setTitle]     = useState(exercise.title)
  const [frequency, setFrequency] = useState(exercise.frequency)
  const [dueDate,   setDueDate]   = useState('')
  const [notes,     setNotes]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const fetchPatients = async () => {
      const { data: rels } = await supabase
        .from('therapeutic_relationships')
        .select('patient_id')
        .eq('therapist_id', therapistId)
        .eq('status', 'active')
      if (!rels?.length) { setLoading(false); return }
      const ids = rels.map(r => r.patient_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', ids)
        .order('full_name')
      setPatients(profiles ?? [])
      setLoading(false)
    }
    fetchPatients()
  }, [therapistId])

  const handleAssign = async () => {
    if (!selected) return toast.error('Selecciona un paciente')
    setSaving(true)
    const { error } = await supabase.from('patient_tasks').insert({
      therapist_id:  therapistId,
      patient_id:    selected,
      title:         title.trim() || exercise.title,
      description:   exercise.summary,
      instructions:  exercise.instructions,
      category:      exercise.category,
      frequency:     frequency,
      due_date:      dueDate || null,
      notes:         notes.trim() || null,
      status:        'pending',
    })
    setSaving(false)
    if (error) {
      console.error(error)
      toast.error('Error al asignar. Verifica que la tabla "patient_tasks" exista en Supabase.')
      return
    }
    toast.success(`"${exercise.title}" asignado correctamente`)
    onAssigned()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-float border border-warm-100 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle móvil */}
        <div className="w-10 h-1 bg-warm-200 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        <div className="p-5 border-b border-warm-100">
          <p className="font-serif font-semibold text-warm-900">Asignar ejercicio</p>
          <p className="text-xs text-warm-400 mt-0.5 line-clamp-1">{exercise.title}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Título personalizable */}
          <div>
            <label className="text-xs font-semibold text-warm-600 block mb-1">Título (editable)</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-sm border border-warm-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          {/* Paciente */}
          <div>
            <label className="text-xs font-semibold text-warm-600 block mb-2">Paciente</label>
            {loading ? (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-10 bg-warm-100 rounded-xl animate-pulse" />)}
              </div>
            ) : patients.length === 0 ? (
              <p className="text-sm text-warm-400 text-center py-3">No hay pacientes activos.</p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {patients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all',
                      selected === p.id
                        ? 'bg-primary-50 border-primary-300'
                        : 'border-warm-100 hover:bg-warm-50',
                    )}
                  >
                    <Avatar name={p.full_name} size="xs" />
                    <span className="text-sm font-medium text-warm-800 flex-1">{p.full_name}</span>
                    {selected === p.id && <Check size={13} strokeWidth={1.8} className="text-primary-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Frecuencia */}
          <div>
            <label className="text-xs font-semibold text-warm-600 block mb-2">Frecuencia</label>
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_OPTIONS.map(f => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-all',
                    frequency === f
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-warm-200 text-warm-600 hover:border-warm-400',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha límite */}
          <div>
            <label className="text-xs font-semibold text-warm-600 block mb-1">Fecha límite (opcional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full text-sm border border-warm-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-semibold text-warm-600 block mb-1">Instrucciones adicionales (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Personaliza el ejercicio para este paciente…"
              rows={2}
              className="w-full text-sm border border-warm-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-warm-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-warm-200 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected || saving}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Asignando…' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TherapeuticLibraryPage() {
  const { user } = useAuthStore()
  const [search,       setSearch]       = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [selected,     setSelected]     = useState(null)
  const [showAssign,   setShowAssign]   = useState(false)
  const [showDetail,   setShowDetail]   = useState(false)

  const filtered = useMemo(() => {
    let list = search ? searchLibrary(search) : LIBRARY
    if (activeCategory !== 'all') list = list.filter(ex => ex.category === activeCategory)
    return list
  }, [search, activeCategory])

  const handleSelectExercise = useCallback((ex) => {
    setSelected(ex)
    setShowDetail(true)
  }, [])

  const totalByCategory = useMemo(() =>
    Object.fromEntries(CATEGORIES.map(c => [c.id, LIBRARY.filter(ex => ex.category === c.id).length]))
  , [])

  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Biblioteca terapéutica</h1>
        <p className="text-warm-500 text-sm mt-0.5">
          {LIBRARY.length} ejercicios · 8 categorías · Asignación en un clic
        </p>
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar ejercicio, técnica, categoría…"
        value={search}
        onChange={e => { setSearch(e.target.value); setActiveCategory('all') }}
        prefix={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />

      {/* Filtros de categoría */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setActiveCategory('all'); setSearch('') }}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            activeCategory === 'all'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-warm-100 text-warm-600 hover:bg-warm-200',
          )}
        >
          Todos · {LIBRARY.length}
        </button>
        {CATEGORIES.map(cat => {
          const cs = CAT_STYLE[cat.color]
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSearch('') }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                isActive ? 'bg-primary-600 text-white shadow-sm' : 'bg-warm-100 text-warm-600 hover:bg-warm-200',
              )}
            >
              <CatIcon name={cat.icon} size={11} strokeWidth={1.8} className="inline mr-0.5" /> {cat.label} · {totalByCategory[cat.id]}
            </button>
          )
        })}
      </div>

      {/* Layout: grid + panel lateral en desktop */}
      <div className="flex gap-5 items-start">

        {/* Grid de ejercicios */}
        <div className={cn('flex-1 min-w-0', showDetail && 'hidden lg:block')}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Search size={40} strokeWidth={1.5} className="text-warm-300 mb-3 mx-auto" />
              <p className="font-semibold text-warm-700">Sin resultados para "{search}"</p>
              <button
                onClick={() => { setSearch(''); setActiveCategory('all') }}
                className="mt-3 text-sm text-primary-600 font-medium"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-warm-400 mb-3">
                {filtered.length} ejercicio{filtered.length !== 1 ? 's' : ''}
                {search ? ` para "${search}"` : activeCategory !== 'all' ? ` en ${CATEGORY_MAP[activeCategory]?.label}` : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map(ex => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    isSelected={selected?.id === ex.id}
                    onClick={() => handleSelectExercise(ex)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Panel lateral de detalle — desktop */}
        {showDetail && selected && (
          <div className="w-full lg:w-96 shrink-0 bg-white border border-warm-100 rounded-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: 'calc(100vh - 140px)', position: 'sticky', top: '90px' }}>
            <ExerciseDetail
              exercise={selected}
              onAssign={() => setShowAssign(true)}
              onClose={() => { setShowDetail(false); setSelected(null) }}
            />
          </div>
        )}
      </div>

      {/* Modal de asignación */}
      {showAssign && selected && (
        <AssignModal
          exercise={selected}
          therapistId={user.id}
          onClose={() => setShowAssign(false)}
          onAssigned={() => {
            setShowAssign(false)
            setShowDetail(false)
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}
