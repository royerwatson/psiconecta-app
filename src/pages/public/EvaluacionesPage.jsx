/**
 * EvaluacionesPage — Página de evaluaciones psicométricas con reporte IA.
 * Ruta: /evaluaciones (pública)
 * Diseño: Psiconecta design system
 */
import { Link } from 'react-router-dom'
import {
  Search, ClipboardList, BarChart2, FileText, Video, Lock,
  HeartPulse, BrainCircuit, Moon, Briefcase, Users, UserCheck,
  ArrowRight, Sparkles, ShieldCheck, ChevronRight,
} from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'

/* ─── Datos ─────────────────────────────────────────────── */
const STEPS = [
  { icon: Search,        label: 'Elige tu área',            desc: 'Emociones, relaciones, trabajo, sueño… o responde 5 preguntas y te recomendamos el área adecuada.',  free: true  },
  { icon: ClipboardList, label: 'Completa el test',         desc: 'Preguntas clínicas validadas, presentadas una a una con barra de progreso. Solo 5-8 minutos.',         free: true  },
  { icon: BarChart2,     label: 'Ve tu puntuación',         desc: 'Tu nivel general aparece de inmediato. La interpretación detallada queda bloqueada.',                  free: true  },
  { icon: FileText,      label: 'Tu reporte completo',      desc: 'PDF descargable con desglose dimensional, comparación normativa y recomendaciones personalizadas.',   price: 'desde $4.99' },
  { icon: Video,         label: 'Conecta con tu terapeuta', desc: 'Comparte tu reporte con un psicólogo y agenda tu primera sesión. Llega con claridad y avanza más rápido.',   cta: true   },
]

const AREAS = [
  { icon: HeartPulse,    label: 'Ansiedad\n& Estrés',       color: 'text-violet-600 bg-violet-50',  instruments: 'GAD-7 · STAI',          price: '$4.99' },
  { icon: BrainCircuit,  label: 'Ánimo\n& Depresión',       color: 'text-primary-600 bg-primary-50', instruments: 'PHQ-9 · BDI-II',         price: '$4.99' },
  { icon: Moon,          label: 'Calidad\ndel sueño',        color: 'text-indigo-600 bg-indigo-50',  instruments: 'PSQI · ESS',             price: '$4.99' },
  { icon: Briefcase,     label: 'Trabajo\n& Burnout',        color: 'text-cyan-600 bg-cyan-50',      instruments: 'MBI · CBI',              price: '$6.99' },
  { icon: Users,         label: 'Relaciones\n& Pareja',      color: 'text-teal-600 bg-teal-50',      instruments: 'FACES-III · DAS',        price: '$9.99' },
  { icon: UserCheck,     label: 'Rasgos de\nPersonalidad',   color: 'text-accent-600 bg-accent-50',  instruments: 'IPDE screening',         price: '$9.99' },
]

const PACKAGES = [
  { slug: 'bienestar', name: 'Pack Bienestar Emocional',   icon: '🌿', price: '$12.99', save: '30%', includes: 'GAD-7 + PHQ-9 + ISI · Reporte integrado cruzado' },
  { slug: 'laboral',   name: 'Pack Vida Laboral',           icon: '💼', price: '$14.99', save: '28%', includes: 'MBI-GS + GAD-7 · Recomendaciones para entorno laboral' },
  { slug: 'completo',  name: 'Pack Evaluación Completa',    icon: '⭐', price: '$24.99', save: '40%', includes: '4 instrumentos clínicos · Reporte de 10-12 págs · 20% dcto. en 1ª sesión', highlight: true },
]

/* ─── Componentes ────────────────────────────────────────── */
function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center shadow-sm">
            <PsiconectaLogo size={22} color="white" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">
            Psico<span className="text-primary-600">necta</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
            Iniciar sesión
          </Link>
          <Link to="/register" className="btn-premium btn-primary-premium text-sm px-4 py-2">
            Comenzar gratis <ChevronRight size={15} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </header>
  )
}

