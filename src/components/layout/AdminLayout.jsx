import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Bot, Stethoscope, Users, Calendar,
  UsersRound, TrendingUp, Wallet, ArrowDownToLine, RotateCcw,
  ClipboardList, Star, Crown, LogOut, Trash2,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    title: null,
    items: [
      { to: '/admin/dashboard',     Icon: LayoutDashboard,  label: 'Dashboard'      },
    ],
  },
  {
    title: 'Personas',
    items: [
      { to: '/admin/therapists',    Icon: Stethoscope,      label: 'Terapeutas'     },
      { to: '/admin/patients',      Icon: Users,            label: 'Pacientes'      },
      { to: '/admin/reviews',       Icon: Star,             label: 'Reseñas'        },
    ],
  },
  {
    title: 'Clínico',
    items: [
      { to: '/admin/ai-alerts',     Icon: Bot,              label: 'Alertas IA'     },
      { to: '/admin/sessions',      Icon: Calendar,         label: 'Sesiones'       },
      { to: '/admin/groups',        Icon: UsersRound,       label: 'Grupales'       },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { to: '/admin/financial',     Icon: Wallet,           label: 'Finanzas'       },
      { to: '/admin/payouts',       Icon: ArrowDownToLine,  label: 'Pagos'          },
      { to: '/admin/refunds',       Icon: RotateCcw,        label: 'Reembolsos'     },
      { to: '/admin/subscriptions', Icon: Crown,            label: 'Suscripciones'  },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { to: '/admin/stats',         Icon: TrendingUp,       label: 'Estadísticas'   },
      { to: '/admin/activity',      Icon: ClipboardList,    label: 'Actividad'      },
      { to: '/admin/deletions',     Icon: Trash2,           label: 'Elim. de datos' },
    ],
  },
]

// Lista plana para la barra inferior móvil
const NAV = NAV_GROUPS.flatMap(g => g.items)

export default function AdminLayout() {
  const { signOut } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [pending, setPending] = useState({})

  // Badges de pendientes: el admin ve dónde hay trabajo sin entrar sección
  // por sección. Se refresca al navegar y cada 60s.
  useEffect(() => {
    let active = true
    const fetchPending = async () => {
      const [creds, alerts, refunds, deletions] = await Promise.all([
        supabase.from('therapist_credentials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('ai_checkins').select('id', { count: 'exact', head: true }).in('risk_level', ['high', 'medium']).is('therapist_reviewed_at', null),
        supabase.from('refunds').select('id', { count: 'exact', head: true }).in('status', ['pending', 'disputed', 'failed']),
        supabase.from('deletion_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      if (!active) return
      setPending({
        '/admin/therapists': creds.count ?? 0,
        '/admin/ai-alerts':  alerts.count ?? 0,
        '/admin/refunds':    refunds.count ?? 0,
        '/admin/deletions':  deletions.count ?? 0,
      })
    }
    fetchPending()
    const interval = setInterval(fetchPending, 60_000)
    return () => { active = false; clearInterval(interval) }
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-dvh bg-warm-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-primary-900 flex flex-col fixed top-0 left-0 h-full z-20 hidden sm:flex">
        <div className="px-5 py-6 border-b border-primary-800">
          <p className="font-serif text-xl font-bold text-white">
            Psico<span className="text-calm-300">necta</span>
          </p>
          <p className="text-xs text-primary-300 mt-0.5">Panel Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.title ?? 'top'} className={gi > 0 ? 'mt-3' : ''}>
              {group.title && (
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-400/80">
                  {group.title}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map(({ to, Icon, label }) => (
                  <NavLink key={to} to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'text-primary-300 hover:bg-white/10 hover:text-white'
                      }`
                    }>
                    <Icon size={17} strokeWidth={1.8} />
                    <span className="flex-1">{label}</span>
                    {pending[to] > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {pending[to] > 99 ? '99+' : pending[to]}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-primary-800">
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-primary-300 hover:bg-white/10 hover:text-white transition-all">
            <LogOut size={17} strokeWidth={1.8} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Bottom nav móvil */}
      <nav className="fixed bottom-0 left-0 right-0 bg-primary-900 flex sm:hidden z-20 border-t border-primary-800">
        {NAV.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-all relative ${
              isActive ? 'text-white' : 'text-primary-400'
            }`}>
            <span className="relative">
              <Icon size={18} strokeWidth={1.8} />
              {pending[to] > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {pending[to] > 9 ? '9+' : pending[to]}
                </span>
              )}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Contenido */}
      <main className="flex-1 sm:ml-56 pb-20 sm:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
