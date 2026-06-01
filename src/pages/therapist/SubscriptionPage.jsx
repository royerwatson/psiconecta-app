/**
 * SubscriptionPage — Gestión de plan de suscripción del terapeuta.
 *
 * Planes:
 *   Basic   — Gratis · 10% comisión
 *   Pro     — $39/mes · 7.5% comisión · badge · mayor visibilidad
 *   Premium — $79/mes · 5% comisión · todo lo anterior · estadísticas avanzadas
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import {
  Check, Zap, Star, Crown, TrendingUp, Users, Eye, BarChart2,
  Calendar, ChevronRight, AlertCircle,
} from 'lucide-react'

// ── Definición de planes ──────────────────────────────────────────────────────

const PLANS = [
  {
    id:           'basic',
    name:         'Básico',
    price:        0,
    priceLabel:   'Gratis',
    commission:   10,
    color:        'warm',
    Icon:         Zap,
    description:  'Empieza a ofrecer tus servicios en la plataforma sin costo mensual.',
    features: [
      'Perfil público verificado',
      'Agenda y gestión de citas',
      'Chat con pacientes',
      'Videollamadas ilimitadas',
      '10% de comisión por sesión',
    ],
    highlight: false,
  },
  {
    id:           'pro',
    name:         'Pro',
    price:        39,
    priceLabel:   '$39/mes',
    commission:   7.5,
    color:        'primary',
    Icon:         Star,
    description:  'Para terapeutas con flujo activo de pacientes. Mayor visibilidad y menor comisión.',
    features: [
      'Todo lo del plan Básico',
      'Badge Pro en tu perfil',
      'Mayor visibilidad en búsquedas',
      'Estadísticas de perfil avanzadas',
      '7.5% de comisión por sesión',
    ],
    highlight: true,
  },
  {
    id:           'premium',
    name:         'Premium',
    price:        79,
    priceLabel:   '$79/mes',
    commission:   5,
    color:        'amber',
    Icon:         Crown,
    description:  'Para terapeutas de alto volumen. La menor comisión y máxima visibilidad.',
    features: [
      'Todo lo del plan Pro',
      'Badge Premium destacado',
      'Posición prioritaria en búsquedas',
      'Dashboard de ingresos avanzado',
      '5% de comisión por sesión',
    ],
    highlight: false,
  },
]

const PLAN_COLORS = {
  warm:    { bg: 'bg-warm-50',    border: 'border-warm-200',    badge: 'bg-warm-100 text-warm-700',    btn: '' },
  primary: { bg: 'bg-primary-50', border: 'border-primary-300', badge: 'bg-primary-500 text-white',    btn: 'ring-2 ring-primary-300' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700',  btn: '' },
}

// Cuánto ahorra el terapeuta vs plan Basic con un volumen dado
function savings(plan, monthlySessions, avgPrice) {
  const basicComm   = monthlySessions * avgPrice * 0.10
  const planComm    = monthlySessions * avgPrice * (plan.commission / 100)
  const saved       = basicComm - planComm - plan.price
  return saved
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { user } = useAuthStore()
  const [currentPlan, setCurrentPlan]   = useState('basic')
  const [planExpires, setPlanExpires]   = useState(null)
  const [loading, setLoading]           = useState(true)
  const [upgrading, setUpgrading]       = useState(null) // plan id en proceso
  const [sessions, setSessions]         = useState(10)   // slider para calculadora
  const [avgPrice, setAvgPrice]         = useState(60)

  useEffect(() => {
    fetchPlan()
  }, [user])

  const fetchPlan = async () => {
    if (!user) return
    const { data } = await supabase
      .from('therapist_profiles')
      .select('subscription_plan, plan_expires_at')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setCurrentPlan(data.subscription_plan ?? 'basic')
      setPlanExpires(data.plan_expires_at)
    }
    setLoading(false)
  }

  const handleUpgrade = async (plan) => {
    if (plan.id === currentPlan) return
    if (plan.price === 0) {
      // Downgrade a basic
      const { error } = await supabase
        .from('therapist_profiles')
        .update({ subscription_plan: 'basic', plan_expires_at: null })
        .eq('user_id', user.id)
      if (error) { toast.error('Error al cambiar el plan'); return }
      setCurrentPlan('basic')
      setPlanExpires(null)
      toast.success('Plan cambiado a Básico')
      return
    }
    // Upgrade a Pro o Premium — redirigir a PayPal
    setUpgrading(plan.id)
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const token = authSession?.access_token
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription-order`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ plan: plan.id, amount: plan.price }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Redirigir a PayPal
      window.location.href = data.approveUrl
    } catch (err) {
      toast.error(err.message ?? 'Error iniciando el pago')
    } finally {
      setUpgrading(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  const currentPlanData = PLANS.find(p => p.id === currentPlan) ?? PLANS[0]

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Mi suscripción</h1>
        <p className="text-warm-500 text-sm mt-1">
          Gestiona tu plan y conoce cómo maximizar tus ingresos en Psiconecta.
        </p>
      </div>

      {/* Plan actual */}
      <div className="bg-white border border-warm-100 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              currentPlan === 'premium' ? 'bg-amber-100' :
              currentPlan === 'pro'     ? 'bg-primary-100' : 'bg-warm-100'
            }`}>
              {(() => { const I = currentPlanData.Icon; return <I size={20} strokeWidth={1.8} className={
                currentPlan === 'premium' ? 'text-amber-600' :
                currentPlan === 'pro'     ? 'text-primary-600' : 'text-warm-500'
              } /> })()}
            </div>
            <div>
              <p className="font-semibold text-warm-900">Plan {currentPlanData.name}</p>
              <p className="text-sm text-warm-400">
                {currentPlan === 'basic'
                  ? 'Gratis · 10% de comisión'
                  : `${currentPlanData.priceLabel} · ${currentPlanData.commission}% de comisión`}
              </p>
            </div>
          </div>
          {planExpires && (
            <div className="flex items-center gap-1.5 text-xs text-warm-400 bg-warm-50 px-3 py-1.5 rounded-lg">
              <Calendar size={12} strokeWidth={1.8} />
              Renueva: {new Date(planExpires).toLocaleDateString('es-DO', { dateStyle: 'medium' })}
            </div>
          )}
        </div>
      </div>

      {/* Calculadora de ahorro */}
      <div className="bg-gradient-to-br from-primary-50 to-calm-50 border border-primary-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} strokeWidth={1.8} className="text-primary-600" />
          <p className="font-semibold text-primary-900 text-sm">Calculadora de ahorro</p>
        </div>
        <p className="text-xs text-primary-700 mb-4">
          ¿Cuántas sesiones haces al mes y a qué precio promedio?
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-primary-700 font-medium mb-1 block">
              Sesiones/mes: <strong>{sessions}</strong>
            </label>
            <input type="range" min="5" max="80" value={sessions}
              onChange={e => setSessions(+e.target.value)}
              className="w-full accent-primary-500" />
          </div>
          <div>
            <label className="text-xs text-primary-700 font-medium mb-1 block">
              Precio promedio: <strong>${avgPrice}</strong>
            </label>
            <input type="range" min="30" max="200" step="5" value={avgPrice}
              onChange={e => setAvgPrice(+e.target.value)}
              className="w-full accent-primary-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PLANS.filter(p => p.price > 0).map(plan => {
            const saved = savings(plan, sessions, avgPrice)
            return (
              <div key={plan.id} className="bg-white rounded-xl p-3 border border-primary-100">
                <p className="text-xs font-semibold text-warm-700 mb-1">Plan {plan.name}</p>
                <p className={`text-lg font-bold ${saved > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {saved > 0 ? `+$${saved.toFixed(0)}/mes` : `-$${Math.abs(saved).toFixed(0)}/mes`}
                </p>
                <p className="text-[10px] text-warm-400 mt-0.5">
                  vs plan Básico · {sessions} sesiones × ${avgPrice}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Planes */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const clr      = PLAN_COLORS[plan.color]
          const isCurrent = plan.id === currentPlan
          const PlanIcon  = plan.icon
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all ${
                isCurrent
                  ? `${clr.border} ${clr.bg}`
                  : 'border-warm-100 bg-white hover:border-warm-200'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Más popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                {(() => { const I = plan.Icon; return <I size={18} strokeWidth={1.8} className={
                  plan.color === 'amber' ? 'text-amber-500' :
                  plan.color === 'primary' ? 'text-primary-500' : 'text-warm-400'
                } /> })()}
                <span className="font-bold text-warm-900">{plan.name}</span>
                {isCurrent && (
                  <span className="ml-auto text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Actual
                  </span>
                )}
              </div>

              <div className="mb-3">
                <span className="text-2xl font-bold text-warm-900">{plan.priceLabel}</span>
                <p className="text-xs text-warm-400 mt-0.5">{plan.commission}% comisión por sesión</p>
              </div>

              <p className="text-xs text-warm-500 leading-relaxed mb-4">{plan.description}</p>

              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-warm-700">
                    <Check size={13} strokeWidth={2.5} className="text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                size="sm"
                fullWidth
                variant={isCurrent ? 'secondary' : plan.highlight ? 'primary' : 'outline'}
                disabled={isCurrent || upgrading === plan.id}
                loading={upgrading === plan.id}
                onClick={() => handleUpgrade(plan)}
              >
                {isCurrent ? 'Plan actual' :
                 plan.price === 0 ? 'Cambiar a Básico' :
                 `Upgrade a ${plan.name}`}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Nota de facturación */}
      <div className="flex items-start gap-2 text-xs text-warm-400 bg-warm-50 rounded-xl p-4">
        <AlertCircle size={14} strokeWidth={1.8} className="shrink-0 mt-0.5" />
        <p>
          Los planes Pro y Premium se facturan mensualmente a través de PayPal.
          Puedes cancelar en cualquier momento. La comisión se aplica automáticamente
          en cada sesión completada según el plan vigente en ese momento.
        </p>
      </div>

    </div>
  )
}
