import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0)
  const sizes = { sm: 16, md: 22, lg: 32 }
  const px = sizes[size]

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star
        return (
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
            )}
          >
            <Star
              size={px}
              strokeWidth={1.5}
              className={cn(
                'transition-colors',
                filled ? 'text-amber-400 fill-amber-400' : 'text-warm-200',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

// Versión compacta para mostrar rating (solo lectura)
export function RatingDisplay({ value, reviews, compact = false }) {
  const filled = Math.round(value)
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Star size={11} strokeWidth={0} className="text-amber-400 fill-amber-400" />
        <span className="text-xs font-semibold text-warm-700">{Number(value).toFixed(1)}</span>
        {reviews !== undefined && (
          <span className="text-xs text-warm-400">({reviews})</span>
        )}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((s) => (
          <Star key={s} size={13} strokeWidth={1.5}
            className={s <= filled ? 'text-amber-400 fill-amber-400' : 'text-warm-200'} />
        ))}
      </div>
      <span className="text-sm font-medium text-warm-700">{Number(value).toFixed(1)}</span>
      {reviews !== undefined && (
        <span className="text-xs text-warm-400">({reviews} reseñas)</span>
      )}
    </div>
  )
}
