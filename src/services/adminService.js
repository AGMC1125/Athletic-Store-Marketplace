import { supabase } from '../lib/supabase'

/**
 * Servicio de administración.
 * Solo accesible para usuarios con role = 'admin'.
 * Las políticas RLS de Supabase garantizan el acceso.
 */
export const adminService = {

  // ── Métricas generales ──────────────────────────────────

  async getMetrics() {
    const [usersRes, storesRes, productsRes, membershipsRes] = await Promise.all([
      supabase.from('profiles').select('id, plan, role', { count: 'exact' }),
      supabase.from('stores').select('id, is_active', { count: 'exact' }),
      supabase.from('products').select('id, is_active', { count: 'exact' }),
      supabase.from('memberships').select('plan, status'),
    ])

    const profiles   = usersRes.data   ?? []
    const stores     = storesRes.data  ?? []
    const products   = productsRes.data ?? []
    const memberships = membershipsRes.data ?? []

    return {
      totalUsers:       profiles.length,
      usersFreePlan:    profiles.filter(p => p.plan === 'free').length,
      usersBasicPlan:   profiles.filter(p => p.plan === 'basic').length,
      totalStores:      stores.length,
      activeStores:     stores.filter(s => s.is_active).length,
      inactiveStores:   stores.filter(s => !s.is_active).length,
      totalProducts:    products.length,
      activeProducts:   products.filter(p => p.is_active).length,
      inactiveProducts: products.filter(p => !p.is_active).length,
    }
  },

  // ── Usuarios ────────────────────────────────────────────

  async getUsers({ page = 1, pageSize = 20 } = {}) {
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('profiles')
      .select(`
        id, email, full_name, plan, role, created_at,
        stores ( id, name, slug, is_active )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return { data, count }
  },

  async updateUserPlan(userId, plan) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ plan })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ── Tiendas ─────────────────────────────────────────────

  async getStores({ page = 1, pageSize = 20 } = {}) {
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('stores')
      .select(`
        id, name, slug, city, is_active, created_at,
        owner:profiles ( id, email, full_name, plan )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return { data, count }
  },

  async toggleStoreStatus(storeId, isActive) {
    const { data, error } = await supabase
      .from('stores')
      .update({ is_active: isActive })
      .eq('id', storeId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ── Productos ───────────────────────────────────────────

  async getProducts({ page = 1, pageSize = 20 } = {}) {
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('products')
      .select(`
        id, name, category, price, is_active, created_at,
        store:stores ( id, name, slug )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return { data, count }
  },

  async toggleProductStatus(productId, isActive) {
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', productId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ── Membresías ──────────────────────────────────────────

  async getMemberships({ page = 1, pageSize = 20 } = {}) {
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('memberships')
      .select(`
        id, plan, status, starts_at, ends_at, price_paid, notes, created_at,
        profile:profiles ( id, email, full_name, plan )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return { data, count }
  },

  async updateMembershipStatus(membershipId, status) {
    const { data, error } = await supabase
      .from('memberships')
      .update({ status })
      .eq('id', membershipId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ── Cuentas bancarias ───────────────────────────────────

  async getBankAccounts({ page = 1, pageSize = 20 } = {}) {
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('bank_accounts')
      .select(`
        id, clabe, bank_name, holder_name, created_at,
        store:stores ( id, name, slug, is_active, owner:profiles ( id, email, full_name ) )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return { data, count }
  },
}
