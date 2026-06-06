/**
 * LegalPage — Layout compartido para páginas legales.
 * Uso: <LegalPage title="..." subtitle="..." updated="...">contenido</LegalPage>
 */
import { Link } from 'react-router-dom'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import SEOHead from './SEOHead'
import { ChevronRight, ArrowLeft } from 'lucide-react'

export default function LegalPage({ title, subtitle, updated, url, children }) {
  return (
    <>
      <SEOHead
        title={`${title} | Psiconecta`}
        description={subtitle}
        url={`https://psiconecta.app${url}`}
        noIndex={false}
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
        <section className="pt-28 pb-10 px-4 bg-psiconecta dark:bg-[#0f1117] border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-3xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-600 transition-colors mb-4">
              <ArrowLeft size={12} strokeWidth={2} /> Volver al inicio
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              {title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">{subtitle}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Última actualización: {updated}</p>
          </div>
        </section>

        {/* CONTENIDO */}
        <div className="max-w-3xl mx-auto px-4 py-12 pb-20">
          <div className="prose-legal">
            {children}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="py-8 px-4 bg-slate-900 text-center text-xs text-slate-600">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/terminos"   className="hover:text-slate-400 transition-colors">Términos de uso</Link>
            <span>·</span>
            <Link to="/privacidad" className="hover:text-slate-400 transition-colors">Privacidad</Link>
            <span>·</span>
            <Link to="/reembolsos" className="hover:text-slate-400 transition-colors">Reembolsos</Link>
            <span>·</span>
            <Link to="/"           className="hover:text-slate-400 transition-colors">Inicio</Link>
          </div>
          <p className="mt-3">© {new Date().getFullYear()} Psiconecta. Todos los derechos reservados.</p>
        </footer>
      </div>
    </>
  )
}

/* Componentes de contenido legal reutilizables */
export function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        {title}
      </h2>
      <div className="space-y-3 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
        {children}
      </div>
    </section>
  )
}

export function P({ children }) {
  return <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{children}</p>
}

export function Ul({ items }) {
  return (
    <ul className="space-y-1.5 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Highlight({ children }) {
  return (
    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl p-4 text-sm text-primary-800 dark:text-primary-300 font-medium">
      {children}
    </div>
  )
}
