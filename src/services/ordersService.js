import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/cloudinary'

export const ordersService = {
  // ── Crear una orden (guest checkout) ──────────────────────────────────────
  /**
   * @param {object} params
   * @param {string} params.storeId
   * @param {object} params.customerData  { name, phone, phoneAlt, email, address, notes }
   * @param {Array}  params.items         Array de cart items del mismo store
   * @returns {object} La orden creada (con folio generado por el trigger de DB)
   */
  async createOrder({ storeId, customerData, items }) {
    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

    // 1. Insertar la orden (el trigger de DB asigna el folio automáticamente)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id:          storeId,
        customer_name:     customerData.name,
        customer_phone:    customerData.phone,
        customer_phone_alt: customerData.phoneAlt || null,
        customer_email:    customerData.email    || null,
        customer_address:  customerData.address  || null,
        customer_notes:    customerData.notes    || null,
        total,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // 2. Insertar los items con snapshot del producto
    const orderItems = items.map((item) => ({
      order_id:           order.id,
      product_id:         item.productId || null,
      product_snapshot: {
        name:                item.name,
        base_price:          item.basePrice,
        discount_percentage: item.discountPct || null,
        final_price:         item.unitPrice,
        category:            item.category,
        image_url:           item.imageUrl || null,
        store_name:          item.storeName,
        store_slug:          item.storeSlug,
      },
      selected_color:     item.selectedColor     || null,
      selected_color_hex: item.selectedColorHex  || null,
      selected_size:      item.selectedSize      || null,
      quantity:           item.quantity,
      unit_price:         item.unitPrice,
      subtotal:           item.unitPrice * item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return order
  },

  // ── Obtener una orden por folio (RPC — sin autenticación) ─────────────────
  async getOrderByFolio(folio) {
    const { data, error } = await supabase
      .rpc('get_order_by_folio', { p_folio: folio.toUpperCase() })

    if (error) throw error
    return data?.[0] ?? null
  },

  // ── Obtener los items de una orden por folio (RPC) ─────────────────────────
  async getOrderItemsByFolio(folio) {
    const { data, error } = await supabase
      .rpc('get_order_items_by_folio', { p_folio: folio.toUpperCase() })

    if (error) throw error
    return data ?? []
  },

  // ── Obtener órdenes por teléfono (RPC — sin autenticación) ────────────────
  async getOrdersByPhone(phone) {
    // Normalizar: solo dígitos
    const normalized = phone.replace(/\D/g, '')

    const { data, error } = await supabase
      .rpc('get_orders_by_phone', { p_phone: normalized })

    if (error) throw error
    return data ?? []
  },

  // ── Subir comprobante de pago (Cloudinary + RPC) ──────────────────────────
  async uploadPaymentProof({ folio, file }) {
    // 1. Subir imagen a Cloudinary
    const imageUrl = await uploadImage(file, 'orders/payment_proofs')

    // 2. Llamar función RPC que actualiza la orden con el comprobante
    const { data, error } = await supabase
      .rpc('upload_payment_proof', {
        p_folio:             folio.toUpperCase(),
        p_payment_proof_url: imageUrl,
      })

    if (error) throw error
    return imageUrl
  },

  // ── Dashboard: obtener órdenes de la tienda (autenticado) ─────────────────
  async getStoreOrders(storeId, { status } = {}) {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  // ── Dashboard: obtener items de una orden (autenticado) ───────────────────
  async getOrderItemsById(orderId) {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (error) throw error
    return data ?? []
  },

  // ── Dashboard: actualizar estado de una orden (autenticado) ───────────────
  async updateOrderStatus(orderId, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
