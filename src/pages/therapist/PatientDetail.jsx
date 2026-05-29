import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input, { Textarea, Select } from '@/components/ui/Input'
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import PatientTestsTab from '@/components/psychometrics/PatientTestsTab'

export default function PatientDetail() {
  const { patientId } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [sessions, setSessions] = useState([])
  const [history, setHistory] = useState([])
  const [tasks, setTasks] = useState([])
  const [tab, setTab] = useState('history') // 'history' | 'tasks' | 'sessions'
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false) // tiene sesión con este paciente
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [historyForm, setHistoryForm] = useState({ diagnosis: '', treatment_plan: '', session_notes: '', risk_level: 'low' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '' })

  useEffect(() => {
    fetchAll()
  }, [patientId])

  const fetchAll = async () => {
    setLoading(true)

    // Verificar si este terapeuta tiene alguna sesión con el paciente
    const { data: mySession } = await supabase
      .from('sessions')
      .select('id')
      .eq('therapist_id', user.id)
      .eq('patient_id', patientId)
      .limit(1)

    const access = (mySession ?? []).length > 0
    setHasAccess(access)

    const [{ data: pat }, { data: sess }, { data: tsk }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', patientId).single(),
      supabase.from('sessions').select('*').eq('patient_id', patientId).order('scheduled_at', { ascending: false }).limit(10),
      supabase.from('tasks').select('*').eq('patient_id', patientId).eq('therapist_id', user.id).order('created_at', { ascending: false }),
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
      ...historyForm,
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
    const { error } = await supabase.from('tasks').insert({
      patient_id:   patientId,
      therapist_id: user.id,
      ...taskForm,
      title: taskForm.title.trim(),
    })
    if (error) { toast.error('Error guardando tarea'); return }
    toast.success('Tarea asignada al paciente')
    setShowTaskModal(false)
    setTaskForm({ title: '', description: '', due_date: '' })
    fetchAll()
  }

  const toggleTask = async (task) => {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id)
    fetchAll()
  }

  if (loading) return <div className="flex flex-col gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>
  if (!patient) return <p className="text-center text-warm-500 mt-20">Paciente no encontrado</p>

  const TABS = [
    { id: 'history', label: '📋 Historial clínico', count: history.length  },
    { id: 'tasks',   label: '✅ Tareas',             count: tasks.length    },
    { id: 'sessions',label: '📅 Sesiones',           count: sessions.length },
    { id: 'tests',   label: '🧪 Tests',              count: 0               },
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
          <Button size="sm" variant="calm" onClick={() => navigate(`/therapist/chat?patient=${patientId}`)}>
            💬 Mensaje
          </Button>
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
              <div className="text-4xl mb-3">🔒</div>
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
                <Badge variant={h.risk_level === 'high' ? 'danger' : h.risk_level === 'medium' ? 'warning' : 'success'}>
                  Riesgo {h.risk_level}
                </Badge>
              </div>
              {h.diagnosis && <div className="mb-2"><p className="text-xs font-semibold text-warm-500 uppercase">Diagnóstico</p><p className="text-sm text-warm-800 mt-1">{h.diagnosis}</p></div>}
              {h.treatment_plan && <div className="mb-2"><p className="text-xs font-semibold text-warm-500 uppercase">Plan de tratamiento</p><p className="text-sm text-warm-800 mt-1">{h.treatment_plan}</p></div>}
              {h.session_notes && <div><p className="text-xs font-semibold text-warm-500 uppercase">Notas de sesión</p><p className="text-sm text-warm-800 mt-1">{h.session_notes}</p></div>}
            </Card>
          ))}
          </>
          )}
        </div>
      )}

      {/* Tareas */}
      {tab === 'tasks' && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
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
                {task.completed && <span className="text-xs">✓</span>}
              </button>
              <div className="flex-1">
                <p className={`font-medium text-sm ${task.completed ? 'line-through text-warm-400' : 'text-warm-800'}`}>
                  {task.title}
                </p>
                {task.description && <p className="text-xs text-warm-500 mt-0.5">{task.description}</p>}
                {task.due_date && <p className="text-xs text-warm-400 mt-1">📅 Hasta el {formatDate(task.due_date)}</p>}
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
            <option value="low">🟢 Bajo</option>
            <option value="medium">🟡 Medio</option>
            <option value="high">🔴 Alto</option>
          </Select>
          <Button onClick={saveHistory} fullWidth>Guardar nota clínica</Button>
        </div>
      </Modal>

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
