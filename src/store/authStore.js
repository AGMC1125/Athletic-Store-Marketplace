import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Store de autenticación.
 * Gestiona el estado global del usuario autenticado y su perfil.
 */
const useAuthStore = create(
  devtools(
    (set, get) => ({
      // ── Estado ─────────────────────────────────────────────
      user: null,          // Usuario de Supabase Auth
      profile: null,       // Perfil extendido de la tabla `profiles`
      store: null,         // Tienda del usuario (tabla `stores`)
      isLoading: true,     // Cargando sesión inicial
      isAuthenticated: false,
      profileError: false, // True si el perfil falló al cargarse

      // ── Acciones ───────────────────────────────────────────
      setUser: (user) =>
        set({ user, isAuthenticated: !!user }, false, 'setUser'),

      setProfile: (profile) =>
        set({ profile, profileError: !profile && get().isAuthenticated }, false, 'setProfile'),

      setStore: (store) =>
        set({ store }, false, 'setStore'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      setProfileError: (profileError) =>
        set({ profileError }, false, 'setProfileError'),

      /** Limpia todo el estado al cerrar sesión */
      clearAuth: () =>
        set(
          {
            user: null,
            profile: null,
            store: null,
            isAuthenticated: false,
            isLoading: false,
            profileError: false,
          },
          false,
          'clearAuth'
        ),
    }),
    { name: 'AuthStore' }
  )
)

export default useAuthStore
