/**
 * JournalPage — Diario personal del paciente.
 *
 * Funciones:
 *   - Escribir entradas privadas (solo visibles para el propio paciente)
 *   - Prompts terapéuticos sugeridos por categoría
 *   - Lista de entradas anteriores con vista previa y fecha
 *   - Editar y eliminar entradas propias
 *   - Etiquetas de estado de ánimo opcionales
 *
 * Tabla: patient_journal
 *   id, patient_id, title, content, prompt, mood_tag, created_at, updated_at
 */
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { Flower2, Heart, Brain, Sprout, Users, Sparkles, BookOpen, Lock, MessageCircle, Pen, Trash2 } from 'lucide-react'

// ─── Prompts terapéuticos ─────────────────────────────────────────────────────

const PROMPT_CATEGORIES = [
  {
    id: 'gratitud',
    label: 'Gratitud',
    Icon: Flower2,
    color: 'bg-pink-50 text-pink-700 border-pink-100',
    prompts: [
      '¿Qué tres cosas pequeñas de hoy agradezco y por qué?',
      '¿Qué persona en mi vida me ha apoyado últimamente? ¿Cómo me ha hecho sentir?',
      '¿Qué parte de mí mismo/a valoro y agradezco hoy?',
      '¿Qué experiencia reciente, aunque difícil, me enseñó algo valioso?',
    ],
  },
  {
    id: 'emociones',
    label: 'Emociones',
    Icon: Heart,
    color: 'bg-purple-50 text-purple-700 border-purple-100',
    prompts: [
      '¿Qué emoción predomina en mí hoy? ¿Dónde la siento en el cuerpo?',
      'Describe un momento de esta semana que te generó malestar. ¿Qué pensabas en ese instante?',
      '¿Qué situación me cuesta más manejar emocionalmente? ¿Por qué crees que es así?',
      '¿Cuándo fue la última vez que me sentí en paz? ¿Qué lo hizo posible?',
    ],
  },
  {
    id: 'pensamientos',
    label: 'Pensamientos',
    Icon: Brain,
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    prompts: [
      '¿Qué pensamiento recurrente me aparece esta semana? ¿Es un hecho o una interpretación?',
      'Si pudiera hablarle a mi yo de hace 5 años, ¿qué le diría sobre cómo estoy ahora?',
      '¿Qué creencia sobre mí mismo/a me limita? ¿Qué evidencia tengo a favor y en contra?',
      '¿Cuál es mi "crítico interno" diciendo hoy? ¿Cómo le respondería un amigo compasivo?',
    ],
  },
  {
    id: 'metas',
    label: 'Metas',
    Icon: Sprout,
    color: 'bg-green-50 text-green-700 border-green-100',
    prompts: [
      '¿Qué pequeño paso puedo dar mañana hacia algo que me importa?',
      '¿Qué valor personal quiero honrar más esta semana? ¿Cómo lo haré?',
      '¿Qué hábito me gustaría cultivar? ¿Qué obstáculo anticipas y cómo lo enfrentarías?',
      '¿Qué versión de mí mismo/a aspiro a ser en 6 meses? ¿Qué estoy haciendo hoy en esa dirección?',
    ],
  },
  {
    id: 'relaciones',
    label: 'Relaciones',
    Icon: Users,
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    prompts: [
      '¿Hay alguna relación en mi vida que quiera cuidar más? ¿Qué acción pequeña podría tomar?',
      '¿Hubo algún conflicto esta semana? ¿Qué pudo haber sentido la otra persona?',
      '¿Me cuesta pedir ayuda? ¿Por qué? ¿Qué pasaría si lo hiciera más?',
      '¿Cómo me relaciono conmigo mismo/a cuando cometo un error? ¿Soy compasivo/a?',
    ],
  },
  {
    id: 'terapia',
    label: 'Terapia',
    Icon: Sparkles,
    color: 'bg-teal-50 text-teal-700 border-teal-100',
    prompts: [
      '¿Qué aprendí sobre mí mismo/a en la última sesión con mi terapeuta?',
      '¿Qué ejercicio o técnica de terapia me ha resultado útil? ¿Por qué crees que funciona?',
      '¿Qué quiero explorar o preguntar en mi próxima sesión?',
      '¿Noto algún cambio en mí desde que comencé la terapia? ¿Cuál?',
    ],
  },
]

