const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

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

export function getOptimizedUrl(url, { width = 400, height, crop = 'fill', quality = 'auto' } = {}) {
  const single = Array.isArray(url) ? url[0] : url
  if (!single || typeof single !== 'string' || !single.includes('cloudinary.com')) return single ?? null

  const dims = height ? `w_${width},h_${height}` : `w_${width}`
  return single.replace(
    '/upload/',
    `/upload/${dims},c_${crop},q_${quality},f_auto/`
  )
}
