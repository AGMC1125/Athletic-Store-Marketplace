import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Store, Package, CreditCard, User,
  LogOut, Menu, X, ShoppingBag, AlertTriangle, Landmark, ExternalLink,
  ClipboardList,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { ToastContainer, Spinner, Modal, Button } from '../ui'
import useAuthStore from '../../store/authStore'
import { useAuthActions } from '../../hooks/useAuth'
import { productsService } from '../../services/productsService'
import { ROUTES, PLAN_LIMITS } from '../../constants'

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ open, onClose, onSignOutRequest }) {
  const { profile, store } = useAuthStore()
  const plan  = profile?.plan ?? 'free'
  const limit = PLAN_LIMITS[plan]

  // Reutiliza la caché de productos — no hace petición extra si ya está cargado
  const { data: products = [] } = useQuery({
    queryKey: ['products', 'store', store?.id],
    queryFn:  () => productsService.getProductsByStore(store.id),
    enabled:  !!store?.id,
    staleTime: 1000 * 60,
  })

  const productCount = products.length
  const isFull       = limit !== Infinity && productCount >= limit
  const isNear       = limit !== Infinity && productCount / limit >= 0.8

  const NAV_ITEMS = [
    { to: ROUTES.DASHBOARD,            icon: LayoutDashboard, label: 'Resumen' },
    { to: ROUTES.DASHBOARD_STORE,      icon: Store,           label: 'Mi Tienda' },
    { to: ROUTES.DASHBOARD_ORDERS,     icon: ClipboardList,   label: 'Órdenes' },
    {
      to:    ROUTES.DASHBOARD_PRODUCTS,
      icon:  Package,
      label: 'Productos',
      badge: store ? (
        <span
          className={cn(
            'ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full',
            isFull
              ? 'bg-state-error/20 text-state-error'
              : isNear
              ? 'bg-state-warning/20 text-state-warning'
              : 'bg-white/10 text-content-muted'
          )}
        >
          {productCount}/{limit === Infinity ? '∞' : limit}
        </span>
      ) : null,
    },
    { to: ROUTES.DASHBOARD_MEMBERSHIP, icon: CreditCard,      label: 'Membresía' },
    { to: ROUTES.DASHBOARD_PAYMENT,    icon: Landmark,         label: 'Método de Pago' },
    { to: ROUTES.DASHBOARD_PROFILE,    icon: User,            label: 'Mi Perfil' },
  ]

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-brand-black-soft border-r border-brand-gold/10',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 h-16 border-b border-brand-gold/10">
          <ShoppingBag size={22} className="text-brand-gold" />
          <span className="font-bold text-sm">
            <span className="text-brand-gold">Athletic</span>
            <span className="text-content-primary"> Store</span>
          </span>
          <button
            onClick={onClose}
            className="ml-auto md:hidden p-1 text-content-secondary hover:text-content-primary"
            aria-label="Cerrar sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Store info */}
        {store && (
          <div className="px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="w-9 h-9 rounded-lg object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-brand-gold/20 flex items-center justify-center">
                  <Store size={18} className="text-brand-gold" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-content-primary truncate">{store.name}</p>
                <p className="text-xs text-content-secondary">{store.city ?? 'Sin ciudad'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((navItem) => {
              const NavIcon = navItem.icon
              return (
              <li key={navItem.to}>
                <NavLink
                  to={navItem.to}
                  end={navItem.to === ROUTES.DASHBOARD}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-brand-gold/10 text-brand-gold'
                        : 'text-content-secondary hover:text-content-primary hover:bg-white/5'
                    )
                  }
                >
                  <NavIcon size={18} />
                  <span className="flex-1">{navItem.label}</span>
                  {navItem.badge}
                </NavLink>
              </li>
              )
            })}
          </ul>
        </nav>

        {/* Ver tienda pública */}
        {store && (
          <div className="px-3 pb-2">
            <a
              href={`/tienda/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-brand-gold/80 hover:text-brand-gold hover:bg-brand-gold/5 border border-brand-gold/20 hover:border-brand-gold/40 transition-colors"
            >
              <ExternalLink size={16} />
              Ver mi tienda
            </a>
          </div>
        )}

        {/* Sign out */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={onSignOutRequest}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-content-secondary hover:text-state-error hover:bg-state-error/5 transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

// ── Sign-out confirm modal ────────────────────────────────────────────────────
function SignOutModal({ isOpen, onCancel, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Cerrar sesión" size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-state-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-content-secondary">
            ¿Estás seguro de que deseas cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder al panel.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            <LogOut size={15} /> Cerrar sesión
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Layout principal ─────────────────────────────────────────────────────────
function DashboardLayout() {
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const { isLoading } = useAuthStore()
  const { signOut }    = useAuthActions()
  const navigate       = useNavigate()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <Spinner size="xl" className="text-brand-gold" />
      </div>
    )
  }

  async function handleSignOut() {
    setConfirmSignOut(false)
    await signOut()
    navigate(ROUTES.HOME, { replace: true })
  }

  return (
    <div className="min-h-screen bg-brand-black flex">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOutRequest={() => setConfirmSignOut(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Top bar móvil */}
        <header className="sticky top-0 z-20 flex items-center h-14 px-4 border-b border-brand-gold/10 bg-brand-black/95 backdrop-blur-md md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-content-secondary hover:text-content-primary"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 text-sm font-semibold text-content-primary">Dashboard</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Modal cerrar sesión */}
      <SignOutModal
        isOpen={confirmSignOut}
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={handleSignOut}
      />

      <ToastContainer />
    </div>
  )
}

export default DashboardLayout
