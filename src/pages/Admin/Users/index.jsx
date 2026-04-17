import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, ChevronLeft, ChevronRight, Store, CheckCircle, XCircle } from 'lucide-react'
import { adminService } from '../../../services/adminService'
import { PLAN_LABELS, PLANS } from '../../../constants'
import { Spinner, Badge } from '../../../components/ui'
import useUIStore from '../../../store/uiStore'
import { formatDate } from '../../../utils/formatters'

const PAGE_SIZE = 20

const planBadgeVariant = {
  free:    'gray',
  basic:   'warning',
}

function AdminUsers() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => adminService.getUsers({ page, pageSize: PAGE_SIZE }),
    staleTime: 1000 * 30,
  })

  const changePlanMutation = useMutation({
    mutationFn: ({ userId, plan }) => adminService.updateUserPlan(userId, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'metrics'] })
      addToast({ message: 'Plan actualizado correctamente', type: 'success' })
    },
    onError: (err) => {
      addToast({ message: err.message ?? 'Error al actualizar el plan', type: 'error' })
    },
  })

  const users     = data?.data  ?? []
  const total     = data?.count ?? 0
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
        Error al cargar usuarios.
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Users size={24} className="text-brand-gold" />
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Usuarios</h1>
          <p className="text-content-secondary text-sm">{total} registrados en total</p>
        </div>
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-content-muted text-left">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Tienda</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => {
                // PostgREST retorna la relación como objeto (no array) cuando
                // el FK tiene UNIQUE constraint (relación 1:1). Manejamos ambos casos.
                const store = Array.isArray(user.stores)
                  ? user.stores[0]
                  : (user.stores ?? null)
                const isUpdating = changePlanMutation.isPending &&
                  changePlanMutation.variables?.userId === user.id

                return (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-content-primary">
                          {user.full_name || '—'}
                          {user.role === 'admin' && (
                            <span className="ml-2 text-xs text-brand-gold font-normal">(admin)</span>
                          )}
                        </p>
                        <p className="text-content-muted text-xs mt-0.5">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {store ? (
                        <div className="flex items-center gap-1.5">
                          {store.is_active
                            ? <CheckCircle size={13} className="text-state-success flex-shrink-0" />
                            : <XCircle    size={13} className="text-state-error   flex-shrink-0" />
                          }
                          <span className="text-content-secondary truncate max-w-[120px]">
                            {store.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-content-muted">Sin tienda</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={planBadgeVariant[user.plan] ?? 'gray'}>
                        {PLAN_LABELS[user.plan] ?? user.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== 'admin' && (
                        <select
                          disabled={isUpdating}
                          value={user.plan}
                          onChange={(e) =>
                            changePlanMutation.mutate({ userId: user.id, plan: e.target.value })
                          }
                          className="bg-brand-black-card border border-white/10 text-content-secondary text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-gold/50 disabled:opacity-50 cursor-pointer"
                        >
                          <option value={PLANS.FREE}>Plan Gratuito</option>
                          <option value={PLANS.BASIC}>Plan Básico</option>
                        </select>
                      )}
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

export default AdminUsers
