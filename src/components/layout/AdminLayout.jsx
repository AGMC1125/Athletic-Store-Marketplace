import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Store, Package,
  LogOut, Menu, X, ShieldCheck, AlertTriangle,
  CreditCard, Landmark
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { ToastContainer, Modal, Button } from '../ui'
import useAuthStore from '../../store/authStore'
import { useAuthActions } from '../../hooks/useAuth'
import { ROUTES } from '../../constants'

const NAV_ITEMS = [
  { to: ROUTES.ADMIN,               icon: LayoutDashboard, label: 'Resumen',         end: true },
  { to: ROUTES.ADMIN_USERS,         icon: Users,            label: 'Usuarios'         },
  { to: ROUTES.ADMIN_STORES,        icon: Store,            label: 'Tiendas'          },
  { to: ROUTES.ADMIN_PRODUCTS,      icon: Package,          label: 'Productos'        },
  { to: ROUTES.ADMIN_MEMBERSHIPS,   icon: CreditCard,       label: 'Membresías'       },
  { to: ROUTES.ADMIN_BANK_ACCOUNTS, icon: Landmark,         label: 'Cuentas Bancarias'},
]

function AdminSidebar({ open, onClose, onSignOutRequest }) {
  const { profile } = useAuthStore()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64',
          'bg-brand-black-soft border-r border-brand-gold/20',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 h-16 border-b border-brand-gold/20">
          <ShieldCheck size={20} className="text-brand-gold" />
          <span className="font-bold text-sm">
            <span className="text-brand-gold">Admin</span>
            <span className="text-content-primary"> Panel</span>
          </span>
          <button
            onClick={onClose}
            className="ml-auto md:hidden p-1 text-content-secondary hover:text-content-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin badge */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-gold/20 flex items-center justify-center">
              <ShieldCheck size={18} className="text-brand-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content-primary truncate">
                {profile?.full_name ?? 'Administrador'}
              </p>
              <p className="text-xs text-brand-gold font-medium">Superadmin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((navItem) => {
              const NavIcon = navItem.icon
              return (
              <li key={navItem.to}>
                <NavLink
                  to={navItem.to}
                  end={navItem.end}
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
                  {navItem.label}
                </NavLink>
              </li>
              )
            })}
          </ul>

        </nav>

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

function AdminSignOutModal({ isOpen, onCancel, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Cerrar sesión" size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-state-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-content-secondary">
            ¿Estás seguro de que deseas cerrar tu sesión? Saldrás del panel de administración.
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

function AdminLayout() {
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const { signOut }    = useAuthActions()
  const navigate       = useNavigate()

  async function handleSignOut() {
    setConfirmSignOut(false)
    await signOut()
    navigate(ROUTES.HOME, { replace: true })
  }

  return (
    <div className="min-h-screen bg-brand-black flex">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOutRequest={() => setConfirmSignOut(true)}
      />

      <div className="flex-1 flex flex-col md:ml-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center h-14 px-4 border-b border-brand-gold/20 bg-brand-black/95 backdrop-blur-md md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-content-secondary hover:text-content-primary"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <ShieldCheck size={16} className="text-brand-gold" />
            <span className="text-sm font-semibold text-content-primary">Panel Admin</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <AdminSignOutModal
        isOpen={confirmSignOut}
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={handleSignOut}
      />

      <ToastContainer />
    </div>
  )
}

export default AdminLayout
