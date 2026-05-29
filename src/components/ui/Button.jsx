/**
 * Componente Button reutilizable.
 *
 * Props:
 *   variant  — 'primary' | 'secondary' | 'ghost' | 'danger' | 'calm' | 'outline'
 *   size     — 'sm' | 'md' | 'lg' | 'xl' | 'icon'
 *   loading  — muestra spinner y deshabilita el botón
 *   fullWidth — width: 100%
 *   disabled — deshabilita el botón (también se aplica cuando loading=true)
 */
import { cn } from '@/lib/utils'

const variants = {
  primary:   'bg-primary-600 hover:bg-primary-700 text-white btn-shadow active:scale-95',
  secondary: 'bg-white hover:bg-warm-50 text-primary-700 border border-primary-200 hover:border-primary-300',
  ghost:     'bg-transparent hover:bg-primary-50 text-primary-600',
  danger:    'bg-red-500 hover:bg-red-600 text-white',
  calm:      'bg-calm-500 hover:bg-calm-600 text-white btn-shadow active:scale-95',
  outline:   'bg-transparent border border-warm-200 text-warm-700 hover:bg-warm-50',
}

const sizes = {
  sm:   'px-3 py-1.5 text-sm rounded-lg',
  md:   'px-5 py-2.5 text-sm rounded-xl',
  lg:   'px-6 py-3 text-base rounded-xl',
  xl:   'px-8 py-4 text-lg rounded-2xl',
  icon: 'p-2.5 rounded-xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
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
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Cargando...</span>
        </>
      ) : children}
    </button>
  )
}
