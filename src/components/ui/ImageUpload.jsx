import { useRef, useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { cn } from '../../utils/cn'
import { uploadImage } from '../../lib/cloudinary'
import Spinner from './Spinner'

/* ── Constantes ───────────────────────────────────────────── */
const MAX_FILE_SIZE_MB = 15
const MAX_FILE_SIZE    = MAX_FILE_SIZE_MB * 1024 * 1024
const COMPRESS_TARGET  = 1.5 * 1024 * 1024 // 1.5 MB target
const COMPRESS_MIN_QUALITY = 0.4

/**
 * Comprime una imagen del lado del cliente usando el canvas del navegador.
 * Devuelve un Blob comprimido ≈ COMPRESS_TARGET.
 * Si la imagen ya es menor al target, devuelve el File original.
 */
async function compressImage(file) {
  // Si ya es suficientemente pequeña, no comprimir
  if (file.size <= COMPRESS_TARGET) return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Calcular dimensiones máximas (reducir si es muy grande)
      let { width, height } = img
      const MAX_DIM = 2048
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
        width  = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Buscar la calidad adecuada iterativamente
      let quality = 0.85
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir la imagen'))
              return
            }

            // Si el blob es suficientemente pequeño o ya bajamos mucho la calidad, aceptar
            if (blob.size <= COMPRESS_TARGET || quality <= COMPRESS_MIN_QUALITY) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            } else {
              quality -= 0.1
              tryCompress()
            }
          },
          'image/jpeg',
          quality
        )
      }

      tryCompress()
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo cargar la imagen para comprimir'))
    }

    img.src = url
  })
}

/**
 * Componente reutilizable para subir imágenes a Cloudinary.
 * Sube la imagen inmediatamente al seleccionarla y devuelve la URL via onChange.
 * Comprime automáticamente imágenes grandes antes de subirlas.
 *
 * @param {string}   value       - URL actual de la imagen
 * @param {Function} onChange    - Callback (url: string) => void
 * @param {string}   folder      - Carpeta de Cloudinary (ej: 'stores/logos')
 * @param {string}   label       - Texto del botón
 * @param {string}   aspectRatio - Clases CSS para el aspect ratio (default: cuadrado)
 * @param {string}   className
 */
function ImageUpload({
  value,
  onChange,
  folder = 'products',
  label = 'Subir imagen',
  aspectRatio = 'aspect-square',
  className,
}) {
  const inputRef   = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError  ] = useState(null)

  async function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Solo se aceptan imágenes (JPG, PNG, WEBP)')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`La imagen no debe superar ${MAX_FILE_SIZE_MB} MB`)
      return
    }

    setError(null)
    setLoading(true)
    try {
      // Comprimir si es necesario
      const processed = await compressImage(file)
      const { url } = await uploadImage(processed, folder)
      onChange(url)
    } catch (err) {
      console.error('[ImageUpload] Error:', err)
      setError('Error al subir la imagen. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    handleFile(e.target.files?.[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFile(e.dataTransfer.files?.[0])
  }

  function handleRemove(e) {
    e.stopPropagation()
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'relative w-full rounded-xl border-2 border-dashed transition-colors duration-200 overflow-hidden cursor-pointer',
          aspectRatio,
          loading
            ? 'border-brand-gold/40 bg-brand-gold/5 cursor-not-allowed'
            : value
              ? 'border-brand-gold/30 hover:border-brand-gold/60'
              : 'border-white/10 hover:border-brand-gold/40 bg-white/[0.02] hover:bg-brand-gold/5',
        )}
      >
        {/* Imagen cargada */}
        {value && !loading && (
          <>
            <img
              src={value}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <p className="text-white text-xs font-medium">Cambiar imagen</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-state-error/80 transition-colors z-10"
            >
              <X size={12} />
            </button>
          </>
        )}

        {/* Spinner mientras carga */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Spinner size="md" className="text-brand-gold" />
            <p className="text-xs text-content-secondary">Comprimiendo y subiendo...</p>
          </div>
        )}

        {/* Estado vacío */}
        {!value && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <div className="p-2.5 rounded-xl bg-brand-gold/10">
              <ImageIcon size={22} className="text-brand-gold" />
            </div>
            <p className="text-xs text-content-secondary text-center">{label}</p>
            <p className="text-xs text-content-muted text-center">JPG, PNG, WEBP · máx. {MAX_FILE_SIZE_MB} MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-state-error">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

export default ImageUpload
