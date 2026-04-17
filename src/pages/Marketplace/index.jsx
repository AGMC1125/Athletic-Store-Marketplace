import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Package, Store, ChevronDown } from 'lucide-react'
import { Badge, Spinner } from '../../components/ui'
import { productsService } from '../../services/productsService'
import { getOptimizedUrl } from '../../lib/cloudinary'
import { CATEGORY_LABELS, CATEGORY_ICONS, ROUTES } from '../../constants'
import { formatPrice } from '../../utils/formatters'

const PAGE_SIZE = 12

// ── Debounce ─────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── Tarjeta de producto ───────────────────────────────────
function ProductCard({ product }) {
  const thumb = product.image_url
    ? getOptimizedUrl(product.image_url, { width: 400, height: 400 })
    : null

  return (
    <Link
      to={ROUTES.PRODUCT.replace(':id', product.id)}
      className="card-base overflow-hidden group hover:border-brand-gold/30 transition-all duration-200"
    >
      {/* Imagen */}
      <div className="aspect-square overflow-hidden bg-brand-black-soft">
        {thumb
          ? (
            <img
              src={thumb}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )
          : (
            <div className="w-full h-full flex items-center justify-center text-content-muted">
              <Package size={36} />
            </div>
          )
        }
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-sm font-semibold text-content-primary line-clamp-2 leading-snug mb-2">
          {product.name}
        </p>

        <Badge variant="secondary" size="sm" className="mb-3 inline-flex items-center gap-1">
          {(() => { const Icon = CATEGORY_ICONS[product.category]; return Icon ? <Icon size={11} /> : null })()}
          {CATEGORY_LABELS[product.category] ?? product.category}
        </Badge>

        <div className="flex items-end justify-between">
          <p className="text-brand-gold font-bold text-base">{formatPrice(product.price)}</p>
          {product.stock > 0
            ? <span className="text-xs text-state-success">En existencia</span>
            : <span className="text-xs text-state-error">Sin stock</span>
          }
        </div>

        {product.stores && (
          <p className="text-xs text-content-muted mt-2 truncate flex items-center gap-1">
            <Store size={11} className="shrink-0" />
            {product.stores.name}
            {product.stores.city ? ` · ${product.stores.city}` : ''}
          </p>
        )}
      </div>
    </Link>
  )
}

// ── Skeleton ──────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="card-base overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/5" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/3" />
        <div className="h-4 bg-white/5 rounded w-2/5" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────
const CATEGORIES = [
  { value: '', label: 'Todos', Icon: null },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
    Icon: CATEGORY_ICONS[value],
  })),
]

function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState(searchParams.get('categoria') ?? '')
  const [page, setPage]         = useState(1)
  const [productPages, setProductPages] = useState([]) // indexed by page-1
  const debouncedSearch = useDebounce(search)

  // Sincroniza categoría cuando viene desde la landing (?categoria=X)
  useEffect(() => {
    setCategory(searchParams.get('categoria') ?? '')
  }, [searchParams])

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setPage(1)
    setProductPages([])
  }, [debouncedSearch, category])

  const { data: currentPageProducts = [], isLoading, isFetching } = useQuery({
    queryKey: ['products', 'public', { category, search: debouncedSearch, page }],
    queryFn: () =>
      productsService.getPublicProducts({
        category: category || undefined,
        search:   debouncedSearch || undefined,
        page,
        limit:    PAGE_SIZE,
      }),
    staleTime: 1000 * 60 * 2,
  })

  // Acumular productos paginados indexados por página
  const prevQueryKey = useRef(null)
  useEffect(() => {
    if (isFetching) return
    setProductPages(prev => {
      const next = [...prev]
      next[page - 1] = currentPageProducts
      return next
    })
  }, [currentPageProducts, isFetching, page])

  const allProducts = productPages.flat()
  const hasMore     = currentPageProducts.length === PAGE_SIZE

  function handleCategory(cat) {
    setCategory(cat)
    if (cat) setSearchParams({ categoria: cat })
    else setSearchParams({})
  }

  const isFirstLoad = isLoading && page === 1

  return (
    <div className="container-app py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-content-primary mb-2">
          Catálogo de Productos
        </h1>
        <p className="text-content-secondary">
          Encuentra productos deportivos de tiendas físicas cerca de ti
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            placeholder="Buscar productos o tiendas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 bg-brand-black-soft text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
          />
        </div>

        {/* Categorías */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategory(cat.value)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === cat.value
                  ? 'bg-brand-gold text-content-inverse'
                  : 'bg-brand-black-soft border border-white/10 text-content-secondary hover:border-brand-gold/40 hover:text-content-primary'
              }`}
            >
              {cat.Icon && <cat.Icon size={14} />}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skeleton — primera carga */}
      {isFirstLoad && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      )}

      {/* Vacío */}
      {!isFirstLoad && allProducts.length === 0 && !isFetching && (
        <div className="text-center py-24">
          <Package size={52} className="text-content-muted mx-auto mb-4" />
          <p className="text-content-primary font-medium mb-2">No se encontraron productos</p>
          <p className="text-content-secondary text-sm">
            {debouncedSearch || category
              ? 'Prueba con otros términos o quita los filtros.'
              : 'Aún no hay productos publicados en el catálogo.'}
          </p>
          {(debouncedSearch || category) && (
            <button
              onClick={() => { setSearch(''); handleCategory('') }}
              className="mt-4 text-brand-gold text-sm hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {!isFirstLoad && allProducts.length > 0 && (
        <>
          <p className="text-xs text-content-muted mb-4">
            {allProducts.length} producto{allProducts.length !== 1 ? 's' : ''} encontrado{allProducts.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {allProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Cargar más */}
          <div className="flex justify-center mt-10">
            {isFetching && page > 1 ? (
              <div className="flex items-center gap-2 text-content-muted text-sm">
                <Spinner size="sm" className="text-brand-gold" />
                Cargando más productos...
              </div>
            ) : hasMore ? (
              <button
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-brand-gold/30 text-brand-gold text-sm font-medium hover:bg-brand-gold/10 hover:border-brand-gold/60 transition-all active:scale-95"
              >
                <ChevronDown size={16} />
                Cargar más productos
              </button>
            ) : (
              <p className="text-xs text-content-muted">
                Has visto todos los productos disponibles
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default MarketplacePage
