import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Package, Eye, Tag } from 'lucide-react'
import { Button, Input, Spinner } from '../../../components/ui'
import VariantsManager from '../../../components/products/VariantsManager'
import { productsService } from '../../../services/productsService'
import { PRODUCT_TEMPLATES, TEMPLATE_OPTIONS } from '../../../templates/productTemplates'
import { ROUTES } from '../../../constants'
import { formatPrice } from '../../../utils/formatters'
import useAuthStore from '../../../store/authStore'
import useUIStore from '../../../store/uiStore'

// ── Validación base ────────────────────────────────────────────────
const baseSchema = z.object({
  name:        z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  price: z.coerce
    .number({ invalid_type_error: 'Ingresa un precio válido' })
    .positive('El precio debe ser mayor a 0')
    .max(999_999.99, 'El precio no puede superar $999,999.99'),
  // stock se calcula automáticamente a partir de las variantes, no se captura en el form
  stock: z.coerce.number().int().min(0).optional().default(0),
  discount_percentage: z.preprocess(
    (v) => (v === '' || v === null || v === undefined || (typeof v === 'number' && isNaN(v)) ? null : Number(v)),
    z.number({ invalid_type_error: 'Ingresa un porcentaje válido' })
      .int('Debe ser un número entero')
      .min(0, 'Mínimo 0%')
      .max(100, 'Máximo 100%')
      .nullable()
  ),
  category:    z.string().min(1, 'Selecciona una categoría'),
  image_url:   z.string().optional().or(z.literal('')),
  is_active:   z.boolean().optional(),
  attributes:  z.record(z.string(), z.any()).optional(),
})

// ── Campo dinámico según plantilla ────────────────────────────────
function TemplateField({ field, register, errors }) {
  const error = errors?.attributes?.[field.key]?.message

  if (field.type === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium text-content-secondary mb-1.5">
          {field.label}
          {field.required && <span className="text-state-error ml-1">*</span>}
        </label>
        <select
          {...register(`attributes.${field.key}`)}
          className="w-full bg-brand-black-card border border-white/10 text-content-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50 transition-colors"
        >
          <option value="">Seleccionar...</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-state-error">{error}</p>}
      </div>
    )
  }

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...register(`attributes.${field.key}`)}
          className="w-4 h-4 rounded border-white/20 bg-brand-black-card accent-brand-gold"
        />
        <span className="text-sm text-content-secondary">{field.label}</span>
      </label>
    )
  }

  return (
    <Input
      label={field.label}
      type={field.type === 'number' ? 'number' : 'text'}
      placeholder={field.placeholder}
      required={field.required}
      error={error}
      {...register(`attributes.${field.key}`, {
        valueAsNumber: field.type === 'number',
      })}
    />
  )
}

// ── Página ─────────────────────────────────────────────────────────
function DashboardProductForm() {
  const { id }      = useParams()
  const isEditing   = !!id
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const { store, profile } = useAuthStore()
  const { addToast }       = useUIStore()
  
  // Estado local para variantes (color + fotos + tallas + stock)
  const [variants, setVariants] = useState([])
  const [uploadProgress, setUploadProgress] = useState(null)

  // Cargar producto si es edición
  // staleTime alto + refetchOnWindowFocus:false para que el refetch en segundo plano
  // NO sobreescriba los cambios que el usuario esté editando en el formulario.
  const {
    data: existing,
    isLoading: loadingProduct,
    isError: errorProduct,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.getOwnerProductById(id),
    enabled: isEditing,
    staleTime: 1000 * 60 * 10,   // 10 min — no refetch mientras se edita
    refetchOnWindowFocus: false,  // evita reset al cambiar de pestaña
  })

  const { register, handleSubmit, control, reset, watch,
    formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: '', description: '', price: undefined,
      discount_percentage: null,
      category: '', is_active: true, attributes: {},
    },
  })

  const selectedCategory    = watch('category')
  const template            = selectedCategory ? PRODUCT_TEMPLATES[selectedCategory] : null
  const watchedPrice        = watch('price')
  const watchedDiscount     = watch('discount_percentage')
  const finalPrice          = watchedPrice && watchedDiscount
    ? watchedPrice * (1 - watchedDiscount / 100)
    : null

  // Precarga en modo edición.
  // IMPORTANTE: solo se ejecuta cuando llegan datos frescos y el form NO ha sido
  // modificado aún (isDirty = false). Así un refetch tardío no borra lo que el
  // usuario ya escribió.
  useEffect(() => {
    if (existing && !isDirty) {
      const existingAttrs = existing.attributes ?? {}
      // Extraer variantes del jsonb (si las hay) y quitar la clave del objeto de atributos generales
      const existingVariants = existingAttrs.variants ?? []
      const { variants: _v, ...otherAttrs } = existingAttrs

      reset({
        name:                existing.name                ?? '',
        description:         existing.description         ?? '',
        price:               parseFloat(existing.price)   || 0,
        stock:               parseInt(existing.stock, 10) || 0,
        discount_percentage: existing.discount_percentage ?? null,
        category:            existing.category            ?? '',
        image_url:           '',
        is_active:           existing.is_active           ?? true,
        attributes:          otherAttrs,
      })

      // Restaurar variantes con sus imágenes como URLs existentes
      if (existingVariants.length > 0) {
        setVariants(
          existingVariants.map((v) => ({
            ...v,
            images: (v.images ?? []).map((url, i) => ({
              id:  `existing-${v.id}-${i}`,
              url,
              preview: url,
            })),
          }))
        )
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  const mutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name:                values.name,
        description:         values.description || null,
        price:               values.price,
        discount_percentage: values.discount_percentage ?? null,
        category:            values.category,
        is_active:           values.is_active ?? true,
        // stock y attributes se calculan del lado del servicio a partir de variants
        attributes:          values.attributes ?? {},
      }
      if (!isEditing) payload.owner_id = profile?.id

      return isEditing
        ? productsService.updateProduct(id, payload, variants, setUploadProgress)
        : productsService.createProduct(store.id, payload, variants, setUploadProgress)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'store', store?.id] })
      queryClient.invalidateQueries({ queryKey: ['store-products', store?.id] })
      if (isEditing) queryClient.invalidateQueries({ queryKey: ['product', id] })
      setUploadProgress(null)
      addToast({
        message: isEditing ? 'Producto actualizado' : '¡Producto publicado!',
        type: 'success',
      })
      navigate(ROUTES.DASHBOARD_PRODUCTS)
    },
    onError: (err) => {
      setUploadProgress(null)
      addToast({ message: err?.message ?? 'Error al guardar el producto', type: 'error' })
    },
  })

  if (isEditing && loadingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" className="text-brand-gold" />
      </div>
    )
  }

  if (isEditing && errorProduct) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="p-3 rounded-full bg-state-error/10">
          <AlertTriangle size={28} className="text-state-error" />
        </div>
        <div>
          <p className="text-content-primary font-medium">No se pudo cargar el producto</p>
          <p className="text-content-secondary text-sm mt-1">
            El producto no existe o no tienes permiso para editarlo.
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate(ROUTES.DASHBOARD_PRODUCTS)}>
          <ArrowLeft size={16} /> Volver a productos
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD_PRODUCTS)}
          className="p-2 rounded-lg text-content-secondary hover:text-content-primary hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          <p className="text-content-secondary mt-0.5 text-sm">
            {isEditing
              ? 'Actualiza la información del producto.'
              : 'Completa los datos y los colores disponibles para publicar.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        {/* ── Grid principal: info izq. | variantes der. ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.55fr] gap-5 items-start">

          {/* ── Columna izquierda ── */}
          <div className="space-y-5">

            {/* Info básica */}
            <div className="card-base p-5 space-y-4">
              <h2 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                <Package size={15} className="text-brand-gold" />
                Información básica
              </h2>

              {/* Categoría — va primero para que el usuario elija antes de rellenar detalles */}
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1.5">
                  Categoría <span className="text-state-error">*</span>
                </label>
                <select
                  {...register('category')}
                  className="w-full bg-brand-black-card border border-white/10 text-content-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50 transition-colors"
                >
                  <option value="">Selecciona una categoría...</option>
                  {TEMPLATE_OPTIONS.map(({ value, label, icon }) => (
                    <option key={value} value={value}>{icon} {label}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-state-error">{errors.category.message}</p>
                )}
              </div>

              <Input
                label="Nombre del producto"
                placeholder="Ej: Tenis Nike Air Max 270"
                required
                error={errors.name?.message}
                {...register('name')}
              />

              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1.5">
                  Descripción <span className="text-content-muted font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Materiales, características principales, uso recomendado..."
                  className="w-full bg-brand-black-card border border-white/10 text-content-primary placeholder-content-muted rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-brand-gold/50 transition-colors"
                  {...register('description')}
                />
              </div>
            </div>

            {/* Precio */}
            <div className="card-base p-5 space-y-4">
              <h2 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                <Tag size={15} className="text-brand-gold" />
                Precio
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Precio (MXN)"
                  type="number"
                  placeholder="0.00"
                  required
                  min="0.01"
                  max="999999.99"
                  step="0.01"
                  error={errors.price?.message}
                  {...register('price', { valueAsNumber: true })}
                />
                <div>
                  <label className="block text-sm font-medium text-content-secondary mb-1.5">
                    Descuento (%) <span className="text-content-muted font-normal">opcional</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="0"
                    className="w-full bg-brand-black-card border border-white/10 text-content-primary placeholder-content-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50 transition-colors"
                    {...register('discount_percentage', { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) })}
                  />
                  {errors.discount_percentage && (
                    <p className="mt-1 text-xs text-state-error">{errors.discount_percentage.message}</p>
                  )}
                </div>
              </div>

              {finalPrice !== null && finalPrice > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-brand-gold/5 border border-brand-gold/20 px-4 py-2.5">
                  <span className="text-xs text-content-muted">Precio final con descuento</span>
                  <span className="text-base font-black text-brand-gold">{formatPrice(finalPrice)}</span>
                </div>
              )}
            </div>

            {/* Detalles específicos de categoría */}
            {template && (
              <div className="card-base p-5 space-y-4">
                <h2 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                  <span className="text-base leading-none">{template.icon}</span>
                  Detalles de {template.label}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {template.fields.map((field) => (
                    <div key={field.key} className={field.type === 'boolean' ? 'sm:col-span-2' : ''}>
                      <TemplateField field={field} register={register} errors={errors} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visibilidad */}
            <div className="card-base p-5">
              <h2 className="text-sm font-semibold text-content-primary mb-3 flex items-center gap-2">
                <Eye size={15} className="text-brand-gold" />
                Visibilidad
              </h2>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input type="checkbox" id="is_active" {...register('is_active')} className="sr-only peer" />
                  <div className="w-10 h-5 rounded-full bg-white/10 peer-checked:bg-brand-gold transition-colors duration-200" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-content-primary">
                    {watch('is_active') ? 'Visible en el catálogo' : 'Oculto al público'}
                  </p>
                  <p className="text-xs text-content-muted mt-0.5">
                    {watch('is_active')
                      ? 'Los clientes podrán encontrar este producto.'
                      : 'No aparecerá en el catálogo ni en búsquedas.'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* ── Columna derecha: variantes ── */}
          <div className="space-y-5">
            <VariantsManager
              category={selectedCategory}
              variants={variants}
              onChange={setVariants}
              disabled={mutation.isPending}
            />

            {/* Progreso de subida */}
            {uploadProgress && (
              <div className="card-base p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-content-secondary">Subiendo imágenes...</span>
                  <span className="text-brand-gold font-medium">
                    {uploadProgress.current} / {uploadProgress.total}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-gold transition-all duration-300"
                    style={{ width: `${uploadProgress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Botones (full width) ── */}
        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-white/5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(ROUTES.DASHBOARD_PRODUCTS)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
          >
            <Save size={16} />
            {isEditing ? 'Guardar cambios' : 'Publicar producto'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default DashboardProductForm
