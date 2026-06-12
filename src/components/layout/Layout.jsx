import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import OnboardingSlides from '@/components/onboarding/OnboardingSlides'
import NotificationBell from '@/components/ui/NotificationBell'
import { initPushNotifications } from '@/lib/pushNotifications'
import {
  Home, Calendar, MessageCircle, User, Search,
  Users, ClipboardList, BookOpen, Clock, Heart,
  LayoutDashboard, TestTube, Shield, Library,
  BookMarked, Stethoscope, FolderOpen, MoreHorizontal,
  X, Zap, Bell, ChevronRight, LogOut, Crown, TrendingUp, Lock, Moon, Sun,
} from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import { useDarkMode } from '@/hooks/useDarkMode'

// ─── Navegación ────────────────────────────────────────────────────────────────

const THERAPIST_PRIMARY = [
  { to: '/therapist/dashboard', icon: Home,          label: 'Inicio'    },
  { to: '/therapist/schedule',  icon: Calendar,      label: 'Agenda'    },
  { to: '/therapist/patients',  icon: Users,         label: 'Pacientes' },
  { to: '/therapist/chat',      icon: MessageCircle, label: 'Mensajes', badge: 'chat' },
  { to: '/therapist/profile',   icon: User,          label: 'Perfil'    },
]
const THERAPIST_SECONDARY = [
  { to: '/therapist/subscription', icon: Crown,          label: 'Mi plan'       },
  { to: '/therapist/stats',        icon: TrendingUp,     label: 'Estadísticas'  },
  { to: '/therapist/tests',        icon: TestTube,       label: 'Tests'         },
  { to: '/therapist/dsm',          icon: BookOpen,       label: 'DSM-5-TR'   },
  { to: '/therapist/cie',          icon: BookMarked,     label: 'CIE-11'      },
  { to: '/therapist/scales',       icon: LayoutDashboard,label: 'Escalas'     },
  { to: '/therapist/safety-plan',  icon: Shield,         label: 'Plan Crisis' },
  { to: '/therapist/library',      icon: Library,        label: 'Biblioteca'  },
  { to: '/therapist/peers',        icon: Stethoscope,    label: 'Colegas'     },
  { to: '/therapist/protocols',    icon: FolderOpen,     label: 'Protocolos'  },
]

const PATIENT_PRIMARY = [
  { to: '/patient/dashboard',    icon: Home,          label: 'Inicio'  },
  { to: '/patient/find',         icon: Search,        label: 'Buscar'  },
  { to: '/patient/appointments', icon: Calendar,      label: 'Citas'   },
  { to: '/patient/chat',         icon: MessageCircle, label: 'Mensajes', badge: 'chat' },
  { to: '/patient/profile',      icon: User,          label: 'Perfil'  },
]
const PATIENT_SECONDARY = [
  { to: '/patient/tasks',    icon: ClipboardList, label: 'Mis Tareas' },
  { to: '/patient/journal',  icon: BookOpen,      label: 'Diario'     },
  { to: '/patient/sessions', icon: Clock,         label: 'Historial'  },
  { to: '/patient/crisis',   icon: Heart,         label: 'Apoyo'      },
]

// ─── Sidebar nav item ─────────────────────────────────────────────────────────

