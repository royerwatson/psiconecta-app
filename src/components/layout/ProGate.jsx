/**
 * ProGate — Bloquea el acceso a rutas exclusivas del plan Suscripción.
 * Los terapeutas con plan 'basic' ven una pantalla de upgrade.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import { Lock, Star } from 'lucide-react'

export default function ProGate({ children, featureName = 'esta herramienta' }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [plan, setPlan]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('therapist_profiles')
      .select('subscription_plan')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setPlan(data?.subscription_plan ?? 'basic')
        setLoading(false)
      })
  }, [user])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  const isPro = plan === 'pro' || plan === 'premium'
  if (isPro) return children

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-5 max-w-sm mx-auto px-4">
      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center">
        <Lock size={28} strokeWidth={1.5} className="text-primary-400" />
      </div>
      <div>
        <h2 className="font-serif text-xl font-bold text-warm-900 mb-2">
          Disponible en el plan Suscripción
        </h2>
        <p className="text-warm-500 text-sm leading-relaxed">
          El acceso a {featureName} está incluido en la suscripción mensual de{' '}
          <strong>$79.99 USD/mes</strong>.
          Actualiza tu plan para acceder a todas las herramientas clínicas profesionales.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <Button onClick={() => navigate('/therapist/subscription')} fullWidth>
          <Star size={15} strokeWidth={1.8} className="mr-1.5" />
          Ver plan Suscripción
        </Button>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
        >
          Volver
        </button>
      </div>
    </div>
  )
}
