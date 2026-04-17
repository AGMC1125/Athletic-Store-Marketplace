import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Package, Pencil, Trash2, ToggleLeft, ToggleRight, AlertTriangle
} from 'lucide-react'
import { 
  Button, Badge, Modal, ProductListSkeleton, InlineSpinner, EmptyState 
} from '../../../components/ui'
import ProductFilters from '../../../components/products/ProductFilters'
import { productsService } from '../../../services/productsService'
import { getOptimizedUrl } from '../../../lib/cloudinary'
import useAuthStore from '../../../store/authStore'
import useUIStore from '../../../store/uiStore'
import { ROUTES, PLAN_LIMITS, CATEGORY_LABELS, PLAN_LABELS } from '../../../constants'
import { formatPrice } from '../../../utils/formatters'

const categoryVariant = {
  footwear:           'info',
  socks:              'secondary',
  shin_guards:        'warning',
  goalkeeper_gloves:  'success',
}

function PlanLimitBar({ current, limit }) {
  const pct = limit === Infinity ? 0 : Math.min((current / limit) * 100, 100)
  const isNear = pct >= 80
  const isFull = current >= limit

  return (
    <div className="card-base px-4 py-3 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-content-secondary">Productos publicados</span>
          <span className={`text-xs font-medium ${isFull ? 'text-state-error' : isNear ? 'text-state-warning' : 'text-content-primary'}`}>
            {current} / {limit === Infinity ? '∞' : limit}
          </span>
        </div>
        {limit !== Infinity && (
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-state-error' : isNear ? 'bg-state-warning' : 'bg-brand-gold'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
      {isFull && (
        <Link to={ROUTES.DASHBOARD_MEMBERSHIP}>
          <Button variant="secondary" size="sm">Mejorar plan</Button>
        </Link>
      )}
    </div>
  )
}

function ProductCard({ product, onToggle, onDelete, isToggling }) {
  const thumb = product.image_url
    ? getOptimizedUrl(product.image_url, { width: 80, height: 80 })
    : null

  return (
    <div className={`card-base p-4 flex items-center gap-4 hover:border-white/20 transition-colors ${!product.is_active ? 'opacity-60' : ''}`}>
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
        {thumb
          ? <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-content-muted"><Package size={20} /></div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-content-primary truncate">{product.name}</p>
          <Badge variant={categoryVariant[product.category] ?? 'secondary'} size="sm">
            {CATEGORY_LABELS[product.category] ?? product.category}
          </Badge>
          {!product.is_active && (
            <span className="text-xs text-content-muted bg-white/5 px-2 py-0.5 rounded-full">Oculto</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-brand-gold font-semibold text-sm">{formatPrice(product.price)}</span>
          <span className="text-content-muted text-xs">Stock: {product.stock}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Toggle visibilidad */}
        <button
          onClick={() => !isToggling && onToggle(product)}
          disabled={isToggling}
          title={product.is_active ? 'Ocultar producto' : 'Mostrar producto'}
          className={`p-2 rounded-lg transition-colors ${
            isToggling
              ? 'cursor-not-allowed opacity-50'
              : 'text-content-secondary hover:text-content-primary hover:bg-white/5'
          }`}
        >
          {isToggling
            ? <InlineSpinner size={20} className="text-brand-gold" />
            : product.is_active
              ? <ToggleRight size={20} className="text-state-success" />
              : <ToggleLeft  size={20} className="text-content-muted" />
          }
        </button>

        {/* Editar */}
        <Link
          to={ROUTES.DASHBOARD_PRODUCTS_EDIT.replace(':id', product.id)}
          className="p-2 rounded-lg text-content-secondary hover:text-brand-gold hover:bg-brand-gold/5 transition-colors"
          title="Editar producto"
        >
          <Pencil size={16} />
        </Link>

        {/* Eliminar */}
        <button
          onClick={() => onDelete(product)}
          title="Eliminar producto"
          className="p-2 rounded-lg text-content-secondary hover:text-state-error hover:bg-state-error/5 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

function DashboardProducts() {
  const { store, profile } = useAuthStore()
  const { addToast }       = useUIStore()
  const queryClient        = useQueryClient()
  const [deleteTarget,    setDeleteTarget]    = useState(null)
  const [togglingId,      setTogglingId]      = useState(null)
  const [showLimitModal,  setShowLimitModal]  = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    isActive: undefined,
    sort: 'newest',
  })

  const plan  = profile?.plan ?? 'free'
  const limit = PLAN_LIMITS[plan]

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'store', store?.id],
    queryFn: () => productsService.getProductsByStore(store.id),
    enabled: !!store?.id,
    staleTime: 1000 * 60,
  })

  // Filtrar y ordenar productos
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Filtro de búsqueda
    if (filters.search) {
      const search = filters.search.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      )
    }

    // Filtro de categoría
    if (filters.category) {
      result = result.filter(p => p.category === filters.category)
    }

    // Filtro de estado
    if (filters.isActive !== undefined) {
      result = result.filter(p => p.is_active === filters.isActive)
    }

    // Ordenamiento
    switch (filters.sort) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        break
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'price_asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        result.sort((a, b) => b.price - a.price)
        break
      default:
        break
    }

    return result
  }, [products, filters])

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => {
      setTogglingId(id)
      return productsService.toggleProductStatus(id, !is_active)
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ['products', 'store', store?.id] })
      addToast({
        message: is_active ? 'Producto ocultado del catálogo' : 'Producto visible en el catálogo',
        type: 'success',
      })
      setTogglingId(null)
    },
    onError: () => {
      addToast({ message: 'Error al cambiar la visibilidad', type: 'error' })
      setTogglingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => productsService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'store', store?.id] })
      addToast({ message: 'Producto eliminado', type: 'success' })
      setDeleteTarget(null)
    },
    onError: () => addToast({ message: 'Error al eliminar el producto', type: 'error' }),
  })

  const atLimit    = products.length >= limit
  const hasStore   = !!store

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Mis Productos</h1>
          <p className="text-content-secondary mt-1">Gestiona tu catálogo de productos.</p>
        </div>
        {hasStore && (
          atLimit ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowLimitModal(true)}
            >
              <Plus size={16} /> Nuevo producto
            </Button>
          ) : (
            <Link to={ROUTES.DASHBOARD_PRODUCTS_NEW}>
              <Button variant="primary" size="sm">
                <Plus size={16} /> Nuevo producto
              </Button>
            </Link>
          )
        )}
      </div>

      {/* Sin tienda configurada */}
      {!hasStore && (
        <div className="card-base p-8 text-center">
          <Package size={40} className="text-content-muted mx-auto mb-3" />
          <p className="text-content-primary font-medium mb-1">Primero configura tu tienda</p>
          <p className="text-content-secondary text-sm mb-4">
            Necesitas crear el perfil de tu tienda antes de publicar productos.
          </p>
          <Link to={ROUTES.DASHBOARD_STORE}>
            <Button variant="primary" size="sm">Ir a Mi Tienda</Button>
          </Link>
        </div>
      )}

      {/* Barra de límite */}
      {hasStore && (
        <PlanLimitBar current={products.length} limit={limit} />
      )}

      {/* Loading */}
      {hasStore && isLoading && (
        <ProductListSkeleton count={3} />
      )}

      {/* Lista vacía */}
      {hasStore && !isLoading && products.length === 0 && (
        <EmptyState
          icon={Package}
          title="Aún no tienes productos"
          description="Agrega tu primer producto para que los clientes puedan encontrarte."
          action={() => {}}
          actionLabel={
            <Link to={ROUTES.DASHBOARD_PRODUCTS_NEW}>
              <Button variant="primary" size="sm">
                <Plus size={16} /> Agregar primer producto
              </Button>
            </Link>
          }
        />
      )}

      {/* Filtros */}
      {hasStore && !isLoading && products.length > 0 && (
        <ProductFilters 
          filters={filters}
          onFiltersChange={setFilters}
          productCount={filteredProducts.length}
        />
      )}

      {/* Lista de productos */}
      {hasStore && !isLoading && products.length > 0 && (
        <>
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No hay productos que coincidan"
              description="Intenta ajustar los filtros para ver más resultados."
              action={() => setFilters({ search: '', category: '', isActive: undefined, sort: 'newest' })}
              actionLabel="Limpiar filtros"
            />
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onToggle={(p) => toggleMutation.mutate(p)}
                  onDelete={(p) => setDeleteTarget(p)}
                  isToggling={togglingId === product.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal límite de plan alcanzado */}
      <Modal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        title="Límite de productos alcanzado"
        size="sm"
      >
        <div className="space-y-5">
          <p className="text-sm text-content-secondary">
            Has alcanzado el límite de <span className="text-content-primary font-semibold">{limit} productos</span> de tu plan actual.
            Mejora tu plan para publicar más productos en el catálogo.
          </p>
          <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-xl p-4 text-center">
            <p className="text-xs text-content-muted mb-1">Plan actual</p>
            <p className="text-brand-gold font-bold">{PLAN_LABELS[profile?.plan ?? 'free']}</p>
            <p className="text-sm text-content-secondary mt-1">{limit} productos máx.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowLimitModal(false)}>
              Cancelar
            </Button>
            <Link to={ROUTES.DASHBOARD_MEMBERSHIP} className="flex-1">
              <Button variant="primary" className="w-full" onClick={() => setShowLimitModal(false)}>
                Ver planes
              </Button>
            </Link>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar producto"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-state-error flex-shrink-0 mt-0.5" />
            <p className="text-content-secondary text-sm">
              ¿Estás seguro de que deseas eliminar <span className="text-content-primary font-medium">"{deleteTarget?.name}"</span>? Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DashboardProducts
