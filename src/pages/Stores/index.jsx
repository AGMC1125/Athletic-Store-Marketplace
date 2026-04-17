import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Store, MapPin, Package, BadgeCheck, Search } from 'lucide-react'
import { useState } from 'react'
import { Spinner } from '../../components/ui'
import { storesService } from '../../services/storesService'
import { getOptimizedUrl } from '../../lib/cloudinary'
import { ROUTES } from '../../constants'

// ── Card de tienda ────────────────────────────────────────────────────────────
function StoreCard({ store }) {
  const logo = store.logo_url
    ? getOptimizedUrl(store.logo_url, { width: 80, height: 80 })
    : null

  return (
    <Link
      to={ROUTES.STORE.replace(':slug', store.slug)}
      className="card-base overflow-hidden group hover:border-brand-gold/35 transition-all duration-200 flex flex-col"
    >
      {/* Banner */}
      <div className="h-28 bg-gradient-to-br from-brand-black-card to-brand-black-soft relative overflow-hidden">
        {store.banner_url ? (
          <img
            src={getOptimizedUrl(store.banner_url, { width: 400, height: 112 })}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, transparent 60%)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Logo */}
        <div className="absolute bottom-3 left-4">
          {logo ? (
            <img
              src={logo}
              alt={store.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-white/20 bg-brand-black-soft"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-brand-gold/15 border-2 border-brand-gold/25 flex items-center justify-center">
              <Store size={20} className="text-brand-gold" />
            </div>
          )}
        </div>

        {/* Badge Pro */}
        {store.plan === 'basic' && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-gold text-black text-[10px] font-bold">
              <BadgeCheck size={10} /> Pro
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1">
        <h3 className="text-sm font-bold text-content-primary group-hover:text-brand-gold transition-colors truncate">
          {store.name}
        </h3>

        {(store.city || store.state) && (
          <p className="text-xs text-content-muted flex items-center gap-1 mt-1">
            <MapPin size={10} className="shrink-0" />
            {[store.city, store.state].filter(Boolean).join(', ')}
          </p>
        )}

        {store.description && (
          <p className="text-xs text-content-muted mt-2 line-clamp-2 leading-relaxed">
            {store.description}
          </p>
        )}

        <div className="flex items-center gap-1 mt-3 text-xs text-content-muted">
          <Package size={11} />
          <span>Ver productos</span>
          <span className="ml-auto text-brand-gold/60 group-hover:text-brand-gold transition-colors">→</span>
        </div>
      </div>
    </Link>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function StoreSkeleton() {
  return (
    <div className="card-base overflow-hidden animate-pulse">
      <div className="h-28 bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-3 bg-white/5 rounded w-full" />
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
function StoresPage() {
  const [search, setSearch] = useState('')

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['stores', 'public'],
    queryFn:  () => storesService.getPublicStores(),
    staleTime: 1000 * 60 * 5,
  })

  const filtered = stores.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase()) ||
    s.state?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container-app py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-content-primary mb-2">Tiendas</h1>
        <p className="text-content-secondary">
          Descubre tiendas deportivas y explora sus productos directamente.
        </p>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md mb-8">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tienda o ciudad…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-brand-black-soft text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/40 focus:border-brand-gold/40"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <StoreSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Store size={48} className="text-content-muted mx-auto mb-4" />
          <p className="text-content-primary font-semibold mb-1">
            {search ? 'No se encontraron tiendas' : 'Aún no hay tiendas registradas'}
          </p>
          <p className="text-content-secondary text-sm">
            {search ? 'Prueba con otro término de búsqueda.' : 'Vuelve pronto.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-content-muted mb-4">
            {filtered.length} tienda{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default StoresPage
