import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Package, Clock, CheckCircle, Truck, XCircle,
  ShoppingBag, AlertCircle, Upload, Loader2, ChevronRight,
  ArrowLeft, Store, Landmark, PartyPopper, RefreshCw,
} from 'lucide-react'
import { ordersService } from '../../services/ordersService'
import { bankAccountsService } from '../../services/bankAccountsService'
import { getOptimizedUrl } from '../../lib/cloudinary'
import { ROUTES } from '../../constants'
import { formatPrice } from '../../utils/formatters'

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending_payment:  { label: 'Pendiente de pago',   color: 'text-amber-400',    bg: 'bg-amber-400/10  border-amber-400/20',  icon: Clock },
  payment_uploaded: { label: 'Comprobante enviado',  color: 'text-blue-400',     bg: 'bg-blue-400/10   border-blue-400/20',   icon: Upload },
  paid:             { label: 'Pago confirmado',       color: 'text-state-success',bg: 'bg-state-success/10 border-state-success/20', icon: CheckCircle },
  processing:       { label: 'En proceso de envío',  color: 'text-purple-400',   bg: 'bg-purple-400/10 border-purple-400/20', icon: Package },
  shipped:          { label: 'Enviado',               color: 'text-cyan-400',     bg: 'bg-cyan-400/10   border-cyan-400/20',   icon: Truck },
  delivered:        { label: 'Entregado',             color: 'text-state-success',bg: 'bg-state-success/10 border-state-success/20', icon: CheckCircle },
  cancelled:        { label: 'Cancelado',             color: 'text-state-error',  bg: 'bg-state-error/10  border-state-error/20',  icon: XCircle },
}

