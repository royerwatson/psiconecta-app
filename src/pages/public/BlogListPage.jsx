import { Link } from 'react-router-dom'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import SEOHead from './SEOHead'
import { BLOG_POSTS } from '@/data/blogPosts'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import {
  ArrowRight, ChevronRight, Clock,
  HeartPulse, Users, Video, BrainCircuit, CalendarCheck,
  CloudRain, Wallet, Flame, HeartHandshake, Moon,
} from 'lucide-react'

const ICON_MAP = { HeartPulse, Users, Video, BrainCircuit, CalendarCheck, CloudRain, Wallet, Flame, HeartHandshake, Moon }

const CATEGORY_COLORS = {
  'Bienestar':    'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  'Guías':        'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300',
  'Salud mental': 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  'Consejos':     'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
}

/* Portada con patrón SVG decorativo */
function PostCover({ gradient, iconName, large = false }) {
  const Icon = ICON_MAP[iconName]
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${large ? 'h-64 sm:h-80' : 'h-36'}`}>
      {/* Círculos decorativos */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <circle cx="320" cy="-40" r="180" fill="white" />
        <circle cx="-30" cy="220" r="140" fill="white" />
        <circle cx="200" cy="150" r="60" fill="white" />
      </svg>
      {/* Patrón de puntos */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 40 40" preserveAspectRatio="repeat">
        <circle cx="5" cy="5" r="1.5" fill="white" />
        <circle cx="20" cy="5" r="1.5" fill="white" />
        <circle cx="35" cy="5" r="1.5" fill="white" />
        <circle cx="5" cy="20" r="1.5" fill="white" />
        <circle cx="20" cy="20" r="1.5" fill="white" />
        <circle cx="35" cy="20" r="1.5" fill="white" />
        <circle cx="5" cy="35" r="1.5" fill="white" />
        <circle cx="20" cy="35" r="1.5" fill="white" />
        <circle cx="35" cy="35" r="1.5" fill="white" />
      </svg>
      {/* Icono central */}
      {Icon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ${large ? 'w-20 h-20' : 'w-14 h-14'}`}>
            <Icon size={large ? 40 : 26} strokeWidth={1.5} className="text-white" />
          </div>
        </div>
      )}
    </div>
  )
}

export default function BlogListPage() {
  const [featured, ...rest] = BLOG_POSTS

  useScrollReveal()

  return (
    <>
      <SEOHead
        title="Blog de salud mental | Psiconecta"
        description="Artículos sobre salud mental, psicología y bienestar escritos por profesionales. Aprende a cuidar tu mente con contenido claro y sin tecnicismos."
        url="https://psiconecta.app/blog"
      />

      <div className="min-h-screen bg-white dark:bg-[#0f1117] text-slate-800 dark:text-slate-200">

        {/* NAVBAR */}
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
                Comenzar gratis <ChevronRight size={15} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="pt-28 pb-10 px-4 bg-psiconecta dark:bg-[#0f1117]">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="hero-reveal hero-reveal-1 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Recursos de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-brand">salud mental</span>
            </h1>
            <p className="hero-reveal hero-reveal-2 text-slate-500 dark:text-slate-400 font-medium">
              Artículos claros, sin tecnicismos, para entender y cuidar tu bienestar emocional.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 pb-20">

          {/* ARTÍCULO DESTACADO */}
          <div className="fade-in mb-10">
          <Link to={`/blog/${featured.slug}`} className="group block card-elevated overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <PostCover gradient={featured.coverGradient} iconName={featured.icon} large />
              <div className="p-7 sm:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[featured.category] ?? ''}`}>
                    {featured.category}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock size={11} strokeWidth={1.8} /> {featured.readTime} min
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                  {featured.title}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-5 text-sm">
                  {featured.excerpt}
                </p>
                <span className="inline-flex items-center gap-1.5 text-primary-600 font-semibold text-sm group-hover:gap-3 transition-all">
                  Leer artículo <ArrowRight size={16} strokeWidth={2} />
                </span>
              </div>
            </div>
          </Link>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map(post => (
              <div key={post.slug} className="fade-in flex">
              <Link
                to={`/blog/${post.slug}`}
                className="group card overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col flex-1"
              >
                <PostCover gradient={post.coverGradient} iconName={post.icon} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] ?? 'bg-slate-100 text-slate-600'}`}>
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                      <Clock size={10} strokeWidth={1.8} /> {post.readTime} min
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(post.date)}</span>
                    <span className="inline-flex items-center gap-1 text-primary-600 font-semibold text-xs group-hover:gap-2 transition-all">
                      Leer <ArrowRight size={12} strokeWidth={2} />
                    </span>
                  </div>
                </div>
              </Link>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <section className="py-16 px-4 bg-gradient-brand">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-extrabold text-white mb-3">¿Listo para dar el paso?</h2>
            <p className="text-indigo-100 mb-6 font-medium">Conecta con un psicólogo verificado y comienza tu proceso hoy.</p>
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-[14px] hover:bg-primary-50 transition-colors">
              Comenzar gratis <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </div>
        </section>

        <footer className="py-8 px-4 bg-slate-900 text-center text-xs text-slate-600">
          <Link to="/" className="hover:text-slate-400 transition-colors">← Volver al inicio</Link>
          <span className="mx-3">·</span>
          <span>© {new Date().getFullYear()} Psiconecta</span>
        </footer>
      </div>
    </>
  )
}
