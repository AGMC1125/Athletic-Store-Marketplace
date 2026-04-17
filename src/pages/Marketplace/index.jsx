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
  const rawUrl = Array.isArray(product.image_url)
    ? product.image_url[0]
    : product.image_url

  const thumb = rawUrl
    ? getOptimizedUrl(rawUrl, { width: 400, crop: 'fit' })
    : null

  const discountPct = product.discount_percentage
  const basePrice   = parseFloat(product.price)
  const finalPrice  = discountPct ? basePrice * (1 - discountPct / 100) : basePrice

  return (
    <Link
      to={ROUTES.PRODUCT.replace(':id', product.id)}
      className="card-base overflow-hidden group hover:border-brand-gold/30 transition-all duration-200 flex flex-col"
    >
      {/* Imagen — sin recorte, fondo neutro */}
      <div className="relative bg-brand-black-soft" style={{ aspectRatio: '1 / 1' }}>
        {thumb ? (
          <img
            src={thumb}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-contain p-2 group-hover:brightness-110 transition-all duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-content-muted">
            <Package size={32} />
          </div>
        )}
        {discountPct > 0 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-brand-gold text-black text-[10px] font-bold leading-none">
            −{discountPct}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs sm:text-sm font-semibold text-content-primary line-clamp-2 leading-snug mb-1.5 flex-1">
          {product.name}
        </p>

        <Badge variant="gray" size="sm" className="mb-2 inline-flex items-center gap-1 self-start">
          {(() => { const Icon = CATEGORY_ICONS[product.category]; return Icon ? <Icon size={10} /> : null })()}
          <span className="text-[10px]">{CATEGORY_LABELS[product.category] ?? product.category}</span>
        </Badge>

        <div className="flex items-end justify-between gap-1">
          <div>
            <p className="text-brand-gold font-bold text-sm sm:text-base leading-none">
              {formatPrice(finalPrice)}
            </p>
            {discountPct > 0 && (
              <p className="text-[10px] text-content-muted line-through mt-0.5">{formatPrice(basePrice)}</p>
            )}
          </div>
          {product.stock > 0
            ? <span className="text-[10px] sm:text-xs text-state-success shrink-0">En existencia</span>
            : <span className="text-[10px] sm:text-xs text-state-error shrink-0">Sin stock</span>
          }
        </div>

        {product.stores && (
          <p className="text-[10px] text-content-muted mt-1.5 truncate flex items-center gap-1">
            <Store size={10} className="shrink-0" />
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
      <div className="flex flex-col gap-3 mb-8">
        {/* Búsqueda — fila completa */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            placeholder="Buscar productos o tiendas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-brand-black-soft text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
          />
        </div>

        {/* Categorías — scroll horizontal en móvil */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategory(cat.value)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                category === cat.value
                  ? 'bg-brand-gold text-black'
                  : 'bg-brand-black-soft border border-white/10 text-content-secondary hover:border-brand-gold/40 hover:text-content-primary'
              }`}
            >
              {cat.Icon && <cat.Icon size={13} />}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skeleton — primera carga */}
      {isFirstLoad && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