const MOOD_TAGS = [
  { id: 'tranquilo',    emoji: '😌', label: 'Tranquilo'    },
  { id: 'reflexivo',   emoji: '🤔', label: 'Reflexivo'    },
  { id: 'agradecido',  emoji: '🙏', label: 'Agradecido'   },
  { id: 'ansioso',     emoji: '😰', label: 'Ansioso'      },
  { id: 'triste',      emoji: '😔', label: 'Triste'       },
  { id: 'motivado',    emoji: '💪', label: 'Motivado'     },
  { id: 'confundido',  emoji: '😵', label: 'Confundido'   },
  { id: 'esperanzado', emoji: '🌟', label: 'Esperanzado'  },
]

function formatEntryDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatEntryTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// ─── Componente Editor ────────────────────────────────────────────────────────

function JournalEditor({ entry, onSave, onCancel }) {
  const [title, setTitle]     = useState(entry?.title ?? '')
  const [content, setContent] = useState(entry?.content ?? '')
  const [moodTag, setMoodTag] = useState(entry?.mood_tag ?? '')
  const [prompt, setPrompt]   = useState(entry?.prompt ?? '')
  const [activeCat, setActiveCat] = useState(null)
  const [saving, setSaving]   = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const usePrompt = (p) => {
    setPrompt(p)
    setActiveCat(null)
    // Si el área está vacía, pre-llena con el prompt como contexto
    if (!content.trim()) {
      setContent('')
    }
    textareaRef.current?.focus()
  }

  const handleSave = async () => {
    if (!content.trim()) { toast.error('Escribe algo en tu entrada'); return }
    setSaving(true)
    await onSave({ title, content, mood_tag: moodTag || null, prompt: prompt || null })
    setSaving(false)
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <div className="flex flex-col gap-4 animate-fade-in">

      {/* Prompts sugeridos */}
      <div>
        <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Sparkles size={12} strokeWidth={1.8} /> Prompts para inspirarte
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {PROMPT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(prev => prev === cat.id ? null : cat.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                activeCat === cat.id
                  ? cat.color + ' shadow-sm'
                  : 'bg-white border-warm-200 text-warm-600 hover:border-warm-300'
              )}
            >
              <cat.Icon size={11} strokeWidth={1.8} /> {cat.label}
            </button>
          ))}
        </div>

        {/* Lista de prompts de la categoría activa */}
        {activeCat && (
          <div className="bg-warm-50 border border-warm-100 rounded-xl p-3 flex flex-col gap-1.5 animate-fade-in">
            {PROMPT_CATEGORIES.find(c => c.id === activeCat)?.prompts.map((p, i) => (
              <button
                key={i}
                onClick={() => usePrompt(p)}
                className="text-left text-sm text-warm-700 hover:text-primary-700 hover:bg-white px-2 py-1.5 rounded-lg transition-colors"
              >
                → {p}
              </button>
            ))}
          </div>
        )}

        {/* Prompt seleccionado */}
        {prompt && (
          <div className="flex items-start gap-2 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2.5 mt-2">
            <MessageCircle size={14} strokeWidth={1.8} className="text-primary-400 shrink-0 mt-0.5" />
            <p className="text-sm text-primary-700 italic flex-1">{prompt}</p>
            <button
              onClick={() => setPrompt('')}
              className="text-primary-300 hover:text-primary-500 text-lg leading-none shrink-0"
            >×</button>
          </div>
        )}
      </div>

      {/* Título opcional */}
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título (opcional)"
        className="w-full font-serif text-lg font-semibold text-warm-900 placeholder:text-warm-300 bg-transparent border-b border-warm-100 pb-2 outline-none focus:border-primary-300 transition-colors"
      />

      {/* Área de escritura */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Escribe libremente... este es tu espacio privado."
        rows={10}
        className="w-full bg-white border border-warm-200 rounded-xl px-4 py-3 text-sm text-warm-800 placeholder:text-warm-300 leading-relaxed outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 resize-none transition-all"
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-warm-400">{wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}</p>
      </div>

      {/* Etiqueta de estado de ánimo */}
      <div>
        <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-2">
          ¿Cómo te sientes al escribir esto?
        </p>
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map(tag => (
            <button
              key={tag.id}
              onClick={() => setMoodTag(prev => prev === tag.id ? '' : tag.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                moodTag === tag.id
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white border-warm-200 text-warm-600 hover:border-warm-300'
              )}
            >
              <span>{tag.emoji}</span>
              <span>{tag.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-1">
        <Button onClick={onCancel} variant="secondary" className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSave} loading={saving} className="flex-1">
          Guardar entrada
        </Button>
      </div>
    </div>
  )
}

// ─── Tarjeta de entrada ───────────────────────────────────────────────────────

function EntryCard({ entry, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const moodTag = MOOD_TAGS.find(t => t.id === entry.mood_tag)
  const preview = entry.content.length > 140
    ? entry.content.slice(0, 140) + '…'
    : entry.content

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta entrada? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    await onDelete(entry.id)
    setDeleting(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-card overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 py-4 hover:bg-warm-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-warm-400 capitalize">
                {formatEntryDate(entry.created_at)}
              </span>
              <span className="text-warm-200">·</span>
              <span className="text-xs text-warm-400">{formatEntryTime(entry.created_at)}</span>
              {moodTag && (
                <span className="text-xs bg-warm-50 border border-warm-100 text-warm-600 px-2 py-0.5 rounded-full">
                  {moodTag.emoji} {moodTag.label}
                </span>
              )}
            </div>
            {entry.title && (
              <p className="font-serif font-semibold text-warm-900 text-sm mb-0.5">{entry.title}</p>
            )}
            <p className="text-sm text-warm-600 leading-relaxed">
              {expanded ? entry.content : preview}
            </p>
            {entry.prompt && expanded && (
              <p className="text-xs text-primary-500 italic mt-2 border-l-2 border-primary-200 pl-2">
                {entry.prompt}
              </p>
            )}
          </div>
          <span className={cn(
            'shrink-0 text-warm-300 text-lg transition-transform duration-200',
            expanded && 'rotate-180'
          )}>▾</span>
        </div>
      </button>

      {expanded && (
        <div className="flex gap-2 px-4 pb-3 border-t border-warm-50 pt-3 animate-fade-in">
          <button
            onClick={() => onEdit(entry)}
            className="flex items-center gap-1.5 text-xs text-warm-500 hover:text-primary-600 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50"
          >
            <Pen size={12} strokeWidth={1.8} /> Editar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs text-warm-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <Trash2 size={12} strokeWidth={1.8} /> Eliminar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function JournalPage() {
  const { user } = useAuthStore()
  const [entries, setEntries]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('list')   // 'list' | 'new' | 'edit'
  const [editingEntry, setEditing] = useState(null)
  const [filterMood, setFilterMood] = useState('')

  useEffect(() => { if (user) fetchEntries() }, [user])

  const fetchEntries = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('patient_journal')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      toast.error('No se pudieron cargar las entradas')
    } else {
      setEntries(data ?? [])
    }
    setLoading(false)
  }

  const handleSave = async ({ title, content, mood_tag, prompt }) => {
    if (editingEntry) {
      // Actualizar entrada existente
      const { error } = await supabase
        .from('patient_journal')
        .update({ title, content, mood_tag, prompt, updated_at: new Date().toISOString() })
        .eq('id', editingEntry.id)
        .eq('patient_id', user.id)

      if (error) { toast.error('No se pudo guardar'); return }
      setEntries(prev => prev.map(e =>
        e.id === editingEntry.id
          ? { ...e, title, content, mood_tag, prompt }
          : e
      ))
      toast.success('Entrada actualizada')
    } else {
      // Nueva entrada
      const { data, error } = await supabase
        .from('patient_journal')
        .insert({ patient_id: user.id, title, content, mood_tag, prompt })
        .select()
        .single()

      if (error) { toast.error('No se pudo guardar'); return }
      setEntries(prev => [data, ...prev])
      toast.success('Entrada guardada')
    }

    setView('list')
    setEditing(null)
  }

  const handleEdit = (entry) => {
    setEditing(entry)
    setView('edit')
  }

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('patient_journal')
      .delete()
      .eq('id', id)
      .eq('patient_id', user.id)

    if (error) { toast.error('No se pudo eliminar'); return }
    setEntries(prev => prev.filter(e => e.id !== id))
    toast.success('Entrada eliminada')
  }

  const handleCancel = () => {
    setView('list')
    setEditing(null)
  }

  const filteredEntries = filterMood
    ? entries.filter(e => e.mood_tag === filterMood)
    : entries

  // ── Vista de editor (nueva o edición) ──
  if (view === 'new' || view === 'edit') {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleCancel}
            className="text-warm-400 hover:text-warm-700 transition-colors p-1"
          >
            ← Volver
          </button>
          <h1 className="font-serif text-xl font-bold text-warm-900">
            {view === 'edit' ? 'Editar entrada' : 'Nueva entrada'}
          </h1>
        </div>
        <JournalEditor
          entry={editingEntry}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  // ── Vista de lista ──
  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-8">

      {/* Encabezado */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Mi Diario</h1>
          <p className="text-warm-500 text-sm mt-1">
            {entries.length === 0
              ? 'Un espacio privado para ti'
              : `${entries.length} ${entries.length === 1 ? 'entrada' : 'entradas'} · Solo tú puedes leerlas`}
          </p>
        </div>
        <Button onClick={() => setView('new')} size="sm">
          + Nueva entrada
        </Button>
      </div>

      {/* Sin entradas — estado vacío motivador */}
      {!loading && entries.length === 0 && (
        <div className="bg-gradient-to-br from-primary-50 to-calm-50 border border-primary-100 rounded-2xl p-8 text-center mb-6">
          <div className="mb-4 flex justify-center"><BookOpen size={48} strokeWidth={1.8} className="text-warm-300" /></div>
          <p className="font-serif font-semibold text-warm-900 text-lg mb-2">
            Tu diario está esperando
          </p>
          <p className="text-warm-500 text-sm leading-relaxed mb-5">
            Escribir sobre tus pensamientos y emociones es una de las herramientas
            más poderosas del proceso terapéutico. Es solo tuyo.
          </p>
          <Button onClick={() => setView('new')}>
            Escribe tu primera entrada
          </Button>
        </div>
      )}

      {/* Filtro por estado de ánimo */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterMood('')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              !filterMood
                ? 'bg-warm-800 text-white border-warm-800'
                : 'bg-white border-warm-200 text-warm-600 hover:border-warm-300'
            )}
          >
            Todas
          </button>
          {MOOD_TAGS.filter(t => entries.some(e => e.mood_tag === t.id)).map(tag => (
            <button
              key={tag.id}
              onClick={() => setFilterMood(prev => prev === tag.id ? '' : tag.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                filterMood === tag.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white border-warm-200 text-warm-600 hover:border-warm-300'
              )}
            >
              {tag.emoji} {tag.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista de entradas */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : filteredEntries.length === 0 && filterMood ? (
        <div className="text-center py-10 text-warm-400">
          <p className="text-3xl mb-2">{MOOD_TAGS.find(t => t.id === filterMood)?.emoji}</p>
          <p className="text-sm">No hay entradas con ese estado de ánimo</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredEntries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Nota de privacidad */}
      {!loading && entries.length > 0 && (
        <div className="flex items-center gap-2 mt-6 text-center justify-center">
          <Lock size={14} strokeWidth={1.8} className="text-warm-300" />
          <p className="text-xs text-warm-400">
            Tu diario es completamente privado. Ni tu terapeuta tiene acceso.
          </p>
        </div>
      )}
    </div>
  )
}
