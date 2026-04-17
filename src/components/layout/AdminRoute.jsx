import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { useAuthActions } from '../../hooks/useAuth'
import { ROUTES } from '../../constants'
import Spinner from '../ui/Spinner'

/**
 * Protege rutas exclusivas de superadmin.
 * Requiere estar autenticado Y tener role === 'admin'.
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, profile, profileError } = useAuthStore()
  const { signOut } = useAuthActions()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="xl" className="text-brand-gold" />
          <p className="text-content-secondary text-sm">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  // Autenticado pero perfil no disponible
  if (!profile || profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
          <p className="text-content-primary font-semibold">No se pudo cargar tu perfil</p>
          <p className="text-content-secondary text-sm">
            Hubo un problema al obtener los datos de tu cuenta. Intenta cerrar sesión y volver a entrar.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg border border-brand-gold/30 text-brand-gold text-sm font-medium hover:bg-brand-gold/10 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={async () => {
                await signOut()
                window.location.href = ROUTES.LOGIN
              }}
              className="px-4 py-2 rounded-lg bg-brand-gold text-brand-black text-sm font-medium hover:bg-brand-gold/90 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (profile.role !== 'admin') {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children
}

export default AdminRoute
