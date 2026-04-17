import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService } from '../services/productsService'
import { validateProductLimit } from '../utils/productValidations'
import useAuthStore from '../store/authStore'

/**
 * Hook para gestión de productos por tienda.
 * Úsalo en el dashboard del dueño para gestionar sus productos.
 */
export function useStoreProducts() {
  const { store, profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [uploadProgress, setUploadProgress] = useState(null)

  // Obtener productos de la tienda
  const {
    data: products = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['store-products', store?.id],
    queryFn: () => productsService.getProductsByStore(store.id),
    enabled: !!store?.id,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })

  // Contar productos para validar límites
  const { data: productCount = 0 } = useQuery({
    queryKey: ['store-products-count', store?.id],
    queryFn: () => productsService.countStoreProducts(store.id),
    enabled: !!store?.id,
  })

  // Validar límite de plan
  const planLimit = validateProductLimit(productCount, profile?.plan || 'free')

  // Crear producto
  const createMutation = useMutation({
    mutationFn: async ({ productData, images }) => {
      // Validar límite antes de crear
      if (!planLimit.canCreate) {
        throw new Error(
          `Has alcanzado el límite de ${planLimit.limit} producto${planLimit.limit === 1 ? '' : 's'} de tu plan. Mejora tu plan para publicar más productos.`
        )
      }

      return productsService.createProduct(
        store.id,
        productData,
        images,
        setUploadProgress
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-products', store.id] })
      queryClient.invalidateQueries({ queryKey: ['store-products-count', store.id] })
      setUploadProgress(null)
    },
    onError: () => {
      setUploadProgress(null)
    },
  })

  // Actualizar producto
  const updateMutation = useMutation({
    mutationFn: async ({ productId, updates, images }) => {
      return productsService.updateProduct(
        productId,
        updates,
        images,
        setUploadProgress
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-products', store.id] })
      setUploadProgress(null)
    },
    onError: () => {
      setUploadProgress(null)
    },
  })

  // Eliminar producto
  const deleteMutation = useMutation({
    mutationFn: (productId) => productsService.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-products', store.id] })
      queryClient.invalidateQueries({ queryKey: ['store-products-count', store.id] })
    },
  })

  // Cambiar estado activo/inactivo
  const toggleStatusMutation = useMutation({
    mutationFn: ({ productId, isActive }) => 
      productsService.toggleProductStatus(productId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-products', store.id] })
    },
  })

  // Duplicar producto
  const duplicateMutation = useMutation({
    mutationFn: (productId) => {
      // Validar límite antes de duplicar
      if (!planLimit.canCreate) {
        throw new Error(
          `Has alcanzado el límite de ${planLimit.limit} producto${planLimit.limit === 1 ? '' : 's'} de tu plan.`
        )
      }
      return productsService.duplicateProduct(productId, store.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-products', store.id] })
      queryClient.invalidateQueries({ queryKey: ['store-products-count', store.id] })
    },
  })

  // Obtener producto para edición
  const getProductForEdit = useCallback(
    async (productId) => {
      return productsService.getOwnerProductById(productId)
    },
    []
  )

  // Filtrar productos localmente
  const filterProducts = useCallback(
    (filters = {}) => {
      let filtered = products

      if (filters.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
        )
      }

      if (filters.category) {
        filtered = filtered.filter((p) => p.category === filters.category)
      }

      if (filters.isActive !== undefined) {
        filtered = filtered.filter((p) => p.is_active === filters.isActive)
      }

      // Ordenar
      if (filters.sort === 'name_asc') {
        filtered.sort((a, b) => a.name.localeCompare(b.name))
      } else if (filters.sort === 'name_desc') {
        filtered.sort((a, b) => b.name.localeCompare(a.name))
      } else if (filters.sort === 'price_asc') {
        filtered.sort((a, b) => a.price - b.price)
      } else if (filters.sort === 'price_desc') {
        filtered.sort((a, b) => b.price - a.price)
      }

      return filtered
    },
    [products]
  )

  return {
    // Datos
    products,
    productCount,
    planLimit,
    uploadProgress,

    // Estados
    isLoading,
    error,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleStatusMutation.isPending,
    isDuplicating: duplicateMutation.isPending,

    // Acciones
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    duplicateProduct: duplicateMutation.mutate,
    getProductForEdit,
    filterProducts,
    refetch,

    // Métodos async para usar con await
    createProductAsync: createMutation.mutateAsync,
    updateProductAsync: updateMutation.mutateAsync,
    deleteProductAsync: deleteMutation.mutateAsync,
    toggleStatusAsync: toggleStatusMutation.mutateAsync,
    duplicateProductAsync: duplicateMutation.mutateAsync,
  }
}
