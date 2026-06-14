/**
 * PricingPage — Página pública de planes y precios.
 * Ruta: /pricing (no requiere autenticación)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Zap, Star, ArrowRight, Users, Shield, Video,
  FlaskConical, BookOpen, LayoutDashboard, Library, Stethoscope, FolderOpen } from 'lucide-react'
import Button from '@/components/ui/Button'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import { useCurrencyContext } from '@/context/CurrencyContext'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const PLANS = [
  {
    id:        'basic',
    name:      'Gratuito',
    price:     0,
    Icon:      Zap,
    bg:        'bg-white',
    border:    'border-warm-200',
    highlight: false,
    cta:       'Comenzar gratis',
    features: [
      'Perfil público verificado',
      'Agenda y gestión de citas',
      'Chat privado con pacientes',
      'Videollamadas ilimitadas',
      '20% de comisión por sesión',
    ],
  },
  {
    id:        'pro',
    name:      'Suscripción',
    price:     79.99,
    Icon:      Star,
    bg:        'bg-primary-600',
    border:    'border-primary-600',
    highlight: true,
    cta:       'Suscribirme por $79.99/mes',
    features: [
      'Todo lo del plan Gratuito',
      '10% de comisión por sesión (vs 20% en Gratuito)',
      'Tests psicométricos (45+ instrumentos)',
      'DSM-5-TR y CIE-11 de referencia',
      'Escalas clínicas validadas',
      'Plan de crisis (Stanley-Brown)',
      'Biblioteca terapéutica',
      'Consulta con colegas',
      'Protocolos terapéuticos',
      'Dashboard de estadísticas avanzadas',
      'Exporta el expediente clínico completo en PDF',
    ],
  },
]

const FAQS = [
  {
    q: '¿Cuándo se cobra la comisión?',
    a: 'La comisión se descuenta automáticamente cuando el paciente paga. El resto se transfiere a tu cuenta en el siguiente ciclo de liquidación.',
  },
  {
    q: '¿La suscripción cambia la comisión?',
    a: 'Sí. El plan Gratuito tiene un 20% de comisión por sesión. Al suscribirte ($79.99/mes o $799/año), la comisión baja al 10%, además de darte acceso a todas las herramientas clínicas.',
  },
  {
    q: '¿Cuál es la diferencia entre mensual y anual?',
    a: 'El plan anual cuesta $799 en un solo pago, equivalente a $66.58/mes — un ahorro de $159.88 vs pagar mensualmente ($79.99 × 12 = $959.88). El acceso es por 12 meses completos.',
  },
  {
    q: '¿Puedo cancelar la suscripción en cualquier momento?',
    a: 'Sí. Conservas el acceso hasta el final del período pagado. Al vencer, tu cuenta pasa automáticamente al plan Gratuito.',
  },
  {
    q: '¿El plan Gratuito tiene límite de tiempo?',
    a: 'No. Es gratuito para siempre. Solo activas la suscripción cuando quieras acceder a las herramientas clínicas avanzadas.',
  },
  {
    q: '¿Hay período de prueba?',
    a: 'No ofrecemos período de prueba, pero puedes comenzar con el plan Gratuito y suscribirte cuando lo necesites, sin penalización.',
  },
]

export default function PricingPage() {
  const navigate = useNavigate()
  const { formatWithLocal } = useCurrencyContext()
  const [billing, setBilling] = useState('monthly') // 'monthly' | 'annual'

  useScrollReveal()

  const proPrice     = billing === 'annual' ? 799 : 79.99
  const proLabel     = billing === 'annual' ? '$799' : '$79.99'
  const proPeriod    = billing === 'annual' ? '/año' : '/mes'
  const proLocalSub  = billing === 'annual'
    ? formatWithLocal(799).split('≈')[1]?.trim() ?? ''
    : formatWithLocal(79.99).split('≈')[1]?.trim() ?? ''

  return (
    <div className="min-h-dvh bg-psiconecta">

      {/* Navbar mínima */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-brand rounded-xl flex items-center justify-center">
            <PsiconectaLogo size={20} color="white" />
          </div>
          <span className="font-bold text-warm-900">Psico<span className="text-primary-600">necta</span></span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm text-warm-600 hover:text-warm-900">
            Iniciar sesión
          </button>
          <Button size="sm" onClick={() => navigate('/register')}>
            Crear cuenta
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center px-4 pt-12 pb-16 max-w-3xl mx-auto">
        <span className="hero-reveal hero-reveal-1 inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
          Para terapeutas
        </span>
        <h1 className="hero-reveal hero-reveal-1 font-serif text-4xl font-bold text-warm-900 mb-4 leading-tight">
          Planes que crecen<br/>contigo
        </h1>
        <p className="hero-reveal hero-reveal-2 text-warm-500 text-lg leading-relaxed max-w-xl mx-auto">
          Comienza gratis. Cuando tu práctica crezca, elige el plan que mejor
          se ajuste a tu práctica y reduce tu comisión del 20% al 10%.
        </p>
      </div>

      {/* Toggle mensual / anual */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setBilling('monthly')}
          className={`px-5 py-2 rounded-xl text-sm font-medium border transition-all ${
            billing === 'monthly'
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
          }`}
        >
          Mensual
        </button>
        <button
          onClick={() => setBilling('annual')}
          className={`px-5 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
            billing === 'annual'
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
          }`}
        >
          Anual
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            billing === 'annual' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
          }`}>
            −17%
          </span>
        </button>
      </div>

      {/* Planes */}
      <div className="grid sm:grid-cols-3 gap-5 max-w-5xl mx-auto px-4 pb-16">
        {PLANS.map((plan) => {
          const PlanIcon = plan.Icon
          const isHighlight = plan.highlight
          return (
            <div key={plan.id} className="fade-in">
            <div
              className={`relative h-full rounded-3xl border-2 ${plan.border} ${plan.bg} p-7 flex flex-col shadow-sm ${
                isHighlight ? 'shadow-primary-100 shadow-lg scale-[1.02]' : ''
              }`}
            >
              {isHighlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    Más popular
                  </span>
                </div>
              )}

              <div className={`flex items-center gap-2 mb-6 ${isHighlight ? 'text-white' : ''}`}>
                <PlanIcon size={20} strokeWidth={1.8} className={isHighlight ? 'text-white/80' : plan.color} />
                <span className={`font-bold text-lg ${isHighlight ? 'text-white' : 'text-warm-900'}`}>
                  {plan.name}
                </span>
              </div>

              <div className="mb-6">
                <div className={`flex items-end gap-2 ${isHighlight ? 'text-white' : 'text-warm-900'}`}>
                  <span className="text-4xl font-bold">
                    {isHighlight ? proLabel : (plan.price === 0 ? 'Gratis' : plan.priceLabel)}
                  </span>
                  {isHighlight && (
                    <span className={`text-sm mb-1.5 ${isHighlight ? 'text-white/70' : 'text-warm-400'}`}>{proPeriod}</span>
                  )}
                  {!isHighlight && plan.period && (
                    <span className={`text-sm mb-1.5 text-warm-400`}>{plan.period}</span>
                  )}
                  {isHighlight && billing === 'annual' && (
                    <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full mb-1.5">−17%</span>
                  )}
                </div>
                {isHighlight && (
                  <p className="text-xs mt-0.5 text-white/60">
                    ≈ {proLocalSub} {billing === 'annual' ? '/año' : '/mes'}
                  </p>
                )}
                {isHighlight && billing === 'annual' && (
                  <p className="text-xs mt-0.5 text-green-300 font-medium">Ahorras $159.88 vs mensual</p>
                )}
                <p className={`text-sm mt-1 ${isHighlight ? 'text-white/80' : 'text-warm-500'}`}>
                  {plan.commission} de comisión por sesión
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className={`flex items-start gap-2.5 text-sm ${isHighlight ? 'text-white/90' : 'text-warm-700'}`}>
                    <Check size={15} strokeWidth={2.5} className={`shrink-0 mt-0.5 ${isHighlight ? 'text-white' : 'text-green-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/register?role=therapist')}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  isHighlight
                    ? 'bg-white text-primary-700 hover:bg-primary-50'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isHighlight
                  ? (billing === 'annual' ? 'Suscribirme por $799/año' : 'Suscribirme por $79.99/mes')
                  : plan.cta}
                <ArrowRight size={15} strokeWidth={2} />
              </button>
            </div>
            </div>
          )
        })}
      </div>

      {/* Stats de confianza */}
      <div className="bg-white border-y border-warm-100 py-12 px-4 mb-16">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div className="fade-in">
            <div className="flex justify-center mb-2">
              <Users size={24} strokeWidth={1.5} className="text-primary-400" />
            </div>
            <p className="text-2xl font-bold text-warm-900">100%</p>
            <p className="text-sm text-warm-400 mt-0.5">Terapeutas verificados</p>
          </div>
          <div className="fade-in">
            <div className="flex justify-center mb-2">
              <Shield size={24} strokeWidth={1.5} className="text-primary-400" />
            </div>
            <p className="text-2xl font-bold text-warm-900">SSL</p>
            <p className="text-sm text-warm-400 mt-0.5">Pagos cifrados</p>
          </div>
          <div className="fade-in">
            <div className="flex justify-center mb-2">
              <Video size={24} strokeWidth={1.5} className="text-primary-400" />
            </div>
            <p className="text-2xl font-bold text-warm-900">HD</p>
            <p className="text-sm text-warm-400 mt-0.5">Video de alta calidad</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="font-serif text-2xl font-bold text-warm-900 text-center mb-8">
          Preguntas frecuentes
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-warm-100 p-5">
              <p className="font-semibold text-warm-900 mb-2">{faq.q}</p>
              <p className="text-sm text-warm-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-warm-500 mb-4">¿Listo para unirte?</p>
          <Button onClick={() => navigate('/register?role=therapist')} size="lg">
            Crear cuenta de terapeuta gratis
            <ArrowRight size={16} strokeWidth={2} className="ml-2" />
          </Button>
        </div>
      </div>

    </div>
  )
}
