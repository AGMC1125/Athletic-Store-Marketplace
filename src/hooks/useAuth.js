import { useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { profilesService } from '../services/profilesService'
import { storesService } from '../services/storesService'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'

/* ─── Configuración ──────────────────────────────────────── */
const RETRY_DELAY_MS  = 800   // Espera entre el 1er y 2do intento
const INIT_TIMEOUT_MS = 6000  // Máximo total antes de forzar loading=false

/* ═══════════════════════════════════════════════════════════
   fetchUserData
   Carga profile + store de forma independiente:
   - Si la tienda falla: no crítico, se usa null y se continúa.
   - Si el perfil falla: se lanza el error para que el llamador reintente.
   ═══════════════════════════════════════════════════════════ */
async function fetchUserData(userId, sessionUser = null) {
  // Promise.allSettled permite que store falle sin matar la carga del perfil
  const [profileResult, storeResult] = await Promise.allSettled([
    profilesService.getProfile(userId),
    storesService.getMyStore(userId),
  ])

  // Tienda: falla no crítica — el usuario puede seguir usando el dashboard
  const store = storeResult.status === 'fulfilled' ? storeResult.value : null
  if (storeResult.status === 'rejected') {
    console.warn('[Auth] Error cargando tienda (no crítico):', storeResult.reason?.message)
  }

  // Perfil: falla crítica — lanzar para que el llamador decida si reintentar
  if (profileResult.status === 'rejected') {
    throw profileResult.reason
  }

  let profile = profileResult.value

  // El perfil no existe en BD todavía — intentar crearlo a partir de auth
  if (!profile && sessionUser) {
    console.warn('[Auth] Perfil no encontrado, creando desde datos de auth...')
    profile = await profilesService.ensureProfile(userId, sessionUser)
  }

  return { profile, store }
}

/* ═══════════════════════════════════════════════════════════
   loadAndApplyUserData
   Wrapper con un único reintento y manejo de errores claro.
   ═══════════════════════════════════════════════════════════ */
async function loadAndApplyUserData(userId, sessionUser, storeActions, mounted) {
  const { setProfile, setStore, setProfileError } = storeActions

  setProfileError(false)

  let profile = null
  let store   = null
  let success = false

  // ── Primer intento ─────────────────────────────────────
  try {
    const result = await fetchUserData(userId, sessionUser)
    profile = result.profile
    store   = result.store
    success = true
  } catch (firstErr) {
    console.warn('[Auth] Primer intento de carga fallido:', firstErr?.message)

    // ── Reintento único tras 800ms ─────────────────────
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))

    try {
      const result = await fetchUserData(userId, sessionUser)
      profile = result.profile
      store   = result.store
      success = true
    } catch (secondErr) {
      console.error('[Auth] Segundo intento también fallido:', secondErr?.message)
    }
  }

  if (!mounted.current) return

  if (success && profile) {
    setProfile(profile)
    setStore(store)
  } else {
    // Sin perfil después de ambos intentos — marcar error
    setProfile(null)
    setStore(null)
    setProfileError(true)
    console.error('[Auth] No se pudo cargar el perfil tras ambos intentos.')
  }
}

/* ═══════════════════════════════════════════════════════════
   useAuthInit — inicialización + escucha cambios de sesión
   ═══════════════════════════════════════════════════════════ */
