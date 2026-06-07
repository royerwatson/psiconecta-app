/**
 * SessionHistoryPage — Historial de sesiones del paciente.
 *
 * Muestra:
 *   - Todas las sesiones completadas (con terapeuta, fecha, duración, precio)
 *   - Notas liberadas por el terapeuta (clinical_history.is_released = true)
 *   - Campo de retroalimentación personal del paciente por sesión
 *   - Reseña entregada si existe
 *
 * Tablas:
 *   sessions          — sesiones completadas del paciente
 *   clinical_history  — notas liberadas (is_released = true)
 *   reviews           — reseña del paciente post-sesión
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { Star, Clock, Timer, ClipboardList, Stethoscope, AlertTriangle, Pencil, Lock, CalendarDays } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSessionDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatSessionTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatPrice(price) {
  if (!price || price === 0) return null
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
}

const RISK_LABEL = { low: null, medium: 'Seguimiento', high: 'Riesgo alto' }
const RISK_COLOR = {
  low:    '',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  high:   'text-red-600 bg-red-50 border-red-200',
}

// ─── Estrellas de reseña ──────────────────────────────────────────────────────

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} strokeWidth={1.8}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-warm-200 fill-warm-200'} />
      ))}
    </div>
  )
}

// ─── Tarjeta de sesión ────────────────────────────────────────────────────────

function SessionCard({ session, onSaveFeedback }) {
  const [expanded, setExpanded]     = useState(false)
  const [feedback, setFeedback]     = useState(session.patient_feedback ?? '')
  const [saving, setSaving]         = useState(false)
  const [editingFB, setEditingFB]   = useState(false)

  const hasReleasedNotes = session.clinical_history?.length > 0
  const hasReview        = session.reviews?.length > 0
  const review           = session.reviews?.[0]

  const handleSaveFeedback = async () => {
    if (!feedback.trim()) return
    setSaving(true)
    await onSaveFeedback(session.id, feedback.trim())
    setSaving(false)
    setEditingFB(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-card overflow-hidden">

      {/* Cabecera */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-warm-50 transition-colors"
      >
        <Avatar name={session.therapist?.full_name ?? ''} size="md" className="shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-warm-900 text-sm">{session.therapist?.full_name ?? 'Terapeuta'}</p>
          <p className="text-xs text-warm-500 mt-0.5 capitalize">{formatSessionDate(session.scheduled_at)}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-xs bg-warm-50 border border-warm-100 text-warm-500 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock size={11} strokeWidth={1.8} className="shrink-0" />{formatSessionTime(session.scheduled_at)}
            </span>
            {session.duration && (
              <span className="text-xs bg-warm-50 border border-warm-100 text-warm-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Timer size={11} strokeWidth={1.8} className="shrink-0" />{session.duration} min
              </span>
            )}
            {formatPrice(session.price) && (
              <span className="text-xs bg-warm-50 border border-warm-100 text-warm-500 px-2 py-0.5 rounded-full">
                {formatPrice(session.price)}
              </span>
            )}
            {hasReleasedNotes && (
              <span className="text-xs bg-primary-50 border border-primary-100 text-primary-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ClipboardList size={11} strokeWidth={1.8} className="shrink-0" />Notas compartidas
              </span>
            )}
            {hasReview && (
              <span className="text-xs bg-amber-50 border border-amber-100 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star size={11} strokeWidth={1.8} className="shrink-0" />{review.rating}/5
              </span>
            )}
          </div>
        </div>

        <span className={cn(
          'shrink-0 text-warm-300 text-lg transition-transform duration-200 mt-1',
          expanded && 'rotate-180'
        )}>▾</span>
      </button>

      {/* Detalle expandido */}
      {expanded && (
        <div className="border-t border-warm-50 px-5 py-5 flex flex-col gap-5 animate-fade-in">

          {/* Especialidad del terapeuta */}
          {session.therapist?.therapist_profiles?.[0]?.specialty && (
            <p className="text-xs text-warm-500 flex items-center gap-1">
              <Stethoscope size={12} strokeWidth={1.8} className="shrink-0" />{session.therapist.therapist_profiles[0].specialty}
            </p>
          )}

          {/* Notas liberadas por el terapeuta */}
          {hasReleasedNotes && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide flex items-center gap-1">
                <ClipboardList size={12} strokeWidth={1.8} className="shrink-0" />Resumen compartido por tu terapeuta
              </p>
              {session.clinical_history.map((note) => (
                <div key={note.id} className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex flex-col gap-2">
                  {note.released_notes && (
                    <div>
                      <p className="text-xs font-semibold text-primary-700 mb-1">Resumen de la sesión</p>
                      <p className="text-sm text-primary-800 leading-relaxed whitespace-pre-line">{note.released_notes}</p>
                    </div>
                  )}
                  {!note.released_notes && note.session_notes && (
                    <div>
                      <p className="text-xs font-semibold text-primary-700 mb-1">Notas de sesión</p>
                      <p className="text-sm text-primary-800 leading-relaxed whitespace-pre-line">{note.session_notes}</p>
                    </div>
                  )}
                  {note.treatment_plan && (
                    <div className="pt-2 border-t border-primary-100">
                      <p className="text-xs font-semibold text-primary-700 mb-1">Plan de trabajo</p>
                      <p className="text-sm text-primary-800 leading-relaxed">{note.treatment_plan}</p>
                    </div>
                  )}
                  {note.risk_level && note.risk_level !== 'low' && RISK_LABEL[note.risk_level] && (
                    <span className={cn('text-xs font-medium px-2 py-1 rounded-lg border self-start', RISK_COLOR[note.risk_level])}>
                      {RISK_LABEL[note.risk_level]}
                    </span>
                  )}
                  <p className="text-[10px] text-primary-400 mt-1">
                    Compartido por {note.therapist?.full_name} · {new Date(note.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Reseña del paciente */}
          {hasReview && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1"><Star size={12} strokeWidth={1.8} className="shrink-0" />Tu reseña</p>
              <StarDisplay rating={review.rating} />
              {review.comment && (
                <p className="text-sm text-amber-800 mt-2 leading-relaxed">{review.comment}</p>
              )}
            </div>
          )}

          {/* Retroalimentación del paciente */}
          <div>
            <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Pencil size={12} strokeWidth={1.8} className="shrink-0" />Mi reflexión sobre esta sesión
            </p>

            {session.patient_feedback && !editingFB ? (
              <div className="bg-warm-50 border border-warm-100 rounded-xl p-4">
                <p className="text-sm text-warm-700 leading-relaxed whitespace-pre-line">
                  {session.patient_feedback}
                </p>
                <button
                  onClick={() => setEditingFB(true)}
                  className="text-xs text-primary-500 hover:text-primary-700 mt-2 transition-colors"
                >
                  Editar reflexión
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="¿Qué fue lo más importante de esta sesión? ¿Qué aprendiste sobre ti? ¿Qué quieres recordar?"
                  className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 placeholder:text-warm-400 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 resize-none transition-all leading-relaxed"
                />
                <div className="flex gap-2">
                  {editingFB && (
                    <button
                      onClick={() => { setFeedback(session.patient_feedback ?? ''); setEditingFB(false) }}
                      className="px-3 py-1.5 text-xs text-warm-500 border border-warm-200 rounded-lg hover:bg-warm-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <Button
                    onClick={handleSaveFeedback}
                    loading={saving}
                    size="sm"
                    disabled={!feedback.trim()}
                  >
                    Guardar reflexión
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sin notas ni reflexión — mensaje motivador */}
          {!hasReleasedNotes && !hasReview && !session.patient_feedback && !editingFB && (
            <div className="text-center py-2 text-warm-400">
              <p className="text-xs">Tu terapeuta aún no ha compartido notas de esta sesión.</p>
              <p className="text-xs mt-0.5">Puedes escribir tu propia reflexión arriba.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SessionHistoryPage() {
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [stats, setStats]       = useState({ total: 0, withNotes: 0, totalMinutes: 0 })

  useEffect(() => { if (user) fetchSessions() }, [user])

  const fetchSessions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id, scheduled_at, duration, status, price,
        patient_feedback, patient_feedback_at,
        therapist:profiles!sessions_therapist_id_fkey(
          id, full_name, avatar_url,
          therapist_profiles(specialty)
        ),
        clinical_history(
          id, session_notes, treatment_plan, released_notes, risk_level, created_at, is_released,
          therapist:profiles!clinical_history_therapist_id_fkey(full_name)
        ),
        reviews(id, rating, comment)
      `)
      .eq('patient_id', user.id)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })

    if (error) {
      console.error(error)
      toast.error('No se pudo cargar el historial')
      setLoading(false)
      return
    }

    const list = (data ?? []).map(s => ({
      ...s,
      // Filtrar: solo mostrar notas clínicas marcadas como liberadas
      clinical_history: (s.clinical_history ?? []).filter(h => h.is_released),
    }))

    setSessions(list)
    setStats({
      total:        list.length,
      withNotes:    list.filter(s => s.clinical_history?.length > 0).length,
      totalMinutes: list.reduce((acc, s) => acc + (s.duration ?? 60), 0),
    })
    setLoading(false)
  }

  const handleSaveFeedback = async (sessionId, text) => {
    const { error } = await supabase
      .from('sessions')
      .update({ patient_feedback: text, patient_feedback_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('patient_id', user.id)

    if (error) {
      toast.error('No se pudo guardar')
      return
    }
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, patient_feedback: text } : s
    ))
    toast.success('Reflexión guardada')
  }

  const totalHours = Math.round(stats.totalMinutes / 60)

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-8">

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-warm-900">Historial de Sesiones</h1>
        <p className="text-warm-500 text-sm mt-1">Tu recorrido terapéutico</p>
      </div>

      {/* Estadísticas */}
      {!loading && sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-warm-100 shadow-card p-4 text-center">
            <p className="text-2xl font-bold text-warm-900">{stats.total}</p>
            <p className="text-xs text-warm-500 mt-0.5">sesiones</p>
          </div>
          <div className="bg-white rounded-2xl border border-warm-100 shadow-card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{totalHours}</p>
            <p className="text-xs text-warm-500 mt-0.5">horas en terapia</p>
          </div>
          <div className="bg-white rounded-2xl border border-warm-100 shadow-card p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.withNotes}</p>
            <p className="text-xs text-warm-500 mt-0.5">notas compartidas</p>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <CalendarDays size={48} strokeWidth={1.5} className="mx-auto mb-3 text-warm-300" />
          <p className="font-medium text-warm-600">Aún no tienes sesiones completadas</p>
          <p className="text-sm mt-1 text-warm-400 mb-5">
            Aquí verás el resumen de cada sesión terminada
          </p>
          <Button size="sm" onClick={() => navigate('/patient/find')}>
            Buscar un terapeuta
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onSaveFeedback={handleSaveFeedback}
            />
          ))}
        </div>
      )}

      {/* Nota de privacidad */}
      {!loading && sessions.length > 0 && (
        <p className="text-xs text-warm-400 text-center mt-6">
          <Lock size={12} strokeWidth={1.8} className="inline mr-1" />Solo ves las notas que tu terapeuta decidió compartir contigo.
          Tu retroalimentación es privada.
        </p>
      )}
    </div>
  )
}
