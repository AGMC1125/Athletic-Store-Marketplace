import { PRODUCT_CATEGORIES } from '../constants'

/**
 * Definición de plantillas de productos.
 * Cada plantilla define los campos específicos que se mostrarán
 * en el formulario de creación/edición de un producto.
 *
 * type: 'text' | 'number' | 'select' | 'boolean'
 */
// Nota: los campos `size` y `color` fueron eliminados de todas las plantillas.
// Ahora se gestionan por variante en VariantsManager (color + tallas + stock por color).
export const PRODUCT_TEMPLATES = {
  [PRODUCT_CATEGORIES.FOOTWEAR]: {
    label: 'Calzado Deportivo',
    icon: '👟',
    fields: [
      { key: 'brand',    label: 'Marca',  type: 'text', required: false, placeholder: 'Ej: Nike, Adidas, Puma' },
      { key: 'model',    label: 'Modelo', type: 'text', required: false, placeholder: 'Ej: Air Max 270, Predator' },
      { key: 'material', label: 'Material', type: 'text', required: false, placeholder: 'Ej: Cuero sintético, malla' },
      {
        key: 'sport_type',
        label: 'Tipo de deporte',
        type: 'select',
        required: false,
        options: [
          { value: 'running',    label: 'Running' },
          { value: 'football',   label: 'Fútbol' },
          { value: 'basketball', label: 'Básquetbol' },
          { value: 'training',   label: 'Entrenamiento' },
          { value: 'casual',     label: 'Casual deportivo' },
          { value: 'other',      label: 'Otro' },
        ],
      },
    ],
  },

  [PRODUCT_CATEGORIES.SOCKS]: {
    label: 'Medias Deportivas',
    icon: '🧦',
    fields: [
      { key: 'brand',    label: 'Marca',    type: 'text', required: false, placeholder: 'Ej: Nike, Under Armour' },
      { key: 'material', label: 'Material', type: 'text', required: false, placeholder: 'Ej: Algodón, poliéster' },
      {
        key: 'pack',
        label: 'Presentación',
        type: 'select',
        required: false,
        options: [
          { value: '1',  label: '1 par' },
          { value: '3',  label: '3 pares' },
          { value: '6',  label: '6 pares' },
          { value: '12', label: '12 pares' },
        ],
      },
    ],
  },

  [PRODUCT_CATEGORIES.SHIN_GUARDS]: {
    label: 'Espinilleras',
    icon: '🦵',
    fields: [
      { key: 'brand',     label: 'Marca',       type: 'text',    required: false, placeholder: 'Ej: Adidas, Nike' },
      { key: 'material',  label: 'Material',    type: 'text',    required: false, placeholder: 'Ej: Polipropileno, fibra de carbono' },
      { key: 'has_ankle', label: 'Con tobillera', type: 'boolean', required: false },
      { key: 'sport',     label: 'Deporte',     type: 'text',    required: false, placeholder: 'Ej: Fútbol, fútbol sala' },
    ],
  },

  [PRODUCT_CATEGORIES.GOALKEEPER_GLOVES]: {
    label: 'Guantes de Portero',
    icon: '🧤',
    fields: [
      { key: 'brand',     label: 'Marca',         type: 'text',   required: false, placeholder: 'Ej: Reusch, Uhlsport, Adidas' },
      {
        key: 'cut',
        label: 'Corte',
        type: 'select',
        required: false,
        options: [
          { value: 'flat',     label: 'Plano' },
          { value: 'negative', label: 'Negativo' },
          { value: 'roll',     label: 'Roll Finger' },
          { value: 'hybrid',   label: 'Híbrido' },
        ],
      },
      { key: 'grip_type', label: 'Tipo de agarre', type: 'text', required: false, placeholder: 'Ej: Aquagrip, Giga Grip' },
    ],
  },
}

/**
 * Retorna la definición de una plantilla por su tipo.
 * @param {string} type
 * @returns {object|null}
 */
export function getTemplate(type) {
  return PRODUCT_TEMPLATES[type] ?? null
}

/**
 * Lista de todas las plantillas disponibles para selects.
 */
export const TEMPLATE_OPTIONS = Object.entries(PRODUCT_TEMPLATES).map(
  ([value, { label, icon }]) => ({ value, label, icon })
)
