import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClipboardList, Search, Filter, RefreshCw, X, Eye,
  CheckCircle, XCircle, Clock, Truck, Package, BadgeCheck,
  Phone, Mail, MapPin, FileText, ChevronDown, AlertCircle,
  Image, User, ShoppingBag, DollarSign,
} from 'lucide-react'
import { Spinner, Modal, Button } from '../../../components/ui'
import { ordersService } from '../../../services/ordersService'
import { getOptimizedUrl } from '../../../lib/cloudinary'
import useAuthStore from '../../../store/authStore'
import { formatPrice } from '../../../utils/formatters'
import { cn } from '../../../utils/cn'

// ── Configuración de estados ──────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending_payment: {
    label: 'Pago pendiente',
    color: 'text-amber-400',
    bg:    'bg-amber-400/10',
    border:'border-amber-400/25',
    icon:  Clock,
  },
  paid: {
    label: 'Pagado',
    color: 'text-emerald-400',
    bg:    'bg-emerald-400/10',
    border:'border-emerald-400/25',
    icon:  DollarSign,
  },
  processing: {
    label: 'En proceso',
    color: 'text-blue-400',
    bg:    'bg-blue-400/10',
    border:'border-blue-400/25',
    icon:  Package,
  },
  shipped: {
    label: 'Enviado',
    color: 'text-purple-400',
    bg:    'bg-purple-400/10',
    border:'border-purple-400/25',
    icon:  Truck,
  },
  delivered: {
    label: 'Entregado',
    color: 'text-emerald-400',
    bg:    'bg-emerald-400/10',
    border:'border-emerald-400/25',
    icon:  CheckCircle,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-400',
    bg:    'bg-red-400/10',
    border:'border-red-400/25',
    icon:  XCircle,
  },
  payment_failed: {
    label: 'Pago rechazado',
    color: 'text-red-400',
    bg:    'bg-red-400/10',
    border:'border-red-400/25',
    icon:  AlertCircle,
  },
}

// Transiciones de estado permitidas
const STATUS_TRANSITIONS = {
  pending_payment: ['paid', 'cancelled', 'payment_failed'],
  paid:            ['processing', 'cancelled'],
  processing:      ['shipped', 'cancelled'],
  shipped:         ['delivered'],
  delivered:       [],
  cancelled:       [],
  payment_failed:  ['pending_payment', 'cancelled'],
}

const STATUS_LABELS_TRANSITION = {
  paid:           '✓ Confirmar pago',
  processing:     '⚙ Marcar en proceso',
  shipped:        '🚚 Marcar como enviado',
  delivered:      '✅ Confirmar entrega',
  cancelled:      '✕ Cancelar orden',
  payment_failed: '✕ Rechazar pago',
  pending_payment:'↩ Volver a pendiente',
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending_payment
  const Icon = cfg.icon
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border',
      cfg.color, cfg.bg, cfg.border
    )}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

// ── Formateador de fecha ──────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── CountdownTimer ────────────────────────────────────────────────────────────
function CountdownTimer({ expiresAt, status }) {
  const [, forceUpdate] = useState(0)

  // Rerender every minute
  useState(() => {
    const iv = setInterval(() => forceUpdate((n) => n + 1), 60_000)
    return () => clearInterval(iv)
  })

  if (status !== 'pending_payment') return null

  const ms   = new Date(expiresAt) - Date.now()
  if (ms <= 0) return <span className="text-xs text-red-400 font-semibold">⏰ Tiempo expirado</span>

  const totalMins  = Math.floor(ms / 60_000)
  const hours      = Math.floor(totalMins / 60)
  const mins       = totalMins % 60
  const isUrgent   = ms < 3_600_000 // < 1 hora

  return (
    <span className={cn('text-xs font-semibold', isUrgent ? 'text-red-400' : 'text-amber-400')}>
      ⏱ Vence en {hours > 0 ? `${hours}h ` : ''}{mins}min
    </span>
  )
}

// ── PaymentProofModal ─────────────────────────────────────────────────────────
function PaymentProofModal({ url, onClose }) {
  return (
    <Modal isOpen={!!url} onClose={onClose} title="Comprobante de pago" size="md">
      <div className="space-y-4">
        <img
          src={getOptimizedUrl(url, { width: 800, height: 1200 })}
          alt="Comprobante de pago"
          className="w-full rounded-xl object-contain max-h-[60vh] bg-white/5"
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm text-brand-gold hover:underline"
        >
          Abrir imagen en tamaño completo ↗
        </a>
      </div>
    </Modal>
  )
}

