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
  ChevronRight,
  Star,
  BookOpen,
  ClipboardList,
  Users,
  HeartPulse,
  ArrowRight,
} from 'lucide-react'
import SEOHead from './SEOHead'

/* ─────────────────────────────────────────────
   Datos estáticos de testimonios
   (reemplazar por query a tabla `reviews` cuando haya datos reales)
───────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    id: 1,
    name: 'María G.',
    role: 'Paciente',
    rating: 5,
    text:
      'Encontré a mi terapeuta en menos de 10 minutos. La videollamada fue fluida y el proceso de pago súper fácil. No imaginé que la terapia online podía sentirse tan cercana.',
  },
  {
    id: 2,
    name: 'Dr. Carlos M.',
    role: 'Terapeuta verificado',
    rating: 5,
    text:
      'La plataforma me da todas las herramientas que necesito: tests, escalas clínicas, protocolos. Mis pacientes llegan mejor preparados y yo puedo enfocarme en el trabajo terapéutico.',
  },
  {
    id: 3,
    name: 'Sofía R.',
    role: 'Paciente',
    rating: 5,
    text:
      'El modo anónimo me dio la confianza para dar el primer paso. Nadie en mi entorno sabe que voy a terapia, y eso fue clave para decidirme.',
  },
]

/* ─────────────────────────────────────────────
   Beneficios para pacientes
───────────────────────────────────────────── */
const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Terapeutas verificados',
    desc: 'Cada terapeuta presenta título profesional, exequátur y acreditación del Colegio Psicológico antes de atender pacientes.',
  },
  {
    icon: Video,
    title: 'Videollamadas seguras',
    desc: 'Sesiones cifradas vía Daily.co, accesibles desde cualquier dispositivo sin instalar nada.',
  },
  {
    icon: BrainCircuit,
    title: 'Check-in diario con IA',
    desc: 'Monitoreo continuo de tu estado emocional. Si detectamos señales de alerta, tu terapeuta es notificado de inmediato.',
  },
  {
    icon: EyeOff,
    title: 'Modo anónimo',
    desc: 'Puedes iniciar tu proceso terapéutico de forma anónima: tu terapeuta solo verá tus iniciales hasta que decidas compartir más.',
  },
  {
    icon: CreditCard,
    title: 'Pagos seguros',
    desc: 'Procesamos cada sesión vía PayPal. Política de reembolso clara: hasta el 100 % si cancelas con más de 24 horas de anticipación.',
  },
  {
    icon: CalendarCheck,
    title: 'Agenda flexible',
    desc: 'Reserva, cambia o cancela citas desde tu panel. Citas urgentes disponibles en menos de 24 horas.',
  },
]

/* ─────────────────────────────────────────────
   Pasos: cómo funciona
───────────────────────────────────────────── */
const STEPS = [
  {
    number: '01',
    icon: UserCheck,
    title: 'Crea tu cuenta',
    desc: 'Regístrate gratis en minutos. Puedes usar tu cuenta de Google o email.',
  },
  {
    number: '02',
    icon: Search,
    title: 'Encuentra tu terapeuta',
    desc: 'Filtra por especialidad, precio o disponibilidad. Consulta perfiles, reseñas y tarifas.',
  },
  {
    number: '03',
    icon: CreditCard,
    title: 'Agenda y paga',
    desc: 'Selecciona el horario que prefieras y completa el pago seguro vía PayPal.',
  },
  {
    number: '04',
    icon: Video,
    title: 'Comienza tu terapia',
    desc: 'Entra a la videollamada desde el navegador, sin apps adicionales. Tu terapeuta te estará esperando.',
  },
]

/* ─────────────────────────────────────────────
   Herramientas para terapeutas
───────────────────────────────────────────── */
const THERAPIST_TOOLS = [
  { icon: ClipboardList, label: '45+ tests psicométricos' },
  { icon: BookOpen, label: 'DSM-5-TR y CIE-11 en español' },
  { icon: HeartPulse, label: 'Escalas clínicas con scoring' },
  { icon: Users, label: 'Terapia grupal' },
  { icon: BrainCircuit, label: 'Alertas de riesgo IA' },
  { icon: ShieldCheck, label: 'Protocolos TCC, DBT, ACT, EMDR' },
]

