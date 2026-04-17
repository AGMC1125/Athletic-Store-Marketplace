import { Outlet } from 'react-router-dom'
import { useAuthInit } from '../../hooks/useAuth'

/**
 * Componente raíz que inicializa la sesión de autenticación.
 * Debe envolver TODAS las rutas para que `isLoading` se resuelva
 * antes de que ProtectedRoute evalúe si hay sesión activa.
 */
function AuthInitializer() {
  useAuthInit()
  return <Outlet />
}

export default AuthInitializer
