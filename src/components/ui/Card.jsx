/**
 * Card — Componente premium nivel Apple.
 * variant: 'default' | 'elevated' | 'glass' | 'colored' | 'outline'
 */
import { cn } from '@/lib/utils'

export default function Card({
  children,
  className = '',
  onClick,
  hover = false,
  padding = true,
  variant = 'default',
}) {
  const base = {
    default:  'card',
    elevated: 'card-elevated',
    glass:    'card-glass',
    outline:  'bg-white rounded-[20px] border-[1.5px] border-slate-100',
    colored:  'card-colored',
  }[variant] ?? 'card'

  return (
    <div
      onClick={onClick}
      className={cn(
        base,
        padding && 'p-5',
        hover && 'hover-lift cursor-pointer',
        onClick && !hover && 'cursor-pointer press',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', action }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="flex-1 min-w-0">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={cn('text-[0.9375rem] font-bold text-slate-900 tracking-tight', className)}>
      {children}
    </h3>
  )
}

export function CardSubtitle({ children, className = '' }) {
  return (
    <p className={cn('text-sm text-slate-500 mt-0.5', className)}>{children}</p>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={cn('flex items-center justify-between pt-4 mt-4 border-t border-slate-100', className)}>
      {children}
    </div>
  )
}

export function StatCard({ title, value, subtitle, icon, color = 'primary', className = '' }) {
  const palettes = {
    primary: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'bg-indigo-100', border: 'border-indigo-100/60' },
    calm:    { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: 'bg-blue-100',   border: 'border-blue-100/60'   },
    success: { bg: 'bg-emerald-50',text: 'text-emerald-600',icon: 'bg-emerald-100',border: 'border-emerald-100/60'},
    warning: { bg: 'bg-amber-50',  text: 'text-amber-600',  icon: 'bg-amber-100',  border: 'border-amber-100/60'  },
    rose:    { bg: 'bg-rose-50',   text: 'text-rose-600',   icon: 'bg-rose-100',   border: 'border-rose-100/60'   },
  }
  const p = palettes[color] ?? palettes.primary

  return (
    <div className={cn(
      'rounded-[18px] p-4 border',
      p.bg, p.border,
      className,
    )}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        {icon && (
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', p.icon)}>
            <span className={p.text}>{icon}</span>
          </div>
        )}
      </div>
      <p className={cn('text-2xl font-bold tracking-tight', p.text)}>{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  )
}
