import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/cloudinary'
import { validateProductData, validateProductImages, normalizeProductData } from '../utils/productValidations'

/**
 * Servicio de productos.
 * Maneja todas las operaciones CRUD de productos con validaciones y manejo de imágenes.
 */
export const productsService = {
  /**
   * Obtiene todos los productos públicos (de tiendas activas).
   * Búsqueda por nombre de producto o nombre de tienda.
   */
  async getPublicProducts({ category, search, page = 1, limit = 24 } = {}) {
    let query = supabase
      .from('products')
      .select(`
        *,
        stores!inner(id, name, slug, logo_url, city, is_active)
      `)
      .eq('is_active', true)
      .eq('stores.is_active', true)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (category) query = query.eq('category', category)

    if (search) {
      // Buscar en nombre de producto y en nombre de tienda
      // Primero obtenemos IDs de tiendas que coincidan con la búsqueda
      const { data: matchingStores } = await supabase
        .from('stores')
        .select('id')
        .ilike('name', `%${search}%`)
        .eq('is_active', true)

      const storeIds = (matchingStores ?? []).map(s => s.id)

      if (storeIds.length > 0) {
        // OR: producto cuyo nombre coincide O pertenece a una tienda que coincide
        query = query.or(`name.ilike.%${search}%,store_id.in.(${storeIds.join(',')})`)
      } else {
        query = query.ilike('name', `%${search}%`)
      }
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Obtiene un producto por ID (vista pública, con info de tienda).
   */
  async getProductById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`*, stores(id, name, slug, logo_url, phone, address, city, state)`)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  /**
   * Obtiene un producto por ID para el panel del dueño (sin join de tienda).
   */
  async getOwnerProductById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  /**
   * Obtiene los productos activos de una tienda (vista pública).
   */
  async getPublicProductsByStore(storeId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  /**
   * Obtiene todos los productos de una tienda (panel del dueño).
   */
  async getProductsByStore(storeId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  /**
   * Cuenta los productos activos de una tienda (para límite de plan).
   */
  async countStoreProducts(storeId) {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
    if (error) throw error
    return count ?? 0
  },

  /**
   * Sube todas las imágenes con archivos pendientes de las variantes a Cloudinary.
   * Devuelve las variantes con las imágenes reemplazadas por URLs finales.
   * También calcula stock total y construye image_url flat (primera foto por variante).
   *
   * @param {Array} variants - variantes con shape { id, colorLabel, colorHex, images: [{id, file?, url, preview?}], sizes: {} }
   * @param {Function} onProgress
   * @returns {{ variants: Array, image_url: string[], stock: number }}
   */
  async _processVariants(variants = [], onProgress = null) {
    // Contar archivos pendientes de subida
    const allPending = variants.flatMap((v) => v.images.filter((img) => !!img.file))
    let uploaded = 0

    const processedVariants = []
    for (const variant of variants) {
      const processedImages = []
      for (const img of variant.images) {
        if (img.file) {
          const result = await uploadImage(img.file, 'products/images')
          processedImages.push(result.url)
          uploaded++
          if (onProgress && allPending.length > 0) {
            onProgress({
              current: uploaded,
              total:   allPending.length,
              percent: Math.round((uploaded / allPending.length) * 100),
            })
          }
        } else if (img.url && !img.url.startsWith('blob:')) {
          // URL ya en Cloudinary — reutilizar
          processedImages.push(img.url)
        }
        // blob: URLs sin file se ignoran (imagen eliminada)
      }
      processedVariants.push({
        id:         variant.id,
        colorLabel: variant.colorLabel,
        colorHex:   variant.colorHex,
        images:     processedImages,
        sizes:      variant.sizes ?? {},
      })
    }

    // image_url = primera foto de cada variante (para cards en catálogo)
    const image_url = processedVariants
      .map((v) => v.images[0])
      .filter(Boolean)

    // stock = suma de todas las tallas de todas las variantes
    const stock = processedVariants.reduce(
      (sum, v) => sum + Object.values(v.sizes).reduce((s, q) => s + (parseInt(q) || 0), 0),
      0
    )

    return { variants: processedVariants, image_url, stock }
  },

  /**
   * Crea un nuevo producto.
   * @param {string}   storeId     - ID de la tienda
   * @param {object}   productData - Campos del producto (sin stock ni image_url)
   * @param {Array}    variants    - Variantes del VariantsManager
   * @param {Function} onProgress  - Callback de progreso de subida (opcional)
   */
  async createProduct(storeId, productData, variants = [], onProgress = null) {
    const validation = validateProductData(productData)
    if (!validation.valid) throw new Error(validation.errors.join(', '))

    const normalizedData = normalizeProductData(productData)

    // Subir imágenes de variantes y calcular stock
    const { variants: uploadedVariants, image_url, stock } = await this._processVariants(variants, onProgress)

    // Construir attributes: combinar campos del form + variants
    const attributes = {
      ...(normalizedData.attributes ?? {}),
      variants: uploadedVariants,
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...normalizedData,
        store_id:   storeId,
        image_url,
        stock,
        attributes,
      })
      .select()
      .single()

    if (error) throw error
    return this.getOwnerProductById(product.id)
  },

  /**
   * Actualiza un producto.
   * @param {string}   productId  - ID del producto
   * @param {object}   updates    - Campos a actualizar
   * @param {Array}    variants   - Variantes actualizadas del VariantsManager
   * @param {Function} onProgress - Callback de progreso de subida (opcional)
   */
  async updateProduct(productId, updates, variants = null, onProgress = null) {
    if (updates.name || updates.price || updates.category) {
      const validation = validateProductData({ ...updates })
      if (!validation.valid) throw new Error(validation.errors.join(', '))
    }

    const normalizedUpdates = normalizeProductData(updates)

    // Si se pasaron variantes, subirlas y recalcular stock/image_url
    if (variants && variants.length >= 0) {
      const { variants: uploadedVariants, image_url, stock } = await this._processVariants(variants, onProgress)
      normalizedUpdates.image_url = image_url
      normalizedUpdates.stock     = stock
      normalizedUpdates.attributes = {
        ...(normalizedUpdates.attributes ?? {}),
        variants: uploadedVariants,
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update({ ...normalizedUpdates, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Elimina un producto.
   */
  async deleteProduct(productId) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
    if (error) throw error
  },

  /**
   * Activa o desactiva un producto.
   * @param {string} productId - ID del producto
   * @param {boolean} isActive - Nuevo estado
   */
  async toggleProductStatus(productId, isActive) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', productId)
    if (error) throw error
  },

  /**
   * Obtiene productos con filtros avanzados (para admin o dueño).
   * @param {object} filters - Filtros { storeId, category, search, isActive, sort }
   * @returns {Promise<Array>} Lista de productos
   */
  async getProductsWithFilters(filters = {}) {
    let query = supabase.from('products').select('*')

    if (filters.storeId) {
      query = query.eq('store_id', filters.storeId)
    }

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    // Ordenamiento
    switch (filters.sort) {
      case 'name_asc':
        query = query.order('name', { ascending: true })
        break
      case 'name_desc':
        query = query.order('name', { ascending: false })
        break
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Duplica un producto existente (útil para crear variantes).
   * @param {string} productId - ID del producto a duplicar
   * @param {string} storeId - ID de la tienda
   * @returns {Promise<object>} Nuevo producto creado
   */
  async duplicateProduct(productId, storeId) {
    // Obtener producto original
    const original = await this.getOwnerProductById(productId)
    
    // Crear copia sin ID ni timestamps
    const duplicate = {
      name: `${original.name} (Copia)`,
      description: original.description,
      price: original.price,
      category: original.category,
      stock: 0,
      discount_percentage: original.discount_percentage,
      image_url: original.image_url,
      is_active: false, // Nueva copia comienza inactiva
      store_id: storeId,
    }

    const { data, error } = await supabase
      .from('products')
      .insert(duplicate)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
