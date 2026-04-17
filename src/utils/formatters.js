/**
 * Formatea un precio en pesos mexicanos.
 * @param {number} amount
 * @returns {string}
 */
export function formatPrice(amount) {
  // Supabase devuelve NUMERIC como string ("1600.00") en algunos entornos.
  // Convertimos explícitamente a número antes de formatear.
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount)
  const safe = isNaN(num) ? 0 : num
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safe)
}

/**
 * Genera un slug URL-friendly a partir de un string.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Trunca un texto a una longitud máxima.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 100) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Formatea una fecha a string legible en español.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}
