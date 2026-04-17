import { supabase } from '../lib/supabase'
import { slugify } from '../utils/formatters'

/**
 * Servicio de tiendas.
 */
export const storesService = {
  /**
   * Obtiene la tienda del usuario autenticado.
   */
  async getMyStore(ownerId) {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  /**
   * Obtiene una tienda por su slug (para vista pública).
   */
  async getStoreBySlug(slug) {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (error) throw error
    return data
  },

  /**
   * Lista todas las tiendas activas (alias público).
   */
  async getPublicStores() {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, slug, description, logo_url, banner_url, city, state, plan')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  /**
   * Lista todas las tiendas activas.
   */
  async getActiveStores() {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, slug, description, logo_url, city, state')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  /**
   * Crea una nueva tienda.
   */
  async createStore(ownerId, storeData) {
    const slug = slugify(storeData.name)
    const { data, error } = await supabase
      .from('stores')
      .insert({ ...storeData, owner_id: ownerId, slug, is_active: true })
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Actualiza los datos de una tienda.
   */
  async updateStore(storeId, updates) {
    const { data, error } = await supabase
      .from('stores')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', storeId)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
