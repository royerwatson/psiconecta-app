import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card, { StatCard } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { formatSessionDate, formatPrice, canStartVideo, getGreeting } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import MoodTracker from '@/components/patient/MoodTracker'
import AICheckin from '@/components/patient/AICheckin'
import PendingTestsSection from '@/components/psychometrics/PendingTestsSection'
import StarRating from '@/components/ui/StarRating'
import { Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { Play, ChevronRight, Flame, Zap, Sparkles, ClipboardList, Calendar, MessageCircle, Search } from 'lucide-react'

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
        supabase.from('patient_tasks').select('*').eq('patient_id', user.id).is('completed_at', null).order('due_date', { nullsFirst: false }).limit(5),
        // Traer 30 registros para historial y gráfica semanal
        supabase.from('mood_entries').select('mood, created_at').eq('patient_id', user.id).order('created_at', { ascending: false }).limit(30),
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
    await supabase.from('patient_tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taskId)
    setTasks((t) => t.filter((task) => task.id !== taskId))
    toast.success('¡Tarea completada! 🎉')
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
      {/* ── Bienvenida ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-warm-400 uppercase tracking-widest mb-1">
            {getGreeting()}
          </p>
          <h1 className="text-2xl font-bold text-warm-900 tracking-tight leading-tight">
            {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-warm-400 text-sm mt-1">¿Cómo te sientes hoy?</p>
        </div>
        {streak > 0 && (
          <div className="flex flex-col items-center bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl px-3 py-2.5 min-w-[60px] shrink-0">
            {streak >= 7
              ? <Flame size={22} className="text-orange-500" strokeWidth={2} />
              : streak >= 3
              ? <Zap size={22} className="text-amber-500" strokeWidth={2} />
              : <Sparkles size={22} className="text-amber-400" strokeWidth={2} />
            }
            <span className="text-lg font-bold text-orange-600 leading-tight mt-0.5">{streak}</span>
            <span className="text-[10px] text-orange-400 font-semibold">{streak === 1 ? 'día' : 'días'}</span>
          </div>
        )}
      </div>

      {/* Banner perfil incompleto */}
      {profile && !profile.avatar_url && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex gap-3 items-center">
          <span className="text-xl shrink-0">🪴</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-primary-800 text-sm">Personaliza tu perfil</p>
            <p className="text-xs text-primary-600 mt-0.5">
              Agregar una foto ayuda a tus terapeutas a reconocerte.
            </p>
          </div>
          <Button size="sm" onClick={() => navigate('/patient/profile')}>Editar</Button>
        </div>
      )}

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

      {/* ── Próxima sesión ── */}
      {loading ? (
        <Skeleton className="h-32" />
      ) : nextSession ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-5 text-white shadow-float">
          {/* Círculos decorativos */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-accent-500/20" />
          <div className="absolute top-4 right-16 w-12 h-12 rounded-full bg-white/5" />

          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3 relative">
            Tu próxima sesión
          </p>

          <div className="flex items-center gap-3 relative">
            <div className="relative shrink-0">
              <Avatar name={nextSession.therapist?.full_name ?? ''} size="md"
                className="ring-2 ring-white/30" />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-primary-700" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-base leading-tight">
                {nextSession.therapist?.full_name}
              </p>
              <p className="text-xs text-white/70 mt-0.5">
                {nextSession.therapist?.therapist_profiles?.[0]?.specialty}
              </p>
              <p className="text-sm font-semibold text-white/90 mt-1.5">
                {formatSessionDate(nextSession.scheduled_at)}
              </p>
            </div>

            {canStartVideo(nextSession.scheduled_at) ? (
              <button
                onClick={() => navigate(`/video-call/${nextSession.id}`)}
                className="shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-primary-700 hover:bg-white/90 active:scale-95 transition-all shadow-lg"
                title="Unirse a la sesión"
              >
                <Play size={20} strokeWidth={2.5} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/patient/appointments')}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all"
              >
                Ver cita
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-warm-200 bg-white p-6 text-center">
          <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar size={22} className="text-primary-500" />
          </div>
          <p className="font-semibold text-warm-700 mb-1">Sin sesiones próximas</p>
          <p className="text-sm text-warm-400 mb-4">Encuentra un terapeuta y agenda tu primera sesión</p>
          <Button size="sm" onClick={() => navigate('/patient/find')}>
            Buscar terapeuta
          </Button>
        </div>
      )}

      {/* Mood tracker */}
      <MoodTracker userId={user?.id} />

      {/* Tests psicométricos pendientes */}
      <PendingTestsSection userId={user?.id} />

      {/* Acceso rápido a resultados liberados */}
      <button
        onClick={() => navigate('/patient/my-results')}
        className="w-full flex items-center justify-between bg-white border border-warm-100 rounded-2xl px-4 py-3.5 shadow-sm hover:bg-warm-50 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📊</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-warm-900">Mis resultados</p>
            <p className="text-xs text-warm-400 mt-0.5">Ver evaluaciones psicométricas disponibles</p>
          </div>
        </div>
        <svg className="w-4 h-4 text-warm-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Tareas pendientes */}
      {tasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold text-warm-900">
              Mis tareas pendientes
            </h2>
            <button
              onClick={() => navigate('/patient/tasks')}
              className="text-xs text-primary-500 font-medium hover:text-primary-700 transition-colors"
            >
              Ver todas →
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {tasks.map((task) => (
              <Card key={task.id} className="flex items-center gap-3 py-3 px-4">
                <button
                  onClick={() => markTaskDone(task.id)}
                  className="w-5 h-5 rounded-full border-2 border-warm-300 hover:border-success hover:bg-green-50 transition-colors shrink-0 flex items-center justify-center"
                  title="Marcar como completada"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-800 truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.category && (
                      <span className="text-xs text-warm-400">{task.category}</span>
                    )}
                    {task.due_date && (
                      <span className={`text-xs ${
                        new Date(task.due_date + 'T23:59:59') < new Date()
                          ? 'text-red-500 font-medium'
                          : 'text-warm-400'
                      }`}>
                        📅 {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/patient/tasks')}
                  className="text-warm-300 hover:text-warm-500 transition-colors"
                  title="Ver detalle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Accesos rápidos ── */}
      <div>
        <h2 className="text-base font-bold text-warm-900 mb-3">¿Qué necesitas hoy?</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Search,         label: 'Buscar terapeuta', to: '/patient/find',         bg: 'bg-primary-600',  light: 'bg-primary-50 text-primary-600' },
            { icon: Calendar,       label: 'Mis citas',         to: '/patient/appointments', bg: 'bg-accent-600',   light: 'bg-accent-50 text-accent-600'   },
            { icon: ClipboardList,  label: 'Mis tareas',         to: '/patient/tasks',        bg: 'bg-orange-500',   light: 'bg-orange-50 text-orange-600'   },
            { icon: MessageCircle,  label: 'Mensajes',           to: '/patient/chat',         bg: 'bg-green-600',    light: 'bg-green-50 text-green-600'     },
          ].map(({ icon: Icon, label, to, light }) => (
            <button key={to} onClick={() => navigate(to)}
              className="bg-white border border-warm-100 rounded-2xl p-4 flex items-center gap-3 hover:shadow-card hover:border-warm-200 active:scale-[0.97] transition-all text-left">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${light}`}>
                <Icon size={18} strokeWidth={2} />
              </span>
              <span className="text-sm font-semibold text-warm-800 leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
