import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin, Phone, MessageCircle, Package, Store,
  ArrowLeft, AlertTriangle,
} from 'lucide-react'
import { Badge, Spinner } from '../../components/ui'
import { storesService } from '../../services/storesService'
import { productsService } from '../../services/productsService'
import { getOptimizedUrl } from '../../lib/cloudinary'
import { ROUTES, CATEGORY_LABELS, CATEGORY_ICONS } from '../../constants'
import { formatPrice } from '../../utils/formatters'

// ── Tarjeta de producto (dentro del perfil de tienda) ─────
function StoreProductCard({ product }) {
  const thumb = product.image_url
    ? getOptimizedUrl(product.image_url, { width: 400, crop: 'fit' })
    : null

  const CategoryIcon = CATEGORY_ICONS[product.category]

  return (
    <Link
      to={ROUTES.PRODUCT.replace(':id', product.id)}
      className="card-base overflow-hidden group hover:border-brand-gold/30 transition-all duration-200"
    >
      <div className="aspect-square bg-brand-black-soft flex items-center justify-center overflow-hidden">
        {thumb
          ? (
            <img
              src={thumb}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:brightness-110 transition-all duration-300"
            />
          )
          : (
            <div className="w-full h-full flex items-center justify-center text-content-muted">
              <Package size={32} />
            </div>
          )
        }
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-content-primary line-clamp-2 leading-snug mb-2">
          {product.name}
        </p>
        <Badge variant="gray" size="sm" className="mb-3 inline-flex items-center gap-1">
          {CategoryIcon && <CategoryIcon size={12} />}
          {CATEGORY_LABELS[product.category] ?? product.category}
        </Badge>
        <div className="flex items-center justify-between">
          <p className="text-brand-gold font-bold">{formatPrice(parseFloat(product.price))}</p>
          {product.stock > 0
            ? <span className="text-xs text-state-success">En existencia</span>
            : <span className="text-xs text-state-error">Sin stock</span>
          }
        </div>
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
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────
function StoreProfilePage() {
  const { slug } = useParams()

  const { data: store, isLoading: loadingStore, isError: errorStore } = useQuery({
    queryKey: ['store', 'public', slug],
    queryFn: () => storesService.getStoreBySlug(slug),
    staleTime: 1000 * 60 * 5,
    enabled: !!slug,
  })

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'store', 'public', store?.id],
    queryFn: () => productsService.getPublicProductsByStore(store.id),
    staleTime: 1000 * 60 * 2,
    enabled: !!store?.id,
  })

  if (loadingStore) {
    return (
      <div className="container-app py-20 flex justify-center">
        <Spinner size="lg" className="text-brand-gold" />
      </div>
    )
  }

  if (errorStore || !store) {
    return (
      <div className="container-app py-20 text-center">
        <div className="inline-flex p-4 rounded-full bg-state-error/10 mb-4">
          <AlertTriangle size={32} className="text-state-error" />
        </div>
        <p className="text-content-primary font-semibold mb-2">Tienda no encontrada</p>
        <p className="text-content-secondary text-sm mb-6">
          Esta tienda no existe o no está activa en este momento.
        </p>
        <Link
          to={ROUTES.CATALOG}
          className="inline-flex items-center gap-2 text-brand-gold hover:underline text-sm"
        >
          <ArrowLeft size={15} /> Ir al catálogo
        </Link>
      </div>
    )
  }

  const phone = store.phone?.replace(/\D/g, '')
  const whatsappUrl = phone
    ? `https://wa.me/52${phone}?text=${encodeURIComponent(`Hola, encontré tu tienda "${store.name}" en Athletic Store Marketplace.`)}`
    : null

  const bannerUrl = store.banner_url
    ? getOptimizedUrl(store.banner_url, { width: 1400, height: 400 })
    : null

  return (
    <div className="animate-fade-in">
      {/* ── Banner / Header ── */}
      <div className="relative bg-brand-black-card border-b border-white/5">

        {/* Banner: imagen real o gradiente decorativo */}
        {bannerUrl ? (
          <div className="h-28 sm:h-40 overflow-hidden">
            <img
              src={bannerUrl}
              alt={`Banner de ${store.name}`}
              className="w-full h-full object-cover"
            />
            {/* Overlay sutil para que el contenido inferior sea legible */}
            <div className="absolute inset-0 h-28 sm:h-40 bg-gradient-to-b from-transparent to-brand-black-card/80" />
          </div>
        ) : (
          <div
            className="h-28 sm:h-40"
            style={{
              background:
                'linear-gradient(135deg, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0.03) 60%, rgba(0,0,0,0) 100%)',
            }}
          >
            {/* Grid decorativo sutil */}
            <div
              className="w-full h-full opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
          </div>
        )}

        <div className="container-app pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-12 sm:-mt-16 relative z-10">
            {/* Logo */}
            {store.logo_url ? (
              <img
                src={getOptimizedUrl(store.logo_url, { width: 120, height: 120 })}
                alt={store.name}
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-brand-black bg-brand-black-card shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-brand-gold/10 border-4 border-brand-black flex items-center justify-center shadow-xl">
                <Store size={32} className="text-brand-gold" />
              </div>
            )}

            {/* Nombre + ubicación */}
            <div className="flex-1 pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-content-primary">
                {store.name}
              </h1>
              {(store.city || store.state) && (
                <p className="text-content-muted text-sm flex items-center gap-1 mt-1">
                  <MapPin size={13} />
                  {[store.city, store.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Botones de contacto */}
            <div className="flex gap-2 w-full sm:w-auto">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1da851] active:scale-95 transition-all"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}
              {store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-content-primary text-sm hover:border-brand-gold/40 hover:text-brand-gold active:scale-95 transition-all"
                >
                  <Phone size={15} />
                  Llamar
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="container-app py-8 space-y-8">

        {/* Descripción + dirección */}
        {(store.description || store.address) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {store.description && (
              <div className="card-base p-5">
                <p className="text-xs text-content-muted uppercase tracking-wider mb-2">Sobre la tienda</p>
                <p className="text-content-secondary text-sm leading-relaxed">{store.description}</p>
              </div>
            )}
            {store.address && (
              <div className="card-base p-5">
                <p className="text-xs text-content-muted uppercase tracking-wider mb-2">Dirección</p>
                <p className="text-content-secondary text-sm flex items-start gap-2">
                  <MapPin size={14} className="text-brand-gold shrink-0 mt-0.5" />
                  {store.address}
                  {store.city ? `, ${store.city}` : ''}
                  {store.state ? `, ${store.state}` : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Catálogo */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-content-primary">
              Productos de la tienda
            </h2>
            {!loadingProducts && products.length > 0 && (
              <span className="text-xs text-content-muted">
                {products.length} producto{products.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loadingProducts && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          )}

          {!loadingProducts && products.length === 0 && (
            <div className="card-base p-12 text-center">
              <Package size={44} className="text-content-muted mx-auto mb-3" />
              <p className="text-content-primary font-medium">Aún no hay productos publicados</p>
              <p className="text-content-secondary text-sm mt-1">
                Esta tienda no tiene productos activos en este momento.
              </p>
            </div>
          )}

          {!loadingProducts && products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {products.map((product) => (
                <StoreProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Volver al catálogo */}
        <div className="pt-4 border-t border-white/5">
          <Link
            to={ROUTES.CATALOG}
            className="inline-flex items-center gap-2 text-content-muted hover:text-brand-gold text-sm transition-colors"
          >
            <ArrowLeft size={14} /> Volver al catálogo general
          </Link>
        </div>
      </div>
    </div>
  )
}

export default StoreProfilePage
