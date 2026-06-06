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
  Lock,
  RefreshCw,
  MessageCircle,
  ChevronDown,
  BadgeCheck,
  FileText,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import SEOHead from './SEOHead'


/* ─── Testimonios ───────────────────────────── */
const TESTIMONIALS = [
  {
    id: 1,
    name: 'María G.',
    role: 'Paciente',
    initials: 'MG',
    color: 'from-primary-400 to-accent-500',
    rating: 5,
    text: 'Encontré a mi terapeuta en menos de 10 minutos. La videollamada fue fluida y el proceso de pago súper fácil. No imaginé que la terapia online podía sentirse tan cercana.',
  },
  {
    id: 2,
    name: 'Dr. Carlos M.',
    role: 'Terapeuta verificado',
    initials: 'CM',
    color: 'from-accent-400 to-primary-600',
    rating: 5,
    text: 'La plataforma me da todas las herramientas que necesito: tests, escalas clínicas, protocolos. Mis pacientes llegan mejor preparados y yo puedo enfocarme en el trabajo terapéutico.',
  },
  {
    id: 3,
    name: 'Sofía R.',
    role: 'Paciente',
    initials: 'SR',
    color: 'from-primary-500 to-accent-400',
    rating: 5,
    text: 'El modo anónimo me dio la confianza para dar el primer paso. Nadie en mi entorno sabe que voy a terapia, y eso fue clave para decidirme.',
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
  /* IntersectionObserver: fade-in en scroll para elementos .fade-in */
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
      .fade-in.visible { opacity: 1; transform: translateY(0); }
    `
    document.head.appendChild(style)

    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el))
    return () => { observer.disconnect(); document.head.removeChild(style) }
  }, [])

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
              <a href="#beneficios"    className="hover:text-primary-600 transition-colors">Beneficios</a>
              <a href="#como-funciona" className="hover:text-primary-600 transition-colors">Cómo funciona</a>
              <a href="#terapeutas"    className="hover:text-primary-600 transition-colors">Para terapeutas</a>
              <Link to="/pricing"      className="hover:text-primary-600 transition-colors">Planes</Link>
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
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
                Tu bienestar mental,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-brand">
                  accesible desde donde estés
                </span>
              </h1>

              <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium max-w-lg">
                Conecta con psicólogos y terapeutas verificados. Agenda sesiones de
                videollamada, recibe seguimiento continuo con IA y empieza tu proceso
                hoy — de forma anónima si lo prefieres.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link to="/register" className="btn-premium btn-primary-premium text-base px-7 py-3.5">
                  Encuentra tu terapeuta
                  <ArrowRight size={18} strokeWidth={1.8} />
                </Link>
                <Link to="/register?role=therapist" className="btn-premium btn-secondary-premium text-base px-7 py-3.5">
                  Soy terapeuta
                </Link>
              </div>

              {/* Propuesta de valor */}
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { icon: ShieldCheck, label: 'Terapeutas verificados' },
                  { icon: EyeOff,      label: 'Modo anónimo' },
                  { icon: CreditCard,  label: 'Pago seguro vía PayPal' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-700">
                    <Icon size={15} strokeWidth={1.8} className="text-primary-500" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup hero */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-brand opacity-10 rounded-[60px] blur-3xl" />
              <HeroMockup />
            </div>
          </div>
        </section>

        {/* ── BENEFICIOS ─────────────────────────── */}
        <section id="beneficios" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              title="Todo lo que necesitas para cuidar tu salud mental"
              subtitle="Una plataforma diseñada con el paciente en el centro, respaldada por profesionales verificados."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="fade-in card p-6 hover:shadow-lg transition-shadow group">
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
              title="Empieza en cuatro pasos simples"
              subtitle="Desde el registro hasta tu primera sesión, todo está diseñado para ser rápido y sin fricciones."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12 relative">
              <div className="hidden lg:block absolute top-10 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-primary-100 z-0" />

              {STEPS.map(({ number, icon: Icon, title, desc }) => (
                <div key={number} className="fade-in relative z-10 flex flex-col items-center text-center card p-6">
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
              <Link to="/register" className="btn-premium btn-primary-premium text-base px-8 py-3.5">
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
              title="Lo que dicen quienes ya dan el paso"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
              {TESTIMONIALS.map(({ id, name, role, initials, color, rating, text }) => (
                <div key={id} className="fade-in card p-6">
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} size={14} strokeWidth={0} className="fill-accent-400 text-accent-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-5">"{text}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                      <span className="text-white font-bold text-xs">{initials}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{role}</p>
                    </div>
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

                <div className="card p-5 mb-6 space-y-4">
                  <PlanCard
                    name="Plan Gratuito"
                    price="$0/mes"
                    features={['Perfil público verificado', 'Gestión de agenda', 'Videollamadas ilimitadas', 'Chat con pacientes', 'Comisión del 10 % por sesión']}
                  />
                  <div className="border-t border-dashed border-slate-100" />
                  <PlanCard
                    name="Plan Pro"
                    price="$50/mes"
                    highlight
                    features={['Todo lo del plan gratuito', '45+ tests psicométricos', 'DSM-5-TR y CIE-11 en español', 'Escalas clínicas con scoring automático', 'Protocolos TCC, DBT, ACT, EMDR', 'Estadísticas avanzadas']}
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

        {/* ── CONFIANZA Y SEGURIDAD ──────────────── */}
        <section className="py-16 px-4 border-t border-slate-100">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
              Tu privacidad y seguridad, garantizadas
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Lock,        title: 'Cifrado extremo a extremo', desc: 'Todas las sesiones y mensajes viajan cifrados. Nadie más puede acceder.' },
                { icon: EyeOff,      title: 'Modo anónimo disponible',   desc: 'Tu terapeuta solo ve tus iniciales hasta que decidas identificarte.' },
                { icon: RefreshCw,   title: 'Cancela cuando quieras',    desc: 'Sin permanencia ni penalizaciones. Política de reembolso clara.' },
                { icon: BadgeCheck,  title: 'Terapeutas verificados',    desc: 'Título, exequátur y Colegio Psicológico revisados por nuestro equipo.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="fade-in flex flex-col items-center text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 mb-3 shadow-sm">
                    <Icon size={18} strokeWidth={1.8} className="text-primary-600" />
                  </div>
                  <p className="font-bold text-slate-900 text-sm mb-1">{title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
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
            <p className="text-center mt-8 text-sm text-slate-500">
              ¿Tienes otra pregunta?{' '}
              <a href="mailto:hola@psiconecta.app" className="text-primary-600 font-semibold hover:underline">
                Escríbenos
              </a>
            </p>
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
              { label: 'Cómo funciona',    href: '#como-funciona' },
              { label: 'Buscar terapeuta', href: '/register' },
              { label: 'Planes y precios', href: '/pricing' },
              { label: 'Recursos de crisis', href: '/patient/crisis' },
            ]} />

            <FooterColumn title="Terapeutas" links={[
              { label: 'Unirme como terapeuta',    href: '/register?role=therapist' },
              { label: 'Plan Pro',                 href: '/pricing' },
              { label: 'Proceso de verificación',  href: '#terapeutas' },
            ]} />

            <FooterColumn title="Legal" links={[
              { label: 'Términos de uso',        href: '#' },
              { label: 'Privacidad',             href: '#' },
              { label: 'Política de reembolsos', href: '#' },
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

function SectionHeader({ title, subtitle }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
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
            <p className="font-bold text-white text-sm">Paciente Demo</p>
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
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-900 text-sm">{question}</span>
        <ChevronDown
          size={18}
          strokeWidth={1.8}
          className={`text-primary-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 leading-relaxed pt-3">{answer}</p>
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
