import { cn } from '../../utils/cn'
import Spinner from './Spinner'

/**
 * Componente Button reutilizable.
 * Variants: primary (dorado), secondary (outline dorado), ghost, danger
 * Sizes: sm, md, lg
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-brand-gold text-content-inverse hover:bg-brand-gold-light active:scale-95 shadow-gold-sm hover:shadow-gold-md',
    secondary:
      'border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-content-inverse active:scale-95',
    ghost:
      'text-content-secondary hover:text-content-primary hover:bg-white/5 active:scale-95',
    danger:
      'bg-state-error text-white hover:bg-red-600 active:scale-95',
  }

  const sizes = {
    sm:  'px-3 py-1.5 text-sm',
    md:  'px-5 py-2.5 text-sm',
    lg:  'px-7 py-3 text-base',
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading && <Spinner size="sm" className="text-current" />}
      {children}
    </button>
  )
}

export default Button