export function useAuthInit() {
  const {
    setUser, setProfile, setStore, setLoading,
    setProfileError, clearAuth,
  } = useAuthStore()

  useEffect(() => {
    // mounted como ref para que los callbacks async siempre vean el valor actual
    const mounted = { current: true }

    // Flag para evitar que SIGNED_IN procese una sesión que initializeAuth
    // ya está cargando (race condition en el arranque inicial)
    let initComplete = false

    const storeActions = { setProfile, setStore, setProfileError }

    /* ── Inicialización: lee sesión local y carga datos ──────── */
    async function initializeAuth() {
      try {
        const session = await authService.getSession()

        if (!mounted.current) return

        if (session?.user) {
          setUser(session.user)
          await loadAndApplyUserData(session.user.id, session.user, storeActions, mounted)
        }
      } catch (err) {
        console.error('[Auth] Error en initializeAuth:', err?.message)
        if (mounted.current) setProfileError(true)
      } finally {
        if (mounted.current) setLoading(false)
        initComplete = true
      }
    }

    // Arrancar
    initializeAuth()

    /* ── Escuchar cambios de auth ──────────────────────────── */
    const unsubscribe = authService.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return

      console.log('[Auth] onAuthStateChange:', event, session?.user?.email ?? 'no user')

      switch (event) {

        case 'SIGNED_IN': {
          // Si initializeAuth todavía no terminó, ella ya maneja esta sesión
          if (!initComplete) break

          // Si el usuario ya estaba autenticado: es solo una renovación silenciosa
          // de token. Solo actualizamos el objeto user, sin tocar loading ni perfil.
          const alreadyAuth = useAuthStore.getState().isAuthenticated
          if (alreadyAuth) {
            setUser(session.user)
            break
          }

          // Login genuino: cargar perfil y tienda
          setLoading(true)
          setProfileError(false)
          setUser(session.user)
          await loadAndApplyUserData(session.user.id, session.user, storeActions, mounted)
          if (mounted.current) setLoading(false)
          break
        }

        case 'SIGNED_OUT': {
          if (mounted.current) clearAuth()
          break
        }

        case 'TOKEN_REFRESHED': {
          // Token renovado automáticamente — solo actualizar user, no recargar perfil
          if (session?.user) setUser(session.user)
          break
        }

        case 'USER_UPDATED': {
          // Email o contraseña cambiada — recargar perfil
          if (session?.user) {
            setUser(session.user)
            await loadAndApplyUserData(session.user.id, session.user, storeActions, mounted)
          }
          break
        }

        case 'INITIAL_SESSION':
          // Ignorado: initializeAuth ya maneja la sesión inicial
          break

        default:
          break
      }
    })

    /* ── Timeout de seguridad ─────────────────────────────── */
    const timeoutId = setTimeout(() => {
      if (mounted.current && useAuthStore.getState().isLoading) {
        console.warn('[Auth] Timeout alcanzado — forzando loading=false')
        setLoading(false)
        initComplete = true
      }
    }, INIT_TIMEOUT_MS)

    /* ── Cleanup ──────────────────────────────────────────── */
    return () => {
      mounted.current = false
      clearTimeout(timeoutId)
      unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

/* ═══════════════════════════════════════════════════════════
   useAuthActions — operaciones de autenticación
   ═══════════════════════════════════════════════════════════ */
export function useAuthActions() {
  const { clearAuth } = useAuthStore()
  const { addToast } = useUIStore()

  const signIn = useCallback(async (credentials) => {
    const data = await authService.signIn(credentials)
    return data
  }, [])

  const signUp = useCallback(async ({ email, password, fullName }) => {
    const data = await authService.signUp({ email, password, fullName })
    return data
  }, [])

  /**
   * Cierre de sesión robusto.
   * Siempre limpia el estado local y el localStorage,
   * incluso si la llamada al servidor falla.
   */
  const signOut = useCallback(async () => {
    try {
      await authService.signOut()
    } catch (err) {
      console.error('[Auth] Error en signOut (se limpiará de todas formas):', err?.message)
    } finally {
      clearAuth()
      // Limpiar manualmente cualquier clave de Supabase en localStorage
      // como última línea de defensa
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('sb-') || k.includes('supabase'))
          .forEach((k) => localStorage.removeItem(k))
      } catch (_) {
        // localStorage no disponible (modo privado extremo) — ignorar
      }
    }
    addToast({ message: 'Sesión cerrada correctamente', type: 'success' })
  }, [clearAuth, addToast])

  const resetPassword = useCallback(async (email) => {
    await authService.resetPassword(email)
    addToast({ message: 'Revisa tu correo para recuperar tu contraseña', type: 'success' })
  }, [addToast])

  return { signIn, signUp, signOut, resetPassword }
}
