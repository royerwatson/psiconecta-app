import { cn } from '@/lib/utils'
import { CheckCircle2, Clock, XCircle, Star } from 'lucide-react'

const variants = {
  primary:  'bg-primary-100 text-primary-700',
  calm:     'bg-calm-100 text-calm-700',
  success:  'bg-green-100 text-green-700',
  warning:  'bg-amber-100 text-amber-700',
  danger:   'bg-red-100 text-red-700',
  neutral:  'bg-warm-100 text-warm-600',
  verified: 'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  urgent:   'bg-orange-100 text-orange-700',
}

export default function Badge({ children, variant = 'primary', dot = false, className = '' }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className,
    )}>
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' || variant === 'verified' ? 'bg-green-500' :
          variant === 'warning' || variant === 'pending' ? 'bg-amber-500' :
          variant === 'danger'  || variant === 'rejected' ? 'bg-red-500' :
          variant === 'urgent' ? 'bg-orange-500' :
          'bg-primary-500',
        )} />
      )}
      {children}
    </span>
  )
}

// Badge de verificación de terapeuta
export function VerificationBadge({ status }) {
  const map = {
    verified: { label: 'Verificado',  variant: 'verified', Icon: CheckCircle2 },
    pending:  { label: 'En revisión', variant: 'pending',  Icon: Clock        },
    rejected: { label: 'Rechazado',   variant: 'rejected', Icon: XCircle      },
  }
  const b = map[status] ?? map.pending
  return <Badge variant={b.variant}><b.Icon size={11} strokeWidth={1.8} />{b.label}</Badge>
}

// Badge de estrellas
export function RatingBadge({ rating }) {
  return (
    <Badge variant="warning" className="gap-1">
      <Star size={11} className="fill-amber-400 text-amber-400" strokeWidth={0} />
      <span>{Number(rating).toFixed(1)}</span>
    </Badge>
  )
}
