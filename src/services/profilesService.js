import { supabase } from '../lib/supabase'

/**
 * Servicio de perfiles de usuario.
 */
export const profilesService = {
  /**
   * Obtiene el perfil del usuario autenticado.
   * Usa maybeSingle() para devolver null (en lugar de lanzar error) cuando no existe la fila.
   */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return data  // null si no existe
  },

  /**
   * Garantiza que el perfil exista en la BD.
   * Si no existe, lo crea a partir de los datos de auth.
   * Se usa como mecanismo de recuperación en el hook de auth.
   * @param {string} userId
   * @param {{ email: string, user_metadata?: object }} authUser
   */
  async ensureProfile(userId, authUser) {
    // Intentar leer primero
    const { data: existing, error: readError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (readError) throw readError
    if (existing) return existing

    // No existe — insertar desde datos de auth
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id:        userId,
          email:     authUser.email ?? '',
          full_name: authUser.user_metadata?.full_name ?? '',
          role:      'user',
          plan:      'free',
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Actualiza el perfil del usuario.
   */
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
