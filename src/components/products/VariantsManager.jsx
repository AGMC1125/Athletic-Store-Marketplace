/**
 * VariantsManager.jsx
 * Gestiona las variantes de color + tallas + stock + fotos por color.
 * Cada variante tiene hasta MAX_IMAGES_PER_VARIANT fotos (plan gratuito).
 *
 * Estructura de cada variante en el estado local:
 * {
 *   id: string,            // e.g. "v-1720000000000"
 *   colorLabel: string,    // "Negro"
 *   colorHex: string,      // "#111111"
 *   images: [              // máx. MAX_IMAGES_PER_VARIANT
 *     { id, file?, url, preview? }
 *   ],
 *   sizes: { "24": 5, "24.5": 3 }   // talla → stock
 * }
 */

import { useState, useCallback, useId } from 'react'
import {
  Plus, X, Trash2, ChevronDown, ChevronUp,
  Upload, Image as ImageIcon, AlertTriangle,
} from 'lucide-react'
import { COMMON_COLORS, VARIANT_TEMPLATES, MAX_IMAGES_PER_VARIANT } from '../../constants'

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatSizeDisplay(size, sizeLabel = '') {
  return sizeLabel.includes('cm') ? `${size} cm` : size
}

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

// ─── ColorPicker ──────────────────────────────────────────────────────────────

function ColorPicker({ usedColors, onAdd, onClose }) {
  const [custom, setCustom] = useState({ label: '', hex: '#ffffff' })
  const available = COMMON_COLORS.filter((c) => !usedColors.includes(c.label))

  return (
    <div className="absolute top-full left-0 mt-2 z-30 bg-brand-black-card border border-white/15 rounded-xl p-4 shadow-2xl min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-content-muted uppercase tracking-widest">
          Seleccionar color
        </span>
        <button type="button" onClick={onClose} className="text-content-muted hover:text-content-primary transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {available.map((c) => (
          <button
            key={c.label}
            type="button"
            title={c.label}
            onClick={() => { onAdd(c.label, c.hex); onClose() }}
            className="w-8 h-8 rounded-full border-2 border-white/10 hover:border-brand-gold hover:scale-110 transition-all duration-150"
            style={{ backgroundColor: c.hex }}
          />
        ))}
        {available.length === 0 && (
          <p className="text-xs text-content-muted py-1">
            Ya usaste todos los colores predefinidos.
          </p>
        )}
      </div>

      <div className="border-t border-white/10 pt-3 space-y-2">
        <p className="text-[10px] text-content-muted uppercase tracking-widest">Color personalizado</p>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={custom.hex}
            onChange={(e) => setCustom((p) => ({ ...p, hex: e.target.value }))}
            className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={custom.label}
            onChange={(e) => setCustom((p) => ({ ...p, label: e.target.value }))}
            placeholder="Nombre del color"
            className="flex-1 px-3 py-2 text-xs bg-brand-black-soft border border-white/10 rounded-lg text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand-gold/50"
          />
          <button
            type="button"
            onClick={() => {
              if (!custom.label.trim()) return
              onAdd(custom.label.trim(), custom.hex)
              onClose()
            }}
            className="px-3 py-2 text-xs font-bold bg-brand-gold text-black rounded-lg hover:bg-brand-gold/90 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── VariantImageSlot ─────────────────────────────────────────────────────────

