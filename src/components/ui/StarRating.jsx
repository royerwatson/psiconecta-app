import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0)

  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn(
            'transition-transform duration-100',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default',
            sizes[size],
          )}
        >
          <span className={cn(
            'transition-colors',
            (hovered || value) >= star ? 'text-amber-400' : 'text-warm-200',
          )}>
            ★
          </span>
        </button>
      ))}
    </div>
  )
}

// Versión compacta para mostrar rating (solo lectura)
export function RatingDisplay({ value, reviews, compact = false }) {
  const filled = Math.round(value)
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-amber-400 text-xs">★</span>
        <span className="text-xs font-semibold text-warm-700">{Number(value).toFixed(1)}</span>
        {reviews !== undefined && (
          <span className="text-xs text-warm-400">({reviews})</span>
        )}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1,2,3,4,5].map((s) => (
          <span key={s} className={s <= filled ? 'text-amber-400' : 'text-warm-200'}>★</span>
        ))}
      </div>
      <span className="text-sm font-medium text-warm-700">{Number(value).toFixed(1)}</span>
      {reviews !== undefined && (
        <span className="text-xs text-warm-400">({reviews} reseñas)</span>
      )}
    </div>
  )
}
