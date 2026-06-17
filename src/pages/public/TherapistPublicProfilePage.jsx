/**
 * TherapistPublicProfilePage — /terapeutas/:slug
 * Página pública e indexable de perfil individual del terapeuta.
 */
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import SEOHead from './SEOHead'
import {
  ShieldCheck, Star, ChevronRight, ArrowRight,
  ArrowLeft, Clock, Calendar, Crown,
} from 'lucide-react'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'pm' : 'am'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

export default function TherapistPublicProfilePage() {
  const { slug } = useParams()
  const navigate  = useNavigate()
  const [therapist, setTherapist]       = useState(null)
  const [availability, setAvailability] = useState([])
  const [loading, setLoading]           = useState(true)
  const [notFound, setNotFound]         = useState(false)

  useEffect(() => { fetchTherapist() }, [slug])

  const fetchTherapist = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('therapist_profiles')
      .select(`
        user_id, full_name, specialty, bio, price_per_session,
        rating, review_count, subscription_plan, verified, avatar_url, slug
      `)
      .eq('slug', slug)
      .eq('verified', true)
      .single()

    if (error || !data) { setNotFound(true); setLoading(false); return }
    setTherapist(data)

    // Cargar disponibilidad
    const { data: avail } = await supabase
      .from('therapist_availability')
      .select('day_of_week, start_time, end_time')
      .eq('therapist_id', data.user_id)
      .order('day_of_week', { ascending: true })

    setAvailability(avail ?? [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f1117]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#0f1117]">
        <p className="text-slate-500 dark:text-slate-400">Terapeuta no encontrado.</p>
        <Link to="/terapeutas" className="text-primary-600 text-sm font-semibold hover:underline">
          ← Ver directorio
        </Link>
      </div>
    )
  }

  const name    = therapist.full_name ?? 'Terapeuta'
  const rating  = therapist.rating ?? 0
  const reviews = therapist.review_count ?? 0
  const isPro   = ['pro', 'premium'].includes(therapist.subscription_plan)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <SEOHead
        title={`${name} — Psicólogo/a verificado/a en RD | Psiconecta`}
        description={therapist.bio
          ? `${therapist.bio.slice(0, 150)}...`
          : `Perfil de ${name}, terapeuta verificado/a en República Dominicana. Especialidad: ${therapist.specialty}. Agenda tu sesión en Psiconecta.`
        }
        url={`https://psiconecta.app/terapeutas/${slug}`}
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

        {/* ── CONTENIDO ──────────────────────────── */}
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-2xl mx-auto">

            {/* Volver */}
            <Link
              to="/terapeutas"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-6"
            >
              <ArrowLeft size={15} strokeWidth={2} />
              Ver todos los terapeutas
            </Link>

            {/* Card principal */}
            <div className="card p-6 sm:p-8 mb-6">
              <div className="flex items-start gap-5">
                {therapist.avatar_url ? (
                  <img
                    src={therapist.avatar_url}
                    alt={name}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary-100 dark:ring-primary-900 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xl">{initials}</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{name}</h1>
                    {isPro && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 text-xs font-bold">
                        <Crown size={11} strokeWidth={2} /> Pro
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{therapist.specialty ?? 'Psicología clínica'}</p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={14} strokeWidth={2} className="text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Verificado</span>
                    </div>
                    {rating > 0 && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} strokeWidth={0}
                            className={i < Math.round(rating) ? 'fill-accent-400 text-accent-400' : 'fill-slate-200 dark:fill-slate-700 text-slate-200'} />
                        ))}
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-0.5">{rating.toFixed(1)} ({reviews})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {therapist.bio && (
                <p className="mt-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-5">
                  {therapist.bio}
                </p>
              )}
            </div>

            {/* Disponibilidad */}
            {availability.length > 0 && (
              <div className="card p-6 mb-6">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar size={15} strokeWidth={2} className="text-primary-500" />
                  Disponibilidad
                </h2>
                <div className="space-y-2">
                  {availability.map((slot, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300 w-28">
                        {DAYS[slot.day_of_week]}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock size={12} strokeWidth={2} />
                        {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Precio y CTA */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Precio por sesión</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    ${therapist.price_per_session ?? '—'} <span className="text-sm font-normal text-slate-400">USD</span>
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400 dark:text-slate-500">
                  <p>Sesión de 60 min</p>
                  <p>Online</p>
                </div>
              </div>
              <Link
                to="/register"
                className="btn-premium btn-primary-premium w-full justify-center py-3"
              >
                Agendar sesión con {name.split(' ')[0]}
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
                Crea tu cuenta gratis para reservar
              </p>
            </div>

          </div>
        </main>

        {/* ── FOOTER ─────────────────────────────── */}
        <footer className="py-8 px-4 bg-slate-900 text-center text-xs text-slate-600">
          <Link to="/terapeutas" className="hover:text-slate-400 transition-colors">← Ver directorio</Link>
          <span className="mx-3">·</span>
          <Link to="/" className="hover:text-slate-400 transition-colors">Inicio</Link>
          <span className="mx-3">·</span>
          <span>© {new Date().getFullYear()} Psiconecta</span>
        </footer>
      </div>
    </>
  )
}
