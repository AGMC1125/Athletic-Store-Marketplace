/**
 * Componentes de skeleton loading para mostrar mientras se cargan datos.
 * Proporcionan feedback visual y mejoran la percepción de velocidad.
 */

/**
 * Skeleton para una tarjeta de producto.
 */
export function ProductCardSkeleton() {
  return (
    <div className="card-base p-4 flex items-center gap-4 animate-pulse">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg bg-white/5 flex-shrink-0" />

      {/* Info */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/5 rounded w-2/3" />
        <div className="flex items-center gap-3">
          <div className="h-3 bg-white/5 rounded w-20" />
          <div className="h-3 bg-white/5 rounded w-16" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-white/5" />
        <div className="w-8 h-8 rounded-lg bg-white/5" />
        <div className="w-8 h-8 rounded-lg bg-white/5" />
      </div>
    </div>
  )
}

/**
 * Skeleton para lista de productos.
 */
export function ProductListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton para grid de productos (marketplace).
 */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-base p-4 space-y-3 animate-pulse">
          <div className="aspect-square bg-white/5 rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 bg-white/5 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-5 bg-white/5 rounded w-20" />
            <div className="h-8 bg-white/5 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton para detalles de producto.
 */
export function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 animate-pulse">
      {/* Imagen */}
      <div className="aspect-square bg-white/5 rounded-lg" />

      {/* Info */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-8 bg-white/5 rounded w-3/4" />
          <div className="h-6 bg-white/5 rounded w-1/4" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-5/6" />
          <div className="h-4 bg-white/5 rounded w-4/6" />
        </div>
        <div className="h-12 bg-white/5 rounded" />
      </div>
    </div>
  )
}

/**
 * Skeleton genérico para tablas.
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="card-base overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <div className="h-4 bg-white/5 rounded w-20 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-border-subtle last:border-0">
                {Array.from({ length: columns }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Skeleton para formularios.
 */
export function FormSkeleton({ fields = 6 }) {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-white/5 rounded w-24" />
          <div className="h-10 bg-white/5 rounded w-full" />
        </div>
      ))}
      <div className="flex gap-3 justify-end pt-4">
        <div className="h-10 bg-white/5 rounded w-24" />
        <div className="h-10 bg-white/5 rounded w-32" />
      </div>
    </div>
  )
}

/**
 * Spinner inline para botones y componentes pequeños.
 */
export function InlineSpinner({ size = 16, className = '' }) {
  return (
    <div 
      className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

/**
 * Spinner centrado para páginas completas.
 */
export function PageSpinner({ message = 'Cargando...', size = 'lg' }) {
  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 48,
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div 
        className="rounded-full border-4 border-white/10 border-t-brand-gold animate-spin"
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      />
      {message && (
        <p className="text-content-secondary text-sm">{message}</p>
      )}
    </div>
  )
}

/**
 * Estado de "no hay datos" genérico.
 */
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {Icon && (
        <div className="p-4 bg-surface-elevated rounded-full mb-4">
          <Icon size={40} className="text-content-muted" />
        </div>
      )}
      {title && (
        <h3 className="text-content-primary font-medium text-lg mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-content-secondary text-sm max-w-md mb-6">{description}</p>
      )}
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-4 py-2 bg-brand-gold text-black font-medium rounded-lg hover:bg-brand-gold/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
