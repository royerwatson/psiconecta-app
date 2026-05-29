import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card, { StatCard } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { formatSessionDate, formatPrice, canStartVideo } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import MoodTracker from '@/components/patient/MoodTracker'
import AICheckin from '@/components/patient/AICheckin'
import StarRating from '@/components/ui/StarRating'
import { Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'

/**
 * Dashboard principal del paciente.
 *
 * Carga en paralelo:
 *   - Próxima sesión programada (con terapeuta y especialidad)
 *   - Tareas pendientes (máx. 5)
 *   - Registros de estado de ánimo de los últimos 30 días
 *   - Sesiones completadas sin reseña (para prompt de review)
 *
 * Estado local clave:
 *   streak        — racha de días consecutivos con registro de ánimo
 *   pendingReview — primera sesión completada sin reseña del paciente
 *   moodData      — array cronológico (más antiguo → más reciente) para MoodTracker
 */
export default function PatientDashboard() {
  const { profile, user } = useAuthStore()
  const [nextSession, setNextSession] = useState(null)
  const [tasks, setTasks] = useState([])
  const [moodData, setMoodData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [streak, setStreak] = useState(0)
  const [pendingReview, setPendingReview] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewDismissed, setReviewDismissed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const calcStreak = (logs) => {
    if (!logs || logs.length === 0) return 0
    const days = [...new Set(logs.map(l => new Date(l.created_at).toDateString()))]
    days.sort((a, b) => new Date(b) - new Date(a))
    let count = 0
    let cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    for (const d of days) {
      const day = new Date(d)
      day.setHours(0, 0, 0, 0)
      const diff = Math.round((cursor - day) / 86400000)
      if (diff === 0 || diff === 1) {
        count++
        cursor = day
      } else {
        break
      }
    }
    return count
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: sess }, { data: tsk }, { data: mood }, { data: doneSess }] = await Promise.all([
        supabase.from('sessions').select(`
          *, therapist:profiles!sessions_therapist_id_fkey(id, full_name, avatar_url, therapist_profiles(specialty))
        `).eq('patient_id', user.id).in('status', ['scheduled', 'in_progress'])
          .gte('scheduled_at', new Date(Date.now() - 90 * 60 * 1000).toISOString())
          .order('scheduled_at').limit(1),
        supabase.from('tasks').select('*').eq('patient_id', user.id).eq('completed', false).order('due_date').limit(5),
        // Traer 30 registros para historial y gráfica semanal
        supabase.from('mood_logs').select('*').eq('patient_id', user.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('sessions').select(`
          id, scheduled_at,
          therapist:profiles!sessions_therapist_id_fkey(id, full_name),
          reviews(id)
        `).eq('patient_id', user.id).eq('status', 'completed')
          .order('scheduled_at', { ascending: false }).limit(5),
      ])
      setNextSession(sess?.[0] ?? null)
      setTasks(tsk ?? [])
      // Invertir a orden cronológico para que la gráfica y el historial muestren
      // los datos más recientes últimos (el MoodTracker hace su propia deduplicación por día)
      setMoodData((mood ?? []).reverse())
      setStreak(calcStreak(mood ?? []))
      // Encontrar la primera sesión completada sin reseña
      const unreviewed = (doneSess ?? []).find(s => !s.reviews || s.reviews.length === 0)
      setPendingReview(unreviewed ?? null)
    } catch (err) {
      console.error('Error cargando dashboard:', err)
      setError('No pudimos cargar tu información. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  const markTaskDone = async (taskId) => {
    await supabase.from('tasks').update({ completed: true }).eq('id', taskId)
    setTasks((t) => t.filter((task) => task.id !== taskId))
  }

  const submitReview = async () => {
    if (!reviewForm.rating) { toast.error('Selecciona una calificación'); return }
    setSubmittingReview(true)
    const { error } = await supabase.from('reviews').insert({
      session_id: pendingReview.id,
      therapist_id: pendingReview.therapist?.id,
      patient_id: user.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    })
    if (error) { toast.error('Error al enviar reseña'); setSubmittingReview(false); return }
    toast.success('¡Gracias por tu reseña! 🌟')
    setPendingReview(null)
    setReviewForm({ rating: 0, comment: '' })
    setSubmittingReview(false)
  }

  // Pantalla de error — nunca dejar al usuario con pantalla en blanco
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <span className="text-5xl">⚠️</span>
        <p className="font-medium text-warm-800">{error}</p>
        <Button onClick={fetchData} size="sm">Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Bienvenida */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">
            Hola, {profile?.full_name?.split(' ')[0]} 🌟
          </h1>
          <p className="text-warm-500 text-sm mt-1">¿Cómo te sientes hoy?</p>
        </div>
        {streak > 0 && (
          <div className="flex flex-col items-center bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-3 py-2 min-w-[64px]">
            <span className="text-2xl leading-none">{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '✨'}</span>
            <span className="text-lg font-bold text-amber-600 leading-tight">{streak}</span>
            <span className="text-[10px] text-amber-500 font-medium">{streak === 1 ? 'día' : 'días'}</span>
          </div>
        )}
      </div>

      {/* Prompt de reseña post-sesión */}
      {pendingReview && !reviewDismissed && (
        <div className="bg-gradient-to-r from-violet-50 to-primary-50 border border-violet-200 rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-warm-900 text-sm">⭐ ¿Cómo fue tu sesión?</p>
              <p className="text-xs text-warm-500 mt-0.5">
                Sesión con {pendingReview.therapist?.full_name} · Tu opinión ayuda a otros pacientes
              </p>
            </div>
            <button onClick={() => setReviewDismissed(true)}
              className="text-warm-300 hover:text-warm-500 text-lg leading-none ml-2">×</button>
          </div>
          <StarRating value={reviewForm.rating} onChange={(r) => setReviewForm(f => ({ ...f, rating: r }))} size="md" />
          {reviewForm.rating > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              <Textarea
                placeholder="Comentario opcional..."
                value={reviewForm.comment}
                rows={2}
                onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
              />
              <Button size="sm" fullWidth loading={submittingReview} onClick={submitReview}>
                Enviar reseña
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Check-in diario */}
      <AICheckin userId={user?.id} />

      {/* Próxima cita */}
      {loading ? (
        <Skeleton className="h-28" />
      ) : nextSession ? (
        <div className="bg-gradient-to-r from-primary-600 to-calm-500 rounded-2xl p-5 text-white">
          <p className="text-sm font-medium opacity-80 mb-2">Tu próxima sesión</p>
          <div className="flex items-center gap-3">
            <Avatar name={nextSession.therapist?.full_name ?? ''} size="md"
              className="ring-2 ring-white/30" />
            <div className="flex-1">
              <p className="font-semibold">{nextSession.therapist?.full_name}</p>
              <p className="text-sm opacity-80">{nextSession.therapist?.therapist_profiles?.[0]?.specialty}</p>
              <p className="text-sm font-medium mt-0.5">{formatSessionDate(nextSession.scheduled_at)}</p>
            </div>
            {canStartVideo(nextSession.scheduled_at) && (
              <Button size="sm" className="bg-white text-primary-700 hover:bg-white/90 border-0 shadow-none"
                onClick={() => navigate(`/video-call/${nextSession.id}`)}>
                📹 Unirse
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Card className="text-center py-6 border-dashed border-2 border-warm-200">
          <p className="text-warm-500 text-sm mb-3">No tienes sesiones programadas</p>
          <Button size="sm" onClick={() => navigate('/patient/find')}>
            Buscar terapeuta
          </Button>
        </Card>
      )}

      {/* Mood tracker */}
      {/* MoodTracker: recibe hasta 30 registros para historial y gráfica semanal */}
      <MoodTracker moodData={moodData} userId={user?.id} onSave={(entry) => {
        // Agregar el nuevo registro al final (orden cronológico)
        setMoodData((d) => [...d, entry])
      }} />

      {/* Tareas pendientes */}
      {tasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold text-warm-900">
              Mis actividades pendientes
            </h2>
            <Badge variant="warning">{tasks.length}</Badge>
          </div>
          <div className="flex flex-col gap-2">
            {tasks.map((task) => (
              <Card key={task.id} className="flex items-center gap-3 py-3 px-4">
                <button
                  onClick={() => markTaskDone(task.id)}
                  className="w-5 h-5 rounded-full border-2 border-warm-300 hover:border-success hover:bg-green-50 transition-colors shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-800 truncate">{task.title}</p>
                  {task.due_date && (
                    <p className="text-xs text-warm-400 mt-0.5">
                      Hasta el {new Date(task.due_date).toLocaleDateString('es-MX')}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div>
        <h2 className="font-serif text-lg font-semibold text-warm-900 mb-3">¿Qué necesitas hoy?</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🔍', label: 'Buscar terapeuta', to: '/patient/find',         color: 'from-primary-50 to-primary-100/50' },
            { icon: '📅', label: 'Mis citas',         to: '/patient/appointments', color: 'from-calm-50 to-calm-100/50'     },
            { icon: '💬', label: 'Mensajes',           to: '/patient/chat',         color: 'from-violet-50 to-violet-100/50' },
            { icon: '👥', label: 'Sesiones grupales',  to: '/patient/groups',       color: 'from-teal-50 to-teal-100/50'    },
          ].map(({ icon, label, to, color }) => (
            <button key={to} onClick={() => navigate(to)}
              className={`bg-gradient-to-br ${color} border border-warm-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-calm transition-all active:scale-95`}>
              <span className="text-2xl">{icon}</span>
              <span className="text-sm font-medium text-warm-700">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
