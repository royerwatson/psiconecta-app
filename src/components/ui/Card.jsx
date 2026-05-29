import { cn } from '@/lib/utils'

export default function Card({ children, className = '', onClick, hover = false, padding = true }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl shadow-card border border-warm-100',
        padding && 'p-5',
        hover && 'transition-all duration-200 hover:shadow-float hover:-translate-y-0.5 cursor-pointer',
        onClick && 'cursor-pointer',
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
    <h3 className={cn('font-serif text-lg font-semibold text-warm-900', className)}>
      {children}
    </h3>
  )
}

export function CardSubtitle({ children, className = '' }) {
  return (
    <p className={cn('text-sm text-warm-500 mt-0.5', className)}>{children}</p>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={cn('flex items-center justify-between pt-4 mt-4 border-t border-warm-100', className)}>
      {children}
    </div>
  )
}

// Card con gradiente azul suave — para estadísticas o highlights
export function StatCard({ title, value, subtitle, icon, color = 'primary', className = '' }) {
  const colors = {
    primary: 'from-primary-50 to-primary-100/50 border-primary-100',
    calm:    'from-calm-50 to-calm-100/50 border-calm-100',
    success: 'from-green-50 to-green-100/50 border-green-100',
    warning: 'from-amber-50 to-amber-100/50 border-amber-100',
  }
  const iconColors = {
    primary: 'bg-primary-100 text-primary-600',
    calm:    'bg-calm-100 text-calm-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
  }
  return (
    <div className={cn(
      'rounded-2xl border bg-gradient-to-br p-5',
      colors[color],
      className,
    )}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-warm-600">{title}</p>
        {icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-lg', iconColors[color])}>
            {icon}
          </div>
        )}
      </div>
      <p className="font-serif text-2xl font-bold text-warm-900">{value}</p>
      {subtitle && <p className="text-xs text-warm-500 mt-1">{subtitle}</p>}
    </div>
  )
}