// ── OrderDetailModal ──────────────────────────────────────────────────────────
function OrderDetailModal({ order, isOpen, onClose }) {
  const queryClient   = useQueryClient()
  const { store }     = useAuthStore()
  const [proofUrl, setProofUrl] = useState(null)
  const [showTransitions, setShowTransitions] = useState(false)

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['order-items', order?.id],
    queryFn:  () => ordersService.getOrderItemsById(order.id),
    enabled:  isOpen && !!order?.id,
  })

  const { mutate: updateStatus, isPending: updatingStatus } = useMutation({
    mutationFn: ({ status }) => ordersService.updateOrderStatus(order.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-orders', store?.id] })
      onClose()
    },
  })

  if (!order) return null

  const transitions = STATUS_TRANSITIONS[order.status] ?? []
  const hasProof    = !!order.payment_proof_url

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Orden ${order.folio}`} size="lg">
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

          {/* Header: folio + status + timer */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <StatusBadge status={order.status} />
            {order.expires_at && (
              <CountdownTimer expiresAt={order.expires_at} status={order.status} />
            )}
          </div>

          {/* Comprobante de pago */}
          {hasProof ? (
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-400/15 flex items-center justify-center shrink-0">
                <Image size={16} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-400">Comprobante subido</p>
                <p className="text-[11px] text-content-muted">
                  {formatDate(order.payment_uploaded_at)}
                </p>
              </div>
              <button
                onClick={() => setProofUrl(order.payment_proof_url)}
                className="shrink-0 text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Eye size={12} /> Ver
              </button>
            </div>
          ) : (
            order.status === 'pending_payment' && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3.5 flex items-center gap-3">
                <AlertCircle size={16} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">
                  El cliente aún no ha subido su comprobante de pago.
                </p>
              </div>
            )
          )}

          {/* Datos del cliente */}
          <div className="card-base p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-content-muted flex items-center gap-2">
              <User size={12} /> Datos del cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
              <InfoRow icon={User}    label="Nombre"   value={order.customer_name} />
              <InfoRow icon={Phone}   label="Teléfono" value={order.customer_phone} />
              {order.customer_phone_alt && (
                <InfoRow icon={Phone} label="Tel. alternativo" value={order.customer_phone_alt} />
              )}
              {order.customer_email && (
                <InfoRow icon={Mail}  label="Correo" value={order.customer_email} />
              )}
              {order.customer_address && (
                <InfoRow icon={MapPin} label="Dirección" value={order.customer_address} className="sm:col-span-2" />
              )}
              {order.customer_notes && (
                <InfoRow icon={FileText} label="Notas" value={order.customer_notes} className="sm:col-span-2" />
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="card-base p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-content-muted flex items-center gap-2">
              <ShoppingBag size={12} /> Productos ({items.length})
            </h3>
            {itemsLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" className="text-brand-gold" />
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {items.map((item) => {
                  const snap    = item.product_snapshot ?? {}
                  const imgUrl  = snap.image_url
                    ? getOptimizedUrl(snap.image_url, { width: 80, height: 80 })
                    : null

                  return (
                    <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      {/* Imagen */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-brand-black-soft border border-white/5 shrink-0">
                        {imgUrl ? (
                          <img src={imgUrl} alt={snap.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={18} className="text-content-muted" />
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-content-primary line-clamp-1">{snap.name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.selected_color && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-content-secondary bg-white/5 px-1.5 py-0.5 rounded-md">
                              <span
                                className="w-2 h-2 rounded-full border border-white/20"
                                style={{ backgroundColor: item.selected_color_hex ?? '#888' }}
                              />
                              {item.selected_color}
                            </span>
                          )}
                          {item.selected_size && (
                            <span className="text-[11px] text-content-secondary bg-white/5 px-1.5 py-0.5 rounded-md">
                              Talla {item.selected_size}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-xs text-content-muted">× {item.quantity}</p>
                          <p className="text-sm font-bold text-brand-gold">{formatPrice(item.subtotal)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Total */}
            <div className="border-t border-white/8 pt-3 flex justify-between items-center">
              <span className="text-sm text-content-secondary">Total de la orden</span>
              <span className="text-lg font-black text-brand-gold">{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Acciones de estado */}
          {transitions.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowTransitions((v) => !v)}
                className="flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
              >
                <ChevronDown size={14} className={cn('transition-transform', showTransitions && 'rotate-180')} />
                Cambiar estado de la orden
              </button>

              {showTransitions && (
                <div className="flex flex-wrap gap-2">
                  {transitions.map((nextStatus) => {
                    const isCancelOrReject = nextStatus === 'cancelled' || nextStatus === 'payment_failed'
                    return (
                      <button
                        key={nextStatus}
                        onClick={() => updateStatus({ status: nextStatus })}
                        disabled={updatingStatus}
                        className={cn(
                          'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border',
                          isCancelOrReject
                            ? 'border-red-400/30 text-red-400 bg-red-400/5 hover:bg-red-400/10'
                            : 'border-brand-gold/30 text-brand-gold bg-brand-gold/5 hover:bg-brand-gold/10',
                          updatingStatus && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {updatingStatus && <Spinner size="xs" className="inline mr-1" />}
                        {STATUS_LABELS_TRANSITION[nextStatus] ?? nextStatus}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal comprobante */}
      <PaymentProofModal url={proofUrl} onClose={() => setProofUrl(null)} />
    </>
  )
}

function InfoRow({ icon: Icon, label, value, className }) {
  return (
    <div className={cn('flex items-start gap-2', className)}>
      <Icon size={13} className="text-content-muted mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-content-muted uppercase tracking-wider">{label}</p>
        <p className="text-sm text-content-primary break-words">{value || '—'}</p>
      </div>
    </div>
  )
}

// ── OrderRow ──────────────────────────────────────────────────────────────────
function OrderRow({ order, onView }) {
  return (
    <div
      className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[160px_1fr_140px_auto] gap-3 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0 cursor-pointer"
      onClick={() => onView(order)}
    >
      {/* Folio + fecha */}
      <div>
        <p className="text-xs font-mono font-bold text-content-primary">{order.folio}</p>
        <p className="text-[10px] text-content-muted mt-0.5">{formatDate(order.created_at)}</p>
      </div>

      {/* Cliente */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-content-primary truncate">{order.customer_name}</p>
        <p className="text-xs text-content-muted truncate">{order.customer_phone}</p>
      </div>

      {/* Total + status */}
      <div className="text-right hidden sm:block">
        <p className="text-sm font-bold text-brand-gold">{formatPrice(order.total)}</p>
        {order.payment_proof_url && (
          <span className="text-[10px] text-emerald-400 font-semibold">● Comprobante</span>
        )}
      </div>

      {/* Badge estado */}
      <div className="flex items-center gap-2">
        <StatusBadge status={order.status} />
        <Eye size={14} className="text-content-muted hidden sm:block" />
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
const STATUS_FILTER_OPTIONS = [
  { value: '',                label: 'Todos' },
  { value: 'pending_payment', label: 'Pago pendiente' },
  { value: 'paid',            label: 'Pagados' },
  { value: 'processing',      label: 'En proceso' },
  { value: 'shipped',         label: 'Enviados' },
  { value: 'delivered',       label: 'Entregados' },
  { value: 'cancelled',       label: 'Cancelados' },
  { value: 'payment_failed',  label: 'Pago rechazado' },
]

function DashboardOrdersPage() {
  const { store }     = useAuthStore()
  const queryClient   = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [search,       setSearch]       = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const { data: orders = [], isLoading, isFetching } = useQuery({
    queryKey: ['store-orders', store?.id, statusFilter],
    queryFn:  () => ordersService.getStoreOrders(store.id, {
      status: statusFilter || undefined,
    }),
    enabled:  !!store?.id,
    staleTime: 1000 * 30,
  })

  const filtered = orders.filter((o) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.folio?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.includes(q)
    )
  })

  // Contadores por estado para badges
  const countByStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Órdenes</h1>
          <p className="text-content-secondary text-sm mt-0.5">
            Gestiona los pedidos de tu tienda
          </p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['store-orders', store?.id] })}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-xs text-content-secondary hover:text-content-primary hover:border-white/20 transition-colors"
          disabled={isFetching}
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',          value: orders.length,                         color: 'text-content-primary' },
          { label: 'Pago pendiente', value: countByStatus.pending_payment ?? 0,    color: 'text-amber-400' },
          { label: 'Con comprobante',value: orders.filter((o) => o.payment_proof_url).length, color: 'text-emerald-400' },
          { label: 'Entregados',     value: countByStatus.delivered ?? 0,           color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-base px-4 py-3">
            <p className={cn('text-2xl font-black', color)}>{value}</p>
            <p className="text-xs text-content-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card-base p-4 mb-4 flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por folio, nombre o teléfono…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 bg-brand-black-soft text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filtro de estado */}
        <div className="relative shrink-0">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-xl border border-white/10 bg-brand-black-soft text-sm text-content-primary appearance-none focus:outline-none focus:ring-2 focus:ring-brand-gold/40 cursor-pointer"
          >
            {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="card-base overflow-hidden">
        {/* Encabezado de columnas (desktop) */}
        <div className="hidden sm:grid grid-cols-[160px_1fr_140px_auto] gap-3 px-5 py-2.5 border-b border-white/5 bg-white/[0.02]">
          {['Folio / Fecha', 'Cliente', 'Total', 'Estado'].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-content-muted">
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-brand-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 rounded-2xl bg-white/5 mb-4">
              <ClipboardList size={36} className="text-content-muted" />
            </div>
            <p className="text-content-primary font-semibold mb-1">
              {search || statusFilter ? 'No se encontraron órdenes' : 'Aún no tienes órdenes'}
            </p>
            <p className="text-content-secondary text-sm">
              {search || statusFilter
                ? 'Intenta con otros filtros.'
                : 'Cuando un cliente haga un pedido, aparecerá aquí.'}
            </p>
          </div>
        ) : (
          filtered.map((order) => (
            <OrderRow key={order.id} order={order} onView={setSelectedOrder} />
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-content-muted mt-3 text-right">
          {filtered.length} orden{filtered.length !== 1 ? 'es' : ''} mostrada{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Detail modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  )
}

export default DashboardOrdersPage
