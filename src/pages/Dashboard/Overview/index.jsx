import { Package, Store, CreditCard, TrendingUp, ShieldCheck, User, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Badge, Button, Spinner } from '../../../components/ui'
import useAuthStore from '../../../store/authStore'
import { productsService } from '../../../services/productsService'
import { ROUTES, PLAN_LABELS, PLAN_LIMITS, PLANS } from '../../../constants'

function StatCard({ icon, label, value, description }) {
  const StatIcon = icon
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-brand-gold/10">
          <StatIcon size={20} className="text-brand-gold" />
        </div>
      </div>
      <div className="text-2xl font-bold text-content-primary">{value}</div>
      <div className="text-sm font-medium text-content-secondary mt-0.5">{label}</div>
      {description && <div className="text-xs text-content-muted mt-1">{description}</div>}
    </Card>
  )
}

function DashboardOverview() {
  const { profile, store } = useAuthStore()
  const plan  = profile?.plan ?? PLANS.FREE
  const limit = PLAN_LIMITS[plan]

  // Reutiliza la misma query key que la página de Productos para aprovechar el caché
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'store', store?.id],
    queryFn:  () => productsService.getProductsByStore(store.id),
    enabled:  !!store?.id,
    staleTime: 1000 * 60,
  })

  const productCount = products.length

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-content-primary">
          Bienvenido{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-content-secondary mt-1">
          Aquí tienes un resumen de tu tienda en Athletic Store Marketplace.
        </p>
      </div>

      {/* Alerta si no tiene tienda */}
      {!store && (
        <div className="p-5 rounded-xl border border-brand-gold/30 bg-brand-gold/5">
          <p className="text-brand-gold font-medium mb-1">¡Completa tu perfil de tienda!</p>
          <p className="text-sm text-content-secondary mb-3">
            Aún no has configurado tu tienda. Hazlo ahora para comenzar a publicar productos.
          </p>
          <Link to={ROUTES.DASHBOARD_STORE}>
            <Button variant="primary" size="sm">
              <Store size={16} /> Configurar mi tienda
            </Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Productos publicados"
          value={loadingProducts ? <Spinner size="sm" className="text-brand-gold" /> : productCount}
          description={`Límite: ${limit === Infinity ? 'Ilimitado' : limit} productos`}
        />
        <StatCard
          icon={Store}
          label="Estado de tienda"
          value={store ? 'Activa' : 'Sin configurar'}
        />
        <StatCard
          icon={CreditCard}
          label="Plan actual"
          value={PLAN_LABELS[plan]}
        />
        <StatCard
          icon={TrendingUp}
          label="Visitas este mes"
          value="—"
          description="Disponible en planes de pago"
        />
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-lg font-semibold text-content-primary mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to={ROUTES.DASHBOARD_PRODUCTS_NEW} className="card-base p-5 flex items-center gap-3 group">
            <div className="p-2 rounded-lg bg-brand-gold/10 group-hover:bg-brand-gold/20 transition-colors">
              <Package size={20} className="text-brand-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-content-primary">Agregar producto</p>
              <p className="text-xs text-content-muted">Publica un nuevo artículo</p>
            </div>
          </Link>
          <Link to={ROUTES.DASHBOARD_STORE} className="card-base p-5 flex items-center gap-3 group">
            <div className="p-2 rounded-lg bg-brand-gold/10 group-hover:bg-brand-gold/20 transition-colors">
              <Store size={20} className="text-brand-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-content-primary">Editar tienda</p>
              <p className="text-xs text-content-muted">Actualiza tu perfil</p>
            </div>
          </Link>
          <Link to={ROUTES.DASHBOARD_MEMBERSHIP} className="card-base p-5 flex items-center gap-3 group">
            <div className="p-2 rounded-lg bg-brand-gold/10 group-hover:bg-brand-gold/20 transition-colors">
              <CreditCard size={20} className="text-brand-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-content-primary">Ver membresía</p>
              <p className="text-xs text-content-muted">Mejorar tu plan</p>
            </div>
          </Link>
          <Link to={ROUTES.DASHBOARD_PROFILE} className="card-base p-5 flex items-center gap-3 group">
            <div className="p-2 rounded-lg bg-brand-gold/10 group-hover:bg-brand-gold/20 transition-colors">
              <User size={20} className="text-brand-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-content-primary">Mi perfil</p>
              <p className="text-xs text-content-muted">Edita tu información</p>
            </div>
          </Link>
          {store && (
            <a
              href={`/tienda/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card-base p-5 flex items-center gap-3 group border-brand-gold/20 hover:border-brand-gold/50"
            >
              <div className="p-2 rounded-lg bg-brand-gold/10 group-hover:bg-brand-gold/20 transition-colors">
                <ExternalLink size={20} className="text-brand-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-content-primary">Ver mi tienda</p>
                <p className="text-xs text-content-muted">Vista pública del marketplace</p>
              </div>
            </a>
          )}
        </div>
      </div>

      {/* Acceso admin (solo visible para administradores) */}
      {profile?.role === 'admin' && (
        <div className="p-5 rounded-xl border border-brand-gold/40 bg-brand-gold/5">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck size={18} className="text-brand-gold" />
            <p className="text-brand-gold font-semibold text-sm">Panel de Administración</p>
          </div>
          <p className="text-xs text-content-secondary mb-3">
            Tienes acceso de superadmin. Gestiona usuarios, tiendas y productos de la plataforma.
          </p>
          <Link to={ROUTES.ADMIN}>
            <Button variant="secondary" size="sm">
              <ShieldCheck size={14} /> Ir al Panel Admin
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default DashboardOverview
