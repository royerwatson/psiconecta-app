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
  ...props
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-warm-700">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 text-warm-400 pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-white py-2.5 text-sm text-warm-800 placeholder:text-warm-400',
            'transition-all duration-150 outline-none',
            'focus:ring-2 focus:ring-primary-400 focus:ring-offset-0 focus:border-primary-400',
            'disabled:bg-warm-50 disabled:text-warm-400 disabled:cursor-not-allowed',
            error
              ? 'border-red-300 focus:ring-red-400 focus:border-red-400'
              : 'border-warm-200 hover:border-warm-300',
            prefix ? 'pl-10' : 'pl-4',
            suffix ? 'pr-10' : 'pr-4',
            className,
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 text-warm-400">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-warm-400">{hint}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input

// Textarea
export const Textarea = forwardRef(({
  label, error, hint, className = '', containerClassName = '', rows = 4, ...props
}, ref) => (
  <div className={cn('flex flex-col gap-1.5', containerClassName)}>
    {label && (
      <label className="text-sm font-medium text-warm-700">
        {label}
        {props.required && <span className="text-red-400 ml-1">*</span>}
      </label>
    )}
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-warm-800 placeholder:text-warm-400 resize-none',
        'transition-all duration-150 outline-none',
        'focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
        error ? 'border-red-300' : 'border-warm-200 hover:border-warm-300',
        className,
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
    {hint && !error && <p className="text-xs text-warm-400">{hint}</p>}
  </div>
))
Textarea.displayName = 'Textarea'

// Select
export const Select = forwardRef(({
  label, error, hint, className = '', containerClassName = '', children, ...props
}, ref) => (
  <div className={cn('flex flex-col gap-1.5', containerClassName)}>
    {label && (
      <label className="text-sm font-medium text-warm-700">
        {label}
        {props.required && <span className="text-red-400 ml-1">*</span>}
      </label>
    )}
    <select
      ref={ref}
      className={cn(
        'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-warm-800',
        'transition-all duration-150 outline-none appearance-none cursor-pointer',
        'focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
        error ? 'border-red-300' : 'border-warm-200 hover:border-warm-300',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
    {hint && !error && <p className="text-xs text-warm-400">{hint}</p>}
  </div>
))
Select.displayName = 'Select'
