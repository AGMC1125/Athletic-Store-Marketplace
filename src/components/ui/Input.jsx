import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

/**
 * Input component con soporte para label, error, helper text e iconos.
 * Compatible con react-hook-form via forwardRef.
 */
const Input = forwardRef(function Input(
  { label, error, helperText, className = '', id, required, icon: Icon, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-content-secondary">
          {label}
          {required && <span className="text-brand-gold ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon size={18} className="text-content-muted" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-brand-black-card px-4 py-2.5 text-sm text-content-primary',
            'placeholder:text-content-muted transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold',
            error
              ? 'border-state-error focus:ring-state-error/30'
              : 'border-white/10 hover:border-white/20',
            Icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-state-error mt-0.5">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-content-muted mt-0.5">{helperText}</p>
      )}
    </div>
  )
})

export default Input
