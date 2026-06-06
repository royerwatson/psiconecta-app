import { Link } from 'react-router-dom'
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
} from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import SEOHead from './SEOHead'

/* ─── Testimonios (placeholder — conectar a tabla `reviews`) ─── */
const TESTIMONIALS = [
  {
    id: 1,
    name: 'María G.',
    role: 'Paciente',
    rating: 5,
    text: 'Encontré a mi terapeuta en menos de 10 minutos. La videollamada fue fluida y el proceso de pago súper fácil. No imaginé que la terapia online podía sentirse tan cercana.',
  },
  {
    id: 2,
    name: 'Dr. Carlos M.',
    role: 'Terapeuta verificado',
    rating: 5,
    text: 'La plataforma me da todas las herramientas que necesito: tests, escalas clínicas, protocolos. Mis pacientes llegan mejor preparados y yo puedo enfocarme en el trabajo terapéutico.',
  },
  {
    id: 3,
    name: 'Sofía R.',
    role: 'Paciente',
    rating: 5,
    text: 'El modo anónimo me dio la confianza para dar el primer paso. Nadie en mi entorno sabe que voy a terapia, y eso fue clave para decidirme.',
  },
]

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Terapeutas verificados',
    desc: 'Cada terapeuta presenta título profesional, exequátur y acreditación del Colegio Psicológico antes de atender pacientes.',
  },
  {
    icon: Video,
    title: 'Videollamadas seguras',
    desc: 'Sesiones cifradas, accesibles desde cualquier dispositivo sin instalar nada.',
  },
  {
    icon: BrainCircuit,
    title: 'Check-in diario con IA',
    desc: 'Monitoreo continuo de tu estado emocional. Si detectamos señales de alerta, tu terapeuta es notificado de inmediato.',
  },
  {
    icon: EyeOff,
    title: 'Modo anónimo',
    desc: 'Inicia tu proceso terapéutico de forma anónima. Tu terapeuta solo verá tus iniciales hasta que decidas compartir más.',
  },
  {
    icon: CreditCard,
    title: 'Pagos seguros',
    desc: 'Cada sesión se procesa vía PayPal. Reembolso hasta el 100 % si cancelas con más de 24 horas de anticipación.',
  },
  {
    icon: CalendarCheck,
    title: 'Agenda flexible',
    desc: 'Reserva, cambia o cancela citas desde tu panel. Citas urgentes disponibles en menos de 24 horas.',
  },
]

const STEPS = [
  { number: '01', icon: UserCheck, title: 'Crea tu cuenta', desc: 'Regístrate gratis en minutos con email o Google.' },
  { number: '02', icon: Search, title: 'Encuentra tu terapeuta', desc: 'Filtra por especialidad, precio o disponibilidad. Consulta perfiles y reseñas.' },
  { number: '03', icon: CreditCard, title: 'Agenda y paga', desc: 'Selecciona el horario y completa el pago seguro vía PayPal.' },
  { number: '04', icon: Video, title: 'Comienza tu terapia', desc: 'Entra a la videollamada desde el navegador, sin apps adicionales.' },
]

const THERAPIST_TOOLS = [
  { icon: ClipboardList, label: '45+ tests psicométricos con scoring automático' },
  { icon: BookOpen, label: 'DSM-5-TR y CIE-11 en español' },
  { icon: HeartPulse, label: 'Escalas clínicas validadas (PHQ-9, GAD-7, AUDIT, PCL-5)' },
  { icon: Users, label: 'Terapia grupal multi-participante' },
  { icon: BrainCircuit, label: 'Alertas de riesgo IA en tiempo real' },
  { icon: ShieldCheck, label: 'Protocolos TCC, DBT, ACT, EMDR' },
]

