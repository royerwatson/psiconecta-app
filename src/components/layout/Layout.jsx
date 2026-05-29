import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import OnboardingSlides from '@/components/onboarding/OnboardingSlides'
import { useState, useEffect, useRef } from 'react'

// Navegación para terapeuta
const therapistNav = [
  { to: '/therapist/dashboard', icon: '🏠', label: 'Inicio' },
  { to: '/therapist/schedule',  icon: '📅', label: 'Agenda' },
  { to: '/therapist/patients',  icon: '👥', label: 'Pacientes' },
  { to: '/therapist/chat',      icon: '💬', label: 'Mensajes' },
  { to: '/therapist/profile',   icon: '⚙️', label: 'Perfil' },
]

// Navegación para paciente
const patientNav = [
  { to: '/patient/dashboard',    icon: '🏠', label: 'Inicio'      },
  { to: '/patient/find',         icon: '🔍', label: 'Terapeutas'  },
  { to: '/patient/appointments', icon: '📅', label: 'Mis Citas'   },
  { to: '/patient/chat',         icon: '💬', label: 'Mensajes'    },
  { to: '/patient/profile',      icon: '⚙️', label: 'Perfil'      },
]

export default function Layout() {
  const { profile, role, user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const nav = role === 'therapist' ? therapistNav : patientNav
  const [unreadCount, setUnreadCount] = useState(0)
  const lastSeenKey = user ? `chat_last_seen_${user.id}` : null
  const channelRef = useRef(null)

  // Contar mensajes no leídos desde la última visita al chat
  useEffect(() => {
    if (!user) return
    countUnread()

    // Suscripción en tiempo real
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

  // Resetear badge al entrar al chat
  useEffect(() => {
    const chatPaths = ['/patient/chat', '/therapist/chat']
    if (chatPaths.some(p => location.pathname.startsWith(p))) {
      setUnreadCount(0)
      if (lastSeenKey) localStorage.setItem(lastSeenKey, new Date().toISOString())
    }
  }, [location.pathname])

  const countUnread = async () => {
    const lastSeen = lastSeenKey ? localStorage.getItem(lastSeenKey) : null
    const since = lastSeen ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .gte('created_at', since)
    setUnreadCount(count ?? 0)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
    toast.success('Sesión cerrada correctamente')
  }

  return (
    <div className="min-h-dvh flex flex-col bg-warm-50">
      <OnboardingSlides />
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-warm-100 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="font-serif font-bold text-primary-700 text-lg tracking-tight">
              Psico<span className="text-calm-500">necta</span>
            </span>
          </div>

          {/* Usuario + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Avatar name={profile?.full_name ?? ''} size="sm" />
              <div className="text-right">
                <p className="text-sm font-medium text-warm-800 leading-none">
                  {profile?.full_name ?? 'Usuario'}
                </p>
                <p className="text-xs text-warm-400 capitalize mt-0.5">
                  {role === 'therapist' ? '🧑‍⚕️ Terapeuta' : '🙋 Paciente'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs text-warm-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-24 sm:pb-8">
        <Outlet />
      </main>

      {/* Barra de navegación inferior (móvil) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-warm-100 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch">
          {nav.map(({ to, icon, label }) => {
            const isChat = label === 'Mensajes'
            return (
              <NavLink key={to} to={to}
                className={({ isActive }) => cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-colors',
                  isActive ? 'text-primary-600' : 'text-warm-400 hover:text-warm-600',
                )}
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <span className={cn('text-xl transition-transform block', isActive && 'scale-110')}>{icon}</span>
                      {isChat && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </span>
                    <span>{label}</span>
                    {isActive && <span className="w-1 h-1 rounded-full bg-primary-500 mt-0.5" />}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Navegación lateral (desktop) */}
      <nav className="fixed top-16 left-4 hidden sm:flex flex-col gap-1 bg-white rounded-2xl shadow-card border border-warm-100 p-2 z-20">
        {nav.map(({ to, icon, label }) => {
          const isChat = label === 'Mensajes'
          return (
            <NavLink key={to} to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive ? 'bg-primary-50 text-primary-700' : 'text-warm-500 hover:bg-warm-50 hover:text-warm-800',
              )}
            >
              <span className="relative">
                <span className="text-lg">{icon}</span>
                {isChat && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
              {isChat && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
