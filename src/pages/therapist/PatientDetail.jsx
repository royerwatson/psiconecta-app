import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input, { Textarea, Select } from '@/components/ui/Input'
import { formatDate, formatDateTime, formatPrice, sanitize } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import PatientTestsTab from '@/components/psychometrics/PatientTestsTab'
import { MessageCircle, Lock, Calendar, ClipboardList, CheckCircle2, Bot, FlaskConical, AlertTriangle, Eye, Unlock, AlertCircle, Check, BookOpen, Search, X, FileDown } from 'lucide-react'
import { generatePatientPDF } from '@/lib/generatePatientPDF'
import { LIBRARY, CATEGORIES } from '@/data/therapeuticLibrary'
import { cn } from '@/lib/utils'

export default function PatientDetail() {
  const { patientId } = useParams()
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [sessions, setSessions] = useState([])
  const [history, setHistory] = useState([])
  const [tasks, setTasks] = useState([])
  const [checkins, setCheckins] = useState([])
  const [tab, setTab] = useState('history') // 'history' | 'tasks' | 'sessions' | 'checkins'
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false) // tiene sesión con este paciente
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [historyForm, setHistoryForm] = useState({ diagnosis: '', treatment_plan: '', session_notes: '', risk_level: 'low' })
  const [releasingId, setReleasingId] = useState(null)   // id del entry con panel de liberar abierto
  const [releasedNotesEdit, setReleasedNotesEdit] = useState('')
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '' })
  const [showLibraryPicker, setShowLibraryPicker] = useState(false)
  const [libraryQuery, setLibraryQuery] = useState('')
  const [libraryCat, setLibraryCat] = useState('all')
  const [addingFromLib, setAddingFromLib] = useState(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [patientId])

  const fetchAll = async () => {
    setLoading(true)

    // Verificar plan del terapeuta (para mostrar botón PDF)
    supabase.from('therapist_profiles').select('subscription_plan').eq('user_id', user.id).single()
      .then(({ data }) => setIsPro(['pro', 'premium'].includes(data?.subscription_plan)))

    // Verificar si este terapeuta tiene alguna sesión con el paciente
    const { data: mySession } = await supabase
      .from('sessions')
      .select('id')
      .eq('therapist_id', user.id)
      .eq('patient_id', patientId)
      .limit(1)

    const access = (mySession ?? []).length > 0
    setHasAccess(access)

    const [{ data: pat }, { data: sess }, { data: tsk }, { data: chk }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', patientId).single(),
      supabase.from('sessions').select('*').eq('patient_id', patientId).eq('therapist_id', user.id).order('scheduled_at', { ascending: false }).limit(10),
      supabase.from('patient_tasks').select('*').eq('patient_id', patientId).eq('therapist_id', user.id).order('created_at', { ascending: false }),
      supabase.from('ai_checkins').select('*').eq('patient_id', patientId).eq('therapist_id', user.id).order('created_at', { ascending: false }).limit(30),
    ])

    // El historial clínico solo se carga si hay acceso
    let hist = []
    if (access) {
      const { data: histData } = await supabase
        .from('clinical_history')
        .select('*, therapist:profiles!clinical_history_therapist_id_fkey(full_name)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
      hist = histData ?? []
    }

    setPatient(pat)
    setSessions(sess ?? [])
    setHistory(hist)
    setTasks(tsk ?? [])
    setCheckins(chk ?? [])
    setLoading(false)
  }

  const saveHistory = async () => {
    // Validar que al menos un campo tenga contenido
    if (!historyForm.diagnosis && !historyForm.treatment_plan && !historyForm.session_notes) {
      toast.error('Completa al menos un campo para guardar la nota clínica')
      return
    }
    const { error } = await supabase.from('clinical_history').insert({
      patient_id:   patientId,
      therapist_id: user.id,
      diagnosis:      sanitize(historyForm.diagnosis),
      treatment_plan: sanitize(historyForm.treatment_plan),
      session_notes:  sanitize(historyForm.session_notes),
      risk_level:     historyForm.risk_level,
    })
    if (error) { toast.error('Error guardando nota clínica'); return }
    toast.success('Nota clínica guardada')
    setShowHistoryModal(false)
    setHistoryForm({ diagnosis: '', treatment_plan: '', session_notes: '', risk_level: 'low' })
    fetchAll()
  }

  const saveTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error('El título de la tarea es obligatorio')
      return
    }
    const { error } = await supabase.from('patient_tasks').insert({
      patient_id:   patientId,
      therapist_id: user.id,
      title:       sanitize(taskForm.title),
      description: sanitize(taskForm.description),
      due_date:    taskForm.due_date,
      status:      'pending',
    })
    if (error) { toast.error('Error guardando tarea'); return }
    toast.success('Tarea asignada al paciente')
    setShowTaskModal(false)
    setTaskForm({ title: '', description: '', due_date: '' })
    fetchAll()
  }

  const toggleTask = async (task) => {
    await supabase.from('patient_tasks').update({ status: task.completed_at ? 'pending' : 'completed', completed_at: task.completed_at ? null : new Date().toISOString() }).eq('id', task.id)
    fetchAll()
  }

  const assignFromLibrary = async (exercise) => {
    setAddingFromLib(exercise.id)
    const { error } = await supabase.from('patient_tasks').insert({
      patient_id:   patientId,
      therapist_id: user.id,
      title:        exercise.title,
      description:  exercise.summary,
      instructions: exercise.instructions,
      category:     exercise.category,
      frequency:    exercise.frequency ?? null,
      status:       'pending',
    })
    setAddingFromLib(null)
    if (error) { toast.error('Error al asignar ejercicio'); return }
    toast.success(`"${exercise.title}" asignado al paciente`)
    setShowLibraryPicker(false)
    fetchAll()
  }

  const filteredLibrary = LIBRARY.filter(e => {
    const matchCat = libraryCat === 'all' || e.category === libraryCat
    const q = libraryQuery.toLowerCase()
    const matchQ = !q || e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  const markCheckinReviewed = async (checkinId) => {
    await supabase.from('ai_checkins').update({ notified: true }).eq('id', checkinId)
    setCheckins(prev => prev.map(c => c.id === checkinId ? { ...c, notified: true } : c))
    toast.success('Alerta marcada como revisada')
  }

  const toggleReleaseNote = async (histId, currentReleased, releasedNotes) => {
    const next = !currentReleased
    const { error } = await supabase
      .from('clinical_history')
      .update({ is_released: next, released_notes: next ? sanitize(releasedNotes) : null })
      .eq('id', histId)
    if (error) { toast.error('No se pudo actualizar'); return }
    toast.success(next ? 'Notas compartidas con el paciente' : 'Notas retiradas del paciente')
    fetchAll()
  }

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true)
    try {
      // Obtener assignments de tests del paciente
      const { data: rel } = await supabase
        .from('therapeutic_relationships')
        .select('id')
        .eq('therapist_id', user.id)
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .maybeSingle()

      let testAssignments = []
      if (rel) {
        const { data } = await supabase
          .from('test_assignments')
          .select('id, tests(id, name, category), test_sessions(id, status, completed_at)')
          .eq('relationship_id', rel.id)
          .eq('status', 'completed')
        testAssignments = data ?? []
      }

      await generatePatientPDF({
        patient,
        therapistName: profile?.full_name ?? 'Terapeuta',
        sessions,
        history,
        tasks,
        checkins,
        testAssignments,
      })
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('No se pudo generar el PDF. Intenta de nuevo.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (loading) return <div className="flex flex-col gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>
  if (!patient) return <p className="text-center text-warm-500 mt-20">Paciente no encontrado</p>

  const unreadCheckins = checkins.filter(c => c.risk_level === 'high' && !c.notified).length

  const TABS = [
    { id: 'history',  label: 'Historial clínico', count: history.length   },
    { id: 'tasks',    label: 'Tareas',             count: tasks.length     },
    { id: 'sessions', label: 'Sesiones',           count: sessions.length  },
    { id: 'checkins', label: 'Check-ins',          count: unreadCheckins, alert: unreadCheckins > 0 },
    { id: 'tests',    label: 'Tests',              count: 0                },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header paciente */}
      <div className="flex items-start gap-4">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>← Volver</Button>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={patient.full_name} size="xl" />
          <div className="flex-1">
            <h1 className="font-serif text-2xl font-bold text-warm-900">{patient.full_name}</h1>
            <p className="text-warm-500 text-sm mt-1">{patient.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="calm">{sessions.length} sesiones</Badge>
              <Badge variant="neutral">{history.length} notas clínicas</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPro && hasAccess && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleGeneratePDF}
                disabled={generatingPDF}
                className="flex items-center gap-1.5"
              >
                <FileDown size={14} strokeWidth={1.8} />
                {generatingPDF ? 'Generando…' : 'Exportar PDF'}
              </Button>
            )}
            <Button size="sm" variant="calm" onClick={() => navigate(`/therapist/chat?patient=${patientId}`)} className="flex items-center gap-1.5">
              <MessageCircle size={14} strokeWidth={1.8} /> Mensaje
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 p-1 rounded-2xl">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 text-sm font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === t.id ? 'bg-white shadow-sm text-primary-700' : 'text-warm-500 hover:text-warm-700'
            }`}>
            {t.label}
            {t.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              t.alert ? 'bg-red-500 text-white' :
              tab === t.id ? 'bg-primary-100 text-primary-600' : 'bg-warm-200 text-warm-500'
            }`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Historial clínico */}
      {tab === 'history' && (
        <div className="flex flex-col gap-4">
          {!hasAccess ? (
            <Card className="text-center py-10">
              <div className="flex justify-center mb-3"><Lock size={40} strokeWidth={1.8} className="text-warm-300" /></div>
              <p className="font-semibold text-warm-800 mb-1">Acceso restringido</p>
              <p className="text-sm text-warm-500 max-w-xs mx-auto">
                El historial clínico de este paciente solo es visible cuando el paciente ha agendado una sesión contigo.
              </p>
            </Card>
          ) : (
          <>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowHistoryModal(true)}>+ Nueva nota clínica</Button>
          </div>
          {history.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-warm-500">No hay notas clínicas aún</p>
            </Card>
          ) : history.map((h) => (
            <Card key={h.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-warm-400">{formatDateTime(h.created_at)}</p>
                  <p className="text-xs text-warm-400">por {h.therapist?.full_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={h.risk_level === 'high' ? 'danger' : h.risk_level === 'medium' ? 'warning' : 'success'}>
                    Riesgo {h.risk_level}
                  </Badge>
                  {h.is_released && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                      <Eye size={11} strokeWidth={1.8} /> Visible al paciente
                    </span>
                  )}
                </div>
              </div>
              {h.diagnosis && <div className="mb-2"><p className="text-xs font-semibold text-warm-500 uppercase">Diagnóstico</p><p className="text-sm text-warm-800 mt-1">{h.diagnosis}</p></div>}
              {h.treatment_plan && <div className="mb-2"><p className="text-xs font-semibold text-warm-500 uppercase">Plan de tratamiento</p><p className="text-sm text-warm-800 mt-1">{h.treatment_plan}</p></div>}
              {h.session_notes && <div><p className="text-xs font-semibold text-warm-500 uppercase">Notas de sesión</p><p className="text-sm text-warm-800 mt-1">{h.session_notes}</p></div>}

              {/* Panel liberar notas al paciente */}
              {releasingId === h.id ? (
                <div className="mt-4 pt-4 border-t border-warm-100 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-warm-600">
                    Resumen amigable para el paciente (opcional)
                  </p>
                  <Textarea
                    value={releasedNotesEdit}
                    onChange={e => setReleasedNotesEdit(e.target.value)}
                    rows={3}
                    placeholder="Escribe un resumen en lenguaje accesible para el paciente. Si lo dejas vacío, se compartirán las notas de sesión originales."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setReleasingId(null)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        toggleReleaseNote(h.id, h.is_released, releasedNotesEdit)
                        setReleasingId(null)
                      }}
                    >
                      {h.is_released ? 'Retirar del paciente' : 'Compartir con paciente'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-warm-50">
                  <button
                    onClick={() => {
                      setReleasingId(h.id)
                      setReleasedNotesEdit(h.released_notes ?? '')
                    }}
                    className={`text-xs font-medium transition-colors ${
                      h.is_released
                        ? 'text-green-600 hover:text-red-500'
                        : 'text-primary-500 hover:text-primary-700'
                    }`}
                  >
                    {h.is_released
                      ? <span className="inline-flex items-center gap-1"><Eye size={12} strokeWidth={1.8} /> Ocultar al paciente</span>
                      : <span className="inline-flex items-center gap-1"><Unlock size={12} strokeWidth={1.8} /> Compartir resumen con el paciente</span>
                    }
                  </button>
                </div>
              )}
            </Card>
          ))}
          </>
          )}
        </div>
      )}

      {/* Tareas */}
      {tab === 'tasks' && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowLibraryPicker(true)}>
              <BookOpen size={13} strokeWidth={1.8} /> Desde biblioteca
            </Button>
            <Button size="sm" onClick={() => setShowTaskModal(true)}>+ Asignar tarea</Button>
          </div>
          {tasks.length === 0 ? (
            <Card className="text-center py-8"><p className="text-warm-500">No hay tareas asignadas</p></Card>
          ) : tasks.map((task) => (
            <Card key={task.id} className="flex items-start gap-3">
              <button onClick={() => toggleTask(task)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  task.completed ? 'bg-success border-success text-white' : 'border-warm-300 hover:border-primary-400'
                }`}>
                {task.completed && <Check size={11} strokeWidth={2.5} />}
              </button>
              <div className="flex-1">
                <p className={`font-medium text-sm ${task.completed ? 'line-through text-warm-400' : 'text-warm-800'}`}>
                  {task.title}
                </p>
                {task.description && <p className="text-xs text-warm-500 mt-0.5">{task.description}</p>}
                {task.due_date && <p className="text-xs text-warm-400 mt-1 flex items-center gap-1"><Calendar size={11} strokeWidth={1.8} /> Hasta el {formatDate(task.due_date)}</p>}
              </div>
              <Badge variant={task.completed ? 'success' : 'neutral'}>
                {task.completed ? 'Completada' : 'Pendiente'}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {/* Sesiones */}
      {tab === 'sessions' && (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-warm-800">{formatDate(s.scheduled_at)}</p>
                <p className="text-xs text-warm-500 mt-0.5">{formatPrice(s.price ?? 0)} · {s.status}</p>
              </div>
              <Badge variant={s.status === 'completed' ? 'success' : 'primary'} dot>
                {s.status === 'completed' ? 'Completada' : 'Programada'}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {/* Check-ins de IA */}
      {tab === 'checkins' && (
        <div className="flex flex-col gap-3">
          {checkins.length === 0 ? (
            <Card className="text-center py-8">
              <div className="flex justify-center mb-2"><Bot size={32} strokeWidth={1.8} className="text-warm-300" /></div>
              <p className="text-warm-500 text-sm">Este paciente aún no ha completado check-ins diarios</p>
            </Card>
          ) : checkins.map((c) => {
            const isHigh   = c.risk_level === 'high'
            const isMedium = c.risk_level === 'medium'
            const unread   = isHigh && !c.notified
            return (
              <Card key={c.id} className={unread ? 'border-red-200 bg-red-50/30' : ''}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isHigh   ? 'bg-red-100 text-red-700 border border-red-200' :
                      isMedium ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {isHigh ? 'Riesgo alto' : isMedium ? 'Riesgo medio' : 'Sin riesgo'}
                    </span>
                    {unread && (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">
                        <AlertCircle size={11} strokeWidth={1.8} /> Sin revisar
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-warm-400 shrink-0">
                    {new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {c.ai_message && (
                  <p className="text-sm text-warm-700 mb-2 italic">"{c.ai_message}"</p>
                )}

                {c.questions_answers && (
                  <details className="mt-1">
                    <summary className="text-xs text-warm-400 cursor-pointer hover:text-warm-600 transition-colors">
                      Ver respuestas completas
                    </summary>
                    <div className="mt-2 bg-warm-50 rounded-xl p-3 text-xs text-warm-600 leading-relaxed whitespace-pre-line">
                      {c.questions_answers}
                    </div>
                  </details>
                )}

                {unread && (
                  <div className="mt-3 pt-3 border-t border-red-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => markCheckinReviewed(c.id)}
                    >
                      Marcar como revisado
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Tests psicométricos */}
      {tab === 'tests' && (
        <Card>
          <PatientTestsTab therapistId={user.id} patientId={patientId} />
        </Card>
      )}

      {/* Modal historial */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Nueva nota clínica" size="lg">
        <div className="flex flex-col gap-4">
          <Textarea label="Diagnóstico" value={historyForm.diagnosis}
            onChange={(e) => setHistoryForm(f => ({ ...f, diagnosis: e.target.value }))}
            placeholder="Describe el diagnóstico o impresión clínica..." rows={3} />
          <Textarea label="Plan de tratamiento" value={historyForm.treatment_plan}
            onChange={(e) => setHistoryForm(f => ({ ...f, treatment_plan: e.target.value }))}
            placeholder="Objetivos terapéuticos y plan de acción..." rows={3} />
          <Textarea label="Notas de sesión" value={historyForm.session_notes}
            onChange={(e) => setHistoryForm(f => ({ ...f, session_notes: e.target.value }))}
            placeholder="Observaciones y avances de la sesión..." rows={4} />
          <Select label="Nivel de riesgo" value={historyForm.risk_level}
            onChange={(e) => setHistoryForm(f => ({ ...f, risk_level: e.target.value }))}>
            <option value="low">Bajo</option>
            <option value="medium">Medio</option>
            <option value="high">Alto</option>
          </Select>
          <Button onClick={saveHistory} fullWidth>Guardar nota clínica</Button>
        </div>
      </Modal>

      {/* Modal biblioteca terapéutica */}
      {showLibraryPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowLibraryPicker(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-float border border-warm-100 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-warm-200 rounded-full mx-auto mt-3 sm:hidden" />
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-warm-100">
              <div>
                <p className="font-serif font-semibold text-warm-900">Biblioteca terapéutica</p>
                <p className="text-xs text-warm-400">Selecciona un ejercicio para asignar a {patient?.full_name?.split(' ')[0]}</p>
              </div>
              <button onClick={() => setShowLibraryPicker(false)} className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors">
                <X size={18} strokeWidth={1.8} className="text-warm-500" />
              </button>
            </div>
            <div className="px-5 pt-3 pb-2 space-y-2">
              <div className="relative">
                <Search size={14} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-300 pointer-events-none" />
                <input value={libraryQuery} onChange={e => setLibraryQuery(e.target.value)} placeholder="Buscar ejercicio…"
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-warm-200 text-sm text-warm-800 placeholder:text-warm-400 outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button onClick={() => setLibraryCat('all')} className={cn('shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all', libraryCat === 'all' ? 'bg-warm-800 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200')}>Todos</button>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setLibraryCat(c.id)} className={cn('shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all', libraryCat === c.id ? 'bg-primary-600 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200')}>{c.label}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
              {filteredLibrary.length === 0 ? (
                <p className="text-center text-sm text-warm-400 py-10">Sin resultados</p>
              ) : filteredLibrary.map(ex => (
                <div key={ex.id} className="bg-white border border-warm-100 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-warm-900 leading-snug">{ex.title}</p>
                    <p className="text-xs text-warm-500 mt-0.5 line-clamp-2">{ex.summary}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {ex.duration && <span className="text-[10px] text-warm-400 bg-warm-50 px-2 py-0.5 rounded-full border border-warm-100">{ex.duration}</span>}
                      {ex.frequency && <span className="text-[10px] text-warm-400 bg-warm-50 px-2 py-0.5 rounded-full border border-warm-100">{ex.frequency}</span>}
                    </div>
                  </div>
                  <button onClick={() => assignFromLibrary(ex)} disabled={addingFromLib === ex.id}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors">
                    {addingFromLib === ex.id ? '…' : '+ Asignar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal tarea */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Asignar tarea">
        <div className="flex flex-col gap-4">
          <Input label="Título de la tarea" value={taskForm.title}
            onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Ej. Diario de emociones" required />
          <Textarea label="Descripción" value={taskForm.description}
            onChange={(e) => setTaskForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Instrucciones detalladas para el paciente..." rows={3} />
          <Input label="Fecha límite" type="date" value={taskForm.due_date}
            onChange={(e) => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
          <Button onClick={saveTask} fullWidth>Asignar tarea</Button>
        </div>
      </Modal>
    </div>
  )
}
