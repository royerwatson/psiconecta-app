/**
 * Button — Componente premium nivel Apple.
 *
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glass'
 * size:    'sm' | 'md' | 'lg' | 'xl' | 'icon'
 */
import { cn } from '@/lib/utils'

const variants = {
  primary:   'btn-primary-premium text-white',
  secondary: 'btn-secondary-premium',
  ghost:     'btn-ghost-premium',
  danger:    'btn-danger-premium text-white',
  outline:   'bg-transparent border-[1.5px] border-slate-200 text-slate-700 hover:bg-slate-50',
  glass:     'glass text-slate-800 border border-white/60 shadow-sm hover:bg-white/90',
  calm:      'text-white',
}

const gradients = {
  calm: 'gradient-calm',
}

const sizes = {
  sm:   'px-3.5 py-2 text-xs rounded-xl',
  md:   'px-5 py-3 text-sm rounded-[14px]',
  lg:   'px-6 py-3.5 text-[0.9375rem] rounded-2xl',
  xl:   'px-8 py-4 text-base rounded-2xl',
  icon: 'p-2.5 rounded-xl',
}

export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  className = '',
  disabled  = false,
  loading   = false,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        'btn-premium focus-ring',
        variants[variant],
        gradients[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed !transform-none',
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Cargando...</span>
        </>
      ) : children}
    </button>
  )
}
