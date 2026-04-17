import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, ChevronLeft, ChevronRight, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { adminService } from '../../../services/adminService'
import { CATEGORY_LABELS } from '../../../constants'
import { Spinner, Badge, Button } from '../../../components/ui'
import useUIStore from '../../../store/uiStore'
import { formatDate, formatPrice } from '../../../utils/formatters'

const PAGE_SIZE = 20

function AdminProducts() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'products', page],
    queryFn: () => adminService.getProducts({ page, pageSize: PAGE_SIZE }),
    staleTime: 1000 * 30,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ productId, isActive }) => adminService.toggleProductStatus(productId, isActive),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'metrics'] })
      addToast({
        message: vars.isActive ? 'Producto activado' : 'Producto desactivado',
        type: vars.isActive ? 'success' : 'warning',
      })
    },
    onError: (err) => {
      addToast({ message: err.message ?? 'Error al cambiar estado', type: 'error' })
    },
  })

  const products   = data?.data  ?? []
  const total      = data?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" className="text-brand-gold" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card-base p-6 text-center text-state-error">
        Error al cargar productos.
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Package size={24} className="text-brand-gold" />
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Productos</h1>
          <p className="text-content-secondary text-sm">{total} productos en total</p>
        </div>
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-content-muted text-left">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Tienda</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((product) => {
                const isTogglingThis = toggleMutation.isPending &&
                  toggleMutation.variables?.productId === product.id

                return (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-content-primary">{product.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gray">
                        {CATEGORY_LABELS[product.category] ?? product.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-content-secondary">{product.store?.name ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-content-secondary">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {product.is_active
                          ? <><CheckCircle size={14} className="text-state-success" /><span className="text-state-success text-xs">Activo</span></>
                          : <><XCircle    size={14} className="text-state-error"   /><span className="text-state-error   text-xs">Inactivo</span></>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={product.is_active ? 'danger' : 'secondary'}
                          size="sm"
                          isLoading={isTogglingThis}
                          onClick={() =>
                            toggleMutation.mutate({ productId: product.id, isActive: !product.is_active })
                          }
                        >
                          {product.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                        {product.store?.slug && (
                          <a
                            href={`/producto/${product.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-content-secondary hover:text-content-primary transition-colors"
                            title="Ver producto"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-content-muted">
                    No hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-xs text-content-muted">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-white/5 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-white/5 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminProducts
