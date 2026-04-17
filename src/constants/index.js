import { Footprints, Layers, Shield, Hand } from 'lucide-react'

// ── Planes de membresía ──────────────────────────────────
// DB almacena 'free' y 'basic'. PLANS.PRO apunta a 'basic' intencionalmente
// para no requerir migración de schema en Supabase.
export const PLANS = {
  FREE: 'free',
  PRO:  'basic',   // valor en DB = 'basic', etiqueta UI = 'Pro'
}

export const PLAN_LABELS = {
  [PLANS.FREE]: 'Gratuito',
  [PLANS.PRO]:  'Pro',
}

export const PLAN_LIMITS = {
  [PLANS.FREE]: parseInt(import.meta.env.VITE_FREE_PLAN_PRODUCT_LIMIT ?? '5'),
  [PLANS.PRO]:  parseInt(import.meta.env.VITE_BASIC_PLAN_PRODUCT_LIMIT ?? '50'),
}

export const PLAN_PRICES = {
  [PLANS.FREE]: 0,
  [PLANS.PRO]:  299,   // MXN / mes
}

export const PLAN_MAX_VARIANT_IMAGES = {
  [PLANS.FREE]: 3,
  [PLANS.PRO]:  3,   // mismo por ahora; diferenciable a futuro
}

// ── Categorías de producto ───────────────────────────────
export const PRODUCT_CATEGORIES = {
  FOOTWEAR: 'footwear',
  SOCKS: 'socks',
  SHIN_GUARDS: 'shin_guards',
  GOALKEEPER_GLOVES: 'goalkeeper_gloves',
}

export const CATEGORY_LABELS = {
  [PRODUCT_CATEGORIES.FOOTWEAR]: 'Calzado Deportivo',
  [PRODUCT_CATEGORIES.SOCKS]: 'Medias Deportivas',
  [PRODUCT_CATEGORIES.SHIN_GUARDS]: 'Espinilleras',
  [PRODUCT_CATEGORIES.GOALKEEPER_GLOVES]: 'Guantes de Portero',
}

/**
 * Lucide-react component references for each category.
 * Usage: const Icon = CATEGORY_ICONS[category]; <Icon size={18} />
 */
export const CATEGORY_ICONS = {
  [PRODUCT_CATEGORIES.FOOTWEAR]: Footprints,
  [PRODUCT_CATEGORIES.SOCKS]: Layers,
  [PRODUCT_CATEGORIES.SHIN_GUARDS]: Shield,
  [PRODUCT_CATEGORIES.GOALKEEPER_GLOVES]: Hand,
}

// ── Rutas de la aplicación ───────────────────────────────
export const ROUTES = {
  HOME: '/',
  CATALOG: '/catalogo',
  PRODUCT: '/producto/:id',
  STORE: '/tienda/:slug',
  LOGIN: '/auth/login',
  REGISTER: '/auth/registro',
  FORGOT_PASSWORD: '/auth/recuperar',
  AUTH_CALLBACK: '/auth/callback',
  RESET_PASSWORD: '/auth/reset-password',
  DASHBOARD: '/dashboard',
  DASHBOARD_STORE: '/dashboard/tienda',
  DASHBOARD_PRODUCTS: '/dashboard/productos',
  DASHBOARD_PRODUCTS_NEW: '/dashboard/productos/nuevo',
  DASHBOARD_PRODUCTS_EDIT: '/dashboard/productos/:id/editar',
  DASHBOARD_MEMBERSHIP: '/dashboard/membresia',
  DASHBOARD_PAYMENT:    '/dashboard/metodo-de-pago',
  DASHBOARD_PROFILE:    '/dashboard/perfil',
  DASHBOARD_ORDERS:     '/dashboard/ordenes',

  // ── Compras públicas (guest) ───────────────────────────
  STORES:   '/tiendas',
  CART:     '/carrito',
  CHECKOUT: '/checkout',
  ORDERS:   '/ordenes',

  // ── Admin ──────────────────────────────────────────────
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/usuarios',
  ADMIN_STORES: '/admin/tiendas',
  ADMIN_PRODUCTS: '/admin/productos',
  ADMIN_MEMBERSHIPS: '/admin/membresias',
  ADMIN_BANK_ACCOUNTS: '/admin/cuentas-bancarias',
}

// ── Cloudinary folders ───────────────────────────────────
export const CLOUDINARY_FOLDERS = {
  STORE_LOGOS: 'stores/logos',
  PRODUCT_IMAGES: 'products/images',
}

// ── Colores comunes para variantes ──────────────────────
export const COMMON_COLORS = [
  { label: 'Negro',       hex: '#111111' },
  { label: 'Blanco',      hex: '#F5F5F5' },
  { label: 'Rojo',        hex: '#EF4444' },
  { label: 'Azul marino', hex: '#1E3A8A' },
  { label: 'Azul cielo',  hex: '#3B82F6' },
  { label: 'Verde',       hex: '#22C55E' },
  { label: 'Amarillo',    hex: '#EAB308' },
  { label: 'Naranja',     hex: '#F97316' },
  { label: 'Rosa',        hex: '#EC4899' },
  { label: 'Gris',        hex: '#6B7280' },
  { label: 'Dorado',      hex: '#C9A84C' },
  { label: 'Morado',      hex: '#A855F7' },
  { label: 'Café',        hex: '#92400E' },
  { label: 'Verde olivo', hex: '#4D7C0F' },
]

// ── Plantilla de tallas por categoría ───────────────────
export const VARIANT_TEMPLATES = {
  [PRODUCT_CATEGORIES.FOOTWEAR]: {
    sizeLabel: 'Talla (cm)',
    sizes: [
      '22', '22.5', '23', '23.5', '24', '24.5',
      '25', '25.5', '26', '26.5', '27', '27.5',
      '28', '28.5', '29', '29.5', '30', '30.5',
      '31', '31.5', '32',
    ],
    hasColors: true,
  },
  [PRODUCT_CATEGORIES.SOCKS]: {
    sizeLabel: 'Talla',
    sizes: ['CH', 'M', 'G', 'XG'],
    hasColors: true,
  },
  [PRODUCT_CATEGORIES.SHIN_GUARDS]: {
    sizeLabel: 'Talla',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    hasColors: true,
  },
  [PRODUCT_CATEGORIES.GOALKEEPER_GLOVES]: {
    sizeLabel: 'Talla',
    sizes: ['5', '6', '7', '8', '9', '10', '11'],
    hasColors: true,
  },
}

/** Máximo de fotos por variante en el plan gratuito */
export const MAX_IMAGES_PER_VARIANT = 3

// ── Misc ─────────────────────────────────────────────────
export const MAX_PRODUCT_IMAGES = 4
export const APP_NAME = 'Athletic Store Marketplace'
export const APP_TAGLINE = 'El marketplace para tiendas deportivas'
