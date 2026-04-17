import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package, Store } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import { ROUTES, CATEGORY_LABELS } from '../../constants'
import { formatPrice } from '../../utils/formatters'
import { getOptimizedUrl } from '../../lib/cloudinary'

// ── Item del carrito ──────────────────────────────────────────────────────────
function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCartStore()
  const thumb = item.imageUrl
    ? getOptimizedUrl(item.imageUrl, { width: 160, crop: 'fit' })
    : null

  return (
    <div className="flex gap-4 py-5 border-b border-white/5 last:border-0">
      {/* Imagen */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-brand-black-soft shrink-0 border border-white/5">
        {thumb ? (
          <img src={thumb} alt={item.name} className="w-full h-full object-contain p-1.5" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-content-muted">
            <Package size={24} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-content-primary line-clamp-2 leading-snug">
          {item.name}
        </p>
        <p className="text-xs text-content-muted mt-0.5">
          {CATEGORY_LABELS[item.category] ?? item.category}
        </p>

        {/* Variante seleccionada */}
        <div className="flex flex-wrap gap-2 mt-1.5">
          {item.selectedColor && (
            <span className="inline-flex items-center gap-1 text-xs text-content-secondary bg-white/5 px-2 py-0.5 rounded-md">
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/20"
                style={{ backgroundColor: item.selectedColorHex ?? '#888' }}
              />
              {item.selectedColor}
            </span>
          )}
          {item.selectedSize && (
            <span className="text-xs text-content-secondary bg-white/5 px-2 py-0.5 rounded-md">
              Talla {item.selectedSize}
            </span>
          )}
        </div>

        {/* Precio + controles de cantidad */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-brand-gold font-bold text-sm">
            {formatPrice(item.unitPrice * item.quantity)}
            {item.quantity > 1 && (
              <span className="text-content-muted font-normal text-xs ml-1">
                ({formatPrice(item.unitPrice)} c/u)
              </span>
            )}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
              className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-content-secondary hover:text-content-primary hover:border-white/25 transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="w-7 text-center text-sm font-semibold text-content-primary">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
              className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-content-secondary hover:text-content-primary hover:border-white/25 transition-colors"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={() => removeItem(item.cartItemId)}
              className="w-7 h-7 ml-1 rounded-lg flex items-center justify-center text-content-muted hover:text-state-error hover:bg-state-error/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Grupo por tienda ──────────────────────────────────────────────────────────
function StoreGroup({ group }) {
  return (
    <div className="card-base overflow-hidden">
      {/* Header tienda */}
      <div className="flex items-center gap-2 px-5 py-3.5 bg-white/[0.02] border-b border-white/5">
        <Store size={14} className="text-brand-gold" />
        <Link
          to={ROUTES.STORE.replace(':slug', group.storeSlug)}
          className="text-sm font-semibold text-content-primary hover:text-brand-gold transition-colors"
        >
          {group.storeName}
        </Link>
      </div>

      {/* Items */}
      <div className="px-5">
        {group.items.map((item) => (
          <CartItem key={item.cartItemId} item={item} />
        ))}
      </div>

      {/* Subtotal tienda */}
      <div className="px-5 py-3.5 border-t border-white/5 flex justify-between items-center">
        <span className="text-xs text-content-muted">Subtotal {group.storeName}</span>
        <span className="text-sm font-bold text-content-primary">{formatPrice(group.subtotal)}</span>
      </div>
    </div>
  )
}

// ── Página Carrito ─────────────────────────────────────────────────────────────
function groupItemsByStore(items) {
  const groups = {}
  for (const item of items) {
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
}

function CartPage() {
  const navigate = useNavigate()
  const { items, clearCart } = useCartStore()
  const totalItems   = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice   = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const itemsByStore = groupItemsByStore(items)

  if (items.length === 0) {
    return (
      <div className="container-app py-20 text-center animate-fade-in">
        <div className="inline-flex p-5 rounded-2xl bg-white/5 mb-6">
          <ShoppingCart size={40} className="text-content-muted" />
        </div>
        <h1 className="text-xl font-bold text-content-primary mb-2">Tu carrito está vacío</h1>
        <p className="text-content-secondary text-sm mb-8">
          Explora el catálogo y agrega productos que te interesen.
        </p>
        <Link
          to={ROUTES.CATALOG}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-gold text-black font-bold text-sm hover:bg-brand-gold/90 transition-colors"
        >
          Explorar catálogo
          <ArrowRight size={15} />
        </Link>
      </div>
    )
  }

  return (
    <div className="container-app py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Mi carrito</h1>
          <p className="text-content-secondary text-sm mt-0.5">
            {totalItems} producto{totalItems !== 1 ? 's' : ''} de {itemsByStore.length} tienda{itemsByStore.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-content-muted hover:text-state-error transition-colors flex items-center gap-1"
        >
          <Trash2 size={12} />
          Vaciar carrito
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Items agrupados por tienda */}
        <div className="space-y-4">
          {itemsByStore.map((group) => (
            <StoreGroup key={group.storeId} group={group} />
          ))}
        </div>

        {/* Resumen del pedido */}
        <div className="lg:sticky lg:top-24 card-base p-5 space-y-4">
          <h2 className="text-sm font-bold text-content-primary">Resumen del pedido</h2>

          <div className="space-y-2">
            {itemsByStore.map((g) => (
              <div key={g.storeId} className="flex justify-between text-xs text-content-secondary">
                <span className="truncate pr-2">{g.storeName}</span>
                <span className="shrink-0 font-medium">{formatPrice(g.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/8" />

          <div className="flex justify-between items-center">
            <span className="text-sm text-content-secondary">Total</span>
            <span className="text-xl font-black text-brand-gold">{formatPrice(totalPrice)}</span>
          </div>

          <p className="text-[11px] text-content-muted">
            El pago se realiza mediante transferencia bancaria directamente con cada tienda.
          </p>

          <button
            onClick={() => navigate(ROUTES.CHECKOUT)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-gold text-black font-bold text-sm hover:bg-brand-gold/90 active:scale-[0.98] transition-all"
          >
            Proceder al checkout
            <ArrowRight size={16} />
          </button>

          <Link
            to={ROUTES.CATALOG}
            className="block text-center text-xs text-content-muted hover:text-brand-gold transition-colors"
          >
            ← Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CartPage