function StatusBadge({ status, className = '' }) {
  const cfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending_payment
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${className}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Countdown timer ───────────────────────────────────────────────────────────
function CountdownTimer({ expiresAt }) {
  const [now, setNow] = useState(Date.now())
  useState(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  })

  const remaining = new Date(expiresAt).getTime() - now
  if (remaining <= 0) return <span className="text-state-error text-xs font-semibold">Tiempo agotado</span>

  const h  = Math.floor(remaining / 3_600_000)
  const m  = Math.floor((remaining % 3_600_000) / 60_000)
  const s  = Math.floor((remaining % 60_000) / 1_000)
  const urgent = remaining < 3_600_000

  return (
    <span className={`text-xs font-mono font-bold ${urgent ? 'text-state-error' : 'text-amber-400'}`}>
      {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  )
}

// ── Upload comprobante inline ─────────────────────────────────────────────────
function UploadProof({ folio, onSuccess }) {
  const [file, setFile]         = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState(null)

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await ordersService.uploadPaymentProof({ folio, file })
      onSuccess()
    } catch (err) {
      setError(err.message ?? 'Error al subir el comprobante')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${
        file ? 'border-brand-gold/40 bg-brand-gold/5' : 'border-white/10 hover:border-white/25'
      }`}>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {file ? (
          <>
            <CheckCircle size={20} className="text-brand-gold" />
            <span className="text-xs text-brand-gold font-medium">{file.name}</span>
            <span className="text-[10px] text-content-muted">Clic para cambiar</span>
          </>
        ) : (
          <>
            <Upload size={20} className="text-content-muted" />
            <span className="text-xs text-content-secondary">Selecciona tu comprobante de pago</span>
          </>
        )}
      </label>

      {error && <p className="text-xs text-state-error flex items-center gap-1"><AlertCircle size={11} />{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1da851] active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {uploading ? <><Loader2 size={15} className="animate-spin" />Subiendo…</> : <><Upload size={15} />Subir comprobante</>}
      </button>
    </div>
  )
}

// ── Detalle de una orden ──────────────────────────────────────────────────────
function OrderDetail({ order, items, onBack, onRefresh }) {
  const [showUpload, setShowUpload] = useState(false)
  const cfg  = STATUS_CONFIG[order.status] ?? {}
  const Icon = cfg.icon ?? Clock
  const isPending   = order.status === 'pending_payment'
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-content-muted hover:text-content-primary text-sm transition-colors group"
      >
        <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
        Volver a mis órdenes
      </button>

      {/* Estado + folio */}
      <div className="card-base p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-content-muted mb-1">Número de orden</p>
            <p className="text-lg font-mono font-black text-brand-gold tracking-wider">{order.folio}</p>
            <p className="text-xs text-content-muted mt-0.5">{formatDate(order.created_at)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Timer */}
        {isPending && order.expires_at && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-400/5 border border-amber-400/15">
            <Clock size={13} className="text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-amber-400 font-semibold">Tiempo restante para subir comprobante</p>
              <CountdownTimer expiresAt={order.expires_at} />
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="mt-4 p-3 rounded-xl bg-state-error/5 border border-state-error/15">
            <p className="text-xs text-state-error font-semibold">{order.cancellation_reason ?? 'Orden cancelada'}</p>
            <p className="text-xs text-content-muted mt-1">
              Puedes realizar una nueva orden desde el catálogo.{' '}
              <Link to={ROUTES.CATALOG} className="text-brand-gold hover:underline">Ir al catálogo →</Link>
            </p>
          </div>
        )}
      </div>

      {/* Tienda */}
      <div className="card-base p-4 flex items-center gap-3">
        {order.store_logo_url ? (
          <img src={getOptimizedUrl(order.store_logo_url, { width: 44, height: 44 })} alt={order.store_name} className="w-11 h-11 rounded-xl object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-brand-gold/10 flex items-center justify-center"><Store size={18} className="text-brand-gold" /></div>
        )}
        <div>
          <p className="text-sm font-semibold text-content-primary">{order.store_name}</p>
          <Link to={ROUTES.STORE.replace(':slug', order.store_slug)} className="text-xs text-brand-gold hover:underline">
            Ver tienda →
          </Link>
        </div>
        <p className="ml-auto text-lg font-black text-brand-gold">{formatPrice(order.total)}</p>
      </div>

      {/* Productos */}
      <div className="card-base overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5">
          <p className="text-xs font-semibold text-content-secondary uppercase tracking-wider">Productos</p>
        </div>
        <div className="divide-y divide-white/5">
          {items.map((item) => {
            const snap     = item.product_snapshot
            const imgUrl   = snap.image_url ? getOptimizedUrl(snap.image_url, { width: 80, height: 80 }) : null
            return (
              <div key={item.id} className="flex gap-3 p-4">
                <div className="w-14 h-14 rounded-xl bg-brand-black-soft border border-white/5 shrink-0 overflow-hidden">
                  {imgUrl ? (
                    <img src={imgUrl} alt={snap.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-content-muted" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-content-primary line-clamp-1">{snap.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {item.selected_color && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-content-secondary bg-white/5 px-1.5 py-0.5 rounded">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.selected_color_hex ?? '#888' }} />
                        {item.selected_color}
                      </span>
                    )}
                    {item.selected_size && (
                      <span className="text-[10px] text-content-secondary bg-white/5 px-1.5 py-0.5 rounded">Talla {item.selected_size}</span>
                    )}
                    <span className="text-[10px] text-content-muted bg-white/5 px-1.5 py-0.5 rounded">×{item.quantity}</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-brand-gold shrink-0">{formatPrice(item.subtotal)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Subir comprobante (si aplica) */}
      {(isPending || order.status === 'payment_uploaded') && !isCancelled && (
        <div className="card-base p-5">
          {order.payment_proof_url ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-content-secondary uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle size={11} className="text-state-success" />Comprobante enviado
              </p>
              <img
                src={order.payment_proof_url}
                alt="Comprobante de pago"
                className="max-h-48 rounded-xl object-contain border border-white/8"
              />
              <p className="text-[11px] text-content-muted">
                Enviado el {formatDate(order.payment_uploaded_at)}. La tienda validará tu pago.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Upload size={11} />Subir comprobante de pago
              </p>
              <UploadProof
                folio={order.folio}
                onSuccess={() => { onRefresh(); setShowUpload(false) }}
              />
            </>
          )}
        </div>
      )}

      {/* Datos del cliente */}
      <div className="card-base p-5 space-y-2.5">
        <p className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-1">Datos del pedido</p>
        {[
          ['Nombre',    order.customer_name],
          ['Teléfono',  order.customer_phone],
          ['Alt.',      order.customer_phone_alt],
          ['Email',     order.customer_email],
          ['Dirección', order.customer_address],
          ['Notas',     order.customer_notes],
        ].filter(([, v]) => v).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <span className="text-content-muted text-xs">{label}</span>
            <span className="text-content-primary text-xs text-right">{value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onRefresh}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-content-muted hover:text-content-primary transition-colors"
      >
        <RefreshCw size={12} />Actualizar estado
      </button>
    </div>
  )
}

// ── Lista de órdenes (búsqueda por teléfono) ──────────────────────────────────
function OrdersList({ orders, onSelectOrder }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-content-secondary">{orders.length} orden{orders.length !== 1 ? 'es' : ''} encontrada{orders.length !== 1 ? 's' : ''}</p>
      {orders.map((order) => (
        <button
          key={order.id}
          onClick={() => onSelectOrder(order.folio)}
          className="w-full card-base p-4 text-left hover:border-brand-gold/30 transition-all group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {order.store_logo_url && (
                  <img src={getOptimizedUrl(order.store_logo_url, { width: 24, height: 24 })} alt="" className="w-5 h-5 rounded object-cover" />
                )}
                <span className="text-xs text-content-muted truncate">{order.store_name}</span>
              </div>
              <p className="text-sm font-mono font-bold text-brand-gold">{order.folio}</p>
              <p className="text-xs text-content-muted mt-0.5">{formatDate(order.created_at)}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <StatusBadge status={order.status} />
              <span className="text-sm font-bold text-content-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
          <ChevronRight size={14} className="ml-auto text-content-muted group-hover:text-brand-gold transition-colors mt-1" />
        </button>
      ))}
    </div>
  )
}

// ── Página principal de Órdenes ───────────────────────────────────────────────
function OrdersPage() {
  const [searchType, setSearchType] = useState('folio') // 'folio' | 'phone'
  const [query, setQuery]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [results, setResults]       = useState(null)   // null | order | order[]
  const [selectedFolio, setSelectedFolio] = useState(null)
  const [orderItems, setOrderItems] = useState([])

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResults(null)
    setSelectedFolio(null)

    try {
      if (searchType === 'folio') {
        const order = await ordersService.getOrderByFolio(query.trim())
        if (!order) throw new Error('No se encontró ninguna orden con ese folio.')
        const items = await ordersService.getOrderItemsByFolio(query.trim())
        setResults(order)
        setOrderItems(items)
        setSelectedFolio(order.folio)
      } else {
        const orders = await ordersService.getOrdersByPhone(query.trim())
        if (orders.length === 0) throw new Error('No se encontraron órdenes con ese número de teléfono.')
        setResults(orders)
      }
    } catch (err) {
      setError(err.message ?? 'Error al buscar la orden')
    } finally {
      setLoading(false)
    }
  }

  async function loadOrderDetail(folio) {
    setLoading(true)
    try {
      const order = await ordersService.getOrderByFolio(folio)
      const items = await ordersService.getOrderItemsByFolio(folio)
      setSelectedFolio(folio)
      setResults(order)
      setOrderItems(items)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    if (searchType === 'phone' && Array.isArray(results)) {
      setSelectedFolio(null)
    } else {
      setResults(null)
      setSelectedFolio(null)
      setQuery('')
    }
  }

  // Vista detalle de una orden
  const showDetail = selectedFolio && results && !Array.isArray(results)

  // Vista lista de órdenes por teléfono
  const showList = !selectedFolio && Array.isArray(results)

  return (
    <div className="container-app py-8 max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary">Mis Órdenes</h1>
        <p className="text-content-secondary text-sm mt-1">
          Busca tu pedido por folio de compra o número de teléfono.
        </p>
      </div>

      {!showDetail && (
        <>
          {/* Tipo de búsqueda */}
          <div className="flex gap-2 mb-5">
            {[
              { key: 'folio', label: 'Por folio de orden' },
              { key: 'phone', label: 'Por teléfono' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setSearchType(opt.key); setQuery(''); setResults(null); setError(null) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  searchType === opt.key
                    ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                    : 'border-white/10 text-content-muted hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === 'folio' ? 'Ej: ASM-20240417-ABC123' : '10 dígitos sin espacios'}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-brand-black-soft text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/40 focus:border-brand-gold/40 uppercase"
                type={searchType === 'phone' ? 'tel' : 'text'}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-3 rounded-xl bg-brand-gold text-black font-bold text-sm hover:bg-brand-gold/90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-state-error/8 border border-state-error/20 mb-5">
              <AlertCircle size={15} className="text-state-error shrink-0 mt-0.5" />
              <p className="text-sm text-state-error">{error}</p>
            </div>
          )}

          {/* Lista de órdenes (búsqueda por teléfono) */}
          {showList && (
            <OrdersList orders={results} onSelectOrder={loadOrderDetail} />
          )}

          {/* Empty state */}
          {!results && !loading && !error && (
            <div className="text-center py-16 text-content-muted">
              <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Ingresa tu folio o teléfono para buscar tus pedidos.</p>
            </div>
          )}
        </>
      )}

      {/* Detalle de orden */}
      {showDetail && !loading && (
        <OrderDetail
          order={results}
          items={orderItems}
          onBack={handleBack}
          onRefresh={() => loadOrderDetail(selectedFolio)}
        />
      )}

      {loading && !showDetail && (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-gold" />
        </div>
      )}
    </div>
  )
}

export default OrdersPage
