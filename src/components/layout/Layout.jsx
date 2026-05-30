import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import OnboardingSlides from '@/components/onboarding/OnboardingSlides'

// ─── Navegación ───────────────────────────────────────────────────────────────

const therapistNav = [
  { to: '/therapist/dashboard', icon: '🏠', label: 'Inicio'     },
  { to: '/therapist/schedule',  icon: '📅', label: 'Agenda'     },
  { to: '/therapist/patients',  icon: '👥', label: 'Pacientes'  },
  { to: '/therapist/tests',     icon: '🧪', label: 'Tests'      },
  { to: '/therapist/dsm',       icon: '📖', label: 'DSM-5-TR'   },
  { to: '/therapist/cie',       icon: '🏥', label: 'CIE-11'     },
  { to: '/therapist/scales',      icon: '🧮', label: 'Escalas'    },
  { to: '/therapist/safety-plan', icon: '🛡️', label: 'Plan Crisis' },
  { to: '/therapist/library',     icon: '📚', label: 'Biblioteca'  },
  { to: '/therapist/peers',       icon: '👨‍⚕️', label: 'Colegas'    },
  { to: '/therapist/protocols',   icon: '🗂️', label: 'Protocolos' },
  { to: '/therapist/chat',        icon: '💬', label: 'Mensajes'   },
  { to: '/therapist/profile',   icon: '⚙️', label: 'Perfil'     },
]

