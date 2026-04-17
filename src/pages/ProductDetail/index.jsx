import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Package, Store, MapPin, Phone,
  MessageCircle, Tag, AlertTriangle, Landmark,
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  BadgeCheck, ExternalLink,
} from 'lucide-react'
import { Badge, Spinner } from '../../components/ui'
import { productsService } from '../../services/productsService'
import { bankAccountsService } from '../../services/bankAccountsService'
import { getOptimizedUrl } from '../../lib/cloudinary'
import { ROUTES, CATEGORY_LABELS, CATEGORY_ICONS, VARIANT_TEMPLATES } from '../../constants'
import { formatPrice } from '../../utils/formatters'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isVeryDark(hex = '') {
  if (!hex || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b < 60
}

function isVeryLight(hex = '') {
  if (!hex || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 200
}

function formatSizeDisplay(size, sizeLabel = '') {
  return sizeLabel.includes('cm') ? `${size} cm` : size
}

// ── ATTR_LABELS ───────────────────────────────────────────────────────────────

const ATTR_LABELS = {
  brand:                'Marca',
  model:                'Modelo',
  sport:                'Deporte',
  sport_type:           'Tipo de deporte',
  material:             'Material',
  gender:               'Género',
  sole_type:            'Tipo de suela',
  thickness:            'Grosor',
  length:               'Longitud',
  has_ankle:            'Tobillera',
  has_ankle_support:    'Soporte de tobillo',
  protection_level:     'Nivel de protección',
  fit:                  'Ajuste',
  grip_type:            'Tipo de agarre',
  has_finger_protection:'Protección de dedos',
  cut:                  'Corte',
  closure:              'Cierre',
  pack:                 'Presentación',
}

const SPORT_TYPE_LABELS = {
  running:    'Running',
  football:   'Fútbol',
  basketball: 'Básquetbol',
  training:   'Entrenamiento',
  casual:     'Casual deportivo',
  other:      'Otro',
}

const CUT_LABELS = {
  flat:     'Plano',
  negative: 'Negativo',
  roll:     'Roll Finger',
  hybrid:   'Híbrido',
}

function formatAttrValue(key, value) {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (key === 'sport_type') return SPORT_TYPE_LABELS[value] ?? value
  if (key === 'cut')        return CUT_LABELS[value] ?? value
  return String(value)
}

// ── AttributeGrid ─────────────────────────────────────────────────────────────

function AttributeGrid({ attributes }) {
  const entries = Object.entries(attributes)
    .filter(([key, v]) => key !== 'variants' && v !== null && v !== undefined && v !== '')
  if (entries.length === 0) return null

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-content-muted mb-3 flex items-center gap-2">
        <Tag size={12} />
        Especificaciones
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3.5 py-2.5">
            <p className="text-[10px] text-content-muted uppercase tracking-wider mb-0.5">
              {ATTR_LABELS[key] ?? key.replace(/_/g, ' ')}
            </p>
            <p className="text-sm text-content-primary font-medium">
              {formatAttrValue(key, value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ImageGallery ──────────────────────────────────────────────────────────────

function ImageGallery({ images, productName }) {
  const [selected, setSelected] = useState(0)

  useEffect(() => { setSelected(0) }, [images])

  const prev = () => setSelected((i) => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setSelected((i) => (i === images.length - 1 ? 0 : i + 1))

  const main = images[selected]

  if (!images.length) {
    return (
      <div className="aspect-[4/5] rounded-2xl bg-brand-black-soft border border-white/5 flex items-center justify-center text-content-muted">
        <Package size={64} />
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      {/* Miniaturas verticales (solo en desktop si hay más de 1) */}
      {images.length > 1 && (
        <div className="hidden sm:flex flex-col gap-2 shrink-0">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-[68px] h-[68px] rounded-xl overflow-hidden border-2 transition-all ${
                i === selected
                  ? 'border-brand-gold shadow-[0_0_0_1px_rgba(212,175,55,0.35)]'
                  : 'border-white/8 opacity-45 hover:opacity-70 hover:border-white/20'
              }`}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-contain p-1.5 bg-brand-black-soft"
              />
            </button>
          ))}
        </div>
      )}

      {/* Imagen principal */}
      <div className="flex-1 flex flex-col gap-2.5">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-brand-black-soft border border-white/5 group">
          <img
            key={main}
            src={main}
            alt={`${productName} — foto ${selected + 1}`}
            className="w-full h-full object-contain p-6"
            style={{ animation: 'fadeIn 0.18s ease' }}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/55 text-white hover:bg-black/75 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Foto anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/55 text-white hover:bg-black/75 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Foto siguiente"
              >
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 text-xs text-white/80 font-medium tabular-nums">
                {selected + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Miniaturas móvil horizontal */}
        {images.length > 1 && (
          <div className="flex sm:hidden gap-2 overflow-x-auto pb-0.5">
            {images.map((url, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  i === selected
                    ? 'border-brand-gold'
                    : 'border-white/8 opacity-45 hover:opacity-70'
                }`}
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-contain p-1 bg-brand-black-soft"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:.55}to{opacity:1}}`}</style>
    </div>
  )
}

// ── ColorSelector ─────────────────────────────────────────────────────────────

function ColorSelector({ variants, selected, onSelect }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-content-muted uppercase tracking-widest">Color</span>
        {selected && (
          <span className="text-xs text-content-secondary">— {selected}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5">
        {variants.map(({ colorLabel, colorHex }) => {
          const isSelected = selected === colorLabel
          const dark  = isVeryDark(colorHex)
          const light = isVeryLight(colorHex)

          return (
            <button
              key={colorLabel}
              onClick={() => onSelect(isSelected ? null : colorLabel)}
              title={colorLabel}
              className={`w-8 h-8 rounded-full transition-all duration-200 ${
                isSelected ? 'scale-110' : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: colorHex,
                boxShadow: isSelected
                  ? '0 0 0 2.5px #0A0A0A, 0 0 0 4.5px #D4AF37'
                  : `0 0 0 1.5px rgba(255,255,255,${dark ? '0.22' : light ? '0.40' : '0.12'})`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── SizeSelector ──────────────────────────────────────────────────────────────

function SizeSelector({ availableSizes, sizesWithStock, sizeLabel, selected, onSelect }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-content-muted uppercase tracking-widest">
          {sizeLabel}
        </span>
        {selected && (
          <span className="text-xs text-content-secondary">— {formatSizeDisplay(selected, sizeLabel)}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {availableSizes.map((size) => {
          const stock   = sizesWithStock[size] ?? 0
          const inStock = stock > 0
          const isSel   = selected === size

          return (
            <button
              key={size}
              onClick={() => inStock && onSelect(isSel ? null : size)}
              disabled={!inStock}
              title={!inStock ? 'Sin stock' : undefined}
              className={`relative min-w-[44px] px-3 py-2 text-sm font-semibold border rounded-xl transition-all duration-150 ${
                isSel
                  ? 'border-brand-gold bg-brand-gold/10 text-brand-gold shadow-[0_0_0_1px_rgba(212,175,55,0.35)]'
                  : inStock
                    ? 'border-white/12 text-content-secondary hover:border-white/30 hover:text-content-primary cursor-pointer'
                    : 'border-white/8 text-content-muted opacity-35 cursor-not-allowed overflow-hidden'
              }`}
            >
              {formatSizeDisplay(size, sizeLabel)}
              {!inStock && (
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="w-full h-px bg-content-muted opacity-50 block" style={{ transform: 'rotate(-35deg) scaleX(1.4)' }} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── StockIndicator ────────────────────────────────────────────────────────────

function StockIndicator({ stock, colorSelected, sizeSelected, hasColors }) {
  if (hasColors && !colorSelected) {
    return <p className="text-xs text-content-muted italic">← Selecciona un color para continuar</p>
  }
  if (colorSelected && !sizeSelected) {
    return <p className="text-xs text-content-muted italic">← Selecciona una talla para ver disponibilidad</p>
  }
  if (stock === null) return null

  if (stock === 0) {
    return (
      <div className="flex items-center gap-2 text-state-error">
        <AlertCircle size={13} />
        <span className="text-xs font-semibold">Sin stock para esta combinación</span>
      </div>
    )
  }
  if (stock <= 3) {
    return (
      <div className="flex items-center gap-2 text-amber-400">
        <AlertCircle size={13} />
        <span className="text-xs font-semibold">
          {stock === 1 ? 'Última unidad disponible' : `Últimas ${stock} unidades`}
        </span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-state-success">
      <CheckCircle size={13} />
      <span className="text-xs font-semibold">{stock} unidades disponibles</span>
    </div>
  )
}

// ── WhatsAppCTA ───────────────────────────────────────────────────────────────

function WhatsAppCTA({ store, productName, selectedColor, selectedSize, disabled }) {
  const colorPart   = selectedColor ? `, color ${selectedColor}` : ''
  const sizePart    = selectedSize  ? `, talla ${selectedSize}` : ''
  const whatsappMsg = encodeURIComponent(
    `Hola, vi "${productName}"${colorPart}${sizePart} en Athletic Store Marketplace y me interesa. ¿Tienen disponibilidad?`
  )
  const phone       = store.phone?.replace(/\D/g, '')
  const whatsappUrl = phone ? `https://wa.me/52${phone}?text=${whatsappMsg}` : null

  if (!whatsappUrl) return null

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-bold text-base tracking-wide transition-all active:scale-[0.98] ${
        disabled
          ? 'bg-[#25D366]/40 text-white/50 pointer-events-none cursor-not-allowed'
          : 'bg-[#25D366] hover:bg-[#1da851] text-white shadow-[0_4px_24px_rgba(37,211,102,0.25)] hover:shadow-[0_6px_28px_rgba(37,211,102,0.35)]'
      }`}
    >
      <MessageCircle size={20} />
      Consultar disponibilidad
    </a>
  )
}

// ── StoreCard ─────────────────────────────────────────────────────────────────

function StoreCard({ store }) {
  return (
    <div className="flex items-center gap-3">
      {store.logo_url ? (
        <img
          src={getOptimizedUrl(store.logo_url, { width: 48, height: 48 })}
          alt={store.name}
          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/8"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-brand-gold/8 border border-brand-gold/15 flex items-center justify-center shrink-0">
          <Store size={20} className="text-brand-gold" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            to={ROUTES.STORE.replace(':slug', store.slug)}
            className="text-sm font-semibold text-content-primary hover:text-brand-gold transition-colors truncate"
          >
            {store.name}
          </Link>
          {store.plan === 'basic' && (
            <BadgeCheck size={14} className="text-brand-gold shrink-0" />
          )}
        </div>
        {(store.city || store.state) && (
          <p className="text-xs text-content-muted flex items-center gap-1 mt-0.5">
            <MapPin size={10} className="shrink-0" />
            {[store.city, store.state].filter(Boolean).join(', ')}
          </p>
        )}
      </div>
      <Link
        to={ROUTES.STORE.replace(':slug', store.slug)}
        className="shrink-0 inline-flex items-center gap-1 text-xs text-content-muted hover:text-brand-gold transition-colors"
      >
        Ver tienda
        <ExternalLink size={11} />
      </Link>
    </div>
  )
}

// ── BankTransfer ──────────────────────────────────────────────────────────────

function BankTransfer({ bankAccount }) {
  const formatClabe = (clabe) => {
    if (!clabe || clabe.length !== 18) return clabe
    return `${'•'.repeat(14)}${clabe.slice(-4)}`
  }

  return (
    <div className="rounded-2xl border border-brand-gold/15 bg-brand-gold/[0.03] p-4 space-y-2.5">
      <div className="flex items-center gap-2 mb-1">
        <Landmark size={14} className="text-brand-gold" />
        <p className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Pago por transferencia
        </p>
      </div>
      <div className="space-y-1.5 text-sm">
        {[
          ['Banco',    bankAccount.bank_name],
          ['Titular',  bankAccount.holder_name],
          ['CLABE',    formatClabe(bankAccount.clabe)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-content-muted text-xs">{label}</span>
            <span className="text-content-primary font-medium font-mono text-xs tracking-wider">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-content-muted pt-0.5">
        Envía tu comprobante de pago por WhatsApp para confirmar tu pedido.
      </p>
    </div>
  )
}

// ── PhoneButton ───────────────────────────────────────────────────────────────

function PhoneButton({ phone }) {
  return (
    <a
      href={`tel:${phone}`}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-white/10 text-content-secondary text-sm font-medium hover:border-white/20 hover:text-content-primary active:scale-[0.98] transition-all"
    >
      <Phone size={15} />
      {phone}
    </a>
  )
}

// ── Separator ─────────────────────────────────────────────────────────────────

function Sep() {
  return <div className="h-px bg-white/[0.06]" />
}

// ── Página principal ──────────────────────────────────────────────────────────

function ProductDetailPage() {
  const { id } = useParams()

  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize,  setSelectedSize]  = useState(null)

  const handleColorSelect = (color) => {
    setSelectedColor(color)
    setSelectedSize(null)
  }

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', 'public', id],
    queryFn:  () => productsService.getProductById(id),
    staleTime: 1000 * 60 * 5,
    enabled:  !!id,
  })

  const storeId = product?.stores?.id
  const { data: bankAccount } = useQuery({
    queryKey: ['bank-account', 'public', storeId],
    queryFn:  () => bankAccountsService.getPublicBankAccount(storeId),
    staleTime: 1000 * 60 * 10,
    enabled:  !!storeId,
  })

  // Auto-select first color once product loads
  useEffect(() => {
    if (!product) return
    const variants = product.attributes?.variants ?? []
    if (variants.length > 0) {
      setSelectedColor(variants[0].colorLabel)
    }
  }, [product])

  // ── Derived data (before early returns — Rules of Hooks) ─────────────────

  const variants      = product?.attributes?.variants ?? []
  const hasVariants   = variants.length > 0
  const hasColors     = variants.length > 1 ||
    (variants.length === 1 && variants[0].colorLabel !== 'Único')

  const selectedVariant = useMemo(
    () => variants.find((v) => v.colorLabel === selectedColor) ?? null,
    [variants, selectedColor]
  )

  const galleryImages = useMemo(() => {
    if (!product) return []
    if (selectedVariant) {
      return (selectedVariant.images ?? []).map((url) =>
        getOptimizedUrl(url, { width: 800, height: 800 })
      )
    }
    const allVariantImages = variants.flatMap((v) => v.images ?? [])
    if (allVariantImages.length > 0) {
      return allVariantImages.map((url) => getOptimizedUrl(url, { width: 800, height: 800 }))
    }
    const raw = Array.isArray(product.image_url)
      ? product.image_url
      : product.image_url ? [product.image_url] : []
    return raw.map((url) => getOptimizedUrl(url, { width: 800, height: 800 }))
  }, [product, selectedVariant, variants])

  const tpl            = VARIANT_TEMPLATES[product?.category] ?? null
  const sizeLabel      = tpl?.sizeLabel ?? 'Talla'
  const availableSizes = selectedVariant ? Object.keys(selectedVariant.sizes) : (tpl?.sizes ?? [])
  const sizesWithStock = selectedVariant?.sizes ?? {}

  const currentStock = hasVariants && selectedColor && selectedSize
    ? (sizesWithStock[selectedSize] ?? 0)
    : null

  const discountPercentage = product?.discount_percentage
  const basePrice          = product ? parseFloat(product.price) : 0
  const finalPriceNum      = discountPercentage
    ? basePrice * (1 - discountPercentage / 100)
    : basePrice
  const savings            = discountPercentage ? basePrice - finalPriceNum : 0

  // CTA disabled if has variants but no complete selection
  const ctaDisabled = hasVariants && (!selectedColor || !selectedSize)

  // ── Early returns ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="container-app py-24 flex justify-center">
        <Spinner size="lg" className="text-brand-gold" />
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="container-app py-24 text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-state-error/10 mb-2">
          <AlertTriangle size={32} className="text-state-error" />
        </div>
        <p className="text-content-primary font-semibold">Producto no encontrado</p>
        <p className="text-content-secondary text-sm">
          Este producto no existe o ya no está disponible.
        </p>
        <Link
          to={ROUTES.CATALOG}
          className="inline-flex items-center gap-2 text-brand-gold hover:underline text-sm mt-2"
        >
          <ArrowLeft size={14} /> Volver al catálogo
        </Link>
      </div>
    )
  }

  const store        = product.stores
  const CategoryIcon = CATEGORY_ICONS[product.category]

  return (
    <div className="container-app py-8 animate-fade-in">

      {/* Breadcrumb */}
      <Link
        to={ROUTES.CATALOG}
        className="inline-flex items-center gap-2 text-content-muted hover:text-brand-gold text-sm mb-8 transition-colors group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Catálogo
      </Link>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_480px] gap-10 lg:gap-14 items-start">

        {/* ── Columna izquierda: Galería ─────────────────────────────────── */}
        <div>
          <ImageGallery images={galleryImages} productName={product.name} />
        </div>

        {/* ── Columna derecha: Info + acciones (sticky) ─────────────────── */}
        <div className="lg:sticky lg:top-24 space-y-5">

          {/* ── 1. Categoría, nombre y precio ── */}
          <div className="space-y-3">
            {/* Badges de categoría + descuento */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="gray" className="inline-flex items-center gap-1.5">
                {CategoryIcon && <CategoryIcon size={12} />}
                {CATEGORY_LABELS[product.category] ?? product.category}
              </Badge>
              {discountPercentage > 0 && (
                <Badge variant="gold" className="font-bold">
                  −{discountPercentage}%
                </Badge>
              )}
            </div>

            {/* Nombre */}
            <h1 className="text-2xl sm:text-3xl font-bold text-content-primary leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Bloque de precio */}
            <div className="flex items-end gap-3 pt-1">
              <p className="text-4xl font-black text-brand-gold leading-none">
                {formatPrice(finalPriceNum)}
              </p>
              {discountPercentage > 0 && (
                <div className="flex flex-col items-start">
                  <p className="text-base text-content-muted line-through leading-none">
                    {formatPrice(basePrice)}
                  </p>
                  <p className="text-xs text-state-success font-semibold mt-0.5">
                    Ahorras {formatPrice(savings)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Sep />

          {/* ── 2. Selectores de variante ── */}
          {hasVariants ? (
            <div className="space-y-5">
              {hasColors && (
                <ColorSelector
                  variants={variants}
                  selected={selectedColor}
                  onSelect={handleColorSelect}
                />
              )}

              {selectedVariant && availableSizes.length > 0 && (
                <SizeSelector
                  availableSizes={availableSizes}
                  sizesWithStock={sizesWithStock}
                  sizeLabel={sizeLabel}
                  selected={selectedSize}
                  onSelect={setSelectedSize}
                />
              )}

              <StockIndicator
                stock={currentStock}
                colorSelected={selectedColor}
                sizeSelected={selectedSize}
                hasColors={hasColors}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${product.stock > 0 ? 'bg-state-success' : 'bg-state-error'}`} />
              <span className="text-sm text-content-secondary">
                {product.stock > 0
                  ? `${product.stock} unidad${product.stock !== 1 ? 'es' : ''} disponible${product.stock !== 1 ? 's' : ''}`
                  : 'Sin existencias'}
              </span>
            </div>
          )}

          {/* ── 3. CTA principal ── */}
          {store && (
            <WhatsAppCTA
              store={store}
              productName={product.name}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              disabled={ctaDisabled}
            />
          )}

          {/* Teléfono alternativo */}
          {store?.phone && <PhoneButton phone={store.phone} />}

          <Sep />

          {/* ── 4. Descripción ── */}
          {product.description && (
            <>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-content-muted mb-2.5">
                  Descripción
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {product.description}
                </p>
              </div>
              <Sep />
            </>
          )}

          {/* ── 5. Atributos del producto ── */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <>
              <AttributeGrid attributes={product.attributes} />
              <Sep />
            </>
          )}

          {/* ── 6. Tienda ── */}
          {store && (
            <>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-content-muted">
                  Vendido por
                </h3>
                <StoreCard store={store} />
              </div>
              <Sep />
            </>
          )}

          {/* ── 7. Pago por transferencia ── */}
          {bankAccount && (
            <BankTransfer bankAccount={bankAccount} />
          )}

        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage
