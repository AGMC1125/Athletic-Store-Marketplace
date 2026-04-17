import { supabase } from '../lib/supabase'

/**
 * Servicio de autenticación.
 * Todas las llamadas a Supabase Auth están aquí.
 * Los componentes y hooks NUNCA llaman a Supabase directamente.
 */

export const authService = {
  /**
   * Registra un nuevo usuario y crea su perfil en la tabla profiles.
   */
  async signUp({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    if (error) throw error

    // Crear el perfil explícitamente como respaldo al trigger de BD.
    // Si el trigger ya existe, el INSERT no hará nada por el ON CONFLICT.
    if (data.user) {
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'user',
          plan: 'free',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )
    }

    return data
  },

  /**
   * Inicia sesión con email y contraseña.
   */
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  /**
   * Cierra la sesión actual.
   * Intenta cierre global (revoca tokens en servidor);
   * si falla (sesión expirada), hace cierre local.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'global' })

    if (error) {
      console.warn('signOut global falló, intentando local:', error.message)
      // Fallback: al menos limpiar tokens locales
      const { error: localError } = await supabase.auth.signOut({ scope: 'local' })
      if (localError) {
        console.error('signOut local también falló:', localError.message)
        throw localError
      }
    }
  },

  /**
   * Envía correo de recuperación de contraseña.
   */
  async resetPassword(email) {
    const redirectTo = `${import.meta.env.VITE_APP_URL}/auth/nueva-contrasena`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    if (error) throw error
  },

  /**
   * Obtiene la sesión activa (lee desde localStorage primero).
   * Importante: getSession() es síncrono-local y no hace request HTTP.
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  /**
   * Obtiene la sesión validada del servidor (hace request HTTP).
   * Usar cuando necesitas asegurar que el token siga vigente.
   */
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  /**
   * Escucha cambios en el estado de autenticación.
   * @param {Function} callback - (event, session) => void
   * @returns {Function} Función para cancelar la suscripción
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
    return () => subscription.unsubscribe()
  },
}
