const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * Sube una imagen a Cloudinary usando upload sin firma (unsigned).
 * @param {File} file - Archivo a subir
 * @param {string} folder - Carpeta destino (ej: 'stores/logos')
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadImage(file, folder = 'products') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', `athletic-store/${folder}`)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    throw new Error('Error al subir la imagen a Cloudinary')
  }

  const data = await response.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
  }
}

/**
 * Genera una URL optimizada de Cloudinary con transformaciones.
 * Acepta un string o un array de URLs (toma la primera).
 * @param {string|string[]} url - URL o array de URLs de Cloudinary
 * @param {object} opts - Opciones de transformación
 */
export function getOptimizedUrl(url, { width = 400, height = 400, quality = 'auto' } = {}) {
  const single = Array.isArray(url) ? url[0] : url
  if (!single || typeof single !== 'string' || !single.includes('cloudinary.com')) return single ?? null
  return single.replace(
    '/upload/',
    `/upload/w_${width},h_${height},c_fill,q_${quality},f_auto/`
  )
}
