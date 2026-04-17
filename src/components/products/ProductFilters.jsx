import { Search, Filter, X, SlidersHorizontal } from 'lucide-react'
import { CATEGORY_LABELS } from '../../constants'

/**
 * Componente de filtros para productos.
 * Permite buscar, filtrar por categoría y estado.
 */
export default function ProductFilters({ 
  filters, 
  onFiltersChange,
  productCount = 0,
  className = '' 
}) {
  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      category: '',
      isActive: undefined,
      sort: 'newest',
    })
  }

  const hasActiveFilters = filters.search || filters.category || filters.isActive !== undefined

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Buscador */}
      <div className="relative">
        <Search 
          size={18} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" 
        />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full bg-surface-elevated border border-border-subtle text-content-primary placeholder-content-muted rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50 transition-colors"
        />
        {filters.search && (
          <button
            onClick={() => updateFilter('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Categoría */}
        <div className="relative">
          <select
            value={filters.category || ''}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="appearance-none bg-surface-elevated border border-border-subtle text-content-primary rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-brand-gold/50 transition-colors cursor-pointer"
          >
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <Filter size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
        </div>

        {/* Estado */}
        <div className="relative">
          <select
            value={
              filters.isActive === undefined 
                ? 'all' 
                : filters.isActive 
                  ? 'active' 
                  : 'inactive'
            }
            onChange={(e) => {
              const value = e.target.value
              updateFilter(
                'isActive', 
                value === 'all' ? undefined : value === 'active'
              )
            }}
            className="appearance-none bg-surface-elevated border border-border-subtle text-content-primary rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-brand-gold/50 transition-colors cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Visibles</option>
            <option value="inactive">Ocultos</option>
          </select>
          <SlidersHorizontal size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
        </div>

        {/* Ordenar */}
        <div className="relative ml-auto">
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="appearance-none bg-surface-elevated border border-border-subtle text-content-primary rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-brand-gold/50 transition-colors cursor-pointer"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="name_asc">Nombre A-Z</option>
            <option value="name_desc">Nombre Z-A</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
          <SlidersHorizontal size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
        </div>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-content-secondary hover:text-brand-gold transition-colors flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-surface-elevated"
          >
            <X size={14} />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-xs text-content-secondary">
        <span>
          {productCount === 0 
            ? 'No hay productos' 
            : `${productCount} producto${productCount === 1 ? '' : 's'} encontrado${productCount === 1 ? '' : 's'}`}
        </span>
        {hasActiveFilters && (
          <span className="text-brand-gold">Filtros activos</span>
        )}
      </div>
    </div>
  )
}
