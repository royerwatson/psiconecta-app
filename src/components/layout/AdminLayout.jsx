import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutDashboard, Bot, Stethoscope, Users, Calendar,
  UsersRound, TrendingUp, Wallet, ArrowDownToLine,
  ClipboardList, Star, LogOut,
} from 'lucide-react'

const NAV = [
  { to: '/admin/dashboard',  Icon: LayoutDashboard,   label: 'Dashboard'     },
  { to: '/admin/ai-alerts',  Icon: Bot,               label: 'Alertas IA'   },
  { to: '/admin/therapists', Icon: Stethoscope,        label: 'Terapeutas'   },
  { to: '/admin/patients',   Icon: Users,             label: 'Pacientes'    },
  { to: '/admin/sessions',   Icon: Calendar,          label: 'Sesiones'     },
  { to: '/admin/groups',     Icon: UsersRound,        label: 'Grupales'     },
  { to: '/admin/stats',      Icon: TrendingUp,        label: 'Estadísticas' },
  { to: '/admin/financial',  Icon: Wallet,            label: 'Finanzas'     },
  { to: '/admin/payouts',    Icon: ArrowDownToLine,   label: 'Pagos'        },
  { to: '/admin/activity',   Icon: ClipboardList,     label: 'Actividad'    },
  { to: '/admin/reviews',    Icon: Star,              label: 'Reseñas'      },
]

export default function AdminLayout() {
  const { signOut } = useAuthStore()
  const navigate = useNavigate()

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

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(({ to, Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-primary-300 hover:bg-white/10 hover:text-white'
                }`
              }>
              <Icon size={17} strokeWidth={1.8} />
              {label}
            </NavLink>
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
            `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-all ${
              isActive ? 'text-white' : 'text-primary-400'
            }`}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Contenido */}
      <main className="flex-1 sm:ml-56 pb-20 sm:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
