import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases de Tailwind de forma segura,
 * resolviendo conflictos entre clases.
 * @param  {...any} inputs - Clases de Tailwind
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
