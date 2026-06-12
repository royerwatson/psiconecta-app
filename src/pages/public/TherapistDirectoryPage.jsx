/**
 * TherapistDirectoryPage — /terapeutas
 * Página pública e indexable por Google.
 * Lista terapeutas verificados sin requerir autenticación.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import SEOHead from './SEOHead'
import {
  ShieldCheck, Star, ChevronRight, Search,
  MapPin, ArrowRight, Crown,
} from 'lucide-react'
import { analytics } from '@/lib/analytics'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const SPECIALTIES = [
  'Todas',
  'Psicología clínica',
  'Psicología cognitivo-conductual',
  'Psicoanálisis',
  'Terapia familiar y de pareja',
  'Psicología infantil',
  'Neuropsicología',
]

export default function TherapistDirectoryPage() {
  const [therapists, setTherapists]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [specialty, setSpecialty]     = useState('Todas')

  // Revelado en cascada — re-escanea cuando cargan o se filtran las tarjetas
  useScrollReveal([loading, therapists, search])

  useEffect(() => { fetchTherapists() }, [specialty])

  const fetchTherapists = async () => {
    setLoading(true)
    let query = supabase
      .from('therapist_profiles')
      .select(`
        user_id, full_name, specialty, bio, price_per_session,
        rating, review_count, subscription_plan, verified,
        profile:profiles!therapist_profiles_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('verified', true)

    if (specialty !== 'Todas') query = query.eq('specialty', specialty)

    const { data } = await query.order('rating', { ascending: false })

    const PLAN_ORDER = { premium: 0, pro: 1, basic: 2 }
    const sorted = (data ?? [])
      .map(t => ({ ...t, plan_order: PLAN_ORDER[t.subscription_plan ?? 'basic'] ?? 2 }))
      .sort((a, b) => a.plan_order - b.plan_order || (b.rating ?? 0) - (a.rating ?? 0))

    setTherapists(sorted)
    setLoading(false)
  }

  const filtered = therapists.filter(t => {
    const name = t.profile?.full_name ?? t.full_name ?? ''
    return name.toLowerCase().includes(search.toLowerCase()) ||
      (t.specialty ?? '').toLowerCase().includes(search.toLowerCase())
  })

  const isPro = t => ['pro', 'premium'].includes(t.subscription_plan)

  return (
    <>
      <SEOHead
        title="Directorio de psicólogos verificados en RD | Psiconecta"
        description="Encuentra tu psicólogo o terapeuta verificado en República Dominicana. Perfiles con especialidad, precio y valoraciones reales. Agenda online en minutos."
        url="https://psiconecta.app/terapeutas"
      />

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
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors">
                Iniciar sesión
              </Link>
              <Link to="/register" className="btn-premium btn-primary-premium text-sm px-4 py-2">
                Comenzar gratis
                <ChevronRight size={15} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </header>

        {/* ── HERO ───────────────────────────────── */}
        <section className="pt-28 pb-12 px-4 bg-psiconecta dark:bg-[#0f1117]">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="hero-reveal hero-reveal-1 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Psicólogos verificados en{' '}
              <span className="text-transparent bg-clip-text bg-gradient-brand">
                República Dominicana
              </span>
            </h1>
            <p className="hero-reveal hero-reveal-2 text-slate-500 dark:text-slate-400 font-medium mb-8">
              Todos los terapeutas han presentado título, exequátur y acreditación del Colegio Psicológico.
            </p>

            {/* Búsqueda */}
            <div className="hero-reveal hero-reveal-3 relative max-w-xl mx-auto mb-6">
              <Search size={16} strokeWidth={1.8} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o especialidad..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-premium pl-10 w-full"
              />
            </div>

            {/* Filtros de especialidad */}
            <div className="hero-reveal hero-reveal-4 flex flex-wrap justify-center gap-2">
              {SPECIALTIES.map(s => (
                <button
                  key={s}
                  onClick={() => setSpecialty(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    specialty === s
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── GRID DE TERAPEUTAS ─────────────────── */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron terapeutas para tu búsqueda.</p>
                <button onClick={() => { setSearch(''); setSpecialty('Todas') }} className="mt-4 text-primary-600 text-sm font-semibold hover:underline">
                  Ver todos
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
                  {filtered.length} terapeuta{filtered.length !== 1 ? 's' : ''} verificado{filtered.length !== 1 ? 's' : ''}
                  {specialty !== 'Todas' ? ` en ${specialty}` : ''}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map(t => (
                    <div key={t.user_id} className="fade-in">
                      <TherapistCard therapist={t} isPro={isPro(t)} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────── */}
        <section className="py-16 px-4 bg-gradient-brand mt-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-extrabold text-white mb-3">¿Listo para dar el paso?</h2>
            <p className="text-indigo-100 mb-6 font-medium">Crea tu cuenta gratis y agenda tu primera sesión hoy.</p>
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-[14px] hover:bg-primary-50 transition-colors">
              Comenzar gratis
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </div>
        </section>

        {/* ── FOOTER MÍNIMO ──────────────────────── */}
        <footer className="py-8 px-4 bg-slate-900 text-center text-xs text-slate-600">
          <Link to="/" className="hover:text-slate-400 transition-colors">← Volver al inicio</Link>
          <span className="mx-3">·</span>
          <span>© {new Date().getFullYear()} Psiconecta</span>
        </footer>
      </div>
    </>
  )
}

/* ─── Card individual ─────────────────────── */
function TherapistCard({ therapist, isPro }) {
  const name    = therapist.profile?.full_name ?? therapist.full_name ?? 'Terapeuta'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const rating  = therapist.rating ?? 0
  const reviews = therapist.review_count ?? 0
  const price   = therapist.price_per_session

  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3">
        {therapist.profile?.avatar_url ? (
          <img
            src={therapist.profile.avatar_url}
            alt={name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">{initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{name}</p>
            {isPro && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 text-[10px] font-bold">
                <Crown size={10} strokeWidth={2} /> Pro
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{therapist.specialty ?? 'Psicología clínica'}</p>
        </div>
      </div>

      {/* Rating */}
      {rating > 0 && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={12} strokeWidth={0} className={i < Math.round(rating) ? 'fill-accent-400 text-accent-400' : 'fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700'} />
          ))}
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">{rating.toFixed(1)} ({reviews})</span>
        </div>
      )}

      {/* Bio snippet */}
      {therapist.bio && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{therapist.bio}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <ShieldCheck size={13} strokeWidth={2} className="text-green-500" />
          <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Verificado</span>
        </div>
        {price && (
          <span className="text-sm font-bold text-slate-900 dark:text-white">${price} USD/sesión</span>
        )}
      </div>

      <Link
        to="/register"
        onClick={() => analytics.bookTherapist(therapist.user_id)}
        className="btn-premium btn-primary-premium text-xs py-2.5 w-full justify-center"
      >
        Agendar sesión
        <ArrowRight size={14} strokeWidth={2} />
      </Link>
    </div>
  )
}