function SideNavItem({ to, icon: Icon, label, unread = 0 }) {
  return (
    <NavLink to={to}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200',
        isActive
          ? 'gradient-brand text-white shadow-[0_4px_12px_rgba(79,70,229,0.35)]'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
      )}
    >
      {({ isActive }) => (
        <>
          <span className="relative shrink-0">
            <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </span>
          <span className="flex-1 truncate tracking-[-0.01em]">{label}</span>
          {unread > 0 && !isActive && (
            <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

// ─── Bottom tab item ──────────────────────────────────────────────────────────

function TabItem({ to, icon: Icon, label, unread = 0 }) {
  const location = useLocation()
  const isActive = location.pathname.startsWith(to)

  return (
    <NavLink to={to}
      className="relative flex-1 flex flex-col items-center justify-center gap-1 pt-2 pb-1 min-w-0"
    >
      <span className="relative">
        <span className={cn(
          'flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300',
          isActive
            ? 'gradient-brand shadow-[0_4px_12px_rgba(79,70,229,0.40)] scale-110'
            : 'hover:bg-slate-100',
        )}>
          <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8}
            className={isActive ? 'text-white' : 'text-slate-400'} />
        </span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </span>
      <span className={cn(
        'text-[10px] font-bold tracking-tight truncate leading-none transition-colors',
        isActive ? 'text-indigo-600' : 'text-slate-400',
      )}>
        {label}
      </span>
    </NavLink>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

// Rutas que requieren plan Suscripción
const PRO_ROUTES = new Set([
  '/therapist/tests', '/therapist/dsm', '/therapist/cie',
  '/therapist/scales', '/therapist/safety-plan', '/therapist/library',
  '/therapist/peers', '/therapist/protocols', '/therapist/stats',
])

export default function Layout() {
  const { profile, role, user, signOut } = useAuthStore()
  const { isDark, toggle: toggleDark } = useDarkMode()
  const navigate  = useNavigate()
  const location  = useLocation()

  const primaryNav   = role === 'therapist' ? THERAPIST_PRIMARY   : PATIENT_PRIMARY
  const secondaryNav = role === 'therapist' ? THERAPIST_SECONDARY : PATIENT_SECONDARY

  const [unreadCount, setUnreadCount] = useState(0)
  const [alertCount, setAlertCount]   = useState(0)
  const [showMore, setShowMore]       = useState(false)
  const [showLogout, setShowLogout]   = useState(false)
  const [therapistPlan, setTherapistPlan] = useState('basic')
  const lastSeenKey  = user ? `chat_last_seen_${user.id}` : null
  const channelRef   = useRef(null)
  const drawerRef    = useRef(null)

  // Push notifications nativas (no-op en web)
  useEffect(() => {
    if (!user) return
    initPushNotifications(user.id, navigate)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Plan del terapeuta (para mostrar candado en nav)
  useEffect(() => {
    if (!user || role !== 'therapist') return
    supabase.from('therapist_profiles')
      .select('subscription_plan')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setTherapistPlan(data?.subscription_plan ?? 'basic'))
  }, [user, role])

  // Mensajes no leídos
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
    setShowMore(false)
  }, [location.pathname])

  const countUnread = async () => {
    const lastSeen = lastSeenKey ? localStorage.getItem(lastSeenKey) : null
    const since    = lastSeen ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('messages').select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id).gte('created_at', since)
    setUnreadCount(count ?? 0)
  }

  // Alertas IA (terapeuta)
  useEffect(() => {
    if (!user || role !== 'therapist') return
    supabase.from('ai_checkins')
      .select('id', { count: 'exact', head: true })
      .eq('therapist_id', user.id).eq('risk_level', 'high').eq('notified', false)
      .then(({ count }) => setAlertCount(count ?? 0))
  }, [user?.id, role])

  // Cerrar drawer al clic afuera
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setShowMore(false)
    }
    if (showMore) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMore])

  const handleSignOut = async () => {
    setShowLogout(false)
    await signOut()
    navigate('/login')
    toast.success('Sesión cerrada correctamente')
  }

  const secondaryActive = secondaryNav.some(n => location.pathname.startsWith(n.to))

  return (
    <div className="min-h-dvh flex flex-col bg-warm-50">
      <OnboardingSlides />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-warm-100/80">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

          <button
            onClick={() => navigate(role === 'therapist' ? '/therapist/dashboard' : '/patient/dashboard')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
              <PsiconectaLogo size={18} color="white" />
            </div>
            <span className="font-bold text-warm-900 tracking-tight">
              Psico<span className="text-transparent bg-clip-text bg-gradient-brand">necta</span>
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button onClick={toggleDark}
              className="p-2 rounded-xl hover:bg-warm-100 transition-colors"
              title={isDark ? 'Modo claro' : 'Modo oscuro'}>
              {isDark
                ? <Sun size={18} strokeWidth={1.8} className="text-warm-500" />
                : <Moon size={18} strokeWidth={1.8} className="text-warm-500" />}
            </button>
            {role === 'client' && <NotificationBell userId={user?.id} />}

            {role === 'therapist' && alertCount > 0 && (
              <button onClick={() => navigate('/therapist/dashboard')}
                className="relative p-2 rounded-xl hover:bg-red-50 transition-colors">
                <Bell size={18} className="text-warm-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            )}

            <button
              onClick={() => navigate(role === 'therapist' ? '/therapist/profile' : '/patient/profile')}
              className="hidden sm:flex items-center gap-2 pl-2 hover:opacity-80 transition-opacity"
            >
              <Avatar name={profile?.full_name ?? ''} size="sm" />
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-warm-800 leading-none">
                  {profile?.full_name?.split(' ')[0] ?? 'Usuario'}
                </p>
                <p className="text-xs text-warm-400 mt-0.5">
                  {role === 'therapist' ? 'Terapeuta' : 'Paciente'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenido ── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4">
        <div className="flex gap-6 pt-6 pb-28 sm:pb-10">

          {/* Sidebar desktop */}
          <aside className="hidden sm:block w-52 shrink-0">
            <nav className="sticky top-20 flex flex-col gap-0.5 bg-white/90 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100/60 p-2 max-h-[calc(100dvh-6rem)] overflow-y-auto scrollbar-none">
              {primaryNav.map(({ to, icon, label, badge }) => (
                <SideNavItem key={to} to={to} icon={icon} label={label}
                  unread={badge === 'chat' ? unreadCount : 0} />
              ))}
              <div className="my-1.5 h-px bg-warm-100" />
              {secondaryNav.map(({ to, icon, label }) => {
                const isLocked = role === 'therapist' && therapistPlan === 'basic' && PRO_ROUTES.has(to)
                return (
                  <div key={to} className="relative">
                    <SideNavItem to={to} icon={icon} label={label} />
                    {isLocked && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Lock size={11} strokeWidth={2} className="text-warm-300" />
                      </span>
                    )}
                  </div>
                )
              })}
              <div className="my-1.5 h-px bg-warm-100" />
              <button onClick={() => setShowLogout(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-warm-400 hover:bg-red-50 hover:text-red-500 transition-all w-full text-left">
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </button>
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {/* key por ruta → fade suave en cada navegación */}
            <div key={location.pathname} className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* ── Tab bar móvil ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 nav-glass sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-16">
          {primaryNav.map(({ to, icon, label, badge }) => (
            <TabItem key={to} to={to} icon={icon} label={label}
              unread={badge === 'chat' ? unreadCount : 0} />
          ))}

          {/* Botón Más */}
          <button
            onClick={() => setShowMore(v => !v)}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1"
          >
            <span className={cn(
              'flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200',
              showMore && 'bg-accent-100',
            )}>
              {showMore
                ? <X size={19} className="text-accent-600" strokeWidth={2} />
                : <MoreHorizontal size={19} className={secondaryActive ? 'text-accent-500' : 'text-warm-400'} strokeWidth={1.8} />
              }
            </span>
            <span className={cn(
              'text-[10px] font-semibold truncate leading-none',
              (showMore || secondaryActive) ? 'text-accent-600' : 'text-warm-400',
            )}>
              Más
            </span>
            {secondaryActive && !showMore && (
              <span className="absolute top-2 right-3 w-1.5 h-1.5 bg-accent-500 rounded-full" />
            )}
          </button>
        </div>
      </nav>

      {/* ── Drawer secundario ── */}
      {showMore && (
        <div className="fixed inset-0 z-20 sm:hidden bg-black/20 backdrop-blur-sm"
          onClick={() => setShowMore(false)}>
          <div
            ref={drawerRef}
            className="absolute bottom-16 left-0 right-0 bg-white rounded-t-3xl shadow-float border-t border-warm-100 p-4 animate-slide-up"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-warm-200 rounded-full mx-auto mb-4" />
            <p className="text-xs font-bold text-warm-400 uppercase tracking-widest px-1 mb-3">
              Más secciones
            </p>
            <div className="grid grid-cols-2 gap-2">
              {secondaryNav.map(({ to, icon: Icon, label }) => {
                const isActive  = location.pathname.startsWith(to)
                const isLocked  = role === 'therapist' && therapistPlan === 'basic' && PRO_ROUTES.has(to)
                return (
                  <NavLink key={to} to={to} onClick={() => setShowMore(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all relative',
                      isActive
                        ? 'bg-accent-50 text-accent-700 border border-accent-100'
                        : 'bg-warm-50 text-warm-700 hover:bg-warm-100',
                    )}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="truncate flex-1">{label}</span>
                    {isLocked && <Lock size={11} strokeWidth={2} className="text-warm-300 shrink-0" />}
                  </NavLink>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-warm-100">
              <button onClick={() => { setShowMore(false); setShowLogout(true) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-warm-400 hover:bg-red-50 hover:text-red-500 transition-all">
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Crisis button ── */}
      {role === 'client' && (
        <button
          onClick={() => navigate('/patient/crisis')}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-accent-600 to-primary-600 hover:opacity-90 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-float transition-all"
        >
          <Heart size={14} strokeWidth={2.5} />
          <span className="hidden sm:inline">Apoyo en crisis</span>
          <span className="sm:hidden">SOS</span>
        </button>
      )}

      {/* ── Logout modal ── */}
      {showLogout && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowLogout(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-float"
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-warm-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <LogOut size={22} className="text-warm-500" />
              </div>
              <p className="font-bold text-warm-900 text-lg">¿Cerrar sesión?</p>
              <p className="text-sm text-warm-400 mt-1">
                Tendrás que volver a iniciar sesión para acceder.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)}
                className="flex-1 py-3 rounded-xl border border-warm-200 text-sm font-semibold text-warm-600 hover:bg-warm-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSignOut}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
