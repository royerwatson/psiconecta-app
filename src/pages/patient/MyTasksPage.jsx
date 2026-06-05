/**
 * MyTasksPage — vista del paciente para gestionar sus tareas terapéuticas.
 *
 * Funciones:
 *   - Ver tareas pendientes y completadas asignadas por el terapeuta
 *   - Marcar tareas como completadas con un clic
 *   - Agregar notas personales a cada tarea
 *   - Ver detalle completo: instrucciones, categoría, frecuencia, fecha límite
 *   - Filtrar por estado (Pendientes / Completadas / Todas)
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { Brain, Waves, Leaf, Focus, Zap, Heart, Wind, PenLine, ClipboardList, RefreshCw, AlertTriangle, Calendar, CheckCircle2, BookOpen, Search, X, ChevronDown } from 'lucide-react'
import { sendTaskCompletionNotification } from '@/lib/notifications'
import { LIBRARY, CATEGORIES } from '@/data/therapeuticLibrary'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORY_STYLE = {
  'TCC':                    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100',   Icon: Brain   },
  'DBT':                    { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-100',   Icon: Waves   },
  'ACT':                    { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-100',  Icon: Leaf    },
  'Mindfulness':            { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-100', Icon: Focus   },
  'Activación Conductual':  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-100', Icon: Zap     },
  'Regulación Emocional':   { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-100',   Icon: Heart   },
  'Relajación':             { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-100',   Icon: Wind    },
  'Escritura Reflexiva':    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100',  Icon: PenLine },
}

const DEFAULT_CAT = { bg: 'bg-warm-50', text: 'text-warm-600', border: 'border-warm-100', Icon: ClipboardList }

function getCatStyle(cat) { return CATEGORY_STYLE[cat] ?? DEFAULT_CAT }

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr + 'T23:59:59') < new Date()
}

// ─── Tarjeta de tarea ─────────────────────────────────────────────────────────

function TaskCard({ task, onComplete, onSaveNote, expanded, onToggle }) {
  const [note, setNote]       = useState(task.patient_notes ?? '')
  const [saving, setSaving]   = useState(false)
  const [completing, setComp] = useState(false)
  const cat   = getCatStyle(task.category)
  const over  = !task.completed_at && isOverdue(task.due_date)

  const handleComplete = async () => {
    setComp(true)
    await onComplete(task.id)
    setComp(false)
  }

  const handleSaveNote = async () => {
    setSaving(true)
    await onSaveNote(task.id, note)
    setSaving(false)
  }

  return (
    <div className={cn(
      'bg-white rounded-2xl border shadow-card overflow-hidden transition-all',
      task.completed_at ? 'border-warm-100 opacity-80' : over ? 'border-red-200' : 'border-warm-100',
    )}>
      {/* Cabecera */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-warm-50 transition-colors"
      >
        {/* Checkbox visual */}
        <div className={cn(
          'shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
          task.completed_at
            ? 'bg-success border-success'
            : 'border-warm-300 bg-white hover:border-primary-400'
        )}>
          {task.completed_at && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {/* Categoría */}
            {task.category && (
              <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', cat.bg, cat.text, cat.border)}>
                <cat.Icon size={11} strokeWidth={1.8} className="inline" /> {task.category}
              </span>
            )}
            {/* Frecuencia */}
            {task.frequency && (
              <span className="inline-flex items-center gap-1 text-xs text-warm-400 bg-warm-50 border border-warm-100 px-2 py-0.5 rounded-full">
                <RefreshCw size={11} strokeWidth={1.8} /> {task.frequency}
              </span>
            )}
            {/* Fecha límite */}
            {task.due_date && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full border',
                over
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : task.completed_at
                    ? 'bg-warm-50 text-warm-400 border-warm-100'
                    : 'bg-warm-50 text-warm-500 border-warm-100'
              )}>
                <span className="inline-flex items-center gap-1">
                  {over && !task.completed_at
                    ? <AlertTriangle size={11} strokeWidth={1.8} className="inline" />
                    : <Calendar size={11} strokeWidth={1.8} className="inline" />
                  }
                  {formatDate(task.due_date)}
                </span>
              </span>
            )}
          </div>

          <h3 className={cn(
            'font-semibold text-sm leading-snug',
            task.completed_at ? 'line-through text-warm-400' : 'text-warm-900'
          )}>
            {task.title}
          </h3>

          {task.description && (
            <p className="text-xs text-warm-500 mt-0.5 line-clamp-2">{task.description}</p>
          )}
        </div>

        {/* Chevron */}
        <span className={cn(
          'shrink-0 text-warm-400 text-lg transition-transform duration-200',
          expanded && 'rotate-180'
        )}>▾</span>
      </button>

      {/* Detalle expandido */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-warm-50 pt-4 animate-fade-in">

          {/* Terapeuta que asignó */}
          {task.therapist && (
            <div className="flex items-center gap-2">
              <Avatar name={task.therapist.full_name ?? ''} size="xs" />
              <p className="text-xs text-warm-500">
                Asignado por <span className="font-medium text-warm-700">{task.therapist.full_name}</span>
              </p>
            </div>
          )}

          {/* Instrucciones */}
          {task.instructions && (
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-3.5">
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 mb-1.5"><ClipboardList size={12} strokeWidth={1.8} /> Instrucciones</p>
              <p className="text-sm text-primary-800 leading-relaxed whitespace-pre-line">{task.instructions}</p>
            </div>
          )}

          {/* Notas del terapeuta */}
          {task.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
              <p className="text-xs font-semibold text-amber-700 mb-1">Nota del terapeuta</p>
              <p className="text-sm text-amber-800 leading-relaxed">{task.notes}</p>
            </div>
          )}

          {/* Notas personales del paciente */}
          <div>
            <p className="text-xs font-semibold text-warm-600 mb-1.5">Mis notas personales</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Escribe cómo te fue con esta tarea, reflexiones, dificultades…"
              disabled={!!task.completed_at && note === (task.patient_notes ?? '')}
              className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2.5 text-sm text-warm-800 placeholder:text-warm-400 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 resize-none transition-all"
            />
            {note !== (task.patient_notes ?? '') && (
              <Button
                onClick={handleSaveNote}
                loading={saving}
                size="sm"
                variant="secondary"
                className="mt-2"
              >
                Guardar nota
              </Button>
            )}
          </div>

          {/* Acción principal */}
          {!task.completed_at ? (
            <Button
              onClick={handleComplete}
              loading={completing}
              className="w-full"
            >
              Marcar como completada
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-success text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Completada el {new Date(task.completed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Modal explorador de biblioteca terapéutica ──────────────────────────────

function LibraryPickerModal({ patientId, onClose, onAdded }) {
  const [query, setQuery]       = useState('')
  const [catFilter, setCat]     = useState('all')
  const [adding, setAdding]     = useState(null)  // id del ejercicio en proceso

  const filtered = useMemo(() => {
    let list = catFilter === 'all' ? LIBRARY : LIBRARY.filter(e => e.category === catFilter)
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      (e.tags ?? []).some(t => t.toLowerCase().includes(q))
    )
  }, [query, catFilter])

  const handleAdd = async (exercise) => {
    setAdding(exercise.id)
    const { error } = await supabase.from('patient_tasks').insert({
      patient_id:   patientId,
      therapist_id: null,
      title:        exercise.title,
      description:  exercise.summary,
      instructions: exercise.instructions,
      category:     exercise.category,
      frequency:    exercise.frequency ?? null,
      status:       'pending',
    })
    setAdding(null)
    if (error) { console.error(error); toast.error('No se pudo agregar el ejercicio'); return }
    toast.success(`"${exercise.title}" agregado a tus tareas`)
    onAdded()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-float border border-warm-100 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Handle móvil */}
        <div className="w-10 h-1 bg-warm-200 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-warm-100">
          <div>
            <p className="font-serif font-semibold text-warm-900">Biblioteca terapéutica</p>
            <p className="text-xs text-warm-400">Selecciona un ejercicio para agregarlo a tus tareas</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors"><X size={18} strokeWidth={1.8} className="text-warm-500" /></button>
        </div>

        {/* Búsqueda */}
        <div className="px-5 pt-3 pb-2 space-y-2">
          <div className="relative">
            <Search size={14} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-300 pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar ejercicio…"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-warm-200 text-sm text-warm-800 placeholder:text-warm-400 outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          {/* Filtro por categoría */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCat('all')}
              className={cn('shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all', catFilter === 'all' ? 'bg-warm-800 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200')}
            >
              Todos
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={cn('shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all', catFilter === c.id ? 'bg-primary-600 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200')}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-warm-400">
              <Search size={32} strokeWidth={1.5} className="mx-auto mb-2 text-warm-300" />
              <p className="text-sm">Sin resultados</p>
            </div>
          ) : filtered.map(ex => (
            <div key={ex.id} className="bg-white border border-warm-100 rounded-xl p-3.5 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-warm-900 leading-snug">{ex.title}</p>
                <p className="text-xs text-warm-500 mt-0.5 line-clamp-2">{ex.summary}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {ex.duration && <span className="text-[10px] text-warm-400 bg-warm-50 px-2 py-0.5 rounded-full border border-warm-100">{ex.duration}</span>}
                  {ex.frequency && <span className="text-[10px] text-warm-400 bg-warm-50 px-2 py-0.5 rounded-full border border-warm-100">{ex.frequency}</span>}
                </div>
              </div>
              <button
                onClick={() => handleAdd(ex)}
                disabled={adding === ex.id}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {adding === ex.id ? '…' : '+ Agregar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function MyTasksPage() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()

  const [tasks, setTasks]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('pending') // pending | completed | all
  const [expandedId, setExpId]    = useState(null)
  const [showLibrary, setLibrary] = useState(false)

  useEffect(() => { if (user) fetchTasks() }, [user])

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('patient_tasks')
      .select(`
        *,
        therapist:profiles!patient_tasks_therapist_id_fkey(id, full_name, avatar_url)
      `)
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      toast.error('No se pudieron cargar las tareas')
    } else {
      setTasks(data ?? [])
    }
    setLoading(false)
  }

  const handleComplete = async (taskId) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('patient_tasks')
      .update({ status: 'completed', completed_at: now })
      .eq('id', taskId)
      .eq('patient_id', user.id)

    if (error) {
      toast.error('No se pudo actualizar la tarea')
    } else {
      const completedTask = tasks.find(t => t.id === taskId)
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'completed', completed_at: now } : t
      ))
      toast.success('¡Tarea completada! Sigue adelante con tu proceso.')
      // Notificación push
      sendTaskCompletionNotification(completedTask?.title ?? 'Tarea')
    }
  }

  const handleSaveNote = async (taskId, note) => {
    const { error } = await supabase
      .from('patient_tasks')
      .update({ patient_notes: note })
      .eq('id', taskId)
      .eq('patient_id', user.id)

    if (error) {
      toast.error('No se pudo guardar la nota')
    } else {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, patient_notes: note } : t
      ))
      toast.success('Nota guardada')
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'pending')   return tasks.filter(t => !t.completed_at)
    if (filter === 'completed') return tasks.filter(t =>  t.completed_at)
    return tasks
  }, [tasks, filter])

  const pendingCount   = tasks.filter(t => !t.completed_at).length
  const completedCount = tasks.filter(t =>  t.completed_at).length

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-8">

      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Mis Tareas</h1>
          <p className="text-warm-500 text-sm mt-1">
            Actividades y ejercicios asignados por tu terapeuta
          </p>
        </div>
        <button
          onClick={() => setLibrary(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold hover:bg-primary-100 transition-colors"
        >
          <BookOpen size={14} strokeWidth={1.8} /> Explorar biblioteca
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-warm-100 shadow-card p-4 text-center">
          <p className="text-3xl font-bold text-warm-900">{pendingCount}</p>
          <p className="text-xs text-warm-500 mt-0.5">pendientes</p>
        </div>
        <div className="bg-white rounded-2xl border border-warm-100 shadow-card p-4 text-center">
          <p className="text-3xl font-bold text-success">{completedCount}</p>
          <p className="text-xs text-warm-500 mt-0.5">completadas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'pending',   label: `Pendientes (${pendingCount})`   },
          { key: 'completed', label: `Completadas (${completedCount})` },
          { key: 'all',       label: `Todas (${tasks.length})`         },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              filter === f.key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-warm-200 text-warm-600 hover:border-warm-300'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <div className="mb-3 flex justify-center">
            {filter === 'completed'
              ? <CheckCircle2 size={48} strokeWidth={1.8} className="text-warm-300" />
              : <ClipboardList size={48} strokeWidth={1.8} className="text-warm-300" />
            }
          </div>
          <p className="font-medium text-warm-600">
            {filter === 'pending'
              ? '¡No tienes tareas pendientes!'
              : filter === 'completed'
                ? 'Aún no has completado ninguna tarea'
                : 'No tienes tareas asignadas aún'
            }
          </p>
          <p className="text-sm mt-1 text-warm-400">
            {filter === 'pending'
              ? 'Tu terapeuta te asignará ejercicios en próximas sesiones'
              : filter === 'completed'
                ? 'Completa tareas pendientes para verlas aquí'
                : 'Tu terapeuta te asignará ejercicios en próximas sesiones'
            }
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              expanded={expandedId === task.id}
              onToggle={() => setExpId(prev => prev === task.id ? null : task.id)}
              onComplete={handleComplete}
              onSaveNote={handleSaveNote}
            />
          ))}
        </div>
      )}

      {/* Nota informativa */}
      {!loading && tasks.length > 0 && (
        <p className="text-xs text-warm-400 text-center mt-6">
          Las tareas son asignadas por tu terapeuta. Escríbele por{' '}
          <button
            onClick={() => navigate('/patient/chat')}
            className="text-primary-500 underline hover:text-primary-700"
          >
            chat
          </button>
          {' '}si tienes dudas.
        </p>
      )}

      {showLibrary && (
        <LibraryPickerModal
          patientId={user.id}
          onClose={() => setLibrary(false)}
          onAdded={() => { setLibrary(false); fetchTasks() }}
        />
      )}
    </div>
  )
}
