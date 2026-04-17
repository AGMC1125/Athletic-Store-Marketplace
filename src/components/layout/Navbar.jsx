import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingBag, LogOut, LayoutDashboard } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from '../ui'
import useAuthStore from '../../store/authStore'
import { useAuthActions } from '../../hooks/useAuth'
import { ROUTES } from '../../constants'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, profile } = useAuthStore()
  const { signOut } = useAuthActions()
  const navigate = useNavigate()

  // Admins van al panel de administración; propietarios de tienda al dashboard
  const panelRoute = profile?.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD

  const navLinks = [
    { to: ROUTES.HOME,    label: 'Inicio' },
    { to: ROUTES.CATALOG, label: 'Catálogo' },
  ]

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate(ROUTES.HOME, { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-gold/10 bg-brand-black/95 backdrop-blur-md">
      <nav className="container-app flex items-center justify-between h-16">

        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="Athletic Store"
            className="h-9 w-9 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextSibling.style.display = 'block'
            }}
          />
          <ShoppingBag
            size={26}
            className="text-brand-gold hidden"
            style={{ display: 'none' }}
          />
          <span className="font-bold text-lg leading-tight">
            <span className="text-brand-gold">Athletic</span>
            <span className="text-content-primary"> Store</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === ROUTES.HOME}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium transition-colors duration-200',
                    isActive ? 'text-brand-gold' : 'text-content-secondary hover:text-content-primary'
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(panelRoute)}
              >
                <LayoutDashboard size={16} />
                Mi Panel
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut size={16} />
                Salir
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.LOGIN)}>
                Iniciar sesión
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.REGISTER)}>
                Registrar tienda
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-content-secondary hover:text-content-primary"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand-gold/10 bg-brand-black animate-fade-in">
          <ul className="flex flex-col py-4 px-4 gap-1">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === ROUTES.HOME}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive ? 'bg-brand-gold/10 text-brand-gold' : 'text-content-secondary hover:text-content-primary hover:bg-white/5'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Button variant="secondary" size="md" className="w-full" onClick={() => { navigate(panelRoute); setMenuOpen(false) }}>
                    <LayoutDashboard size={16} /> Mi Panel
                  </Button>
                  <Button variant="ghost" size="md" className="w-full" onClick={handleSignOut}>
                    <LogOut size={16} /> Cerrar sesión
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="md" className="w-full" onClick={() => { navigate(ROUTES.LOGIN); setMenuOpen(false) }}>
                    Iniciar sesión
                  </Button>
                  <Button variant="primary" size="md" className="w-full" onClick={() => { navigate(ROUTES.REGISTER); setMenuOpen(false) }}>
                    Registrar tienda
                  </Button>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}

export default Navbar
