import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { ROUTES } from '../../constants'
import Spinner from '../ui/Spinner'

/**
 * Limpia toda la sesión de Supabase del localStorage y redirige al login.
 * No depende de React, Zustand ni Supabase — funciona aunque todo lo demás esté roto.
 */
function clearSessionAndRedirect() {
  try {
    const keysToRemove = Object.keys(localStorage).filter(
      (k) => k.startsWith('sb-') || k.includes('supabase')
    )
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  } catch (_) {
    // localStorage no disponible — no hay nada más que hacer
  }
  window.location.replace(ROUTES.LOGIN)
}

/**
 * Protege rutas privadas del dashboard de tienda.
 *
 * Estados:
 *  1. Cargando           → Spinner
 *  2. No autenticado     → Redirect a /auth/login
 *  3. Sin perfil / error → Pantalla de error con cerrar sesión a prueba de fallos
 *  4. Admin              → Redirect a /admin
 *  5. OK                 → Renderiza children
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, profile, profileError, user } = useAuthStore()
  const location = useLocation()

  /* ── 1. Cargando ─────────────────────────────────────────── */
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

  /* ── 2. No autenticado ───────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  /* ── 3. Autenticado pero sin perfil / error de carga ─────── */
  if (!profile || profileError) {
    const userEmail = user?.email ?? null

    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black px-4">
        <div className="flex flex-col items-center gap-5 text-center max-w-sm w-full">

          {/* Ícono de alerta */}
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          {/* Mensaje principal */}
          <div className="space-y-2">
            <p className="text-content-primary font-semibold text-lg">
              No se pudo cargar tu perfil
            </p>
            {userEmail && (
              <p className="text-content-secondary text-sm">
                Cuenta: <span className="text-brand-gold">{userEmail}</span>
              </p>
            )}
            <p className="text-content-secondary text-sm leading-relaxed">
              Hubo un problema al obtener los datos de tu cuenta.
              Intenta recargar la página o cierra la sesión y vuelve a entrar.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* Reintentar — recarga completa de la página */}
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2.5 rounded-lg border border-brand-gold/30 text-brand-gold text-sm font-medium hover:bg-brand-gold/10 transition-colors"
            >
              Reintentar
            </button>

            {/* Cerrar sesión — limpia localStorage directamente, no depende de Supabase */}
            <button
              onClick={clearSessionAndRedirect}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand-gold text-brand-black text-sm font-medium hover:bg-brand-gold/90 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>

          {/* Enlace de emergencia si los botones no responden */}
          <p className="text-content-secondary text-xs">
            ¿Los botones no responden?{' '}
            <button
              onClick={clearSessionAndRedirect}
              className="text-brand-gold underline underline-offset-2 hover:text-brand-gold/80"
            >
              Haz clic aquí para salir
            </button>
          </p>

        </div>
      </div>
    )
  }

  /* ── 4. Admin → panel de administración ─────────────────── */
  if (profile.role === 'admin') {
    return <Navigate to={ROUTES.ADMIN} replace />
  }

  /* ── 5. Todo OK → renderizar ruta protegida ─────────────── */
  return children
}

export default ProtectedRoute