const patientNav = [
  { to: '/patient/dashboard',    icon: '🏠', label: 'Inicio'     },
  { to: '/patient/find',         icon: '🔍', label: 'Terapeutas' },
  { to: '/patient/appointments', icon: '📅', label: 'Mis Citas'  },
  { to: '/patient/tasks',        icon: '📋', label: 'Mis Tareas' },
  { to: '/patient/journal',      icon: '📓', label: 'Diario'     },
  { to: '/patient/chat',         icon: '💬', label: 'Mensajes'   },
  { to: '/patient/profile',      icon: '⚙️', label: 'Perfil'     },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Layout() {
  const { profile, role, user, signOut } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const nav       = role === 'therapist' ? therapistNav : patientNav

  const [unreadCount, setUnreadCount]   = useState(0)
  const [alertCount, setAlertCount]     = useState(0)
  const [showLogout, setShowLogout]     = useState(false)
  const lastSeenKey = user ? `chat_last_seen_${user.id}` : null
  const channelRef  = useRef(null)

  // ── Mensajes no leídos ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    countUnread()

    channelRef.current = supabase
      .channel(`unread-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        const chatPaths = ['/patient/chat', '/therapist/chat']
        if (!chatPaths.some(p => location.pathname.startsWith(p))) {
          setUnreadCount(c => c + 1)
        }
      })
      .subscribe()

    return () => { channelRef.current?.unsubscribe() }
  }, [user?.id])

  useEffect(() => {
    const chatPaths = ['/patient/chat', '/therapist/chat']
    if (chatPaths.some(p => location.pathname.startsWith(p))) {
      setUnreadCount(0)
      if (lastSeenKey) localStorage.setItem(lastSeenKey, new Date().toISOString())
    }
  }, [location.pathname])

  const countUnread = async () => {
    const lastSeen = lastSeenKey ? localStorage.getItem(lastSeenKey) : null
    const since    = lastSeen ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .gte('created_at', since)
    setUnreadCount(count ?? 0)
  }

  // ── Alertas IA riesgo alto — solo terapeuta ─────────────────────────────────
  useEffect(() => {
    if (!user || role !== 'therapist') return
    supabase
      .from('ai_checkins')
      .select('id', { count: 'exact', head: true })
      .eq('therapist_id', user.id)
      .eq('risk_level', 'high')
      .eq('notified', false)
      .then(({ count }) => setAlertCount(count ?? 0))
  }, [user?.id, role])

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    setShowLogout(false)
    await signOut()
    navigate('/login')
    toast.success('Sesión cerrada correctamente')
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col bg-warm-50">
      <OnboardingSlides />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-warm-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* Logo */}
          <button
            onClick={() => navigate(role === 'therapist' ? '/therapist/dashboard' : '/patient/dashboard')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">🧠</span>
            <span className="font-serif font-bold text-primary-700 text-lg tracking-tight">
              Psico<span className="text-calm-500">necta</span>
            </span>
          </button>

          {/* Derecha: campana alertas + usuario */}
          <div className="flex items-center gap-2">

            {/* Campana alertas IA — solo terapeuta */}
            {role === 'therapist' && alertCount > 0 && (
              <button
                onClick={() => navigate('/therapist/dashboard')}
                title={`${alertCount} alerta${alertCount !== 1 ? 's' : ''} de bienestar`}
                className="relative p-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                <span className="text-xl">🔔</span>
                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              </button>
            )}

            {/* Avatar + nombre — desktop */}
            <button
              onClick={() => navigate(role === 'therapist' ? '/therapist/profile' : '/patient/profile')}
              className="hidden sm:flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <Avatar name={profile?.full_name ?? ''} size="sm" />
              <div className="text-left">
                <p className="text-sm font-medium text-warm-800 leading-none">
                  {profile?.full_name ?? 'Usuario'}
                </p>
                <p className="text-xs text-warm-400 mt-0.5">
                  {role === 'therapist' ? '🧑‍⚕️ Terapeuta' : '🙋 Paciente'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ── Layout: sidebar + contenido ── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4">
        <div className="flex gap-6 pt-6 pb-24 sm:pb-10">

          {/* ── Sidebar desktop (sticky) ── */}
          <aside className="hidden sm:block w-52 shrink-0">
            <nav className="sticky top-24 flex flex-col gap-0.5 bg-white rounded-2xl shadow-card border border-warm-100 p-2 max-h-[calc(100dvh-7rem)] overflow-y-auto">
              {nav.map(({ to, icon, label }) => {
                const isChat = label === 'Mensajes'
                return (
                  <NavLink key={to} to={to}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-primary-50 to-calm-50 text-primary-700 shadow-sm border border-primary-100'
                        : 'text-warm-500 hover:bg-warm-50 hover:text-warm-800',
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative shrink-0">
                          <span className={cn('text-lg block transition-transform', isActive && 'scale-110')}>
                            {icon}
                          </span>
                          {isChat && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </span>
                        <span className="flex-1">{label}</span>
                        {isChat && unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shrink-0">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}

              <div className="border-t border-warm-100 my-1" />

              {/* Cerrar sesión en sidebar */}
              <button
                onClick={() => setShowLogout(true)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-warm-400 hover:bg-red-50 hover:text-red-500 transition-all w-full text-left"
              >
                <span className="text-lg">🚪</span>
                <span>Cerrar sesión</span>
              </button>
            </nav>
          </aside>

          {/* ── Contenido principal ── */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ── Nav inferior móvil ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-warm-100 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch overflow-x-auto scrollbar-none">
          {nav.map(({ to, icon, label }) => {
            const isChat = label === 'Mensajes'
            return (
              <NavLink key={to} to={to}
                className={({ isActive }) => cn(
                  'shrink-0 flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-w-[52px] text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary-600' : 'text-warm-400 hover:text-warm-600',
                )}
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <span className={cn('text-lg transition-transform block', isActive && 'scale-110')}>
                        {icon}
                      </span>
                      {isChat && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="truncate max-w-[48px] text-center">{label}</span>
                    {isActive && <span className="w-1 h-1 rounded-full bg-primary-500" />}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* ── Modal logout con confirmación ── */}
      {showLogout && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowLogout(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-float border border-warm-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <span className="text-4xl">👋</span>
              <p className="font-serif font-semibold text-warm-900 mt-3">¿Cerrar sesión?</p>
              <p className="text-sm text-warm-400 mt-1">
                Tendrás que volver a iniciar sesión para acceder.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 py-2.5 rounded-xl border border-warm-200 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
