import { cn, getInitials, getAvatarColor } from '@/lib/utils'

const sizes = {
  xs:  'w-7 h-7 text-xs',
  sm:  'w-9 h-9 text-sm',
  md:  'w-11 h-11 text-sm',
  lg:  'w-14 h-14 text-base',
  xl:  'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-2xl',
}

export default function Avatar({ name = '', src, size = 'md', className = '', online = null }) {
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div className={cn(
        'rounded-full flex items-center justify-center font-semibold overflow-hidden',
        sizes[size],
        !src && getAvatarColor(name),
      )}>
        {src
          ? <img src={src} alt={name} className="w-full h-full object-cover" />
          : <span>{getInitials(name)}</span>
        }
      </div>
      {online !== null && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-white',
          size === 'xs' || size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3',
          online ? 'bg-success' : 'bg-warm-300',
        )} />
      )}
    </div>
  )
}

// Grupo de avatares apilados
export function AvatarGroup({ names = [], max = 3, size = 'sm' }) {
  const visible = names.slice(0, max)
  const remaining = names.length - max
  return (
    <div className="flex -space-x-2">
      {visible.map((name, i) => (
        <Avatar key={i} name={name} size={size} className="ring-2 ring-white" />
      ))}
      {remaining > 0 && (
        <div className={cn(
          'rounded-full bg-warm-200 text-warm-600 text-xs font-medium flex items-center justify-center ring-2 ring-white',
          sizes[size],
        )}>
          +{remaining}
        </div>
      )}
    </div>
  )
}
