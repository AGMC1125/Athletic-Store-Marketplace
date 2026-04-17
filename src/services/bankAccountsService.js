import { supabase } from '../lib/supabase'

/**
 * Servicio de cuentas bancarias para transferencias.
 * Cada tienda puede tener UNA cuenta bancaria asociada.
 */
export const bankAccountsService = {
  /**
   * Obtiene la cuenta bancaria de una tienda.
   * @param {string} storeId
   * @returns {Promise<object|null>}
   */
  async getBankAccount(storeId) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  /**
   * Obtiene la cuenta bancaria pública de una tienda (para clientes).
   * Solo devuelve datos si la tienda está activa.
   * @param {string} storeId
   * @returns {Promise<object|null>}
   */
  async getPublicBankAccount(storeId) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('clabe, bank_name, holder_name')
      .eq('store_id', storeId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  /**
   * Crea o actualiza la cuenta bancaria de una tienda.
   * @param {string} storeId
   * @param {{ clabe: string, bank_name: string, holder_name: string }} bankData
   */
  async upsertBankAccount(storeId, bankData) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .upsert(
        {
          store_id:    storeId,
          clabe:       bankData.clabe,
          bank_name:   bankData.bank_name,
          holder_name: bankData.holder_name,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: 'store_id' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },
}
