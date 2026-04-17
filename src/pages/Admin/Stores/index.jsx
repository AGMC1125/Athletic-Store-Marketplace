import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Store, ChevronLeft, ChevronRight, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { adminService } from '../../../services/adminService'
import { PLAN_LABELS } from '../../../constants'
import { Spinner, Badge, Button } from '../../../components/ui'
import useUIStore from '../../../store/uiStore'
import { formatDate } from '../../../utils/formatters'

const PAGE_SIZE = 20

function AdminStores() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stores', page],
    queryFn: () => adminService.getStores({ page, pageSize: PAGE_SIZE }),
    staleTime: 1000 * 30,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ storeId, isActive }) => adminService.toggleStoreStatus(storeId, isActive),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'metrics'] })
      addToast({
        message: vars.isActive ? 'Tienda activada' : 'Tienda desactivada',
        type: vars.isActive ? 'success' : 'warning',
      })
    },
    onError: (err) => {
      addToast({ message: err.message ?? 'Error al cambiar estado', type: 'error' })
    },
  })

  const stores     = data?.data  ?? []
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
        Error al cargar tiendas.
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Store size={24} className="text-brand-gold" />
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Tiendas</h1>
          <p className="text-content-secondary text-sm">{total} registradas en total</p>
        </div>
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-content-muted text-left">
                <th className="px-4 py-3 font-medium">Tienda</th>
                <th className="px-4 py-3 font-medium">Dueño</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stores.map((store) => {
                const isTogglingThis = toggleMutation.isPending &&
                  toggleMutation.variables?.storeId === store.id

                return (
                  <tr key={store.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-content-primary">{store.name}</p>
                        <p className="text-content-muted text-xs mt-0.5">{store.city ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-content-secondary">{store.owner?.full_name ?? '—'}</p>
                        <p className="text-content-muted text-xs">{store.owner?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={store.owner?.plan === 'basic' ? 'warning' : 'gray'}>
                        {PLAN_LABELS[store.owner?.plan] ?? '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {store.is_active
                          ? <><CheckCircle size={14} className="text-state-success" /><span className="text-state-success text-xs">Activa</span></>
                          : <><XCircle    size={14} className="text-state-error"   /><span className="text-state-error   text-xs">Inactiva</span></>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {formatDate(store.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={store.is_active ? 'danger' : 'secondary'}
                          size="sm"
                          isLoading={isTogglingThis}
                          onClick={() =>
                            toggleMutation.mutate({ storeId: store.id, isActive: !store.is_active })
                          }
                        >
                          {store.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <a
                          href={`/tienda/${store.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-content-secondary hover:text-content-primary transition-colors"
                          title="Ver tienda pública"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
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

export default AdminStores
