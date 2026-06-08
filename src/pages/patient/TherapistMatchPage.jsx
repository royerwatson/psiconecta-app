/**
 * TherapistMatchPage — Match automático terapeuta-paciente.
 * Ruta: /patient/match
 *
 * Flujo:
 *   1. Cuestionario de 4 preguntas (motivo, preferencia precio, urgencia, especialidad)
 *   2. Algoritmo de scoring sobre los terapeutas verificados
 *   3. Muestra los 3 mejores matches con explicación
 *   4. CTA para agendar con cada uno
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { RatingDisplay } from '@/components/ui/StarRating'
import { VerificationBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Spinner'
import { Sparkles, ChevronRight, Star, ArrowLeft } from 'lucide-react'
import { useCurrencyContext } from '@/context/CurrencyContext'

const QUESTIONS = [
  {
    id: 'reason',
    q: '¿Cuál es el principal motivo por el que buscas apoyo psicológico?',
    opts: [
      { label: 'Ansiedad o estrés',          specialties: ['Psicología cognitivo-conductual', 'Psicología clínica'] },
      { label: 'Depresión o tristeza',        specialties: ['Psicología clínica', 'Psicoanálisis'] },
      { label: 'Problemas de pareja/familia', specialties: ['Terapia familiar y de pareja'] },
      { label: 'Crecimiento personal',        specialties: ['Psicología clínica', 'Psicología cognitivo-conductual'] },
      { label: 'Trauma o duelo',              specialties: ['Psicología clínica', 'Psicoanálisis'] },
      { label: 'Otro / No estoy seguro/a',    specialties: [] },
    ],
  },
  {
    id: 'budget',
    q: '¿Cuál es tu presupuesto por sesión?',
    opts: [
      { label: 'Hasta $40 USD',    maxPrice: 40 },
      { label: '$40 – $70 USD',    maxPrice: 70 },
      { label: '$70 – $100 USD',   maxPrice: 100 },
      { label: 'Sin límite',       maxPrice: 9999 },
    ],
  },
  {
    id: 'urgency',
    q: '¿Con qué urgencia necesitas comenzar?',
    opts: [
      { label: 'Hoy o mañana',              urgency: 3 },
      { label: 'Esta semana',               urgency: 2 },
      { label: 'En las próximas 2 semanas', urgency: 1 },
      { label: 'Sin prisa',                 urgency: 0 },
    ],
  },
  {
    id: 'gender',
    q: '¿Tienes preferencia de género en tu terapeuta?',
    opts: [
      { label: 'Sin preferencia', gender: null },
      { label: 'Mujer',           gender: 'female' },
      { label: 'Hombre',          gender: 'male' },
    ],
  },
]

function scoreTherapist(therapist, answers) {
  let score = 0

  // Especialidad (40 puntos)
  const reasonAns = answers.reason
  if (reasonAns?.specialties?.includes(therapist.specialty)) score += 40

  // Precio (30 puntos)
  const maxPrice = answers.budget?.maxPrice ?? 9999
  if ((therapist.price_per_session ?? 0) <= maxPrice) score += 30

  // Rating (20 puntos)
  score += Math.round((therapist.rating ?? 0) / 5 * 20)

  // Urgencia: terapeutas con citas urgentes disponibles (10 puntos)
  if (answers.urgency?.urgency >= 2 && therapist.available_urgent) score += 10

  return score
}

export default function TherapistMatchPage() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const { formatWithLocal } = useCurrencyContext()
  const [step, setStep]         = useState(0)   // 0-3 preguntas, 4 = resultados
  const [answers, setAnswers]   = useState({})
  const [therapists, setTherapists] = useState([])
  const [matches, setMatches]   = useState([])
  const [loading, setLoading]   = useState(false)

  const currentQ = QUESTIONS[step]

  const handleAnswer = async (opt) => {
    const newAnswers = { ...answers, [currentQ.id]: opt }
    setAnswers(newAnswers)
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1)
    } else {
      // Última pregunta — calcular matches
      await findMatches(newAnswers)
    }
  }

  const findMatches = async (finalAnswers) => {
    setLoading(true)
    setStep(QUESTIONS.length) // paso resultados

    const { data } = await supabase
      .from('therapist_profiles')
      .select(`user_id, specialty, bio, price_per_session, rating, review_count,
          subscription_plan, verified, available_urgent,
          profile:profiles!therapist_profiles_user_id_fkey(id, full_name, avatar_url)`)
      .eq('verified', true)
      .order('rating', { ascending: false })

    const scored = (data ?? [])
      .map(t => ({ ...t, score: scoreTherapist(t, finalAnswers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    setMatches(scored)
    setLoading(false)
  }

  const restart = () => { setStep(0); setAnswers({}); setMatches([]) }

  // ── Render preguntas ──────────────────────────────────────────────────────────
  if (step < QUESTIONS.length) {
    return (
      <div className="flex flex-col gap-6 max-w-lg mx-auto animate-fade-in">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
          className="flex items-center gap-2 text-sm text-warm-500 hover:text-warm-800 transition-colors self-start">
          <ArrowLeft size={16} strokeWidth={1.8} /> {step > 0 ? 'Anterior' : 'Cancelar'}
        </button>

        {/* Progreso */}
        <div className="flex gap-1.5">
          {QUESTIONS.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? 'bg-primary-500' : 'bg-warm-100'}`} />
          ))}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center">
              <Sparkles size={16} className="text-primary-500" strokeWidth={1.8} />
            </div>
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
              Pregunta {step + 1} de {QUESTIONS.length}
            </span>
          </div>
          <h2 className="font-serif text-xl font-bold text-warm-900 leading-snug">
            {currentQ.q}
          </h2>
        </div>

        <div className="flex flex-col gap-2">
          {currentQ.opts.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(opt)}
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-warm-200 bg-white hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all text-left text-sm font-medium text-warm-800 active:scale-[0.98]">
              {opt.label}
              <ChevronRight size={16} strokeWidth={1.8} className="text-warm-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Render resultados ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Tus mejores matches</h1>
          <p className="text-warm-500 text-sm mt-1">Basado en tus respuestas y disponibilidad</p>
        </div>
        <button onClick={restart} className="text-xs text-primary-500 hover:text-primary-700 font-medium transition-colors">
          Volver a empezar
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-36" />)}</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <Sparkles size={40} className="mx-auto mb-3 text-warm-200" strokeWidth={1.5} />
          <p className="font-medium">No encontramos terapeutas disponibles</p>
          <p className="text-sm mt-1">Intenta ajustar tus preferencias</p>
          <Button size="sm" className="mt-4" onClick={restart}>Intentar de nuevo</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {matches.map((t, i) => (
            <div key={t.id} className={`bg-white border rounded-2xl p-5 ${i === 0 ? 'border-primary-300 shadow-sm' : 'border-warm-100'}`}>
              {i === 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary-600 mb-3">
                  <Star size={12} strokeWidth={2} fill="currentColor" /> Mejor match
                </div>
              )}
              <div className="flex items-start gap-4">
                <Avatar name={t.profile?.full_name ?? ''} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-warm-900">{t.profile?.full_name}</p>
                    <VerificationBadge status="verified" />
                  </div>
                  <p className="text-sm text-warm-500 mt-0.5">{t.specialty}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <RatingDisplay rating={t.rating ?? 0} count={t.review_count ?? 0} />
                    <span className="text-sm font-semibold text-warm-700">{formatPrice(t.price_per_session)}/sesión</span>
                  </div>
                  {t.bio && (
                    <p className="text-xs text-warm-500 mt-2 line-clamp-2">{t.bio}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="secondary" fullWidth
                  onClick={() => navigate(`/patient/therapist/${t.user_id}`)}>
                  Ver perfil
                </Button>
                <Button size="sm" fullWidth
                  onClick={() => navigate(`/patient/find`)}>
                  Agendar →
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate('/patient/find')}
        className="text-sm text-warm-400 hover:text-warm-600 transition-colors text-center">
        Ver todos los terapeutas →
      </button>
    </div>
  )
}
