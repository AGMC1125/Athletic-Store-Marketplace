import { useState } from 'react'
import { Upload, X, Star, MoveUp, MoveDown, Image as ImageIcon } from 'lucide-react'
import { Button } from '../ui'

/**
 * Componente para subir y gestionar múltiples imágenes de producto.
 * Permite:
 * - Subir hasta maxImages imágenes
 * - Reordenar imágenes
 * - Marcar imagen principal
 * - Preview de imágenes
 * - Eliminar imágenes
 */
export default function ProductImageUploader({ 
  images = [], 
  onChange, 
  maxImages = 4,
  disabled = false 
}) {
  const [draggedIndex, setDraggedIndex] = useState(null)

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    
    if (images.length + files.length > maxImages) {
      alert(`Máximo ${maxImages} imágenes permitidas`)
      return
    }

    const newImages = files.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      file,
      url: URL.createObjectURL(file),
      is_main: images.length === 0 && index === 0, // Primera imagen es principal
      order: images.length + index,
    }))

    onChange([...images, ...newImages])
  }

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    
    // Si eliminamos la principal, hacer que la primera sea principal
    if (images[index].is_main && newImages.length > 0) {
      newImages[0].is_main = true
    }

    onChange(newImages)
  }

  const setMainImage = (index) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_main: i === index,
    }))
    onChange(newImages)
  }

  const moveImage = (fromIndex, direction) => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    
    if (toIndex < 0 || toIndex >= images.length) return

    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)

    // Actualizar orden
    newImages.forEach((img, i) => {
      img.order = i
    })

    onChange(newImages)
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)
    
    // Actualizar orden
    newImages.forEach((img, i) => {
      img.order = i
    })

    onChange(newImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      {/* Grid de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div
              key={img.id || img.url}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                relative group rounded-lg overflow-hidden bg-surface-elevated
                border-2 transition-all cursor-move
                ${img.is_main ? 'border-brand-gold' : 'border-border-subtle'}
                ${draggedIndex === index ? 'opacity-50' : ''}
              `}
            >
              {/* Imagen */}
              <div className="aspect-square">
                <img
                  src={img.url}
                  alt={`Producto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badge de principal */}
              {img.is_main && (
                <div className="absolute top-2 left-2 bg-brand-gold text-black px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                  <Star size={12} fill="currentColor" />
                  Principal
                </div>
              )}

              {/* Controles (visible al hacer hover) */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Marcar como principal */}
                {!img.is_main && (
                  <button
                    type="button"
                    onClick={() => setMainImage(index)}
                    disabled={disabled}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    title="Marcar como principal"
                  >
                    <Star size={16} className="text-white" />
                  </button>
                )}

                {/* Mover arriba */}
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'up')}
                    disabled={disabled}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    title="Mover a la izquierda"
                  >
                    <MoveUp size={16} className="text-white" />
                  </button>
                )}

                {/* Mover abajo */}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'down')}
                    disabled={disabled}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    title="Mover a la derecha"
                  >
                    <MoveDown size={16} className="text-white" />
                  </button>
                )}

                {/* Eliminar */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={disabled}
                  className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors"
                  title="Eliminar imagen"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>

              {/* Número de orden */}
              <div className="absolute bottom-2 right-2 bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón para agregar imágenes */}
      {images.length < maxImages && (
        <div>
          <input
            type="file"
            id="product-images"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
          <label
            htmlFor="product-images"
            className={`
              block border-2 border-dashed border-border-subtle rounded-lg p-8
              text-center cursor-pointer transition-all
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-gold hover:bg-surface-elevated'}
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-surface-elevated rounded-full">
                <Upload size={24} className="text-content-secondary" />
              </div>
              <div>
                <p className="text-content-primary font-medium mb-1">
                  Subir imágenes de producto
                </p>
                <p className="text-sm text-content-secondary">
                  {images.length > 0 
                    ? `${images.length} de ${maxImages} imágenes` 
                    : `Hasta ${maxImages} imágenes`}
                </p>
                <p className="text-xs text-content-tertiary mt-1">
                  JPG, PNG o WebP (máx. 5MB cada una)
                </p>
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Info de imagen principal */}
      {images.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-content-secondary bg-surface-elevated p-3 rounded-lg">
          <ImageIcon size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            <strong>Consejo:</strong> La imagen marcada con{' '}
            <Star size={12} className="inline" fill="currentColor" /> se mostrará como 
            principal en el catálogo. Puedes reordenar las imágenes arrastrándolas.
          </p>
        </div>
      )}

      {/* Validación */}
      {images.length === 0 && (
        <p className="text-xs text-state-error">
          * Debes agregar al menos una imagen del producto
        </p>
      )}
    </div>
  )
}
