import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ShieldCheck,
  Video,
  BrainCircuit,
  EyeOff,
  CreditCard,
  CalendarCheck,
  Search,
  UserCheck,
  Star,
  BookOpen,
  ClipboardList,
  Users,
  HeartPulse,
  ArrowRight,
  ChevronRight,
  Lock,
  RefreshCw,
  MessageCircle,
  ChevronDown,
  BadgeCheck,
  FileText,
  Gift,
  Sparkles,
  BarChart2,
  Moon,
  Briefcase,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { analytics } from '@/lib/analytics'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import SEOHead from './SEOHead'


/* ─── Helpers para reviews ──────────────────── */
const AVATAR_GRADIENTS = [
  'from-primary-400 to-accent-500',
  'from-accent-400 to-primary-600',
  'from-primary-500 to-accent-400',
  'from-accent-500 to-primary-400',
  'from-primary-300 to-accent-600',
]

function getDisplayName(fullName) {
  if (!fullName) return 'Paciente anónimo'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0]}.`
}

function getInitials(fullName) {
  if (!fullName) return 'PA'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/* ─── Hook: número animado con RAF ─────────── */
function useAnimatedNumber(target, decimals = 1, duration = 600) {
  const [display, setDisplay] = useState(target)
  const rafRef  = useRef(null)
  const fromRef = useRef(target)
  const startRef = useRef(null)

  useEffect(() => {
    const from = fromRef.current
    const to   = target
    if (from === to) return
    cancelAnimationFrame(rafRef.current)
    startRef.current = null

    rafRef.current = requestAnimationFrame(function tick(now) {
      if (!startRef.current) startRef.current = now
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out-cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const value = from + (to - from) * ease
      setDisplay(parseFloat(value.toFixed(decimals)))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      else { fromRef.current = to; setDisplay(to) }
    })
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, decimals])

  return display
}

/* ─── Calculadora de tiempo para pacientes ─── */
function PatientTimeCalc() {
  const [sessions, setSessions] = useState(4)

  const travel   = parseFloat((sessions * 60  / 60).toFixed(1))
  const coord    = parseFloat((sessions * 20  / 60).toFixed(1))
  const search   = 3.0
  const reminder = parseFloat((sessions * 10  / 60).toFixed(1))
  const total    = parseFloat((travel + coord + search + reminder).toFixed(1))
  const days     = Math.round(total * 12 / 8)

  const animTotal = useAnimatedNumber(total)
  const animDays  = useAnimatedNumber(days, 0)

  const items = [
    { label: 'Traslados eliminados',        val: travel,   grad: 'from-violet-500 to-primary-500' },
    { label: 'Coordinación de horarios',    val: coord,    grad: 'from-primary-500 to-cyan-500' },
    { label: 'Búsqueda del terapeuta',      val: search,   grad: 'from-cyan-500 to-teal-400' },
    { label: 'Recordatorios y seguimiento', val: reminder, grad: 'from-teal-400 to-emerald-400' },
  ]
  const maxVal = Math.max(...items.map(i => i.val), 0.1)

  return (
    <section className="relative py-28 px-4 overflow-hidden bg-psiconecta">
      {/* Ambient glows sutiles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08), transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.06), transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1.5 rounded-full bg-accent-100 text-accent-700 text-xs font-semibold mb-4">
            Para pacientes
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
            Recupera el tiempo que<br/>la terapia presencial te roba
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
            Traslados, llamadas, esperas. Con Psiconecta, todo eso desaparece.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">

          {/* Left — slider + breakdown */}
          <div className="rounded-[28px] p-8 flex flex-col gap-8 bg-white shadow-sm border border-slate-100">

            {/* Slider control */}
            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Sesiones por mes</p>
                  <p className="text-slate-900 font-black leading-none" style={{ fontSize: '72px', lineHeight: 1 }}>
                    {sessions}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs mb-1">Rango recomendado</p>
                  <p className="text-slate-600 text-sm font-medium">2 – 8 sesiones</p>
                </div>
              </div>

              <style>{`
                .calc-slider-patient {
                  -webkit-appearance: none; appearance: none;
                  width: 100%; height: 6px; border-radius: 9999px; outline: none; cursor: pointer;
                  background: linear-gradient(to right, #7c3aed ${((sessions-1)/11)*100}%, #e2e8f0 ${((sessions-1)/11)*100}%);
                  transition: background 0.2s;
                }
                .calc-slider-patient::-webkit-slider-thumb {
                  -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%;
                  background: #7c3aed; box-shadow: 0 0 0 4px rgba(124,58,237,0.15), 0 4px 12px rgba(124,58,237,0.4);
                  transition: transform 0.15s, box-shadow 0.15s;
                }
                .calc-slider-patient::-webkit-slider-thumb:hover {
                  transform: scale(1.15); box-shadow: 0 0 0 6px rgba(124,58,237,0.15), 0 6px 20px rgba(124,58,237,0.5);
                }
                .calc-slider-patient::-moz-range-thumb {
                  width: 24px; height: 24px; border-radius: 50%; border: none;
                  background: #7c3aed; box-shadow: 0 0 0 4px rgba(124,58,237,0.15);
                }
              `}</style>
              <input type="range" min={1} max={12} value={sessions}
                onChange={e => setSessions(Number(e.target.value))}
                className="calc-slider-patient mb-1"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>1</span><span>12</span>
              </div>
            </div>

            {/* Breakdown bars */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-5">Tiempo eliminado al mes</p>
              <div className="space-y-5">
                {items.map((item, i) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600 text-sm">{item.label}</span>
                      <span className="text-slate-900 text-sm font-bold tabular-nums">
                        {item.val.toFixed(1)} h/mes
                      </span>
                    </div>
                    <div className="h-[5px] rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${item.grad}`}
                        style={{
                          width: `${(item.val / maxVal) * 100}%`,
                          transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          transitionDelay: `${i * 60}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — result card (mantiene gradiente violeta premium) */}
          <div className="rounded-[28px] p-8 flex flex-col justify-between relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4f1fc4 0%, #7c3aed 45%, #0ea5e9 100%)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />

            <div className="relative">
              <p className="text-violet-200 text-xs font-semibold uppercase tracking-widest mb-6">Tiempo que recuperas</p>

              <div className="mb-6">
                <div className="flex items-end gap-3">
                  <span className="text-white font-black tabular-nums" style={{ fontSize: '88px', lineHeight: 1 }}>
                    {animTotal}
                  </span>
                  <span className="text-violet-200 text-xl font-medium mb-3">h</span>
                </div>
                <p className="text-violet-200 text-base font-medium mt-1">al mes</p>
              </div>

              <div className="rounded-2xl px-5 py-4 mb-8"
                style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-white font-black text-4xl tabular-nums mb-1">{animDays}</p>
                <p className="text-violet-200 text-sm">días al año devueltos a tu vida</p>
              </div>
            </div>

            <div className="relative space-y-3">
              {[
                'Sesiones desde tu navegador, sin apps extra',
                'Terapeuta ideal asignado por IA en minutos',
                'Recordatorios automáticos y reagendas',
                'Historial clínico y tareas en un solo lugar',
              ].map(t => (
                <div key={t} className="flex items-start gap-2.5 text-sm text-white/80">
                  <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Calculadora de tiempo para terapeutas ── */
function TherapistTimeCalc() {
  const [patients, setPatients] = useState(20)

  const agenda   = parseFloat((patients * 0.55).toFixed(1))
  const billing  = parseFloat((patients * 0.30).toFixed(1))
  const tasks    = parseFloat((patients * 0.40).toFixed(1))
  const unique   = parseFloat((patients * 0.65).toFixed(1))
  const total    = parseFloat((agenda + billing + tasks + unique).toFixed(1))
  const days     = Math.round(total * 12 / 8)

  const animTotal = useAnimatedNumber(total)
  const animDays  = useAnimatedNumber(days, 0)

  const items = [
    { label: 'Agenda y reagendas',           val: agenda,   dot: '#7c3aed' },
    { label: 'Cobros y facturación',          val: billing,  dot: '#0ea5e9' },
    { label: 'Tareas y seguimiento',          val: tasks,    dot: '#10b981' },
    { label: 'IA · Protocolos · Tests · PDF', val: unique,   dot: '#f59e0b' },
  ]
  const maxVal = Math.max(...items.map(i => i.val), 0.1)

  return (
    <section className="py-28 px-4 relative overflow-hidden bg-psiconecta">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{ backgroundImage: 'radial-gradient(circle, #c4b5fd 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07), transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1.5 rounded-full bg-accent-100 text-accent-700 text-xs font-semibold mb-4">
            Para profesionales
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
            Descubre cuántas horas<br/>devuelves a tus pacientes
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
            El papeleo no debería costarte tiempo clínico. Mueve el control y descubre cuánto puedes recuperar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">

          {/* Left — result */}
          <div className="rounded-[28px] p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(150deg, #1e0050 0%, #3b0d8a 50%, #0f172a 100%)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 70% 10%, rgba(167,139,250,0.2) 0%, transparent 55%)' }} />

            <div className="relative">
              <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-6">Horas recuperadas al mes</p>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-white font-black tabular-nums" style={{ fontSize: '88px', lineHeight: 1 }}>
                  {animTotal}
                </span>
                <span className="text-violet-300 text-2xl font-medium mb-3">h</span>
              </div>
              <p className="text-violet-300 text-base font-medium mb-8">al mes · {patients} pacientes activos</p>

              <div className="rounded-2xl px-5 py-4 mb-6"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-white font-black text-4xl tabular-nums mb-1">{animDays}</p>
                <p className="text-violet-300 text-sm">días al año devueltos a la atención clínica</p>
              </div>

              <p className="text-slate-500 text-xs">* Estimación basada en tiempos promedio reportados por psicólogos en plataformas similares.</p>
            </div>

            <Link to="/register?role=therapist"
              className="relative mt-6 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f1fc4)' }}>
              Empieza gratis como terapeuta
              <ArrowRight size={15} strokeWidth={2} />
            </Link>
          </div>

          {/* Right — slider + breakdown */}
          <div className="rounded-[28px] p-8 bg-white shadow-sm border border-slate-100 flex flex-col gap-8">

            {/* Slider */}
            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Pacientes activos</p>
                  <p className="text-slate-900 font-black leading-none" style={{ fontSize: '72px', lineHeight: 1 }}>
                    {patients}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs mb-1">Promedio en RD</p>
                  <p className="text-slate-600 text-sm font-medium">15 – 25 pacientes</p>
                </div>
              </div>

              <style>{`
                .calc-slider-therapist {
                  -webkit-appearance: none; appearance: none;
                  width: 100%; height: 6px; border-radius: 9999px; outline: none; cursor: pointer;
                  background: linear-gradient(to right, #7c3aed ${((patients-3)/47)*100}%, #e2e8f0 ${((patients-3)/47)*100}%);
                  transition: background 0.2s;
                }
                .calc-slider-therapist::-webkit-slider-thumb {
                  -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%;
                  background: #7c3aed; box-shadow: 0 0 0 4px rgba(124,58,237,0.15), 0 4px 12px rgba(124,58,237,0.4);
                  transition: transform 0.15s, box-shadow 0.15s;
                }
                .calc-slider-therapist::-webkit-slider-thumb:hover {
                  transform: scale(1.15); box-shadow: 0 0 0 6px rgba(124,58,237,0.15), 0 6px 20px rgba(124,58,237,0.5);
                }
                .calc-slider-therapist::-moz-range-thumb {
                  width: 24px; height: 24px; border-radius: 50%; border: none;
                  background: #7c3aed; box-shadow: 0 0 0 4px rgba(124,58,237,0.15);
                }
              `}</style>
              <input type="range" min={3} max={50} value={patients}
                onChange={e => setPatients(Number(e.target.value))}
                className="calc-slider-therapist mb-1"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>3</span><span>50</span>
              </div>
            </div>

            {/* Breakdown */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-5">Lo que Psiconecta automatiza por ti</p>
              <div className="space-y-5">
                {items.map((item, i) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.dot }} />
                        <span className="text-slate-600 text-sm">{item.label}</span>
                      </div>
                      <span className="text-slate-900 text-sm font-bold tabular-nums">
                        {item.val.toFixed(1)} h/mes
                      </span>
                    </div>
                    <div className="h-[5px] rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.val / maxVal) * 100}%`,
                          background: item.dot,
                          transition: 'width 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          transitionDelay: `${i * 60}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Quiz de matching ──────────────────────── */
const QUIZ_QUESTIONS = [
  {
    id: 'reason',
    q: '¿Cuál es el principal motivo por el que buscas apoyo?',
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
      { label: 'Hasta $40 USD',   maxPrice: 40 },
      { label: '$40 – $70 USD',   maxPrice: 70 },
      { label: '$70 – $100 USD',  maxPrice: 100 },
      { label: 'Sin límite',      maxPrice: 9999 },
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

const BENEFITS = [
  { icon: ShieldCheck, title: 'Terapeutas verificados',   desc: 'Cada terapeuta presenta título profesional, exequátur y acreditación del Colegio Psicológico antes de atender pacientes.' },
  { icon: Video,        title: 'Videollamadas seguras',    desc: 'Sesiones cifradas, accesibles desde cualquier dispositivo sin instalar nada.' },
  { icon: BrainCircuit, title: 'Check-in diario con IA',  desc: 'Monitoreo continuo de tu estado emocional. Si detectamos señales de alerta, tu terapeuta es notificado de inmediato.' },
  { icon: EyeOff,       title: 'Modo anónimo',            desc: 'Inicia tu proceso terapéutico de forma anónima. Tu terapeuta solo verá tus iniciales hasta que decidas compartir más.' },
  { icon: CreditCard,   title: 'Pagos seguros',           desc: 'Cada sesión se procesa vía PayPal. Reembolso hasta el 100 % si cancelas con más de 24 horas de anticipación.' },
  { icon: CalendarCheck,title: 'Agenda flexible',         desc: 'Reserva, cambia o cancela citas desde tu panel. Citas urgentes disponibles en menos de 24 horas.' },
]

const STEPS = [
  { number: '01', icon: UserCheck,   title: 'Crea tu cuenta',          desc: 'Regístrate gratis en minutos con email o Google.' },
  { number: '02', icon: Search,      title: 'Encuentra tu terapeuta',  desc: 'Filtra por especialidad, precio o disponibilidad.' },
  { number: '03', icon: CreditCard,  title: 'Agenda y paga',           desc: 'Selecciona el horario y completa el pago seguro vía PayPal.' },
  { number: '04', icon: Video,       title: 'Comienza tu terapia',     desc: 'Entra a la videollamada desde el navegador, sin apps adicionales.' },
]

const THERAPIST_TOOLS = [
  { icon: ClipboardList, label: '45+ tests psicométricos con scoring automático' },
  { icon: BookOpen,      label: 'DSM-5-TR y CIE-11 en español' },
  { icon: HeartPulse,    label: 'Escalas clínicas validadas (PHQ-9, GAD-7, AUDIT, PCL-5)' },
  { icon: Users,         label: 'Terapia grupal multi-participante' },
  { icon: BrainCircuit,  label: 'Alertas de riesgo IA en tiempo real' },
  { icon: ShieldCheck,   label: 'Protocolos TCC, DBT, ACT, EMDR' },
]

/* ─────────────────────────────────────────────
   Página principal
───────────────────────────────────────────── */
export default function LandingPage() {
  const [liveReviews, setLiveReviews] = useState([])
  const [reviewsLoaded, setReviewsLoaded] = useState(false)

  /* Cargar reseñas reales de Supabase */
  useEffect(() => {
    supabase
      .rpc('get_public_reviews', { limit_count: 20 })
      .then(({ data }) => {
        setReviewsLoaded(true)
        if (!data || data.length === 0) return
        // Elegir 3 al azar
        const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 3)
        setLiveReviews(shuffled.map((r, i) => ({
          id: r.id,
          name: r.display_name,
          role: 'Paciente verificado',
          initials: r.initials,
          color: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
          rating: r.rating,
          text: r.comment,
        })))
      })
  }, [])

  /* Revelado en cascada al hacer scroll — lenguaje de animación global */
  useScrollReveal([liveReviews])

  return (
    <>
      <SEOHead />

      <div className="min-h-screen bg-white dark:bg-[#0f1117] text-slate-800 dark:text-slate-200">

        {/* ── NAVBAR ─────────────────────────────── */}
        <header className="fixed top-0 inset-x-0 z-50 glass dark:bg-slate-900/80 border-b border-white/60 dark:border-slate-700/60">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center shadow-sm">
                <PsiconectaLogo size={22} color="white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                Psico<span className="text-primary-600">necta</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
              <a href="#beneficios"    className="hover:text-primary-600 transition-colors">Beneficios</a>
              <a href="#como-funciona" className="hover:text-primary-600 transition-colors">Cómo funciona</a>
              <Link to="/terapeutas"   className="hover:text-primary-600 transition-colors">Terapeutas</Link>
              <Link to="/blog"         className="hover:text-primary-600 transition-colors">Blog</Link>
              <Link to="/pricing"        className="hover:text-primary-600 transition-colors">Planes</Link>
              <Link to="/evaluaciones"   className="hover:text-primary-600 transition-colors">Evaluaciones</Link>
              <Link to="/regalo" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:opacity-90 transition-all shadow-sm shadow-violet-200">
                <Sparkles size={13} strokeWidth={2} />
                Regalar
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
                Iniciar sesión
              </Link>
              <Link to="/register" className="btn-premium btn-primary-premium text-sm px-4 py-2">
                Comenzar gratis
                <ChevronRight size={15} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </header>

        {/* ── HERO: split layout ─────────────────── */}
        <section className="pt-20 min-h-[90vh] flex items-center bg-psiconecta overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16">

            {/* Texto */}
            <div>
              <h1 className="hero-reveal hero-reveal-1 text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-5">
                Ese paso que llevas<br />
                tiempo{' '}
                <span className="text-transparent bg-clip-text bg-gradient-brand">
                  posponiendo.
                </span>
              </h1>

              <p className="hero-reveal hero-reveal-2 text-lg text-slate-500 dark:text-slate-300 mb-3 leading-relaxed font-medium max-w-lg">
                Hablar con alguien de confianza cambia todo.
              </p>
              <p className="hero-reveal hero-reveal-2 text-base text-slate-400 dark:text-slate-400 mb-8 leading-relaxed max-w-lg">
                Conéctate con un psicólogo verificado en República Dominicana.
                Sin salas de espera. Sin estigma. Desde donde estés.
              </p>

              <div className="hero-reveal hero-reveal-3 flex flex-col sm:flex-row gap-3 mb-8">
                <Link to="/register" onClick={() => analytics.clickHeroCTA('patient')} className="btn-premium btn-primary-premium text-base px-7 py-3.5">
                  Comenzar ahora
                  <ArrowRight size={18} strokeWidth={1.8} />
                </Link>
                <Link to="/register?role=therapist" onClick={() => analytics.clickHeroCTA('therapist')} className="btn-premium btn-secondary-premium text-base px-7 py-3.5">
                  Soy terapeuta
                </Link>
              </div>

              {/* Propuesta de valor */}
              <div className="hero-reveal hero-reveal-4 flex flex-wrap items-center gap-3">
                {[
                  { icon: ShieldCheck, label: 'Terapeutas verificados' },
                  { icon: EyeOff,      label: 'Modo anónimo' },
                  { icon: CreditCard,  label: 'Pago seguro vía PayPal' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Icon size={15} strokeWidth={1.8} className="text-primary-500" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup hero */}
            <div className="hero-reveal hero-reveal-5 relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-brand opacity-10 rounded-[60px] blur-3xl" />
              <div className="float-soft">
                <HeroMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ── BENEFICIOS ─────────────────────────── */}
        <section id="beneficios" className="py-20 px-4 dark:bg-[#0f1117]">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              title="Todo lo que necesitas para cuidar tu salud mental"
              subtitle="Una plataforma diseñada con el paciente en el centro, respaldada por profesionales verificados."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="fade-in card p-6 hover:shadow-lg transition-shadow group">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30 group-hover:bg-primary-100 transition-colors mb-4">
                    <Icon size={20} strokeWidth={1.8} className="text-primary-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ──────────────────────── */}
        <section id="como-funciona" className="py-20 px-4 bg-psiconecta">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              title="Empieza en cuatro pasos simples"
              subtitle="Desde el registro hasta tu primera sesión, todo está diseñado para ser rápido y sin fricciones."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12 relative">
              <div className="hidden lg:block absolute top-10 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-primary-100 z-0" />

              {STEPS.map(({ number, icon: Icon, title, desc }) => (
                <div key={number} className="fade-in relative z-10 flex flex-col items-center text-center card p-6">
                  <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/30 mb-3">
                    <Icon size={22} strokeWidth={1.8} className="text-primary-600" />
                  </div>
                  <span className="text-xs font-bold text-primary-400 tracking-widest mb-1">{number}</span>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">{title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link to="/register" className="btn-premium btn-primary-premium text-base px-8 py-3.5">
                Crear mi cuenta gratis
                <ArrowRight size={18} strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── CALCULADORA PACIENTES ──────────────── */}
        <PatientTimeCalc />

        {/* ── TESTIMONIOS ──────────────────────────
            Solo se muestra si hay reseñas reales: una sección de
            esqueletos eternos comunica "plataforma vacía". */}
        {(!reviewsLoaded || liveReviews.length > 0) && (
        <section className="py-20 px-4 dark:bg-[#0f1117]">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              title="Lo que dicen quienes ya dan el paso"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
              {liveReviews.length > 0
                ? liveReviews.map(({ id, name, role, initials, color, rating, text }) => (
                    <div key={id} className="fade-in card p-6">
                      <div className="flex items-center gap-0.5 mb-4">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star key={i} size={14} strokeWidth={0} className="fill-accent-400 text-accent-400" />
                        ))}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-5">"{text}"</p>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                          <span className="text-white font-bold text-xs">{initials}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{role}</p>
                        </div>
                      </div>
                    </div>
                  ))
                : Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="card p-6 animate-pulse">
                      <div className="flex gap-0.5 mb-4">
                        {Array.from({ length: 5 }).map((__, j) => (
                          <div key={j} className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                        ))}
                      </div>
                      <div className="space-y-2 mb-5">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-full" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-4/5" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-24" />
                          <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </section>
        )}

        {/* ── PARA TERAPEUTAS ────────────────────── */}
        <section id="terapeutas" className="py-20 px-4 bg-psiconecta">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Mockup terapeutas */}
              <div className="relative hidden lg:block order-last lg:order-first">
                <div className="absolute -inset-4 bg-accent-200 opacity-20 rounded-[60px] blur-3xl" />
                <TherapistMockup />
              </div>

              {/* Texto + planes */}
              <div>
                <span className="inline-block px-3 py-1.5 rounded-full bg-accent-100 text-accent-700 text-xs font-semibold mb-4">
                  Para profesionales
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
                  Todo lo que un terapeuta necesita, en un solo lugar
                </h2>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8 font-medium">
                  Publica tu perfil, gestiona tu agenda y accede a herramientas clínicas avanzadas.
                  El plan gratuito incluye lo esencial; el plan Pro desbloquea el conjunto completo.
                </p>

                <ul className="space-y-3 mb-8">
                  {THERAPIST_TOOLS.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                      <Icon size={16} strokeWidth={1.8} className="text-primary-500 shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>

                <div className="card p-5 mb-6 space-y-4">
                  <PlanCard
                    name="Plan Gratuito"
                    price="$0/mes"
                    features={['Perfil público verificado', 'Gestión de agenda', 'Videollamadas ilimitadas', 'Chat con pacientes', 'Comisión del 20 % por sesión']}
                  />
                  <div className="border-t border-dashed border-slate-100" />
                  <PlanCard
                    name="Plan Pro"
                    price="$79.99/mes"
                    highlight
                    features={['Todo lo del plan gratuito', 'Comisión del 10 % por sesión', '45+ tests psicométricos', 'DSM-5-TR y CIE-11 en español', 'Escalas clínicas con scoring automático', 'Protocolos TCC, DBT, ACT, EMDR', 'Estadísticas avanzadas', 'Exporta el expediente clínico completo en PDF', 'Análisis clínico longitudinal inteligente', 'Acompañamiento 1:1 con coordinador clínico']}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/register?role=therapist" className="btn-premium btn-primary-premium text-sm px-6 py-3">
                    Registrarme como terapeuta
                    <ArrowRight size={16} strokeWidth={1.8} />
                  </Link>
                  <Link to="/pricing" className="btn-premium btn-secondary-premium text-sm px-6 py-3">
                    Ver planes y precios
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CALCULADORA TERAPEUTAS ─────────────── */}
        <TherapistTimeCalc />

        {/* ── QUIZ DE MATCHING ───────────────────── */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <MatchingQuiz />
          </div>
        </section>

        {/* ── CONFIANZA Y SEGURIDAD ──────────────── */}
        <section className="py-16 px-4 border-t border-slate-100 dark:border-slate-800 dark:bg-[#0f1117]">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8">
              Tu privacidad y seguridad, garantizadas
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Lock,        title: 'Cifrado extremo a extremo', desc: 'Todas las sesiones y mensajes viajan cifrados. Nadie más puede acceder.' },
                { icon: EyeOff,      title: 'Modo anónimo disponible',   desc: 'Tu terapeuta solo ve tus iniciales hasta que decidas identificarte.' },
                { icon: RefreshCw,   title: 'Cancela cuando quieras',    desc: 'Sin permanencia ni penalizaciones. Política de reembolso clara.' },
                { icon: BadgeCheck,  title: 'Terapeutas verificados',    desc: 'Título, exequátur y Colegio Psicológico revisados por nuestro equipo.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="fade-in flex flex-col items-center text-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 mb-3 shadow-sm">
                    <Icon size={18} strokeWidth={1.8} className="text-primary-600" />
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">{title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────── */}
        <section className="py-20 px-4 bg-psiconecta">
          <div className="max-w-3xl mx-auto">
            <SectionHeader
              title="Preguntas frecuentes"
              subtitle="Resolvemos las dudas más comunes antes de que empieces."
            />
            <div className="mt-10 space-y-2">
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
            <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
              ¿Tienes otra pregunta?{' '}
              <a href="mailto:hola@psiconecta.app" className="text-primary-600 font-semibold hover:underline">
                Escríbenos
              </a>
            </p>
          </div>
        </section>

        {/* ── EVALUACIONES — teaser compacto ─────── */}
        <section className="py-16 px-4 dark:bg-[#0f1117]">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-3xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border border-primary-100 dark:border-primary-800 p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-semibold mb-3">
                  <Sparkles size={12} strokeWidth={2} /> Nuevo
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                  Evaluaciones psicométricas con reporte IA
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Ansiedad, depresión, burnout, sueño y más. Test gratuito · Reporte completo desde <strong className="text-primary-600">$4.99</strong>.
                </p>
              </div>
              <Link to="/evaluaciones" className="btn-premium btn-primary-premium text-sm px-6 py-3 shrink-0">
                Ver evaluaciones
                <ArrowRight size={16} strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────── */}
        <section className="py-24 px-4 bg-gradient-brand">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Da el primer paso hoy
            </h2>
            <p className="text-indigo-100 text-lg mb-10 leading-relaxed font-medium">
              Crear tu cuenta es gratuito. En minutos puedes conectar con un terapeuta verificado
              y comenzar tu proceso de bienestar mental.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-[14px] hover:bg-primary-50 transition-colors text-base"
              >
                Soy paciente — comenzar gratis
                <ArrowRight size={18} strokeWidth={2} />
              </Link>
              <Link
                to="/register?role=therapist"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/40 hover:border-white/70 text-white font-bold rounded-[14px] transition-colors text-base"
              >
                Soy terapeuta
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────── */}
        <footer className="py-12 px-4 bg-slate-900 text-slate-400 text-sm">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-gradient-brand rounded-xl flex items-center justify-center">
                  <PsiconectaLogo size={18} color="white" />
                </div>
                <span className="font-bold text-white text-sm">
                  Psico<span className="text-primary-400">necta</span>
                </span>
              </div>
              <p className="leading-relaxed text-slate-500 text-xs">
                Psicoterapia online con terapeutas verificados en República Dominicana.
              </p>
            </div>

            <FooterColumn title="Pacientes" links={[
              { label: 'Cómo funciona',             href: '#como-funciona' },
              { label: 'Evaluaciones con reporte',  href: '#evaluaciones' },
              { label: 'Ver terapeutas',            href: '/terapeutas' },
              { label: 'Blog de salud mental',      href: '/blog' },
              { label: 'Planes y precios',          href: '/pricing' },
              { label: 'Regalar sesiones',          href: '/regalo' },
              { label: 'Recursos de crisis',        href: '/patient/crisis' },
            ]} />

            <FooterColumn title="Terapeutas" links={[
              { label: 'Unirme como terapeuta',    href: '/register?role=therapist' },
              { label: 'Plan Pro',                 href: '/pricing' },
              { label: 'Proceso de verificación',  href: '#terapeutas' },
            ]} />

            <FooterColumn title="Legal" links={[
              { label: 'Términos de uso',        href: '/terminos' },
              { label: 'Privacidad',             href: '/privacidad' },
              { label: 'Política de reembolsos', href: '/reembolsos' },
            ]} />
          </div>

          <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-600">
            <p>© {new Date().getFullYear()} Psiconecta. Todos los derechos reservados.</p>
            <p>Hecho con cuidado para el bienestar mental de República Dominicana.</p>
          </div>
        </footer>
      </div>
    </>
  )
}

/* ─── Sub-componentes ─────────────────────── */

function MatchingQuiz() {
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState({})

  const handleAnswer = (opt) => {
    const q = QUIZ_QUESTIONS[step]
    const newAnswers = { ...answers, [q.id]: opt }
    setAnswers(newAnswers)
    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(s => s + 1)
    } else {
      sessionStorage.setItem('matchAnswers', JSON.stringify(newAnswers))
      navigate('/register?quiz=1')
    }
  }

  if (!started) {
    return (
      <div className="card-elevated dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-700 p-8 sm:p-12 text-center">
        <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-5">
          <BrainCircuit size={24} strokeWidth={1.8} className="text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          ¿No sabes por dónde empezar?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-xl mx-auto leading-relaxed">
          Responde 4 preguntas y nuestro algoritmo te conecta con los terapeutas
          que mejor se ajustan a lo que necesitas.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { num: '1', label: 'Motivo de consulta' },
            { num: '2', label: 'Presupuesto por sesión' },
            { num: '3', label: 'Urgencia para comenzar' },
            { num: '4', label: 'Preferencia de terapeuta' },
          ].map(({ num, label }) => (
            <div key={num} className="bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 rounded-xl p-3">
              <span className="text-xs font-bold text-primary-400 tracking-widest block mb-1">{num}</span>
              <span className="text-xs font-bold text-primary-800 dark:text-primary-300 leading-tight">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { analytics.clickMatchQuiz(); setStarted(true) }}
          className="btn-premium btn-primary-premium text-base px-8 py-3.5 mx-auto"
        >
          Hacer el test gratis
          <ArrowRight size={18} strokeWidth={1.8} />
        </button>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
          Menos de 2 minutos · Sin compromisos
        </p>
      </div>
    )
  }

  const q = QUIZ_QUESTIONS[step]
  const progress = Math.round(((step) / QUIZ_QUESTIONS.length) * 100)

  return (
    <div className="card-elevated dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-700 p-8 sm:p-12">
      {/* Barra de progreso */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-primary-500 tracking-widest uppercase">
            Pregunta {step + 1} de {QUIZ_QUESTIONS.length}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">{progress}% completado</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-brand rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Pregunta */}
      <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center mb-5">
        <BrainCircuit size={20} strokeWidth={1.8} className="text-white" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 leading-tight">
        {q.q}
      </h2>

      {/* Opciones */}
      <div className={`grid gap-3 ${q.opts.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {q.opts.map((opt) => (
          <button
            key={opt.label}
            onClick={() => handleAnswer(opt)}
            className="group text-left p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-150 active:scale-[0.98]"
          >
            <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary-700 dark:group-hover:text-primary-400 text-sm leading-snug">
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      {step > 0 && (
        <button
          onClick={() => setStep(s => s - 1)}
          className="mt-6 text-xs text-slate-400 dark:text-slate-500 hover:text-primary-600 font-medium flex items-center gap-1 transition-colors"
        >
          ← Volver
        </button>
      )}
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
        {title}
      </h2>
      {subtitle && <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{subtitle}</p>}
    </div>
  )
}

function PlanCard({ name, price, features, highlight = false }) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`font-bold text-sm ${highlight ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>{name}</span>
        <span className={`font-extrabold text-base ${highlight ? 'text-primary-700 dark:text-primary-400' : 'text-slate-900 dark:text-white'}`}>{price}</span>
      </div>
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
            <ShieldCheck size={14} strokeWidth={2} className={`mt-0.5 shrink-0 ${highlight ? 'text-primary-500' : 'text-slate-400 dark:text-slate-500'}`} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── Mockup hero: simula la UI de videollamada ─── */
function HeroMockup() {
  return (
    <div className="relative rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white">
      {/* Barra superior */}
      <div className="bg-slate-900 px-5 py-3 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="ml-4 flex-1 bg-slate-700 rounded-full h-5 px-3 flex items-center">
          <span className="text-slate-400 text-[10px]">psiconecta.app/video-call</span>
        </div>
      </div>

      {/* Área de videollamada */}
      <div className="relative bg-slate-800 h-72 flex items-center justify-center overflow-hidden">
        {/* Fondo gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-800 to-accent-900 opacity-80" />

        {/* Avatar terapeuta (grande) */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-accent-600 flex items-center justify-center shadow-xl ring-4 ring-white/10">
            <span className="text-white font-bold text-2xl">DL</span>
          </div>
          <div className="glass-dark rounded-full px-4 py-1.5">
            <span className="text-white text-xs font-semibold">Dra. Laura Pérez</span>
          </div>
        </div>

        {/* Mini-vista del paciente */}
        <div className="absolute bottom-4 right-4 w-24 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 ring-2 ring-white/20 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">Tú</span>
        </div>

        {/* Barra de controles */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {[Video, Users, HeartPulse].map((Icon, i) => (
            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${i === 0 ? 'bg-red-500' : 'bg-white/20 backdrop-blur'}`}>
              <Icon size={16} strokeWidth={2} className="text-white" />
            </div>
          ))}
        </div>
      </div>

      {/* Panel inferior: info sesión */}
      <div className="bg-white px-5 py-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-900 text-sm">Sesión en progreso</p>
          <p className="text-xs text-slate-400 mt-0.5">Consulta individual · 50 min</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-600">Conectado</span>
        </div>
      </div>

      {/* Badge flotante */}
      <div className="absolute top-16 left-4 glass rounded-2xl px-3 py-2 flex items-center gap-2 shadow-sm">
        <div className="w-7 h-7 bg-gradient-brand rounded-lg flex items-center justify-center">
          <ShieldCheck size={14} strokeWidth={2} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-900 text-[11px]">Terapeuta verificada</p>
          <p className="text-[10px] text-slate-500">Credenciales aprobadas</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Mockup terapeutas: panel clínico ─────────── */
function TherapistMockup() {
  const tools = [
    { icon: ClipboardList, label: 'PHQ-9 — Depresión',      score: '14/27', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: HeartPulse,    label: 'GAD-7 — Ansiedad',       score: '10/21', color: 'text-primary-600', bg: 'bg-primary-50' },
    { icon: BookOpen,      label: 'DSM-5-TR',                score: 'F41.1',  color: 'text-accent-600', bg: 'bg-accent-50' },
    { icon: BrainCircuit,  label: 'Check-in IA',             score: 'Bajo riesgo', color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="relative rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white">
      {/* Header del panel */}
      <div className="bg-gradient-brand px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm">Paciente anónimo</p>
            <p className="text-indigo-200 text-xs">Próxima sesión: hoy, 3:00 PM</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
          <span className="text-white text-xs font-semibold">En línea</span>
        </div>
      </div>

      {/* Herramientas clínicas */}
      <div className="p-5 space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Evaluaciones recientes</p>
        {tools.map(({ icon: Icon, label, score, color, bg }) => (
          <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={15} strokeWidth={1.8} className={color} />
            </div>
            <span className="text-sm text-slate-700 font-medium flex-1">{label}</span>
            <span className={`text-xs font-bold ${color}`}>{score}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <div className="w-full bg-gradient-brand rounded-xl py-3 flex items-center justify-center gap-2">
          <Video size={16} strokeWidth={2} className="text-white" />
          <span className="text-white font-bold text-sm">Iniciar videollamada</span>
        </div>
      </div>
    </div>
  )
}

/* ─── FAQ data ────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: '¿Es confidencial lo que hablo con mi terapeuta?',
    a: 'Sí. Toda la comunicación dentro de Psiconecta — videollamadas, chat y notas — viaja cifrada. Tu terapeuta está sujeto al secreto profesional. Nadie más tiene acceso a tu información.',
  },
  {
    q: '¿Cuánto cuesta una sesión?',
    a: 'Cada terapeuta define su propia tarifa. Puedes filtrar por precio al buscar. El pago se procesa de forma segura vía PayPal antes de cada sesión.',
  },
  {
    q: '¿Puedo usar la plataforma de forma anónima?',
    a: 'Sí. Al activar el modo anónimo en tu perfil, tu terapeuta solo verá tus iniciales y nunca tu nombre completo ni foto, hasta que decidas desactivarlo.',
  },
  {
    q: '¿Qué pasa si necesito cancelar una cita?',
    a: 'Puedes cancelar desde tu panel en cualquier momento. Si lo haces con más de 24 horas de anticipación recibes el 100 % de reembolso; entre 2 y 24 horas, el 50 %. Menos de 2 horas no aplica reembolso.',
  },
  {
    q: '¿Cómo sé que el terapeuta está realmente verificado?',
    a: 'Cada terapeuta sube tres documentos obligatorios: título profesional, exequátur y acreditación del Colegio Psicológico. Nuestro equipo los revisa individualmente antes de activar el perfil.',
  },
  {
    q: '¿Necesito instalar alguna aplicación?',
    a: 'No. Las videollamadas funcionan directamente desde el navegador web en cualquier dispositivo. Tampoco necesitas cuenta de Zoom ni ninguna app externa.',
  },
]

/* ─── FAQ accordion item ───────────────────────── */
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`card overflow-hidden transition-shadow ${open ? 'shadow-md' : ''}`}>
      <button
        onClick={() => { setOpen(!open); if (!open) analytics.openFAQ(question) }}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
        aria-expanded={open}
      >
        <span className="font-bold text-slate-900 dark:text-white text-sm">{question}</span>
        <ChevronDown
          size={18}
          strokeWidth={1.8}
          className={`text-primary-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-3">{answer}</p>
        </div>
      )}
    </div>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="text-white font-semibold mb-3 text-sm">{title}</p>
      <ul className="space-y-2">
        {links.map(({ label, href }) => (
          <li key={label}>
            {href.startsWith('/') ? (
              <Link to={href} className="text-xs hover:text-slate-200 transition-colors">{label}</Link>
            ) : (
              <a href={href} className="text-xs hover:text-slate-200 transition-colors">{label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