/* ─────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <SEOHead />

      <div className="min-h-screen bg-white text-gray-900 font-sans">

        {/* ── NAVBAR ─────────────────────────────── */}
        <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <PsiconectaLogo className="h-8 w-8" />
              <span className="font-semibold text-blue-700 text-lg tracking-tight">Psiconecta</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <a href="#beneficios" className="hover:text-blue-600 transition-colors">Beneficios</a>
              <a href="#como-funciona" className="hover:text-blue-600 transition-colors">Cómo funciona</a>
              <a href="#terapeutas" className="hover:text-blue-600 transition-colors">Para terapeutas</a>
              <Link to="/pricing" className="hover:text-blue-600 transition-colors">Planes</Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Comenzar gratis
                <ChevronRight size={15} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </header>

        {/* ── HERO ───────────────────────────────── */}
        <section className="pt-32 pb-24 px-4 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-6">
              <ShieldCheck size={13} strokeWidth={1.8} />
              Terapeutas verificados en RD y Latinoamérica
            </span>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Tu bienestar mental,<br />
              <span className="text-blue-600">accesible desde donde estés</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Conecta con psicólogos y terapeutas verificados. Agenda sesiones de videollamada,
              recibe seguimiento continuo con IA y empieza tu proceso hoy — de forma anónima si lo prefieres.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-base transition-colors shadow-sm shadow-blue-200"
              >
                Encuentra tu terapeuta
                <ArrowRight size={18} strokeWidth={1.8} />
              </Link>
              <Link
                to="/register?role=therapist"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 font-semibold rounded-xl text-base transition-colors"
              >
                Soy terapeuta
              </Link>
            </div>

            {/* Social proof */}
            <p className="mt-8 text-sm text-gray-400">
              Sin tarjeta de crédito · Primer registro gratuito · Cancela cuando quieras
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors mb-4">
                    <Icon size={20} strokeWidth={1.8} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ──────────────────────── */}
        <section id="como-funciona" className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              tag="El proceso"
              title="Empieza en cuatro pasos simples"
              subtitle="Desde el registro hasta tu primera sesión, todo está diseñado para ser rápido y sin fricciones."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 relative">
              {/* Línea conectora (desktop) */}
              <div className="hidden lg:block absolute top-10 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-blue-100 z-0" />

              {STEPS.map(({ number, icon: Icon, title, desc }) => (
                <div key={number} className="relative z-10 flex flex-col items-center text-center p-6">
                  <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white border border-blue-100 shadow-sm mb-4">
                    <Icon size={24} strokeWidth={1.8} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-blue-400 tracking-widest mb-1">{number}</span>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {TESTIMONIALS.map(({ id, name, role, rating, text }) => (
                <div key={id} className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} size={14} strokeWidth={0} className="fill-blue-400 text-blue-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-5">"{text}"</p>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PARA TERAPEUTAS ────────────────────── */}
        <section id="terapeutas" className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Texto */}
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-4">
                  Para profesionales
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
                  Todo lo que un terapeuta necesita, en un solo lugar
                </h2>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Publica tu perfil, gestiona tu agenda y accede a herramientas clínicas avanzadas.
                  El plan gratuito incluye lo esencial; el plan Pro desbloquea el conjunto completo.
                </p>

                <ul className="space-y-3 mb-8">
                  {THERAPIST_TOOLS.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm text-gray-700">
                      <Icon size={16} strokeWidth={1.8} className="text-blue-500 shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/register?role=therapist"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Registrarme como terapeuta
                    <ArrowRight size={16} strokeWidth={1.8} />
                  </Link>
                  <Link
                    to="/pricing"
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 hover:border-blue-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Ver planes y precios
                  </Link>
                </div>
              </div>

              {/* Card visual */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4">
                <PlanCard
                  name="Plan Gratuito"
                  price="$0"
                  features={[
                    'Perfil público verificado',
                    'Gestión de agenda',
                    'Videollamadas ilimitadas',
                    'Chat con pacientes',
                    'Comisión del 10 % por sesión',
                  ]}
                />
                <div className="border-t border-dashed border-gray-100" />
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
        <section className="py-24 px-4 bg-blue-600">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
              Da el primer paso hoy
            </h2>
            <p className="text-blue-100 text-lg mb-10 leading-relaxed">
              Crear tu cuenta es gratuito. En minutos puedes conectar con un terapeuta verificado
              y comenzar tu proceso de bienestar mental.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
              >
                Soy paciente — comenzar gratis
                <ArrowRight size={18} strokeWidth={1.8} />
              </Link>
              <Link
                to="/register?role=therapist"
                className="inline-flex items-center justify-center px-8 py-4 border border-blue-400 hover:border-white text-white font-semibold rounded-xl transition-colors"
              >
                Soy terapeuta
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────── */}
        <footer className="py-12 px-4 bg-gray-900 text-gray-400 text-sm">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PsiconectaLogo className="h-7 w-7 text-white" />
                <span className="font-semibold text-white">Psiconecta</span>
              </div>
              <p className="leading-relaxed text-gray-500">
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

          <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} Psiconecta. Todos los derechos reservados.</p>
            <p>Hecho con cuidado para el bienestar mental de Latinoamérica.</p>
          </div>
        </footer>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────
   Sub-componentes
───────────────────────────────────────────── */

function SectionHeader({ tag, title, subtitle }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      {tag && (
        <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-3">
          {tag}
        </span>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
        {title}
      </h2>
      {subtitle && <p className="text-gray-500 leading-relaxed">{subtitle}</p>}
    </div>
  )
}

function PlanCard({ name, price, features, highlight = false }) {
  return (
    <div className={`rounded-xl p-5 ${highlight ? 'bg-blue-50 border border-blue-200' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`font-semibold text-sm ${highlight ? 'text-blue-700' : 'text-gray-700'}`}>
          {name}
        </span>
        <span className={`font-bold ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>{price}</span>
      </div>
      <ul className="space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <ShieldCheck size={14} strokeWidth={1.8} className={`mt-0.5 shrink-0 ${highlight ? 'text-blue-500' : 'text-gray-400'}`} />
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
      <p className="text-white font-medium mb-3">{title}</p>
      <ul className="space-y-2">
        {links.map(({ label, href }) => (
          <li key={label}>
            {href.startsWith('/') ? (
              <Link to={href} className="hover:text-gray-200 transition-colors">{label}</Link>
            ) : (
              <a href={href} className="hover:text-gray-200 transition-colors">{label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Logo inline (copia de PsiconectaLogo del proyecto)
   Si ya existe src/components/ui/Spinner.jsx con el logo,
   importar desde ahí y eliminar este componente.
───────────────────────────────────────────── */
function PsiconectaLogo({ className = 'h-8 w-8' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Psiconecta"
    >
      {/* Arco superior */}
      <path
        d="M8 20 C8 12, 32 12, 32 20"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
        className="text-blue-600"
      />
      {/* Arco inferior */}
      <path
        d="M8 20 C8 28, 32 28, 32 20"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
        className="text-blue-400"
      />
      {/* Nodo central */}
      <circle cx="20" cy="20" r="3" fill="currentColor" className="text-blue-600" />
    </svg>
  )
}
