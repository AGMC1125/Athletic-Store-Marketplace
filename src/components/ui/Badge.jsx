import { cn } from '../../utils/cn'

/**
 * Badge/Pill component.
 * Variants: gold, gray, success, error, warning
 */
function Badge({ children, variant = 'gold', className = '' }) {
  const variants = {
    gold:    'bg-brand-gold/10 text-brand-gold border border-brand-gold/30',
    gray:    'bg-white/5 text-content-secondary border border-white/10',
    success: 'bg-state-success/10 text-state-success border border-state-success/30',
    error:   'bg-state-error/10 text-state-error border border-state-error/30',
    warning: 'bg-state-warning/10 text-state-warning border border-state-warning/30',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge
