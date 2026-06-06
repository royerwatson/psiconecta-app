import { Link } from 'react-router-dom'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import SEOHead from './SEOHead'
import { Home, Search, BookOpen, ArrowRight } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <>
      <SEOHead
        title="Página no encontrada | Psiconecta"
        description="La página que buscas no existe o fue movida."
        noIndex
      />

      <div className="min-h-screen bg-psiconecta dark:bg-[#0f1117] flex flex-col">

        {/* NAVBAR mínimo */}
        <header className="px-4 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center shadow-sm">
              <PsiconectaLogo size={22} color="white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
              Psico<span className="text-primary-600">necta</span>
            </span>
          </Link>
        </header>

        {/* CONTENIDO */}
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-lg w-full text-center">

            {/* Número 404 decorativo */}
            <div className="relative mb-8">
              <p className="text-[120px] sm:text-[160px] font-extrabold text-transparent bg-clip-text bg-gradient-brand leading-none select-none opacity-20">
                404
              </p>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-gradient-brand rounded-3xl flex items-center justify-center shadow-xl">
                  <PsiconectaLogo size={40} color="white" />
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Esta página no existe
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
              La dirección que escribiste fue movida o nunca existió.
              Aquí tienes algunas opciones para continuar.
            </p>

            {/* Links de recuperación */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[
                { to: '/',            icon: Home,     label: 'Inicio' },
                { to: '/terapeutas', icon: Search,    label: 'Ver terapeutas' },
                { to: '/blog',        icon: BookOpen, label: 'Blog' },
              ].map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <Icon size={18} strokeWidth={1.8} className="text-primary-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                </Link>
              ))}
            </div>

            <Link
              to="/register"
              className="btn-premium btn-primary-premium text-base px-8 py-3.5 mx-auto"
            >
              Comenzar gratis
              <ArrowRight size={18} strokeWidth={1.8} />
            </Link>
          </div>
        </div>

        <footer className="py-6 text-center text-xs text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} Psiconecta
        </footer>
      </div>
    </>
  )
}
