import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui'
import { ROUTES } from '../../constants'

function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center animate-slide-up">
        <p className="text-8xl font-black text-brand-gold mb-4">404</p>
        <h1 className="text-2xl font-bold text-content-primary mb-2">
          Página no encontrada
        </h1>
        <p className="text-content-secondary mb-8 max-w-sm mx-auto">
          La página que buscas no existe o fue movida.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft size={16} /> Regresar
          </Button>
          <Link to={ROUTES.HOME}>
            <Button variant="primary">
              <Home size={16} /> Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
