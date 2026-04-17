import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Store, ExternalLink, Save, MapPin, Phone, Image as ImageIcon,
  AlertCircle, CheckCircle2, Info, Building2, MapPinned, Eye,
  Instagram, Facebook, Youtube, Twitter, Globe, Music2, Share2
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, ImageUpload } from '../../../components/ui'
import { storesService } from '../../../services/storesService'
import useAuthStore from '../../../store/authStore'
import useUIStore from '../../../store/uiStore'
import { ROUTES } from '../../../constants'

// Esquema de validación mejorado
const schema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(60, 'El nombre no puede exceder 60 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s0-9&'".,-]+$/, 'Solo letras, números y caracteres básicos'),
  description: z.string()
    .max(300, 'La descripción no puede exceder 300 caracteres')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^[\d\s()+-]*$/, 'Solo números, espacios y caracteres ()+-')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  address: z.string()
    .max(150, 'La dirección no puede exceder 150 caracteres')
    .optional()
    .or(z.literal('')),
  city: z.string()
    .max(60, 'La ciudad no puede exceder 60 caracteres')
    .optional()
    .or(z.literal('')),
  state: z.string()
    .max(60, 'El estado no puede exceder 60 caracteres')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .max(60, 'El país no puede exceder 60 caracteres')
    .optional()
    .or(z.literal('')),
  logo_url:   z.string().optional().or(z.literal('')),
  banner_url:  z.string().optional().or(z.literal('')),
  is_active:  z.boolean().optional(),
  social_links: z.object({
    instagram: z.string().optional().or(z.literal('')),
    facebook:  z.string().optional().or(z.literal('')),
    tiktok:    z.string().optional().or(z.literal('')),
    youtube:   z.string().optional().or(z.literal('')),
    twitter:   z.string().optional().or(z.literal('')),
    website:   z.string().optional().or(z.literal('')),
  }).optional(),
})

/**
 * Alert component for validation feedback
 */
