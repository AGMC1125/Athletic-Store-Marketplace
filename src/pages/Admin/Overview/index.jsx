import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Store, Package, TrendingUp, ShieldCheck } from 'lucide-react'
import { adminService } from '../../../services/adminService'
import { Spinner } from '../../../components/ui'
import { ROUTES } from '../../../constants'

function StatCard({ icon, label, value, sub, color = 'gold' }) {
  const StatIcon = icon
  const colorMap = {
    gold:    'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
    green:   'bg-state-success/10 text-state-success border-state-success/20',
    blue:    'bg-state-info/10 text-state-info border-state-info/20',
    red:     'bg-state-error/10 text-state-error border-state-error/20',
  }
  return (
    <div className="card-base p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl border ${colorMap[color]}`}>
        <StatIcon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-content-secondary text-sm">{label}</p>
        <p className="text-2xl font-bold text-content-primary mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-content-muted mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function AdminOverview() {
  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: () => adminService.getMetrics(),
    staleTime: 1000 * 60, // 1 min
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" className="text-brand-gold" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card-base p-6 text-center text-state-error">
        Error al cargar métricas. Verifica que tengas permisos de admin en Supabase.
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldCheck size={26} className="text-brand-gold" />
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Panel de Administración</h1>
          <p className="text-content-secondary text-sm">Vista general de la plataforma</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Usuarios registrados"
          value={metrics.totalUsers}
          sub={`${metrics.usersFreePlan} gratis · ${metrics.usersBasicPlan} básico`}
          color="gold"
        />
        <StatCard
          icon={Store}
          label="Tiendas"
          value={metrics.totalStores}
          sub={`${metrics.activeStores} activas · ${metrics.inactiveStores} inactivas`}
          color="blue"
        />
        <StatCard
          icon={Package}
          label="Productos"
          value={metrics.totalProducts}
          sub={`${metrics.activeProducts} activos · ${metrics.inactiveProducts} inactivos`}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Plan Básico"
          value={`${metrics.usersBasicPlan}`}
          sub={`de ${metrics.totalUsers} usuarios totales`}
          color="gold"
        />
      </div>

      {/* Distribución de planes */}
      <div className="card-base p-6">
        <h2 className="text-lg font-semibold text-content-primary mb-4">Distribución de planes</h2>
        <div className="space-y-4">
          {[
            { label: 'Plan Gratuito', count: metrics.usersFreePlan,  total: metrics.totalUsers, color: 'bg-content-secondary' },
            { label: 'Plan Básico',   count: metrics.usersBasicPlan, total: metrics.totalUsers, color: 'bg-brand-gold' },
          ].map(({ label, count, total, color }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-content-secondary">{label}</span>
                  <span className="text-sm font-medium text-content-primary">{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: ROUTES.ADMIN_USERS,    label: 'Gestionar usuarios',  icon: Users   },
          { to: ROUTES.ADMIN_STORES,   label: 'Gestionar tiendas',   icon: Store   },
          { to: ROUTES.ADMIN_PRODUCTS, label: 'Gestionar productos', icon: Package },
        ].map((item) => {
          const QuickIcon = item.icon
          return (
          <Link
            key={item.to}
            to={item.to}
            className="card-base p-4 flex items-center gap-3 hover:border-brand-gold/30 transition-colors group"
          >
            <QuickIcon size={20} className="text-brand-gold" />
            <span className="text-sm font-medium text-content-secondary group-hover:text-content-primary transition-colors">
              {item.label}
            </span>
          </Link>
          )
        })}
      </div>
    </div>
  )
}

export default AdminOverview
