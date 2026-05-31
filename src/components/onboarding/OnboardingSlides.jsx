import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import { Smile, Search, Calendar, Heart, Brain, ClipboardList, FileText, CheckCircle2 } from 'lucide-react'

// ── Slides por rol ────────────────────────────────────────────────
const PATIENT_SLIDES = [
  {
    Icon:  Smile,
    title: '¡Bienvenido/a a Psiconecta!',
    body:  'Tu espacio seguro para el bienestar mental. Estamos aquí para acompañarte en cada paso de tu proceso terapéutico.',
    color: 'from-primary-600 to-calm-600',
  },
  {
    Icon:  Search,
    title: 'Encuentra a tu terapeuta ideal',
    body:  'Explora perfiles de terapeutas verificados, filtra por especialidad y agenda tu primera sesión en minutos.',
    color: 'from-calm-600 to-primary-500',
  },
  {
    Icon:  Calendar,
    title: 'Gestiona tus citas fácilmente',
    body:  'Visualiza tus próximas sesiones, cambia de terapeuta hasta 48h antes, y únete a la videollamada con un toque.',
    color: 'from-primary-500 to-primary-700',
  },
  {
    Icon:  Heart,
    title: 'Cuida tu bienestar cada día',
    body:  'Registra tu estado de ánimo, completa el check-in diario con IA y accede a tu historial de progreso cuando quieras.',
    color: 'from-primary-700 to-calm-700',
  },
]

const THERAPIST_SLIDES = [
  {
    Icon:  Brain,
    title: '¡Bienvenido/a a Psiconecta!',
    body:  'La plataforma que conecta a los mejores terapeutas con quienes más los necesitan. Nos alegra que formes parte del equipo.',
    color: 'from-primary-600 to-calm-600',
  },
  {
    Icon:  ClipboardList,
    title: 'Tu agenda, en control',
    body:  'Configura tu disponibilidad horaria, visualiza tus próximas sesiones y gestiona tus pacientes desde un solo lugar.',
    color: 'from-calm-600 to-primary-500',
  },
  {
    Icon:  FileText,
    title: 'Historial clínico integrado',
    body:  'Escribe notas durante y después de cada sesión. Cualquier colega puede dar seguimiento al caso si es necesario.',
    color: 'from-primary-500 to-primary-700',
  },
  {
    Icon:  CheckCircle2,
    title: 'Completa tu verificación',
    body:  'Sube tus credenciales profesionales para que tu perfil sea visible a los pacientes. El proceso toma 24–48 horas.',
    color: 'from-primary-700 to-calm-700',
  },
]

const STORAGE_KEY = (userId) => `psiconecta_onboarding_done_${userId}`

export default function OnboardingSlides() {
  const { user, role } = useAuthStore()
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(0)
  const [exiting, setExiting] = useState(false)

  const slides = role === 'therapist' ? THERAPIST_SLIDES : PATIENT_SLIDES

  useEffect(() => {
    if (!user) return
    const done = localStorage.getItem(STORAGE_KEY(user.id))
    if (!done) setVisible(true)
  }, [user])

  const dismiss = () => {
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      if (user) localStorage.setItem(STORAGE_KEY(user.id), '1')
    }, 400)
  }

  const next = () => {
    if (current < slides.length - 1) setCurrent(c => c + 1)
    else dismiss()
  }

  const prev = () => {
    if (current > 0) setCurrent(c => c - 1)
  }

  if (!visible) return null

  const slide = slides[current]
  const isLast = current === slides.length - 1

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-400 ${
      exiting ? 'opacity-0 scale-95' : 'opacity-100'
    }`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Slide header con gradiente */}
        <div className={`bg-gradient-to-br ${slide.color} px-8 pt-10 pb-14 text-center`}>
          <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            {(() => { const SlideIcon = slide.Icon; return <SlideIcon size={36} strokeWidth={1.8} className="text-white" /> })()}
          </div>
          <h2 className="font-serif text-2xl font-bold text-white leading-tight">
            {slide.title}
          </h2>
        </div>

        {/* Cuerpo */}
        <div className="-mt-6 bg-white rounded-t-3xl px-8 pt-6 pb-8">
          <p className="text-warm-600 text-center text-sm leading-relaxed mb-6">
            {slide.body}
          </p>

          {/* Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${
                  i === current ? 'w-6 h-2 bg-primary-600' : 'w-2 h-2 bg-warm-200'
                }`} />
            ))}
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            {current > 0 && (
              <Button variant="outline" onClick={prev} className="flex-1">
                ← Anterior
              </Button>
            )}
            <Button onClick={next} className="flex-1">
              {isLast ? '¡Comenzar!' : 'Siguiente →'}
            </Button>
          </div>

          {/* Saltar */}
          {!isLast && (
            <button onClick={dismiss}
              className="w-full text-center text-xs text-warm-400 hover:text-warm-600 transition-colors mt-4">
              Saltar introducción
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
