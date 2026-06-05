import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  hint,
  prefix,
  suffix,
  className = '',
  containerClassName = '',
  type = 'text',
  required,
  ...props
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-xs font-semibold text-slate-600 tracking-wide">
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          required={required}
          className={cn(
            'input-premium',
            prefix && 'pl-10',
            suffix && 'pr-10',
            error && 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.08)]',
            className,
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input

export function Select({ label, children, className = '', containerClassName = '', required, error, ...props }) {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-xs font-semibold text-slate-600 tracking-wide">
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}
      <select
        required={required}
        className={cn(
          'input-premium appearance-none cursor-pointer',
          error && 'border-rose-300 bg-rose-50/50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  )
}

export function Textarea({ label, hint, error, className = '', containerClassName = '', required, ...props }) {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-xs font-semibold text-slate-600 tracking-wide">
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        required={required}
        className={cn(
          'input-premium resize-none',
          error && 'border-rose-300 bg-rose-50/50',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
