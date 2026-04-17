import { cn } from '../../utils/cn'

function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm:  'w-4 h-4 border-2',
    md:  'w-6 h-6 border-2',
    lg:  'w-10 h-10 border-3',
    xl:  'w-14 h-14 border-4',
  }

  return (
    <div
      role="status"
      aria-label="Cargando..."
      className={cn(
        'rounded-full border-current border-t-transparent animate-spin',
        sizes[size],
        className
      )}
    />
  )
}

export default Spinner
