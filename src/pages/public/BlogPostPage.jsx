import { Link, useParams, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import SEOHead from './SEOHead'
import { getBlogPost, getRelatedPosts } from '@/data/blogPosts'
import {
  ArrowRight, ChevronRight, Clock, ArrowLeft,
  HeartPulse, Users, Video, BrainCircuit, CalendarCheck,
} from 'lucide-react'
import { analytics } from '@/lib/analytics'

const ICON_MAP = { HeartPulse, Users, Video, BrainCircuit, CalendarCheck }

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
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${large ? 'h-64 sm:h-96' : 'h-32'}`}>
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
        <circle cx="650" cy="-60" r="300" fill="white" />
        <circle cx="-50" cy="350" r="220" fill="white" />
        <circle cx="400" cy="200" r="80" fill="white" />
      </svg>
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 40 40" preserveAspectRatio="repeat">
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
      {Icon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center ${large ? 'w-24 h-24' : 'w-14 h-14'}`}>
            <Icon size={large ? 48 : 26} strokeWidth={1.4} className="text-white" />
          </div>
        </div>
      )}
    </div>
  )
}

/* Renderiza el body soportando **negrita**, listas y párrafos */
function SectionBody({ text, index }) {
  const paras = text.split('\n\n')
  return (
    <div className="space-y-5">
      {paras.map((para, i) => {
        if (para.startsWith('- ')) {
          const items = para.split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2))
          return (
            <ul key={i} className="space-y-2 pl-1">
              {items.map((item, j) => (
                <li key={j} className="flex items-start gap-3 text-slate-600 dark:text-slate-400 leading-relaxed text-base">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: parseBold(item) }} />
                </li>
              ))}
            </ul>
          )
        }
        /* Pull quote: primer párrafo de secciones pares */
        if (i === 0 && index > 0 && index % 2 === 0) {
          return (
            <blockquote key={i} className="border-l-4 border-primary-400 pl-5 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-r-xl">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base italic font-medium"
                dangerouslySetInnerHTML={{ __html: parseBold(para) }} />
            </blockquote>
          )
        }
        return (
          <p key={i} className="text-slate-600 dark:text-slate-400 leading-relaxed text-base"
            dangerouslySetInnerHTML={{ __html: parseBold(para) }} />
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

  const Icon = ICON_MAP[post.icon]

  useEffect(() => { analytics.viewBlogPost(slug) }, [slug])

  return (
    <>
      <SEOHead
        title={`${post.title} | Blog Psiconecta`}
        description={post.excerpt}
        url={`https://psiconecta.app/blog/${post.slug}`}
        type="article"
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

        {/* PORTADA */}
        <div className="pt-16">
          <PostCover gradient={post.coverGradient} iconName={post.icon} large />
        </div>

        {/* ARTÍCULO */}
        <div className="max-w-2xl mx-auto px-4 pb-20">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 py-5">
            <Link to="/blog" className="hover:text-primary-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} strokeWidth={2} /> Blog
            </Link>
            <span>/</span>
            <span className="truncate text-slate-500 dark:text-slate-400">{post.title}</span>
          </div>

          {/* Meta badges */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] ?? ''}`}>
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Clock size={12} strokeWidth={1.8} /> {post.readTime} min de lectura
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(post.date)}</span>
          </div>

          {/* Título */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-5">
            {post.title}
          </h1>

          {/* Extracto destacado */}
          <div className={`rounded-2xl bg-gradient-to-br ${post.coverGradient} p-5 mb-8`}>
            <p className="text-white font-medium leading-relaxed text-sm sm:text-base">
              {post.excerpt}
            </p>
          </div>

          {/* Contenido */}
          <div className="space-y-10">
            {post.sections.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <div className="flex items-center gap-3 mb-4">
                    {Icon && i > 0 && (
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${post.coverGradient} flex items-center justify-center shrink-0`}>
                        <Icon size={16} strokeWidth={1.8} className="text-white" />
                      </div>
                    )}
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {section.heading}
                    </h2>
                  </div>
                )}
                <SectionBody text={section.body} index={i} />
                {i < post.sections.length - 1 && (
                  <div className="mt-10 flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${post.coverGradient}`} />
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA integrado */}
          <div className={`mt-12 rounded-2xl bg-gradient-to-br ${post.coverGradient} p-6 text-center`}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <PsiconectaLogo size={20} color="white" />
            </div>
            <p className="font-bold text-white mb-1">¿Quieres hablar con un profesional?</p>
            <p className="text-white/80 text-sm mb-4">
              Conecta con un psicólogo verificado en República Dominicana. Primera sesión sin compromisos.
            </p>
            <Link to="/register" onClick={() => analytics.clickBlogCTA(slug)} className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors text-sm">
              Encontrar mi terapeuta <ArrowRight size={15} strokeWidth={2} />
            </Link>
          </div>

          {/* Artículos relacionados */}
          {related.length > 0 && (
            <div className="mt-12">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 text-base">También te puede interesar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map(r => {
                  const RelIcon = ICON_MAP[r.icon]
                  return (
                    <Link key={r.slug} to={`/blog/${r.slug}`} className="group card overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                      <div className={`h-24 relative overflow-hidden bg-gradient-to-br ${r.coverGradient}`}>
                        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">
                          <circle cx="160" cy="-20" r="100" fill="white" />
                          <circle cx="-10" cy="90" r="70" fill="white" />
                        </svg>
                        {RelIcon && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                              <RelIcon size={20} strokeWidth={1.6} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{r.category} · {r.readTime} min</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-primary-600 transition-colors">
                          {r.title}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* CTA FINAL */}
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