function VariantImageSlot({ image, slotIndex, variantIndex, onAdd, onRemove, disabled }) {
  const inputId = `vi-${variantIndex}-${slotIndex}`

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    onAdd({ id: `vimg-${Date.now()}`, file, url: preview, preview })
    // reset input so same file can be re-selected after removal
    e.target.value = ''
  }

  if (image) {
    return (
      <div className="relative aspect-square rounded-xl overflow-hidden bg-brand-black-soft border border-white/10 group">
        <img
          src={image.preview ?? image.url}
          alt=""
          className="w-full h-full object-contain p-1"
        />
        {!disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <X size={12} />
          </button>
        )}
        {slotIndex === 0 && (
          <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-brand-gold text-black px-1.5 py-0.5 rounded">
            Principal
          </span>
        )}
      </div>
    )
  }

  return (
    <label
      htmlFor={inputId}
      className={`aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-brand-gold/40 hover:bg-white/5 transition-all ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFile}
        disabled={disabled}
        className="hidden"
      />
      <Upload size={14} className="text-content-muted" />
      <span className="text-[10px] text-content-muted">{slotIndex === 0 ? 'Principal' : `Foto ${slotIndex + 1}`}</span>
    </label>
  )
}

// ─── VariantCard ──────────────────────────────────────────────────────────────

function VariantCard({ variant, availableSizes, sizeLabel, onUpdate, onRemove, variantIndex, disabled }) {
  const [expanded, setExpanded] = useState(true)

  const enabledSizes = Object.keys(variant.sizes)
  const totalStock   = Object.values(variant.sizes).reduce((s, q) => s + (parseInt(q) || 0), 0)
  const dark  = isVeryDark(variant.colorHex)
  const light = isVeryLight(variant.colorHex)

  // --- Image helpers ---
  const handleAddImage = useCallback((img) => {
    if (variant.images.length >= MAX_IMAGES_PER_VARIANT) return
    onUpdate({ ...variant, images: [...variant.images, img] })
  }, [variant, onUpdate])

  const handleRemoveImage = useCallback((idx) => {
    const next = variant.images.filter((_, i) => i !== idx)
    onUpdate({ ...variant, images: next })
  }, [variant, onUpdate])

  // --- Size helpers ---
  const toggleSize = (size) => {
    const next = { ...variant.sizes }
    if (size in next) { delete next[size] } else { next[size] = 0 }
    onUpdate({ ...variant, sizes: next })
  }

  const setQty = (size, val) => {
    const qty = Math.max(0, parseInt(val) || 0)
    onUpdate({ ...variant, sizes: { ...variant.sizes, [size]: qty } })
  }

  const selectAll = () => {
    const next = {}
    availableSizes.forEach((s) => { next[s] = variant.sizes[s] ?? 0 })
    onUpdate({ ...variant, sizes: next })
  }

  const clearAll = () => onUpdate({ ...variant, sizes: {} })

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white/5">
        <div
          className="w-5 h-5 rounded-full shrink-0 border-2"
          style={{
            backgroundColor: variant.colorHex,
            borderColor: dark ? 'rgba(255,255,255,0.2)' : light ? 'rgba(0,0,0,0.15)' : 'transparent',
          }}
        />
        <span className="font-semibold text-sm text-content-primary flex-1 truncate">
          {variant.colorLabel}
        </span>
        <span className="text-xs text-content-muted whitespace-nowrap">
          {variant.images.length} foto{variant.images.length !== 1 ? 's' : ''}
          {' · '}
          {enabledSizes.length} talla{enabledSizes.length !== 1 ? 's' : ''}
          {' · '}
          <span className={totalStock > 0 ? 'text-content-primary' : 'text-content-muted'}>
            {totalStock} uds
          </span>
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-content-muted hover:text-content-primary transition-colors"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          title="Eliminar color"
          className="text-content-muted hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-5">
          {/* Imágenes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-content-muted uppercase tracking-widest">
                Fotos ({variant.images.length}/{MAX_IMAGES_PER_VARIANT})
              </span>
              {variant.images.length === 0 && (
                <span className="text-[10px] text-content-muted">La primera foto es la principal</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: MAX_IMAGES_PER_VARIANT }).map((_, i) => (
                <VariantImageSlot
                  key={i}
                  slotIndex={i}
                  variantIndex={variantIndex}
                  image={variant.images[i] ?? null}
                  onAdd={handleAddImage}
                  onRemove={() => handleRemoveImage(i)}
                  disabled={disabled}
                />
              ))}
            </div>
            {variant.images.length === 0 && (
              <p className="text-xs text-amber-400 flex items-center gap-1 mt-2">
                <AlertTriangle size={12} />
                Agrega al menos una foto para este color
              </p>
            )}
          </div>

          {/* Tallas */}
          {availableSizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-semibold text-content-muted uppercase tracking-widest">
                  {sizeLabel} disponibles
                </span>
                <div className="flex gap-3">
                  <button type="button" onClick={selectAll} className="text-[10px] text-brand-gold hover:underline">
                    Todas
                  </button>
                  <button type="button" onClick={clearAll} className="text-[10px] text-content-muted hover:underline">
                    Ninguna
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableSizes.map((size) => {
                  const active = size in variant.sizes
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                        active
                          ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                          : 'border-white/10 text-content-muted hover:border-white/25 hover:text-content-primary'
                      }`}
                    >
                      {formatSizeDisplay(size, sizeLabel)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stock por talla */}
          {enabledSizes.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold text-content-muted uppercase tracking-widest block mb-3">
                Stock por talla
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableSizes.filter((s) => s in variant.sizes).map((size) => (
                  <div key={size} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-content-primary w-12 shrink-0">
                      {formatSizeDisplay(size, sizeLabel)}
                    </span>
                    <div className="flex items-center border border-white/10 rounded-lg overflow-hidden flex-1 bg-brand-black-soft">
                      <button
                        type="button"
                        onClick={() => setQty(size, (variant.sizes[size] || 0) - 1)}
                        className="px-2 py-1.5 text-content-muted hover:text-white text-sm font-bold leading-none transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={variant.sizes[size] ?? 0}
                        onChange={(e) => setQty(size, e.target.value)}
                        className="flex-1 text-center text-sm text-content-primary bg-transparent py-1.5 focus:outline-none min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => setQty(size, (variant.sizes[size] || 0) + 1)}
                        className="px-2 py-1.5 text-content-muted hover:text-white text-sm font-bold leading-none transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enabledSizes.length === 0 && availableSizes.length > 0 && (
            <p className="text-xs text-content-muted flex items-center gap-1.5">
              <AlertTriangle size={12} />
              Activa al menos una talla para ingresar stock.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── VariantsManager (main export) ───────────────────────────────────────────

/**
 * @param {string} category - product category key (e.g. 'footwear')
 * @param {Array}  variants  - variant array (see file header for shape)
 * @param {Function} onChange - called with updated variants array
 * @param {boolean}  disabled
 */
export default function VariantsManager({ category, variants = [], onChange, disabled = false }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const tpl        = VARIANT_TEMPLATES[category] ?? null
  const usedColors = variants.map((v) => v.colorLabel)
  const totalStock = variants.reduce(
    (sum, v) => sum + Object.values(v.sizes).reduce((s, q) => s + (parseInt(q) || 0), 0),
    0
  )

  const addVariant = useCallback((colorLabel, colorHex) => {
    onChange([...variants, {
      id:         `v-${Date.now()}`,
      colorLabel,
      colorHex,
      images:     [],
      sizes:      {},
    }])
  }, [variants, onChange])

  const updateVariant = useCallback((id, updated) => {
    onChange(variants.map((v) => (v.id === id ? updated : v)))
  }, [variants, onChange])

  const removeVariant = useCallback((id) => {
    onChange(variants.filter((v) => v.id !== id))
  }, [variants, onChange])

  if (!tpl) {
    return (
      <div className="card-base p-5">
        <p className="text-sm text-content-muted text-center py-4">
          Selecciona una categoría para configurar colores y tallas.
        </p>
      </div>
    )
  }

  return (
    <div className="card-base p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-content-primary flex items-center gap-2">
            <ImageIcon size={15} className="text-brand-gold" />
            Colores, fotos y tallas
          </h2>
          {variants.length > 0 && (
            <p className="text-xs text-content-muted mt-1">
              {variants.length} color{variants.length !== 1 ? 'es' : ''}
              {' · '}
              <span className="text-brand-gold font-semibold">{totalStock} unidades en total</span>
            </p>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 rounded-xl transition-colors disabled:opacity-50"
          >
            <Plus size={13} />
            Agregar color
          </button>
          {pickerOpen && (
            <ColorPicker
              usedColors={usedColors}
              onAdd={addVariant}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Limit note */}
      <p className="text-[11px] text-content-muted bg-white/5 rounded-lg px-3 py-2">
        Plan gratuito: hasta <strong className="text-content-secondary">{MAX_IMAGES_PER_VARIANT} fotos</strong> por color.
        Cada color tiene sus propias fotos, tallas y stock.
      </p>

      {/* Variant list */}
      {variants.length === 0 ? (
        <div
          className="border-2 border-dashed border-white/10 rounded-xl py-10 text-center cursor-pointer hover:border-brand-gold/30 transition-colors"
          onClick={() => !disabled && setPickerOpen(true)}
        >
          <p className="text-sm text-content-muted">
            Agrega al menos un color para definir tallas y fotos.
          </p>
          <p className="text-xs text-brand-gold mt-1 font-medium">+ Agregar primer color</p>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((v, i) => (
            <VariantCard
              key={v.id}
              variant={v}
              variantIndex={i}
              availableSizes={tpl.sizes}
              sizeLabel={tpl.sizeLabel}
              onUpdate={(updated) => updateVariant(v.id, updated)}
              onRemove={() => removeVariant(v.id)}
              disabled={disabled}
            />
          ))}

          {/* Color principal del catálogo */}
          {variants.length > 1 && (
            <div className="flex items-center gap-3 pt-1 px-1">
              <span className="text-xs text-content-muted whitespace-nowrap shrink-0">
                Color en catálogo:
              </span>
              <div className="flex gap-2 flex-wrap">
                {variants.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      if (i === 0) return
                      const next = [...variants]
                      const [moved] = next.splice(i, 1)
                      next.unshift(moved)
                      onChange(next)
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                      i === 0
                        ? 'border-brand-gold bg-brand-gold/10 text-brand-gold font-semibold'
                        : 'border-white/10 text-content-muted hover:border-white/25 hover:text-content-primary'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-white/10"
                      style={{ backgroundColor: v.colorHex }}
                    />
                    {v.colorLabel}
                    {i === 0 && <span className="ml-0.5">★</span>}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-content-muted">
                (el marcado aparecerá primero en el catálogo)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