function Alert({ variant = 'info', icon: Icon, title, children, className = '' }) {
  const variants = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
  }

  return (
    <div className={`rounded-xl border p-4 ${variants[variant]} ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && <Icon size={20} className="flex-shrink-0 mt-0.5" />}
        <div className="flex-1 space-y-1">
          {title && <p className="font-semibold text-sm">{title}</p>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  )
}

// Redes sociales soportadas
const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'Instagram', Icon: Instagram, placeholder: 'https://instagram.com/tu_tienda',  color: '#E1306C' },
  { key: 'facebook',  label: 'Facebook',  Icon: Facebook,  placeholder: 'https://facebook.com/tu_tienda',  color: '#1877F2' },
  { key: 'tiktok',    label: 'TikTok',    Icon: Music2,    placeholder: 'https://tiktok.com/@tu_tienda',   color: '#69C9D0' },
  { key: 'youtube',   label: 'YouTube',   Icon: Youtube,   placeholder: 'https://youtube.com/@tu_canal',   color: '#FF0000' },
  { key: 'twitter',   label: 'Twitter/X', Icon: Twitter,   placeholder: 'https://twitter.com/tu_tienda',   color: '#1DA1F2' },
  { key: 'website',   label: 'Sitio Web', Icon: Globe,     placeholder: 'https://tu-sitio-web.com',        color: '#D4AF37' },
]

function StoreFormContent() {
  const { user, store, setStore } = useAuthStore()
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()
  const isEditing = !!store
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

  const { register, handleSubmit, control, reset, watch, setValue,
    formState: { errors, isDirty, isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name:       '',
      description: '',
      phone:      '',
      address:    '',
      city:       '',
      state:      '',
      country:    'México',
      logo_url:   '',
      banner_url: '',
      is_active:  true,
      social_links: { instagram: '', facebook: '', tiktok: '', youtube: '', twitter: '', website: '' },
    },
  })

  // Precarga los datos si ya tiene tienda
  useEffect(() => {
    if (store) {
      reset({
        name:        store.name        ?? '',
        description: store.description ?? '',
        phone:       store.phone       ?? '',
        address:     store.address     ?? '',
        city:        store.city        ?? '',
        state:       store.state       ?? '',
        country:     store.country     ?? 'México',
        logo_url:    store.logo_url    ?? '',
        banner_url:  store.banner_url  ?? '',
        is_active:   store.is_active   ?? true,
        social_links: {
          instagram: store.social_links?.instagram ?? '',
          facebook:  store.social_links?.facebook  ?? '',
          tiktok:    store.social_links?.tiktok    ?? '',
          youtube:   store.social_links?.youtube   ?? '',
          twitter:   store.social_links?.twitter   ?? '',
          website:   store.social_links?.website   ?? '',
        },
      })
    }
  }, [store, reset])

  const mutation = useMutation({
    mutationFn: (values) =>
      isEditing
        ? storesService.updateStore(store.id, values)
        : storesService.createStore(user.id, { ...values, owner_id: user.id }),
    onSuccess: (updatedStore) => {
      setStore(updatedStore)
      queryClient.invalidateQueries({ queryKey: ['store'] })
      setShowSuccessAlert(true)
      setTimeout(() => setShowSuccessAlert(false), 5000)
      addToast({
        message: isEditing 
          ? 'Tienda actualizada correctamente' 
          : '¡Tienda creada! Ya puedes publicar productos.',
        type: 'success',
      })
    },
    onError: (err) => {
      console.error('Error saving store:', err)
      const msg = err?.message ?? 'Error al guardar la tienda'
      const isDuplicate = msg.includes('duplicate') || msg.includes('unique')
      addToast({
        message: isDuplicate
          ? 'Ya existe una tienda con ese nombre. Prueba con uno diferente.'
          : 'Ocurrió un error al guardar. Intenta nuevamente.',
        type: 'error',
      })
    },
  })

  const name = watch('name')
  const description = watch('description')
  const storeUrl = store
    ? `${window.location.origin}/tienda/${store.slug}`
    : null

  const slugPreview = name 
    ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : 'tu-tienda'

  const hasErrors = Object.keys(errors).length > 0
  const canSubmit = isValid && (isDirty || !isEditing)

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-content-primary flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-gold/10">
              <Store size={28} className="text-brand-gold" />
            </div>
            {isEditing ? 'Configuración de Tienda' : 'Crear Mi Tienda'}
          </h1>
          <p className="text-content-secondary mt-2 leading-relaxed">
            {isEditing 
              ? 'Actualiza la información pública de tu tienda para mejorar tu presencia en el marketplace.' 
              : 'Configura tu tienda para comenzar a publicar productos y conectar con clientes.'}
          </p>
        </div>
        {storeUrl && (
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold rounded-lg transition-colors border border-brand-gold/20 flex-shrink-0"
          >
            <ExternalLink size={16} />
            <span className="text-sm font-medium">Ver tienda pública</span>
          </a>
        )}
      </div>

      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert variant="success" icon={CheckCircle2} title="¡Cambios guardados!">
          Tu tienda se actualizó correctamente. Los cambios ya son visibles para los clientes.
        </Alert>
      )}

      {/* Validation Errors Alert */}
      {hasErrors && (
        <Alert variant="error" icon={AlertCircle} title="Hay campos con errores">
          Por favor corrige los errores antes de guardar los cambios.
        </Alert>
      )}

      {/* Info Alert para nuevos usuarios */}
      {!isEditing && (
        <Alert variant="info" icon={Info} title="Primer paso: Configura tu tienda">
          Una vez creada tu tienda, podrás publicar hasta 5 productos gratis en el marketplace.
          Los clientes verán tu perfil y podrán contactarte directamente.
        </Alert>
      )}

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
        
        {/* Grid Layout para Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Principal (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Información Básica */}
            <div className="card-base p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <Building2 size={20} className="text-brand-gold" />
                <h2 className="text-lg font-bold text-content-primary">Información Básica</h2>
              </div>

              <Input
                label="Nombre de la tienda"
                placeholder="Ej: Deportes El Campeón"
                required
                error={errors.name?.message}
                {...register('name')}
              />

              <div>
                <label className="block text-sm font-medium text-content-secondary mb-2">
                  Descripción de tu tienda
                  <span className="text-content-muted font-normal ml-1">(opcional)</span>
                </label>
                <textarea
                  rows={4}
                  maxLength={300}
                  placeholder="Cuéntale a tus clientes qué productos ofreces, qué te hace único, años de experiencia, etc..."
                  className="w-full bg-brand-black-card border border-white/10 text-content-primary placeholder-content-muted rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-brand-gold/50 transition-colors"
                  {...register('description')}
                />
                <div className="flex justify-between mt-1.5">
                  {errors.description ? (
                    <p className="text-xs text-state-error">{errors.description.message}</p>
                  ) : (
                    <p className="text-xs text-content-muted">
                      Ayuda a los clientes a conocer tu tienda
                    </p>
                  )}
                  <p className="text-xs text-content-muted">
                    {description?.length || 0} / 300
                  </p>
                </div>
              </div>

              {/* URL Preview */}
              {!isEditing && name && (
                <div className="p-3 bg-brand-gold/5 border border-brand-gold/10 rounded-lg">
                  <p className="text-xs text-content-muted mb-1">URL de tu tienda:</p>
                  <p className="text-sm text-brand-gold font-mono break-all">
                    /tienda/{slugPreview}
                  </p>
                </div>
              )}
            </div>

            {/* Contacto y Ubicación */}
            <div className="card-base p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <MapPin size={20} className="text-brand-gold" />
                <h2 className="text-lg font-bold text-content-primary">Contacto y Ubicación</h2>
              </div>

              <Input
                label="Teléfono / WhatsApp"
                placeholder="Ej: 55 1234 5678"
                icon={Phone}
                error={errors.phone?.message}
                {...register('phone')}
              />

              <Input
                label="Dirección completa"
                placeholder="Ej: Av. Insurgentes Sur 1234, Col. Centro"
                icon={MapPinned}
                error={errors.address?.message}
                {...register('address')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ciudad"
                  placeholder="Ej: Ciudad de México"
                  error={errors.city?.message}
                  {...register('city')}
                />
                <Input
                  label="Estado"
                  placeholder="Ej: CDMX"
                  error={errors.state?.message}
                  {...register('state')}
                />
              </div>

              <Input
                label="País"
                placeholder="Ej: México"
                error={errors.country?.message}
                {...register('country')}
              />
            </div>
          </div>

          {/* Columna Lateral (1/3) */}
          <div className="space-y-6">
            
            {/* Logo */}
            <div className="card-base p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <ImageIcon size={20} className="text-brand-gold" />
                <h2 className="text-lg font-bold text-content-primary">Logo</h2>
              </div>
              
              <Controller
                name="logo_url"
                control={control}
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    folder="stores/logos"
                    label="Subir logo"
                    aspectRatio="aspect-square"
                    className="w-full"
                  />
                )}
              />

              <div className="space-y-2 text-xs text-content-muted">
                <p>• Sugerido: imagen cuadrada (1:1)</p>
                <p>• Recomendado: 200×200 px o mayor</p>
                <p>• Formatos: JPG, PNG, WebP</p>
                <p>• Se comprime automáticamente antes de subir</p>
              </div>
            </div>

            {/* Banner */}
            <div className="card-base p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <ImageIcon size={20} className="text-brand-gold" />
                <h2 className="text-lg font-bold text-content-primary">Banner</h2>
              </div>

              <Controller
                name="banner_url"
                control={control}
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    folder="stores/banners"
                    label="Subir banner"
                    aspectRatio="aspect-[16/9]"
                    className="w-full"
                  />
                )}
              />

              <div className="space-y-2 text-xs text-content-muted">
                <p>• Sugerido: imagen horizontal (16:9)</p>
                <p>• Recomendado: 1200×675 px o mayor</p>
                <p>• Formatos: JPG, PNG, WebP</p>
                <p>• Se comprime automáticamente antes de subir</p>
              </div>
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="card-base p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Share2 size={20} className="text-brand-gold" />
            <h2 className="text-lg font-bold text-content-primary">Redes Sociales</h2>
            <span className="ml-auto text-xs text-content-muted">Opcional</span>
          </div>
          <p className="text-sm text-content-secondary -mt-1">
            Agrega los perfiles que quieras mostrar en tu tienda pública. Los clientes podrán seguirte y generar más confianza.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SOCIAL_NETWORKS.map(({ key, label, Icon, placeholder, color }) => (
              <div key={key} className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-content-secondary">
                  <Icon size={15} style={{ color }} />
                  {label}
                </label>
                <input
                  type="url"
                  placeholder={placeholder}
                  {...register(`social_links.${key}`)}
                  className="w-full bg-brand-black-soft border border-white/10 text-content-primary placeholder-content-muted rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-gold/50 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Visibilidad de la tienda */}
        {isEditing && (
          <div className="card-base p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-4">
              <Eye size={18} className="text-brand-gold" />
              <h2 className="text-base font-bold text-content-primary">Visibilidad</h2>
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  id="store_is_active"
                  {...register('is_active')}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 rounded-full bg-white/10 peer-checked:bg-brand-gold transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-content-primary group-hover:text-white transition-colors">
                  {watch('is_active') ? 'Tienda activa y visible' : 'Tienda oculta al público'}
                </p>
                <p className="text-xs text-content-muted mt-0.5">
                  {watch('is_active')
                    ? 'Los clientes pueden ver tu tienda y productos en el marketplace.'
                    : 'Tu tienda no aparecerá en el catálogo ni en búsquedas.'}
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Submit Actions */}
        <div className="card-base p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 backdrop-blur-sm bg-brand-black-card/95 border-brand-gold/20">
          <div className="flex-1">
            {isEditing ? (
              <p className="text-sm text-content-secondary">
                {isDirty 
                  ? 'Tienes cambios sin guardar' 
                  : 'No hay cambios pendientes'}
              </p>
            ) : (
              <p className="text-sm text-content-muted">
                Al crear tu tienda, aceptas nuestros términos y condiciones
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={mutation.isPending}
            disabled={!canSubmit}
            className="w-full sm:w-auto min-w-[200px]"
          >
            <Save size={18} />
            {isEditing ? 'Guardar Cambios' : 'Crear Mi Tienda'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default StoreFormContent
