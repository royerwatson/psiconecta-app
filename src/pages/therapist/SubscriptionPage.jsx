/**
 * SubscriptionPage — Gestión de plan de suscripción del terapeuta.
 *
 * Planes:
 *   Gratuito  — $0/mes · 20% comisión · funciones core
 *   Pro       — $50/mes · 10% comisión · herramientas clínicas completas
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import PayPalSubscriptionButton from '@/components/payment/PayPalSubscriptionButton'
import toast from 'react-hot-toast'
import { Check, Zap, Star, AlertCircle, Lock, FlaskConical,
  BookOpen, BookMarked, LayoutDashboard, Shield, Library,
  Stethoscope, FolderOpen, TrendingUp, UserCheck } from 'lucide-react'
import { useCurrencyContext } from '@/context/CurrencyContext'

// ── Definición de planes ──────────────────────────────────────────────────────

const PLANS = [
  {
    id:          'basic',
    name:        'Gratuito',
    price:       0,
    commission:  20,
    Icon:        Zap,
    highlight:   false,
    description: 'Todo lo necesario para comenzar tu práctica online sin costo mensual.',
    features: [
      { text: 'Perfil público verificado',    Icon: Check },
      { text: 'Agenda y gestión de citas',    Icon: Check },
      { text: 'Chat con pacientes',           Icon: Check },
      { text: 'Videollamadas ilimitadas',     Icon: Check },
      { text: '20% de comisión por sesión',   Icon: Check },
    ],
    locked: [
      { text: 'Tests psicométricos',          Icon: FlaskConical },
      { text: 'DSM-5-TR y CIE-11',            Icon: BookOpen     },
      { text: 'Escalas clínicas',             Icon: LayoutDashboard },
      { text: 'Plan de crisis',               Icon: Shield       },
      { text: 'Biblioteca terapéutica',       Icon: Library      },
      { text: 'Consulta con colegas',         Icon: Stethoscope  },
      { text: 'Protocolos terapéuticos',      Icon: FolderOpen   },
    ],
  },
  {
    id:          'pro',
    name:        'Suscripción',
    price:       79.99,
    commission:  10,
    Icon:        Star,
    highlight:   true,
    description: 'Herramientas clínicas completas para potenciar tu práctica profesional.',
    features: [
      { text: 'Todo lo del plan Gratuito',             Icon: Check },
      { text: '10% de comisión (vs 20% en Gratuito)',  Icon: Check },
      { text: 'Tests psicométricos (45+)',              Icon: FlaskConical },
      { text: 'DSM-5-TR y CIE-11',            Icon: BookOpen     },
      { text: 'Escalas clínicas validadas',   Icon: LayoutDashboard },
      { text: 'Plan de crisis (Stanley-Brown)',Icon: Shield       },
      { text: 'Biblioteca terapéutica',       Icon: Library      },
      { text: 'Consulta con colegas',         Icon: Stethoscope  },
      { text: 'Protocolos terapéuticos',      Icon: FolderOpen   },
      { text: 'Dashboard de estadísticas',    Icon: Star         },
      { text: 'Expediente clínico en PDF',                     Icon: BookMarked   },
      { text: 'Análisis clínico longitudinal inteligente',     Icon: TrendingUp   },
      { text: 'Acompañamiento 1:1 con coordinador clínico',   Icon: UserCheck    },
    ],
  },
]

// ── Componente ────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { user } = useAuthStore()
  const { formatWithLocal } = useCurrencyContext()
  const [currentPlan, setCurrentPlan]   = useState('basic')
  const [planExpires, setPlanExpires]   = useState(null)
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'annual'
  const [loading, setLoading]           = useState(true)
  const [upgrading, setUpgrading]       = useState(false)
  const [showPayPal, setShowPayPal]     = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchPlan() }, [user])

  const fetchPlan = async () => {
    if (!user) return
    const { data } = await supabase
      .from('therapist_profiles')
      .select('subscription_plan, plan_expires_at, billing_cycle')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setCurrentPlan(data.subscription_plan ?? 'basic')
      setPlanExpires(data.plan_expires_at)
      if (data.billing_cycle) setBillingCycle(data.billing_cycle)
    }
    setLoading(false)
  }

  const handleSubscriptionSuccess = async (expiresAt) => {
    // Actualizar estado local inmediatamente
    setCurrentPlan('pro')
    setPlanExpires(expiresAt ?? null)
    setShowPayPal(false)
    // Refrescar perfil completo desde la BD
    await fetchPlan()
    toast.success('¡Plan Pro activado! Bienvenido a todas las herramientas clínicas.')
  }

  const handleSubscriptionError = (msg) => {
    toast.error(msg ?? 'Error procesando el pago')
    setShowPayPal(false)
  }

  const handleDowngrade = async () => {
    const { error } = await supabase
      .from('therapist_profiles')
      .update({ subscription_plan: 'basic', plan_expires_at: null })
      .eq('user_id', user.id)
    if (error) { toast.error('Error al cambiar el plan'); return }
    setCurrentPlan('basic')
    setPlanExpires(null)
    toast.success('Plan cambiado a Gratuito')
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  const isPro = currentPlan === 'pro' || currentPlan === 'premium'

  return (
    <div className="space-y-8 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Mi suscripción</h1>
        <p className="text-warm-500 text-sm mt-1">
          {isPro
            ? 'Tienes acceso completo a todas las herramientas clínicas.'
            : 'Actualiza para acceder a las herramientas clínicas profesionales.'}
        </p>
      </div>

      {/* Estado actual */}
      {isPro && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Star size={20} strokeWidth={1.8} className="text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-primary-900">Plan Suscripción activo</p>
              {billingCycle === 'annual'
                ? <p className="text-sm text-primary-600">$799 USD/año · {formatWithLocal(799).split('≈')[1]?.trim() ?? ''}</p>
                : <p className="text-sm text-primary-600">$79.99 USD/mes · {formatWithLocal(79.99).split('≈')[1]?.trim() ?? ''}</p>
              }
              {billingCycle === 'annual' && (
                <p className="text-xs text-green-600 font-medium mt-0.5">Ahorras $159.88/año vs mensual</p>
              )}
            </div>
          </div>
          {planExpires && (
            <p className="text-xs text-primary-500">
              Renueva: {new Date(planExpires).toLocaleDateString('es-DO', { dateStyle: 'medium' })}
            </p>
          )}
        </div>
      )}

      {/* Toggle ciclo de facturación (solo si no tiene plan activo) */}
      {!isPro && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { setBillingCycle('monthly'); setShowPayPal(false) }}
            className={`px-5 py-2 rounded-xl text-sm font-medium border transition-all ${
              billingCycle === 'monthly'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => { setBillingCycle('annual'); setShowPayPal(false) }}
            className={`px-5 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
              billingCycle === 'annual'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
            }`}
          >
            Anual
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              billingCycle === 'annual' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
            }`}>
              −17%
            </span>
          </button>
        </div>
      )}

      {/* Planes */}
      <div className="grid sm:grid-cols-2 gap-5">
        {PLANS.map((plan) => {
          const PlanIcon   = plan.Icon
          const isCurrent  = (plan.id === 'basic' && !isPro) || (plan.id === 'pro' && isPro)
          return (
            <div key={plan.id} className={`rounded-2xl border-2 p-6 flex flex-col transition-all ${
              plan.highlight
                ? 'border-primary-300 bg-primary-50'
                : 'border-warm-200 bg-white'
            } ${isCurrent ? 'ring-2 ring-offset-1 ring-primary-300' : ''}`}>

              {plan.highlight && (
                <span className="self-start text-[10px] font-bold bg-primary-500 text-white px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                  Recomendado
                </span>
              )}

              <div className="flex items-center gap-2 mb-2">
                <PlanIcon size={18} strokeWidth={1.8} className={plan.highlight ? 'text-primary-500' : 'text-warm-400'} />
                <span className="font-bold text-warm-900 text-lg">{plan.name}</span>
                {isCurrent && (
                  <span className="ml-auto text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Actual
                  </span>
                )}
              </div>

              <div className="mb-3">
                {plan.price === 0 ? (
                  <p className="text-3xl font-bold text-warm-900">Gratis</p>
                ) : billingCycle === 'annual' ? (
                  <>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold text-warm-900">$799 USD</p>
                      <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full mb-1">−17%</span>
                    </div>
                    <p className="text-xs text-warm-400 mt-0.5">
                      ≈ {formatWithLocal(799).split('≈')[1]?.trim() ?? ''} /año · $66.58/mes
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-0.5">Ahorras $159.88 vs mensual</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-warm-900">$79.99 USD</p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      ≈ {formatWithLocal(79.99).split('≈')[1]?.trim() ?? ''} /mes
                    </p>
                  </>
                )}
                <p className="text-xs text-warm-500 mt-1">{plan.commission}% de comisión por sesión</p>
              </div>

              <p className="text-xs text-warm-500 leading-relaxed mb-4">{plan.description}</p>

              {/* Features incluidas */}
              <ul className="space-y-2 mb-4 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-warm-700">
                    <f.Icon size={12} strokeWidth={2} className="text-green-500 shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* Features bloqueadas (solo plan básico) */}
              {plan.locked && (
                <ul className="space-y-2 mb-4 pt-3 border-t border-warm-100">
                  {plan.locked.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-warm-400">
                      <Lock size={11} strokeWidth={1.8} className="shrink-0" />
                      {f.text}
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA */}
              {isCurrent ? (
                <div className="w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium text-center">
                  Plan actual
                </div>
              ) : plan.id === 'pro' ? (
                !showPayPal ? (
                  <Button fullWidth onClick={() => setShowPayPal(true)}>
                    {billingCycle === 'annual'
                      ? 'Suscribirme por $799/año'
                      : 'Suscribirme por $79.99/mes'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <PayPalSubscriptionButton
                      billingCycle={billingCycle}
                      onSuccess={handleSubscriptionSuccess}
                      onError={handleSubscriptionError}
                    />
                    <button
                      onClick={() => setShowPayPal(false)}
                      className="w-full text-xs text-warm-400 hover:text-warm-600 py-1 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )
              ) : (
                <Button fullWidth variant="outline" onClick={handleDowngrade}>
                  Cambiar a Gratuito
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-warm-400 bg-warm-50 rounded-xl p-4">
        <AlertCircle size={14} strokeWidth={1.8} className="shrink-0 mt-0.5" />
        <p>
          La suscripción se factura en <strong>USD</strong> a través de PayPal
          ({billingCycle === 'annual' ? 'un solo pago anual de $799' : 'mensualmente'}).
          La conversión a tu moneda local es referencial — el monto exacto lo determina
          PayPal según su tipo de cambio al momento del pago.
          Puedes cancelar en cualquier momento.
        </p>
      </div>

    </div>
  )
}
