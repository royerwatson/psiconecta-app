import { Link } from 'react-router-dom'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import SEOHead from './SEOHead'
import { BLOG_POSTS } from '@/data/blogPosts'
import { ArrowRight, ChevronRight, Clock } from 'lucide-react'

const CATEGORY_COLORS = {
  'Bienestar':     'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
  'Guías':         'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400',
  'Salud mental':  'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  'Consejos':      'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogListPage() {
  const [featured, ...rest] = BLOG_POSTS

  return (
    <>
      <SEOHead
        title="Blog de salud mental | Psiconecta"
        description="Artículos sobre salud mental, psicología y bienestar escritos por profesionales. Aprende a cuidar tu mente con contenido claro y sin tecnicismos."
        url="https://psiconecta.app/blog"
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
                Comenzar gratis <ChevronRight size={15} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </header>

        {/* ── HERO ───────────────────────────────── */}
        <section className="pt-28 pb-12 px-4 bg-psiconecta dark:bg-[#0f1117]">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Recursos de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-brand">salud mental</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Artículos claros, sin tecnicismos, para entender y cuidar tu bienestar emocional.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 pb-20">

          {/* ── ARTÍCULO DESTACADO ─────────────────── */}
          <Link
            to={`/blog/${featured.slug}`}
            className="group block card p-0 overflow-hidden mb-10 hover:shadow-xl transition-shadow"
          >
            <div className={`h-48 sm:h-64 bg-gradient-to-br ${featured.coverGradient} flex items-end p-6`}>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[featured.category] ?? 'bg-white/20 text-white'} bg-white/20 text-white`}>
                {featured.category}
              </span>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mb-3">
                <span>{formatDate(featured.date)}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock size={12} strokeWidth={1.8} />{featured.readTime} min de lectura</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 group-hover:text-primary-600 transition-colors">
                {featured.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{featured.excerpt}</p>
              <span className="inline-flex items-center gap-1.5 text-primary-600 font-semibold text-sm group-hover:gap-3 transition-all">
                Leer artículo <ArrowRight size={16} strokeWidth={2} />
              </span>
            </div>
          </Link>

          {/* ── GRID DE ARTÍCULOS ──────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map(post => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="group card p-0 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                <div className={`h-32 bg-gradient-to-br ${post.coverGradient}`} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] ?? 'bg-slate-100 text-slate-600'}`}>
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                      <Clock size={10} strokeWidth={1.8} />{post.readTime} min
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-2 group-hover:text-primary-600 transition-colors flex-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1 text-primary-600 font-semibold text-xs group-hover:gap-2 transition-all mt-auto">
                    Leer <ArrowRight size={13} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── CTA ────────────────────────────────── */}
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