/* ─────────────────────────────────────────────
   Página principal
───────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <SEOHead />

      <div className="min-h-screen bg-white text-slate-800">

        {/* ── NAVBAR ─────────────────────────────── */}
        <header className="fixed top-0 inset-x-0 z-50 glass border-b border-white/60">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center shadow-sm">
                <PsiconectaLogo size={22} color="white" />
              </div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                Psico<span className="text-primary-600">necta</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
              <a href="#beneficios" className="hover:text-primary-600 transition-colors">Beneficios</a>
              <a href="#como-funciona" className="hover:text-primary-600 transition-colors">Cómo funciona</a>
              <a href="#terapeutas" className="hover:text-primary-600 transition-colors">Para terapeutas</a>
              <Link to="/pricing" className="hover:text-primary-600 transition-colors">Planes</Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="btn-premium btn-primary-premium text-sm px-4 py-2"
              >
                Comenzar gratis
                <ChevronRight size={15} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </header>

        {/* ── HERO ───────────────────────────────── */}
        <section className="pt-32 pb-24 px-4 bg-psiconecta">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold mb-6">
              <ShieldCheck size={13} strokeWidth={2} />
              Terapeutas verificados en RD y Latinoamérica
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Tu bienestar mental,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-brand">
                accesible desde donde estés
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Conecta con psicólogos y terapeutas verificados. Agenda sesiones de
              videollamada, recibe seguimiento continuo con IA y empieza tu proceso
              hoy — de forma anónima si lo prefieres.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="btn-premium btn-primary-premium w-full sm:w-auto text-base px-8 py-3.5"
              >
                Encuentra tu terapeuta
                <ArrowRight size={18} strokeWidth={1.8} />
              </Link>
              <Link
                to="/register?role=therapist"
                className="btn-premium btn-secondary-premium w-full sm:w-auto text-base px-8 py-3.5"
              >
                Soy terapeuta
              </Link>
            </div>

            <p className="mt-7 text-sm text-slate-400 font-medium">
              Sin tarjeta de crédito · Registro gratuito · Cancela cuando quieras
            </p>
          </div>
        </section>

        {/* ── BENEFICIOS ─────────────────────────── */}
        <section id="beneficios" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              tag="Por qué Psiconecta"
              title="Todo lo que necesitas para cuidar tu salud mental"
              subtitle="Una plataforma diseñada con el paciente en el centro, respaldada por profesionales verificados."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card p-6 hover:shadow-lg transition-shadow group">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors mb-4">
                    <Icon size={20} strokeWidth={1.8} className="text-primary-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 text-base">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ──────────────────────── */}
        <section id="como-funciona" className="py-20 px-4 bg-psiconecta">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              tag="El proceso"
              title="Empieza en cuatro pasos simples"
              subtitle="Desde el registro hasta tu primera sesión, todo está diseñado para ser rápido y sin fricciones."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12 relative">
              <div className="hidden lg:block absolute top-10 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-primary-100 z-0" />

              {STEPS.map(({ number, icon: Icon, title, desc }) => (
                <div key={number} className="relative z-10 flex flex-col items-center text-center card p-6">
                  <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary-50 mb-3">
                    <Icon size={22} strokeWidth={1.8} className="text-primary-600" />
                  </div>
                  <span className="text-xs font-bold text-primary-400 tracking-widest mb-1">{number}</span>
                  <h3 className="font-bold text-slate-900 mb-2 text-sm">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/register"
                className="btn-premium btn-primary-premium text-base px-8 py-3.5"
              >
                Crear mi cuenta gratis
                <ArrowRight size={18} strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIOS ────────────────────────── */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              tag="Testimonios"
              title="Lo que dicen quienes ya dan el paso"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
              {TESTIMONIALS.map(({ id, name, role, rating, text }) => (
                <div key={id} className="card p-6">
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} size={14} strokeWidth={0} className="fill-accent-400 text-accent-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-5">"{text}"</p>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PARA TERAPEUTAS ────────────────────── */}
        <section id="terapeutas" className="py-20 px-4 bg-psiconecta">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1.5 rounded-full bg-accent-100 text-accent-700 text-xs font-semibold mb-4">
                  Para profesionales
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                  Todo lo que un terapeuta necesita, en un solo lugar
                </h2>
                <p className="text-slate-500 leading-relaxed mb-8 font-medium">
                  Publica tu perfil, gestiona tu agenda y accede a herramientas clínicas avanzadas.
                  El plan gratuito incluye lo esencial; el plan Pro desbloquea el conjunto completo.
                </p>

                <ul className="space-y-3 mb-8">
                  {THERAPIST_TOOLS.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                      <Icon size={16} strokeWidth={1.8} className="text-primary-500 shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/register?role=therapist"
                    className="btn-premium btn-primary-premium text-sm px-6 py-3"
                  >
                    Registrarme como terapeuta
                    <ArrowRight size={16} strokeWidth={1.8} />
                  </Link>
                  <Link
                    to="/pricing"
                    className="btn-premium btn-secondary-premium text-sm px-6 py-3"
                  >
                    Ver planes y precios
                  </Link>
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <PlanCard
                  name="Plan Gratuito"
                  price="$0/mes"
                  features={[
                    'Perfil público verificado',
                    'Gestión de agenda',
                    'Videollamadas ilimitadas',
                    'Chat con pacientes',
                    'Comisión del 10 % por sesión',
                  ]}
                />
                <div className="border-t border-dashed border-slate-100" />
                <PlanCard
                  name="Plan Pro"
                  price="$50/mes"
                  highlight
                  features={[
                    'Todo lo del plan gratuito',
                    '45+ tests psicométricos',
                    'DSM-5-TR y CIE-11 en español',
                    'Escalas clínicas con scoring automático',
                    'Protocolos TCC, DBT, ACT, EMDR',
                    'Estadísticas avanzadas de pacientes',
                  ]}
                />
              </div>
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
                Psicoterapia online con terapeutas verificados para toda Latinoamérica.
              </p>
            </div>

            <FooterColumn title="Pacientes" links={[
              { label: 'Cómo funciona', href: '#como-funciona' },
              { label: 'Buscar terapeuta', href: '/register' },
              { label: 'Planes y precios', href: '/pricing' },
              { label: 'Recursos de crisis', href: '/patient/crisis' },
            ]} />

            <FooterColumn title="Terapeutas" links={[
              { label: 'Unirme como terapeuta', href: '/register?role=therapist' },
              { label: 'Plan Pro', href: '/pricing' },
              { label: 'Proceso de verificación', href: '#terapeutas' },
            ]} />

            <FooterColumn title="Legal" links={[
              { label: 'Términos de uso', href: '#' },
              { label: 'Privacidad', href: '#' },
              { label: 'Política de reembolsos', href: '#' },
            ]} />
          </div>

          <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-600">
            <p>© {new Date().getFullYear()} Psiconecta. Todos los derechos reservados.</p>
            <p>Hecho con cuidado para el bienestar mental de Latinoamérica.</p>
          </div>
        </footer>
      </div>
    </>
  )
}

/* ─── Sub-componentes ─────────────────────── */

function SectionHeader({ tag, title, subtitle }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      {tag && (
        <span className="inline-block px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold mb-3">
          {tag}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
        {title}
      </h2>
      {subtitle && <p className="text-slate-500 leading-relaxed font-medium">{subtitle}</p>}
    </div>
  )
}

function PlanCard({ name, price, features, highlight = false }) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? 'bg-primary-50 border border-primary-200' : 'bg-slate-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`font-bold text-sm ${highlight ? 'text-primary-700' : 'text-slate-700'}`}>{name}</span>
        <span className={`font-extrabold text-base ${highlight ? 'text-primary-700' : 'text-slate-900'}`}>{price}</span>
      </div>
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
            <ShieldCheck size={14} strokeWidth={2} className={`mt-0.5 shrink-0 ${highlight ? 'text-primary-500' : 'text-slate-400'}`} />
            {f}
          </li>
        ))}
      </ul>
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
