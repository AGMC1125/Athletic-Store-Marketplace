import { cn } from '../../utils/cn'

/**
 * Card base reutilizable.
 * Props: className, hoverable (muestra efecto hover dorado)
 */
function Card({ children, className = '', hoverable = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-brand-black-card border border-brand-gold/10 rounded-xl shadow-card',
        hoverable && 'transition-all duration-300 hover:border-brand-gold/30 hover:shadow-gold-sm cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={cn('px-5 pt-5 pb-3 border-b border-white/5', className)}>
      {children}
    </div>
  )
}

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={cn('px-5 pt-3 pb-5 border-t border-white/5', className)}>
      {children}
    </div>
  )
}

export default Card
