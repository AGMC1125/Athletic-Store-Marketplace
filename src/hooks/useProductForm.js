import { useState, useEffect } from 'react'
import { validateProductData, validateProductImages } from '../utils/productValidations'

/**
 * Hook personalizado para gestionar el formulario de producto.
 * Maneja estado, validaciones, imágenes y lógica de submit.
 */
export function useProductForm(initialProduct = null, onSubmit) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '0',
    discount_percentage: '',
    is_active: true,
  })

  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar datos iniciales si estamos editando
  useEffect(() => {
    if (initialProduct) {
      setFormData({
        name: initialProduct.name || '',
        description: initialProduct.description || '',
        price: initialProduct.price?.toString() || '',
        category: initialProduct.category || '',
        stock: initialProduct.stock?.toString() || '0',
        discount_percentage: initialProduct.discount_percentage?.toString() || '',
        is_active: initialProduct.is_active ?? true,
      })

      // Cargar imágenes existentes
      if (initialProduct.image_url && Array.isArray(initialProduct.image_url)) {
        const existingImages = initialProduct.image_url.map((url, index) => ({
          id: `existing-${index}`,
          url,
          is_main: index === 0,
          order: index,
        }))
        setImages(existingImages)
      }
    }
  }, [initialProduct])

  // Actualizar campo del formulario
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Marcar como touched
    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }))
    }

    // Limpiar error de este campo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Marcar campo como touched
  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Validar formulario completo
  const validate = () => {
    const dataValidation = validateProductData(formData)
    const imageValidation = validateProductImages(images)

    const allErrors = {}

    // Errores de datos
    if (!dataValidation.valid) {
      dataValidation.errors.forEach((error) => {
        // Mapear errores a campos específicos
        if (error.includes('nombre')) allErrors.name = error
        else if (error.includes('precio')) allErrors.price = error
        else if (error.includes('categoría')) allErrors.category = error
        else if (error.includes('descuento')) allErrors.discount_percentage = error
        else if (error.includes('stock')) allErrors.stock = error
      })
    }

    // Errores de imágenes
    if (!imageValidation.valid) {
      allErrors.images = imageValidation.errors.join(', ')
    }

    setErrors(allErrors)
    return Object.keys(allErrors).length === 0
  }

  // Manejar submit
  const handleSubmit = async (e) => {
    e?.preventDefault()

    // Marcar todos los campos como touched
    setTouched({
      name: true,
      price: true,
      category: true,
      images: true,
    })

    // Validar
    if (!validate()) {
      return false
    }

    setIsSubmitting(true)

    try {
      await onSubmit({ productData: formData, images })
      return true
    } catch (error) {
      setErrors({ submit: error.message })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // Resetear formulario
  const reset = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '0',
      discount_percentage: '',
      is_active: true,
    })
    setImages([])
    setErrors({})
    setTouched({})
  }

  // Helpers
  const hasError = (field) => touched[field] && errors[field]
  const getError = (field) => errors[field]
  const isDirty = () => {
    if (initialProduct) {
      return (
        formData.name !== initialProduct.name ||
        formData.description !== (initialProduct.description || '') ||
        formData.price !== initialProduct.price?.toString() ||
        formData.category !== initialProduct.category ||
        formData.stock !== (initialProduct.stock?.toString() || '0') ||
        formData.discount_percentage !== (initialProduct.discount_percentage?.toString() || '') ||
        formData.is_active !== initialProduct.is_active ||
        images.some((img) => img.file) // Hay imágenes nuevas
      )
    }
    return Object.values(formData).some((val) => val !== '' && val !== true) || images.length > 0
  }

  return {
    // Estado del formulario
    formData,
    images,
    errors,
    touched,
    isSubmitting,

    // Acciones
    updateField,
    setImages,
    markTouched,
    handleSubmit,
    reset,
    validate,

    // Helpers
    hasError,
    getError,
    isDirty,

    // Flags
    isValid: Object.keys(errors).length === 0,
    canSubmit: !isSubmitting && isDirty() && Object.keys(errors).length === 0,
  }
}
