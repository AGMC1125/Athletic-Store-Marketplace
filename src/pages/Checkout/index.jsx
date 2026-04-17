import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Phone, Mail, MapPin, FileText, ArrowRight, ArrowLeft,
  CheckCircle, ShoppingBag, Landmark, Upload, Clock, Package,
  Store, Loader2, AlertCircle, PartyPopper,
} from 'lucide-react'
import useCartStore from '../../store/cartStore'
import { ordersService } from '../../services/ordersService'
import { bankAccountsService } from '../../services/bankAccountsService'
import { getOptimizedUrl } from '../../lib/cloudinary'
import { ROUTES } from '../../constants'
import { formatPrice } from '../../utils/formatters'

// ── Schema validación de datos del cliente ────────────────────────────────────
const customerSchema = z.object({
  name:     z.string().min(2,  'El nombre es requerido'),
  phone:    z.string().min(10, 'Ingresa un teléfono válido (10 dígitos)').max(15),
  phoneAlt: z.string().optional().or(z.literal('')),
  email:    z.string().email('Correo inválido').optional().or(z.literal('')),
  address:  z.string().optional().or(z.literal('')),
  notes:    z.string().optional().or(z.literal('')),
})

// ── Indicador de pasos ────────────────────────────────────────────────────────
function StepIndicator({ step, labels }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {labels.map((label, i) => {
        const num     = i + 1
        const active  = step === num
        const done    = step > num
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                done   ? 'bg-brand-gold border-brand-gold text-black'
                : active ? 'border-brand-gold text-brand-gold bg-brand-gold/10'
                : 'border-white/15 text-content-muted'
              }`}>
                {done ? <CheckCircle size={15} strokeWidth={2.5} /> : num}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-brand-gold' : done ? 'text-content-secondary' : 'text-content-muted'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`w-16 sm:w-24 h-px mb-5 mx-1 transition-colors ${done ? 'bg-brand-gold/40' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Input reutilizable ────────────────────────────────────────────────────────
function Field({ label, error, icon: Icon, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-content-secondary uppercase tracking-wider flex items-center gap-1">
        {Icon && <Icon size={11} />}
        {label}
        {required && <span className="text-state-error">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-state-error flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function TextInput({ register, error, ...props }) {
  return (
    <input
      {...register}
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border bg-brand-black-soft text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/40 transition-colors ${
        error ? 'border-state-error/50' : 'border-white/10 focus:border-brand-gold/40'
      }`}
    />
  )
}

// ── Paso 1: Datos del cliente ──────────────────────────────────────────────────
function StepCustomerData({ onNext }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(customerSchema),
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Nombre completo" error={errors.name?.message} icon={User} required>
          <TextInput register={register('name')} error={errors.name} placeholder="Ej: Juan García Pérez" />
        </Field>
        <Field label="Teléfono principal" error={errors.phone?.message} icon={Phone} required>
          <TextInput register={register('phone')} error={errors.phone} placeholder="10 dígitos" type="tel" />
        </Field>
        <Field label="Teléfono alternativo" error={errors.phoneAlt?.message} icon={Phone}>
          <TextInput register={register('phoneAlt')} placeholder="Opcional" type="tel" />
        </Field>
        <Field label="Correo electrónico" error={errors.email?.message} icon={Mail}>
          <TextInput register={register('email')} error={errors.email} placeholder="Opcional" type="email" />
        </Field>
      </div>
      <Field label="Dirección de entrega" error={errors.address?.message} icon={MapPin}>
        <TextInput register={register('address')} placeholder="Calle, número, colonia, ciudad (opcional)" />
      </Field>
      <Field label="Notas adicionales" icon={FileText}>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Indicaciones especiales para la tienda (opcional)"
          className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-brand-black-soft text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/40 focus:border-brand-gold/40 transition-colors resize-none"
        />
      </Field>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-gold text-black font-bold text-sm hover:bg-brand-gold/90 active:scale-[0.98] transition-all"
      >
        Continuar al pago
        <ArrowRight size={16} />
      </button>
    </form>
  )
}

// ── Paso 2: Pago por transferencia ────────────────────────────────────────────
function StepPayment({ orders, customerData, onNext, onBack }) {
  const [proofFiles, setProofFiles]     = useState({}) // { [orderId]: File }
  const [uploading, setUploading]       = useState(false)
  const [error, setError]               = useState(null)

  async function handleSubmit() {
    setUploading(true)
    setError(null)
    try {
      // Subir comprobantes de pago para cada orden que tenga archivo
      for (const order of orders) {
        const file = proofFiles[order.id]
        if (file) {
          await ordersService.uploadPaymentProof({ folio: order.folio, file })
        }
      }
      onNext()
    } catch (err) {
      setError(err.message ?? 'Error al subir el comprobante')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="card-base p-5 space-y-4">
          {/* Tienda */}
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Store size={14} className="text-brand-gold" />
            <span className="text-sm font-semibold text-content-primary">{order.storeName}</span>
            <span className="ml-auto text-xs text-content-muted font-mono">{order.folio}</span>
          </div>

          {/* Datos bancarios */}
          {order.bankAccount ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Landmark size={14} className="text-brand-gold" />
                <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">Datos de transferencia</span>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-2">
                {[
                  ['Banco',   order.bankAccount.bank_name],
                  ['Titular', order.bankAccount.holder_name],
                  ['CLABE',   order.bankAccount.clabe],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-content-muted">{label}</span>
                    <span className="text-sm font-mono font-semibold text-content-primary">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                  <span className="text-xs text-content-muted">Monto a transferir</span>
                  <span className="text-base font-black text-brand-gold">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-state-warning/5 border border-state-warning/20">
              <AlertCircle size={16} className="text-state-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-state-warning">Sin datos bancarios configurados</p>
                <p className="text-xs text-content-secondary mt-0.5">
                  Contacta directamente a la tienda para recibir los datos de pago.
                  {order.storePhone && ` Teléfono: ${order.storePhone}`}
                </p>
              </div>
            </div>
          )}

          {/* Upload comprobante */}
          <div>
            <p className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Upload size={11} /> Subir comprobante (opcional)
            </p>
            <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${
              proofFiles[order.id]
                ? 'border-brand-gold/40 bg-brand-gold/5'
                : 'border-white/10 hover:border-white/25 hover:bg-white/3'
            }`}>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setProofFiles((prev) => ({ ...prev, [order.id]: file }))
                }}
              />
              {proofFiles[order.id] ? (
                <>
                  <CheckCircle size={20} className="text-brand-gold" />
                  <span className="text-xs text-brand-gold font-medium">{proofFiles[order.id].name}</span>
                  <span className="text-[10px] text-content-muted">Clic para cambiar</span>
                </>
              ) : (
                <>
                  <Upload size={20} className="text-content-muted" />
                  <span className="text-xs text-content-secondary">Arrastra o selecciona el comprobante</span>
                  <span className="text-[10px] text-content-muted">PNG, JPG o PDF · Máx. 5 MB</span>
                </>
              )}
            </label>
          </div>

          {/* Timer warning */}
          {!proofFiles[order.id] && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <Clock size={13} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-400/80">
                Si no subes el comprobante ahora, tienes <strong>24 horas</strong> para hacerlo antes de que la orden se cancele automáticamente.
                Busca tu orden en <strong>/ordenes</strong> con tu folio o teléfono.
              </p>
            </div>
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm text-state-error flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-content-secondary text-sm font-medium hover:border-white/20 transition-colors"
        >
          <ArrowLeft size={15} /> Volver
        </button>
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-gold text-black font-bold text-sm hover:bg-brand-gold/90 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {uploading ? (
            <><Loader2 size={16} className="animate-spin" /> Enviando...</>
          ) : (
            <><CheckCircle size={16} /> Confirmar pedido{orders.length > 1 ? 's' : ''}</>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Paso 3: Confirmación ──────────────────────────────────────────────────────
function StepConfirmation({ orders }) {
  const navigate = useNavigate()

  return (
    <div className="text-center space-y-6 py-4 animate-fade-in">
      {/* Animación de éxito */}
      <div className="relative inline-flex">
        <div className="w-24 h-24 rounded-full bg-state-success/10 flex items-center justify-center">
          <CheckCircle size={48} className="text-state-success" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1">
          <PartyPopper size={22} className="text-brand-gold" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-black text-content-primary mb-2">¡Pedido enviado!</h2>
        <p className="text-content-secondary text-sm max-w-md mx-auto leading-relaxed">
          Tus datos han sido enviados correctamente. El pago será validado por la tienda lo antes posible.
        </p>
      </div>

      {/* Folios generados */}
      <div className="space-y-3 max-w-sm mx-auto">
        {orders.map((order) => (
          <div key={order.id} className="card-base p-4 text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-content-muted">{order.storeName}</span>
              <span className="text-xs text-content-muted">{formatPrice(order.total)}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBag size={14} className="text-brand-gold" />
              <span className="text-sm font-mono font-bold text-brand-gold tracking-wider">{order.folio}</span>
            </div>
            <p className="text-[10px] text-content-muted mt-1">Guarda este folio para rastrear tu pedido</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-content-muted">
        Puedes rastrear el estado de tu pedido en cualquier momento desde la sección de{' '}
        <Link to={ROUTES.ORDERS} className="text-brand-gold hover:underline">Órdenes</Link>.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
        <Link
          to={ROUTES.ORDERS}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-gold text-black font-bold text-sm hover:bg-brand-gold/90 transition-colors"
        >
          Ver mis pedidos
        </Link>
        <Link
          to={ROUTES.CATALOG}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-content-secondary text-sm hover:border-white/20 transition-colors"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}

// ── Página Checkout ───────────────────────────────────────────────────────────
function CheckoutPage() {
  const navigate = useNavigate()
  const { items, itemsByStore, clearCart } = useCartStore()
  const [step, setStep]         = useState(1)
  const [customerData, setCustomerData] = useState(null)
  const [createdOrders, setCreatedOrders] = useState([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  if (items.length === 0 && step < 3) {
    return (
      <div className="container-app py-20 text-center">
        <ShoppingBag size={48} className="text-content-muted mx-auto mb-4" />
        <p className="text-content-primary font-semibold mb-4">Tu carrito está vacío</p>
        <Link to={ROUTES.CART} className="text-brand-gold hover:underline text-sm">← Ir al carrito</Link>
      </div>
    )
  }

  async function handleCustomerDataSubmit(data) {
    setCreating(true)
    setCreateError(null)
    try {
      // Crear una orden por cada tienda en el carrito
      const orders = []
      for (const group of itemsByStore) {
        // Obtener datos bancarios de la tienda
        let bankAccount = null
        try {
          bankAccount = await bankAccountsService.getPublicBankAccount(group.storeId)
        } catch {}

        const order = await ordersService.createOrder({
          storeId:      group.storeId,
          customerData: data,
          items:        group.items,
        })

        orders.push({
          ...order,
          storeName:   group.storeName,
          storeSlug:   group.storeSlug,
          bankAccount,
          storePhone:  null, // se podría enriquecer
          total:       group.subtotal,
        })
      }

      setCustomerData(data)
      setCreatedOrders(orders)
      setStep(2)
    } catch (err) {
      setCreateError(err.message ?? 'Error al crear el pedido')
    } finally {
      setCreating(false)
    }
  }

  function handlePaymentDone() {
    clearCart()
    setStep(3)
  }

  return (
    <div className="container-app py-8 max-w-2xl animate-fade-in">
      {/* Encabezado */}
      <div className="mb-8">
        {step < 3 && (
          <button
            onClick={() => step === 1 ? navigate(ROUTES.CART) : setStep(1)}
            className="flex items-center gap-1.5 text-content-muted hover:text-content-primary text-sm mb-6 transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            {step === 1 ? 'Volver al carrito' : 'Volver a mis datos'}
          </button>
        )}
        <h1 className="text-2xl font-bold text-content-primary">Checkout</h1>
        {step < 3 && (
          <p className="text-content-secondary text-sm mt-1">
            {totalItems} producto{totalItems !== 1 ? 's' : ''} · Total {formatPrice(totalPrice)}
          </p>
        )}
      </div>

      <StepIndicator step={step} labels={['Tus datos', 'Pago', 'Confirmación']} />

      {step === 1 && (
        <>
          {createError && (
            <div className="mb-5 p-3 rounded-xl bg-state-error/10 border border-state-error/20 text-sm text-state-error flex items-center gap-2">
              <AlertCircle size={14} /> {createError}
            </div>
          )}
          {creating ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 size={32} className="animate-spin text-brand-gold" />
              <p className="text-content-secondary text-sm">Creando tu pedido…</p>
            </div>
          ) : (
            <StepCustomerData onNext={handleCustomerDataSubmit} />
          )}
        </>
      )}

      {step === 2 && (
        <StepPayment
          orders={createdOrders}
          customerData={customerData}
          onNext={handlePaymentDone}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && <StepConfirmation orders={createdOrders} />}
    </div>
  )
}

export default CheckoutPage
