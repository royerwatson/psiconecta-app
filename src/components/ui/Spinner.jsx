import { cn } from '@/lib/utils'

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

/**
 * PsiconectaLogo — marca oficial.
 * Dos arcos que se envuelven alrededor de un punto central,
 * representando la conexión entre paciente y terapeuta.
 *
 * Props:
 *   size   — tamaño en px (default 28)
 *   color  — 'white' (sobre fondos oscuros/azules) | 'brand' (sobre fondos claros)
 */
export function PsiconectaLogo({ size = 28, color = 'white' }) {
  const stroke = color === 'brand' ? '#1e5a8e' : 'white'
  const fill   = color === 'brand' ? '#1e5a8e' : 'white'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Psiconecta"
    >
      {/* Arco izquierdo */}
      <path
        d="M13 7C5 11.5 5 20.5 13 25"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Arco derecho */}
      <path
        d="M19 7C27 11.5 27 20.5 19 25"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Nodo central — el punto de encuentro */}
      <circle cx="16" cy="16" r="2.8" fill={fill} />
    </svg>
  )
}

// Pantalla de carga completa
export function LoadingScreen({ message = 'Cargando...' }) {
  return (
    <div className="fixed inset-0 bg-psiconecta flex flex-col items-center justify-center gap-4 z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-calm">
          <PsiconectaLogo size={36} color="white" />
        </div>
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
