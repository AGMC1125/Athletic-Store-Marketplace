import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder = 'Selecciona una opción', className = '', id, required, ...props },
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
      <select
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-lg border bg-brand-black-soft px-4 py-2.5 text-sm text-content-primary',
          'focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold',
          'transition-colors duration-200 cursor-pointer',
          error
            ? 'border-state-error'
            : 'border-white/10 hover:border-white/20',
          className
        )}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-state-error mt-0.5">{error}</p>}
    </div>
  )
})

export default Select
