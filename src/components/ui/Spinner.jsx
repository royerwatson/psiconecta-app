import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm:  'h-4 w-4 border-2',
    md:  'h-8 w-8 border-2',
    lg:  'h-12 w-12 border-3',
    xl:  'h-16 w-16 border-4',
  }
  return (
    <div className={cn(
      'rounded-full border-primary-200 border-t-primary-600 animate-spin',
      sizes[size],
      className,
    )} />
  )
}

// Pantalla de carga completa
export function LoadingScreen({ message = 'Cargando...' }) {
  return (
    <div className="fixed inset-0 bg-psiconecta flex flex-col items-center justify-center gap-4 z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-calm"><Zap size={24} className="text-white" strokeWidth={2} /></div>
        <Spinner size="lg" />
        <p className="text-sm text-warm-500 font-medium">{message}</p>
      </div>
    </div>
  )
}

// Skeleton placeholder
export function Skeleton({ className = '' }) {
  return (
    <div className={cn('skeleton', className)} />
  )
}
