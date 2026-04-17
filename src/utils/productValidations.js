import { PLAN_LIMITS } from '../constants'

/**
 * Validaciones para productos.
 * Centraliza toda la lógica de validación de negocio.
 */

/**
 * Valida si una tienda puede crear más productos según su plan.
 * @param {number} currentCount - Productos actuales de la tienda
 * @param {string} plan - Plan de la tienda (free, basic, premium)
 * @returns {{ canCreate: boolean, limit: number, remaining: number }}
 */
export function validateProductLimit(currentCount, plan) {
  const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - currentCount)
  
  return {
    canCreate: currentCount < limit,
    limit,
    remaining,
    currentCount,
  }
}

/**
 * Valida datos básicos de un producto.
 * @param {object} productData
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateProductData(productData) {
  const errors = []

  // Nombre requerido
  if (!productData.name?.trim()) {
    errors.push('El nombre del producto es requerido')
  }

  // Nombre con longitud mínima
  if (productData.name && productData.name.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres')
  }

  // Precio requerido y positivo
  if (!productData.price || parseFloat(productData.price) <= 0) {
    errors.push('El precio debe ser mayor a 0')
  }

  // Categoría requerida
  if (!productData.category) {
    errors.push('La categoría es requerida')
  }

  // Validar descuento si existe
  if (productData.discount_percentage) {
    const discount = parseInt(productData.discount_percentage)
    if (discount < 0 || discount > 100) {
      errors.push('El descuento debe estar entre 0 y 100')
    }
  }

  // Validar stock si existe
  if (productData.stock !== undefined && productData.stock !== null) {
    const stock = parseInt(productData.stock)
    if (stock < 0) {
      errors.push('El stock no puede ser negativo')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valida imágenes de producto.
 * @param {Array} images - Array de objetos File o URLs
 * @param {number} maxImages - Número máximo de imágenes permitidas
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateProductImages(images = [], maxImages = 4) {
  const errors = []

  if (images.length === 0) {
    errors.push('Debes agregar al menos una imagen')
  }

  if (images.length > maxImages) {
    errors.push(`Máximo ${maxImages} imágenes permitidas`)
  }

  // Validar cada imagen
  images.forEach((img, index) => {
    // Si es un archivo (File), validar tamaño y tipo
    if (img.file instanceof File) {
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (img.file.size > maxSize) {
        errors.push(`La imagen ${index + 1} excede el tamaño máximo de 5MB`)
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(img.file.type)) {
        errors.push(`La imagen ${index + 1} debe ser JPG, PNG o WebP`)
      }
    }

    // Si es una URL, validar formato básico
    if (img.url && typeof img.url === 'string') {
      try {
        new URL(img.url)
      } catch {
        errors.push(`La imagen ${index + 1} tiene una URL inválida`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Calcula el precio final con descuento.
 * @param {number} price - Precio original
 * @param {number} discountPercentage - Porcentaje de descuento
 * @returns {number}
 */
export function calculateFinalPrice(price, discountPercentage = 0) {
  if (!discountPercentage || discountPercentage <= 0) return price
  return price - (price * discountPercentage) / 100
}

/**
 * Verifica si un producto tiene descuento activo.
 * @param {object} product
 * @returns {boolean}
 */
export function hasDiscount(product) {
  return product.discount_percentage > 0
}

/**
 * Normaliza datos de producto para enviar a Supabase.
 * Solo incluye campos presentes en formData para evitar sobrescribir
 * columnas no editadas (p. ej. discount_percentage o attributes).
 * @param {object} formData - Datos del formulario
 * @returns {object}
 */
export function normalizeProductData(formData) {
  const normalized = {
    name:        formData.name?.trim(),
    description: formData.description?.trim() || null,
    price:       parseFloat(formData.price),
    category:    formData.category,
    stock:       formData.stock !== undefined && formData.stock !== null
                   ? parseInt(formData.stock, 10)
                   : 0,
    is_active:   formData.is_active ?? true,
  }

  // attributes: incluir solo si fue provisto (JSONB — no omitir en actualizaciones)
  if (formData.attributes !== undefined) {
    normalized.attributes = formData.attributes
  }

  // discount_percentage: incluir solo si el campo existe en el payload
  if ('discount_percentage' in formData) {
    const raw = formData.discount_percentage
    normalized.discount_percentage =
      raw !== null && raw !== undefined && raw !== ''
        ? parseInt(raw, 10)
        : null
  }

  return normalized
}

/**
 * Genera un mensaje de error amigable para límites de plan.
 * @param {string} plan
 * @param {number} limit
 * @returns {string}
 */
export function getPlanLimitMessage(plan, limit) {
  if (limit === Infinity) {
    return '✨ ¡Productos ilimitados!'
  }
  
  return `Has alcanzado el límite de ${limit} producto${limit === 1 ? '' : 's'} del Plan ${plan.toUpperCase()}. Mejora tu plan para publicar más productos.`
}
