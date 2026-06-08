/**
 * AdminSubscriptions — Panel de suscripciones y comisiones.
 *
 * Muestra:
 *   - MRR (Monthly Recurring Revenue) de suscripciones
 *   - Comisiones acumuladas del mes
 *   - Lista de terapeutas con su plan actual
 *   - Gestión manual de planes (upgrade/downgrade)
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Spinner'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'
import { Crown, Star, Zap, TrendingUp, DollarSign, Users, Check } from 'lucide-react'

const PLAN_CONFIG = {
  basic:   { label: 'Básico',   color: 'bg-warm-100 text-warm-600',       Icon: Zap,   price: 0,   commission: 20  },
  pro:     { label: 'Pro',      color: 'bg-primary-100 text-primary-700', Icon: Star,  price: 50,  commission: 10  },
  premium: { label: 'Premium',  color: 'bg-amber-100 text-amber-700',     Icon: Crown, price: 79,  commission: 10  },
}

export default function AdminSubscriptions() {
  const [therapists, setTherapists] = useState([])
  const [loading, setLoading]       = useState(true)
  const [changing, setChanging]     = useState(null)
  const [filter, setFilter]         = useState('all')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('therapist_profiles')
      .select(`
        user_id, subscription_plan, commission_rate, plan_expires_at,
        price_per_session, sessions_count,
        profile:profiles!therapist_profiles_user_id_fkey(full_name, avatar_url, email)
      `)
      .order('subscription_plan')

    setTherapists(data ?? [])
    setLoading(false)
  }

  const changePlan = async (userId, newPlan) => {
    setChanging(userId)
    const { error } = await supabase
      .from('therapist_profiles')
      .update({
        subscription_plan: newPlan,
        plan_expires_at: newPlan === 'basic' ? null : new Date(Date.now() + 30 * 86400000).toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      toast.error('Error cambiando el plan')
    } else {
      toast.success(`Plan actualizado a ${PLAN_CONFIG[newPlan].label}`)
      fetchData()
    }
    setChanging(null)
  }

  // Métricas
  const mrr = therapists.reduce((sum, t) => sum + (PLAN_CONFIG[t.subscription_plan]?.price ?? 0), 0)
  const proCount     = therapists.filter(t => t.subscription_plan === 'pro').length
  const premiumCount = therapists.filter(t => t.subscription_plan === 'premium').length
  const basicCount   = therapists.filter(t => t.subscription_plan === 'basic').length

  const filtered = filter === 'all' ? therapists : therapists.filter(t => t.subscription_plan === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-900">Suscripciones</h1>
        <p className="text-warm-500 text-sm mt-0.5">Planes activos y comisiones por terapeuta</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-warm-100 rounded-2xl p-4">
          <p className="text-xs text-warm-400 font-medium mb-1">MRR Suscripciones</p>
          <p className="text-2xl font-bold text-warm-900">${mrr}</p>
          <p className="text-xs text-warm-400 mt-0.5">/mes en planes</p>
        </div>
        <div className="bg-white border border-warm-100 rounded-2xl p-4">
          <p className="text-xs text-warm-400 font-medium mb-1">Plan Premium</p>
          <p className="text-2xl font-bold text-amber-600">{premiumCount}</p>
          <p className="text-xs text-warm-400 mt-0.5">terapeutas · $79/mes c/u</p>
        </div>
        <div className="bg-white border border-warm-100 rounded-2xl p-4">
          <p className="text-xs text-warm-400 font-medium mb-1">Plan Pro</p>
          <p className="text-2xl font-bold text-primary-600">{proCount}</p>
          <p className="text-xs text-warm-400 mt-0.5">terapeutas · $39/mes c/u</p>
        </div>
        <div className="bg-white border border-warm-100 rounded-2xl p-4">
          <p className="text-xs text-warm-400 font-medium mb-1">Plan Básico</p>
          <p className="text-2xl font-bold text-warm-700">{basicCount}</p>
          <p className="text-xs text-warm-400 mt-0.5">terapeutas · gratis</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'basic', 'pro', 'premium'].map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
            }`}>
            {f === 'all' ? 'Todos' : PLAN_CONFIG[f].label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const plan = PLAN_CONFIG[t.subscription_plan ?? 'basic']
            const PlanIcon = plan.Icon
            return (
              <div key={t.user_id} className="bg-white border border-warm-100 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
                <Avatar name={t.profile?.full_name ?? ''} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-warm-900 text-sm">{t.profile?.full_name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${plan.color}`}>
                      <PlanIcon size={9} strokeWidth={2} />{plan.label}
                    </span>
                  </div>
                  <p className="text-xs text-warm-400 mt-0.5">{t.profile?.email}</p>
                  <p className="text-xs text-warm-500 mt-0.5">
                    Comisión: <strong>{(t.commission_rate * 100).toFixed(1)}%</strong>
                    {t.plan_expires_at && (
                      <span className="ml-2 text-warm-300">
                        · Vence: {new Date(t.plan_expires_at).toLocaleDateString('es-DO', { dateStyle: 'short' })}
                      </span>
                    )}
                  </p>
                </div>

                {/* Cambiar plan */}
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(PLAN_CONFIG).map(([pid, pc]) => (
                    <button
                      key={pid}
                      disabled={t.subscription_plan === pid || changing === t.user_id}
                      onClick={() => changePlan(t.user_id, pid)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                        t.subscription_plan === pid
                          ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
                          : 'border-warm-200 text-warm-600 hover:border-primary-300 hover:text-primary-700'
                      }`}
                    >
                      {t.subscription_plan === pid
                        ? <span className="flex items-center gap-1"><Check size={11} strokeWidth={2} />{pc.label}</span>
                        : pc.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
