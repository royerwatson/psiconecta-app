/**
 * EvaluacionesSelectPage — Selección de área de evaluación.
 * Ruta: /evaluaciones/elegir (pública)
 */
import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse, BrainCircuit, Moon, Briefcase, Users, UserCheck, ArrowRight, ChevronRight, Sparkles, Crown } from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import { AREA_LIST } from '@/data/assessmentTests'
import { PACK_LIST } from '@/data/assessmentPacks'

const ICONS = {
  ansiedad:     HeartPulse,
  depresion:    BrainCircuit,
  sueno:        Moon,
  burnout:      Briefcase,
  relaciones:   Users,
  personalidad: UserCheck,
}

const COLOR_MAP = {
  violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600',  border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-700' },
  primary: { bg: 'bg-primary-50', icon: 'text-primary-600', border: 'border-primary-200', badge: 'bg-primary-100 text-primary-700' },
  indigo:  { bg: 'bg-indigo-50',  icon: 'text-indigo-600',  border: 'border-indigo-200',  badge: 'bg-indigo-100 text-indigo-700' },
  cyan:    { bg: 'bg-cyan-50',    icon: 'text-cyan-600',    border: 'border-cyan-200',    badge: 'bg-cyan-100 text-cyan-700' },
  teal:    { bg: 'bg-teal-50',    icon: 'text-teal-600',    border: 'border-teal-200',    badge: 'bg-teal-100 text-teal-700' },
  accent:  { bg: 'bg-accent-50',  icon: 'text-accent-600',  border: 'border-accent-200',  badge: 'bg-accent-100 text-accent-700' },
}

function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/evaluaciones" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center shadow-sm">
            <PsiconectaLogo size={22} color="white" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">
            Psico<span className="text-primary-600">necta</span>
          </span>
        </Link>
        <Link to="/login" className="text-sm font-semibold text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl transition-colors">
          Iniciar sesión
        </Link>
      </div>
    </header>
  )
}

export default function EvaluacionesSelectPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-100 text-accent-700 text-xs font-semibold mb-4">
              <Sparkles size={12} strokeWidth={2} /> Paso 1 de 3
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              ¿Qué área quieres explorar?
            </h1>
            <p className="text-slate-500 text-lg">
              El test es gratuito. El reporte completo se desbloquea después.
            </p>
          </div>

          {/* Grid de áreas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {AREA_LIST.map((area) => {
              const Icon = ICONS[area.slug] ?? HeartPulse
              const c = COLOR_MAP[area.color] ?? COLOR_MAP.primary

              if (area.soon) {
                return (
                  <div key={area.slug} className="relative flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 opacity-60 cursor-not-allowed">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
                      <Icon size={22} strokeWidth={1.8} className={c.icon} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-700 text-sm">{area.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{area.price} · Reporte completo</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Próximamente</span>
                  </div>
                )
              }

              return (
                <button
                  key={area.slug}
                  onClick={() => navigate(`/evaluaciones/test/${area.slug}`)}
                  className={`group flex items-center gap-4 p-5 rounded-2xl bg-white border ${c.border} shadow-sm hover:shadow-md transition-all text-left`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
                    <Icon size={22} strokeWidth={1.8} className={c.icon} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{area.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{area.price} · Reporte completo</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                </button>
              )
            })}
          </div>

          {/* ── Sección de Paquetes Temáticos ── */}
          <div className="mt-10 mb-6">
            <div className="text-center mb-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">¿Quieres más de una evaluación?</p>
              <h2 className="text-xl font-extrabold text-slate-900">Paquetes temáticos</h2>
              <p className="text-sm text-slate-500 mt-1">Evalúa varias áreas a la vez y ahorra hasta un 40%</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PACK_LIST.map((pack) => (
                <Link
                  key={pack.slug}
                  to={`/evaluaciones/pack/${pack.slug}`}
                  className={`group relative flex flex-col p-5 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    pack.highlight
                      ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-300'
                      : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  {pack.highlight && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full mb-2 self-start">
                      <Crown size={10} strokeWidth={2} /> Más popular
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xl mr-1">{pack.icon}</span>
                      <p className="text-sm font-bold text-slate-800 inline">{pack.name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{pack.instruments}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <span className={`text-lg font-black ${pack.highlight ? 'text-primary-700' : 'text-slate-900'}`}>${pack.price}</span>
                      <span className="ml-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">-{pack.save}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer info */}
          <p className="text-center text-xs text-slate-400">
            Instrumentos clínicos validados · Test gratuito · Reporte personalizado desde $4.99
          </p>
        </div>
      </main>
    </div>
  )
}
