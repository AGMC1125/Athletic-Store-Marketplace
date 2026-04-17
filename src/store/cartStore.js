import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Estructura de un item del carrito:
 * {
 *   cartItemId: string   (UUID único para esta línea del carrito)
 *   productId:  string
 *   storeId:    string
 *   storeName:  string
 *   storeSlug:  string
 *   name:       string
 *   imageUrl:   string | null
 *   category:   string
 *   basePrice:  number
 *   discountPct:number | null
 *   unitPrice:  number   (precio final con descuento)
 *   selectedColor:    string | null
 *   selectedColorHex: string | null
 *   selectedSize:     string | null
 *   quantity:   number
 * }
 */

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // ── Agregar item ─────────────────────────────────────────────────────
      addItem: (item) => {
        const items = get().items
        // Si ya existe la misma combinación (producto + color + talla), incrementa cantidad
        const existIdx = items.findIndex(
          (i) =>
            i.productId      === item.productId &&
            i.selectedColor  === item.selectedColor &&
            i.selectedSize   === item.selectedSize
        )

        if (existIdx >= 0) {
          const next = [...items]
          next[existIdx] = {
            ...next[existIdx],
            quantity: next[existIdx].quantity + (item.quantity ?? 1),
          }
          set({ items: next })
        } else {
          set({
            items: [
              ...items,
              {
                ...item,
                cartItemId: crypto.randomUUID(),
                quantity: item.quantity ?? 1,
              },
            ],
          })
        }
      },

      // ── Eliminar item ────────────────────────────────────────────────────
      removeItem: (cartItemId) =>
        set({ items: get().items.filter((i) => i.cartItemId !== cartItemId) }),

      // ── Actualizar cantidad ──────────────────────────────────────────────
      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.cartItemId !== cartItemId) })
        } else {
          set({
            items: get().items.map((i) =>
              i.cartItemId === cartItemId ? { ...i, quantity } : i
            ),
          })
        }
      },

      // ── Vaciar carrito ───────────────────────────────────────────────────
      clearCart: () => set({ items: [] }),

      // ── Eliminar items de una tienda específica ──────────────────────────
      clearStoreItems: (storeId) =>
        set({ items: get().items.filter((i) => i.storeId !== storeId) }),

      // ── Getters derivados ────────────────────────────────────────────────
      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      get totalPrice() {
        return get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
      },

      // Agrupa items por tienda → útil para crear órdenes separadas
      get itemsByStore() {
        const groups = {}
        for (const item of get().items) {
          if (!groups[item.storeId]) {
            groups[item.storeId] = {
              storeId:   item.storeId,
              storeName: item.storeName,
              storeSlug: item.storeSlug,
              items:     [],
              subtotal:  0,
            }
          }
          groups[item.storeId].items.push(item)
          groups[item.storeId].subtotal += item.unitPrice * item.quantity
        }
        return Object.values(groups)
      },
    }),
    {
      name: 'athletic-cart-v1',   // clave en localStorage
      version: 1,
    }
  )
)

export default useCartStore