/* ─── Mockup del reporte bloqueado ───────────────────────── */
function ReportMockup() {
  return (
    <div className="rounded-[28px] bg-white border border-slate-100 shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-accent-500 px-6 py-5">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Reporte de evaluación</p>
        <p className="text-white font-bold text-lg">Ansiedad Generalizada (GAD-7)</p>
      </div>
      <div className="p-6 space-y-5">
        {/* Puntuación visible */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Tu puntuación</p>
              <p className="text-4xl font-black text-slate-900 leading-none mt-1">
                11 <span className="text-lg font-semibold text-slate-400">/ 21</span>
              </p>
            </div>
            <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">Moderada</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500" style={{ width: '52%' }} />
          </div>
        </div>

        {/* Dimensiones bloqueadas */}
        <div className="relative">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Desglose dimensional</p>
          <div className="space-y-2.5 blur-[3px] select-none pointer-events-none">
            {[
              { label: 'Preocupación excesiva', pct: 78 },
              { label: 'Tensión física',         pct: 55 },
              { label: 'Irritabilidad',          pct: 40 },
              { label: 'Concentración',          pct: 62 },
            ].map(({ label, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-bold text-slate-800">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-primary-400" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/80 backdrop-blur-[1px]">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center mb-2 shadow-lg">
              <Lock size={18} strokeWidth={2} className="text-white" />
            </div>
            <p className="text-xs font-bold text-slate-700 text-center">Desbloquea el análisis<br/>dimensional completo</p>
            <span className="mt-2 text-xs font-bold text-accent-600 bg-accent-50 px-3 py-1 rounded-full border border-accent-200">desde $4.99</span>
          </div>
        </div>

        {/* Interpretación IA bloqueada */}
        <div className="relative">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Interpretación personalizada</p>
          <div className="space-y-1.5 blur-[4px] select-none pointer-events-none">
            <div className="h-3 bg-slate-100 rounded-full w-full" />
            <div className="h-3 bg-slate-100 rounded-full w-4/5" />
            <div className="h-3 bg-slate-100 rounded-full w-full" />
            <div className="h-3 bg-slate-100 rounded-full w-3/4" />
            <div className="h-3 bg-slate-100 rounded-full w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Página principal ───────────────────────────────────── */
export default function EvaluacionesPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <Navbar />

      {/* ── HERO ─────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 bg-psiconecta overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Texto */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-100 text-accent-700 text-xs font-semibold mb-5">
                <Sparkles size={12} strokeWidth={2} /> Nuevo en Psiconecta
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                Descubre cómo estás,<br />antes de tu primera sesión
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed mb-3">
                Evaluaciones psicométricas clínicas con un reporte diseñado para entenderte, no para abrumarte.
              </p>
              <p className="text-primary-600 font-semibold text-lg mb-8">
                El test es gratis. El reporte completo, desde $4.99 —<br className="hidden sm:block" /> menos del 15% del costo de una sesión presencial.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/evaluaciones/elegir" className="btn-premium btn-primary-premium text-base px-7 py-3.5">
                  Hacer mi evaluación gratis
                  <ArrowRight size={18} strokeWidth={1.8} />
                </Link>
                <a href="#areas" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-primary-600 hover:bg-primary-50 rounded-[14px] border border-primary-200 transition-colors">
                  Ver áreas disponibles
                </a>
              </div>
              <p className="text-xs text-slate-400 mt-4">Acceso inmediato · Reporte en minutos · Pago único</p>
            </div>

            {/* Mockup */}
            <div className="max-w-sm mx-auto lg:max-w-full">
              <ReportMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ─────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Cómo funciona</h2>
            <p className="text-slate-500">Del test gratuito al reporte completo, en menos de 10 minutos.</p>
          </div>
          <div className="space-y-3">
            {STEPS.map(({ icon: Icon, label, desc, free, price, cta }, i) => (
              <div key={i} className={`flex gap-4 p-5 rounded-2xl border transition-colors ${
                cta   ? 'bg-primary-50 border-primary-200'
                : price ? 'bg-accent-50 border-accent-200'
                : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  cta   ? 'bg-primary-100'
                  : price ? 'bg-accent-100'
                  : 'bg-slate-100'
                }`}>
                  <Icon size={20} strokeWidth={1.8} className={cta ? 'text-primary-600' : price ? 'text-accent-600' : 'text-slate-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-300">0{i + 1}</span>
                    <p className={`font-bold text-sm ${cta ? 'text-primary-700' : price ? 'text-accent-700' : 'text-slate-800'}`}>{label}</p>
                    {free  && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Gratis</span>}
                    {price && <span className="text-xs font-semibold text-accent-600 bg-white px-2 py-0.5 rounded-full border border-accent-200">{price}</span>}
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÁREAS ─────────────────────────────────── */}
      <section id="areas" className="py-20 px-4 bg-psiconecta">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Áreas de evaluación</h2>
            <p className="text-slate-500">Instrumentos clínicos validados, presentados en lenguaje accesible.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AREAS.map(({ icon: Icon, label, color, instruments, price }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm whitespace-pre-line leading-tight mb-1">{label}</p>
                  <p className="text-xs text-slate-400 mb-2">{instruments}</p>
                  <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100">{price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAQUETES ──────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Paquetes temáticos</h2>
            <p className="text-slate-500">Evalúa varias dimensiones a la vez y ahorra hasta un 40%.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PACKAGES.map(({ slug, name, icon, price, save, includes, highlight }) => (
              <Link
                key={slug}
                to={`/evaluaciones/pack/${slug}`}
                className={`rounded-2xl p-5 border transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  highlight
                    ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-300'
                    : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                {highlight && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 bg-primary-100 px-2.5 py-1 rounded-full mb-3">
                    <Sparkles size={11} strokeWidth={2} /> Más popular
                  </span>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className={`font-bold text-sm leading-tight ${highlight ? 'text-primary-800' : 'text-slate-800'}`}>
                    {icon && <span className="mr-1">{icon}</span>}{name}
                  </p>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-black ${highlight ? 'text-primary-700' : 'text-slate-900'}`}>{price}</p>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">-{save}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{includes}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${highlight ? 'text-primary-600' : 'text-slate-500'}`}>
                  Ver pack <ChevronRight size={12} strokeWidth={2} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARACIÓN DE PRECIO ─────────────────── */}
      <section className="py-16 px-4 bg-psiconecta border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Tu reporte vs. una sesión presencial</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Test básico',       price: '$4.99',  sub: '14% del costo de 1 sesión', color: 'text-emerald-600' },
              { label: 'Test premium',      price: '$9.99',  sub: '29% del costo de 1 sesión', color: 'text-primary-600' },
              { label: 'Sesión presencial', price: '$34+',   sub: 'Psicólogo privado en RD',    color: 'text-slate-400', strike: true },
            ].map(({ label, price, sub, color, strike }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
                <p className={`text-3xl font-black mb-1 ${color} ${strike ? 'line-through opacity-60' : ''}`}>{price}</p>
                <p className="text-xs font-semibold text-slate-700 mb-1">{label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GARANTÍAS ─────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, title: 'Instrumentos validados', desc: 'GAD-7, PHQ-9, MBI y más — los mismos que usan los psicólogos en consulta.' },
              { icon: Sparkles,    title: 'Lectura profunda',        desc: 'Análisis personalizado basado en tu perfil completo, no solo en un número.' },
              { icon: FileText,    title: 'Reporte descargable',    desc: 'PDF profesional listo para compartir con tu terapeuta o médico de cabecera.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  <Icon size={18} strokeWidth={1.8} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm mb-1">{title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-brand">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Empieza con tu evaluación gratis
          </h2>
          <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
            El test no requiere cuenta ni pago. Solo cuando quieras tu reporte completo, decides.
          </p>
          <Link to="/evaluaciones/elegir" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-[14px] hover:bg-primary-50 transition-colors text-base">
            Hacer mi evaluación gratis
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
          <p className="text-indigo-200/70 text-xs mt-4">Reporte desde $4.99 · Acceso inmediato · Pago único</p>
        </div>
      </section>

      {/* ── FOOTER MÍNIMO ─────────────────────────── */}
      <footer className="py-8 px-4 bg-slate-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 bg-gradient-brand rounded-lg flex items-center justify-center">
            <PsiconectaLogo size={16} color="white" />
          </div>
          <span className="font-bold text-white text-sm">Psico<span className="text-primary-400">necta</span></span>
        </div>
        <div className="flex justify-center gap-5 text-xs text-slate-500 mt-2">
          <Link to="/"         className="hover:text-slate-300 transition-colors">Inicio</Link>
          <Link to="/pricing"  className="hover:text-slate-300 transition-colors">Planes</Link>
          <Link to="/registro" className="hover:text-slate-300 transition-colors">Registro</Link>
          <Link to="/privacidad" className="hover:text-slate-300 transition-colors">Privacidad</Link>
        </div>
      </footer>
    </div>
  )
}
