/**
 * EvaluacionesSelectPage — Selección de área de evaluación.
 * Ruta: /evaluaciones/elegir (pública)
 */
import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse, BrainCircuit, Moon, Briefcase, Users, UserCheck, ArrowRight, ChevronRight, Sparkles } from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import { AREA_LIST } from '@/data/assessmentTests'

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

          {/* Footer info */}
          <p className="text-center text-xs text-slate-400">
            Instrumentos clínicos validados · Test gratuito · Reporte personalizado desde $4.99
          </p>
        </div>
      </main>
    </div>
  )
}
