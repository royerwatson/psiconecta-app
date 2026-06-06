import { Link, useParams, Navigate } from 'react-router-dom'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import SEOHead from './SEOHead'
import { getBlogPost, getRelatedPosts } from '@/data/blogPosts'
import { ArrowRight, ChevronRight, Clock, ArrowLeft } from 'lucide-react'

const CATEGORY_COLORS = {
  'Bienestar':    'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
  'Guías':        'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400',
  'Salud mental': 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  'Consejos':     'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
}

/* Renderiza el body de una sección: soporta **negrita** y saltos de línea */
function SectionBody({ text }) {
  return (
    <div className="space-y-4">
      {text.split('\n\n').map((para, i) => {
        // Detectar listas con -
        if (para.startsWith('- ')) {
          const items = para.split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2))
          return (
            <ul key={i} className="space-y-1.5 pl-4">
              {items.map((item, j) => (
                <li key={j} className="text-slate-600 dark:text-slate-400 leading-relaxed text-base list-disc" dangerouslySetInnerHTML={{ __html: parseBold(item) }} />
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="text-slate-600 dark:text-slate-400 leading-relaxed text-base" dangerouslySetInnerHTML={{ __html: parseBold(para) }} />
        )
      })}
    </div>
  )
}

function parseBold(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-800 dark:text-slate-200">$1</strong>')
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const post = getBlogPost(slug)
  const related = getRelatedPosts(slug, 2)

  if (!post) return <Navigate to="/blog" replace />

  return (
    <>
      <SEOHead
        title={`${post.title} | Blog Psiconecta`}
        description={post.excerpt}
        url={`https://psiconecta.app/blog/${post.slug}`}
        type="article"
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

        {/* ── COVER ──────────────────────────────── */}
        <div className={`pt-16 h-56 sm:h-72 bg-gradient-to-br ${post.coverGradient}`} />

        {/* ── ARTÍCULO ───────────────────────────── */}
        <div className="max-w-2xl mx-auto px-4 pb-20">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 py-5">
            <Link to="/blog" className="hover:text-primary-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} strokeWidth={2} /> Blog
            </Link>
            <span>/</span>
            <span className="truncate">{post.title}</span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] ?? 'bg-slate-100 text-slate-600'}`}>
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Clock size={12} strokeWidth={1.8} /> {post.readTime} min de lectura
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(post.date)}</span>
          </div>

          {/* Título */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            {post.title}
          </h1>

          {/* Extracto */}
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8 font-medium border-l-4 border-primary-300 pl-4">
            {post.excerpt}
          </p>

          <div className="border-t border-slate-100 dark:border-slate-800 mb-8" />

          {/* Contenido */}
          <div className="space-y-8">
            {post.sections.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                    {section.heading}
                  </h2>
                )}
                <SectionBody text={section.body} />
              </div>
            ))}
          </div>

          {/* CTA en línea */}
          <div className="mt-12 card p-6 text-center">
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center mx-auto mb-3">
              <PsiconectaLogo size={20} color="white" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white mb-1">¿Quieres hablar con un profesional?</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Conecta con un psicólogo verificado en República Dominicana. Primera sesión sin compromisos.
            </p>
            <Link to="/register" className="btn-premium btn-primary-premium text-sm px-6 py-2.5 mx-auto">
              Encontrar mi terapeuta <ArrowRight size={15} strokeWidth={2} />
            </Link>
          </div>

          {/* Artículos relacionados */}
          {related.length > 0 && (
            <div className="mt-12">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-base">También te puede interesar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map(r => (
                  <Link key={r.slug} to={`/blog/${r.slug}`} className="group card p-4 hover:shadow-md transition-shadow flex gap-3 items-start">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.coverGradient} shrink-0`} />
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{r.category}</p>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-primary-600 transition-colors">
                        {r.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── CTA FINAL ──────────────────────────── */}
        <section className="py-16 px-4 bg-gradient-brand">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-extrabold text-white mb-3">Da el primer paso hoy</h2>
            <p className="text-indigo-100 mb-6 font-medium">Terapeutas verificados. Sin lista de espera. Desde donde estés.</p>
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-[14px] hover:bg-primary-50 transition-colors">
              Comenzar gratis <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </div>
        </section>

        <footer className="py-8 px-4 bg-slate-900 text-center text-xs text-slate-600">
          <Link to="/blog" className="hover:text-slate-400 transition-colors">← Volver al blog</Link>
          <span className="mx-3">·</span>
          <Link to="/" className="hover:text-slate-400 transition-colors">Inicio</Link>
          <span className="mx-3">·</span>
          <span>© {new Date().getFullYear()} Psiconecta</span>
        </footer>
      </div>
    </>
  )
}
