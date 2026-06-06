/**
 * LandingPage — Página principal pública de Psiconecta.
 * Ruta: / (raíz)
 * Accesible sin login.
 */
import { useNavigate } from 'react-router-dom'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import {
  Shield, Video, ClipboardList, Star, CheckCircle, Zap,
  Brain, Heart, Users, ArrowRight, ChevronRight,
} from 'lucide-react'

const FEATURES = [
  { Icon: Video,         title: 'Videollamadas seguras',    desc: 'Sesiones en tiempo real desde cualquier dispositivo, sin descargas.' },
  { Icon: Shield,        title: 'Privacidad garantizada',   desc: 'Datos cifrados, modo anónimo y cumplimiento con RGPD.' },
  { Icon: ClipboardList, title: 'Herramientas clínicas',    desc: 'Tests psicométricos, escalas validadas y planes de tratamiento.' },
  { Icon: Brain,         title: 'IA de bienestar',          desc: 'Check-in diario con análisis de riesgo y alertas al terapeuta.' },
  { Icon: Heart,         title: 'Seguimiento continuo',     desc: 'Registra tu estado de ánimo y mide tu progreso semana a semana.' },
  { Icon: Users,         title: 'Terapia grupal',           desc: 'Sesiones grupales con otros pacientes en un ambiente seguro.' },
]

const STEPS = [
  { n: '1', title: 'Crea tu cuenta',       desc: 'Registro gratuito en menos de 2 minutos.' },
  { n: '2', title: 'Encuentra tu terapeuta', desc: 'Filtra por especialidad, precio y disponibilidad.' },
  { n: '3', title: 'Agenda y paga',         desc: 'Reserva tu cita y paga de forma segura con PayPal.' },
  { n: '4', title: 'Comienza tu terapia',   desc: 'Conéctate por videollamada desde donde estés.' },
]

const SPECIALTIES = [
  'Ansiedad y estrés', 'Depresión', 'Terapia de pareja', 'Trauma y duelo',
  'Psicología infantil', 'Crecimiento personal', 'Trastornos del sueño', 'Adicciones',
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-white text-slate-800 font-sans">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
              <PsiconectaLogo size={20} color="white" />
            </div>
            <span className="font-bold text-lg text-slate-800">
              Psico<span className="text-indigo-600">necta</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5">
              Iniciar sesión
            </button>
            <button onClick={() => navigate('/register')}
              className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors">
              Registrarse gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full mb-6">
          <Zap size={12} strokeWidth={2} /> Terapeutas verificados disponibles ahora
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
          Tu bienestar mental,<br />
          <span className="text-indigo-600">a un clic de distancia</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Conectamos pacientes con psicólogos certificados para sesiones de terapia online
          seguras, privadas y accesibles desde cualquier lugar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/register')}
            className="flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-base transition-colors shadow-lg shadow-indigo-200">
            Comenzar ahora <ArrowRight size={18} strokeWidth={2} />
          </button>
          <button onClick={() => navigate('/pricing')}
            className="flex items-center justify-center gap-2 px-7 py-3.5 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-2xl text-base transition-colors">
            Ver planes y precios
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-5">Sin compromiso · Cancela cuando quieras · Datos protegidos</p>
      </section>

      {/* ── Especialidades ── */}
      <section className="bg-slate-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">
            Áreas de atención
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SPECIALTIES.map(s => (
              <span key={s} className="text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          Empieza en 4 pasos simples
        </h2>
        <div className="grid sm:grid-cols-4 gap-8">
          {STEPS.map(s => (
            <div key={s.n} className="text-center">
              <div className="w-12 h-12 bg-indigo-600 text-white text-xl font-bold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                {s.n}
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            Todo lo que necesitas para tu bienestar
          </h2>
          <p className="text-center text-slate-500 mb-12 max-w-lg mx-auto">
            Psiconecta combina tecnología y psicología para una experiencia terapéutica completa.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={20} strokeWidth={1.8} className="text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para terapeutas ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-10 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">¿Eres psicólogo o psicoterapeuta?</h2>
          <p className="text-indigo-200 mb-8 max-w-lg mx-auto leading-relaxed">
            Únete a nuestra red de profesionales verificados. Gestiona tu agenda, conecta con pacientes
            y accede a herramientas clínicas avanzadas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            {['Plan Gratuito disponible', 'Sin coste de suscripción inicial', 'Herramientas clínicas incluidas'].map(b => (
              <div key={b} className="flex items-center gap-2 text-sm text-indigo-100">
                <CheckCircle size={15} strokeWidth={2} className="text-indigo-300 shrink-0" />
                {b}
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/register')}
            className="px-8 py-3.5 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors">
            Registrarme como terapeuta →
          </button>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="bg-slate-50 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Da el primer paso hoy
        </h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Miles de personas ya están mejorando su bienestar mental con Psiconecta.
        </p>
        <button onClick={() => navigate('/register')}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-lg transition-colors shadow-lg shadow-indigo-200">
          Crear cuenta gratuita
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
              <PsiconectaLogo size={14} color="white" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Psiconecta</span>
          </div>
          <p className="text-xs text-slate-400">© 2026 Psiconecta · Todos los derechos reservados</p>
          <div className="flex gap-4">
            {['Privacidad', 'Términos', 'Soporte'].map(l => (
              <button key={l} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">{l}</button>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
