import { Link } from 'react-router-dom'
import { ShoppingBag, Instagram, Facebook } from 'lucide-react'
import { ROUTES, APP_NAME } from '../../constants'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-brand-gold/10 bg-brand-black-soft mt-auto">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link to={ROUTES.HOME} className="flex items-center gap-2 mb-3">
              <ShoppingBag size={22} className="text-brand-gold" />
              <span className="font-bold">
                <span className="text-brand-gold">Athletic</span>
                <span className="text-content-primary"> Store</span>
              </span>
            </Link>
            <p className="text-sm text-content-secondary leading-relaxed">
              El marketplace donde las tiendas deportivas físicas muestran sus productos al mundo.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-content-primary mb-3">Explorar</h3>
            <ul className="flex flex-col gap-2">
              {[
                { to: ROUTES.CATALOG, label: 'Catálogo de productos' },
                { to: ROUTES.REGISTER, label: 'Registrar mi tienda' },
                { to: ROUTES.LOGIN, label: 'Iniciar sesión' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-content-secondary hover:text-brand-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Planes */}
          <div>
            <h3 className="text-sm font-semibold text-content-primary mb-3">Planes</h3>
            <ul className="flex flex-col gap-2">
              <li><span className="text-sm text-content-secondary">Plan Gratuito — hasta 5 productos</span></li>
              <li><span className="text-sm text-content-secondary">Plan Básico — $200 MXN/mes</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="gold-divider mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-content-muted">
          <p>© {year} {APP_NAME}. Todos los derechos reservados.</p>
          <p>Sin pasarela de pagos — el contacto es directo con la tienda.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
