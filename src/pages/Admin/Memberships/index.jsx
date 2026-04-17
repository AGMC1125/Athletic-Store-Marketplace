import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react'
import { adminService } from '../../../services/adminService'
import { PLAN_LABELS } from '../../../constants'
import { Spinner, Badge } from '../../../components/ui'
import useUIStore from '../../../store/uiStore'
import { formatDate } from '../../../utils/formatters'

const PAGE_SIZE = 20

const STATUS_CONFIG = {
  active:    { label: 'Activa',    variant: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelada', variant: 'error',   icon: XCircle     },
  expired:   { label: 'Expirada',  variant: 'gray',    icon: Clock       },
}

const planBadgeVariant = {
  free:  'gray',
  basic: 'warning',
}

function AdminMemberships() {
  const [page, setPage]    = useState(1)
  const queryClient        = useQueryClient()
  const { addToast }       = useUIStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'memberships', page],
    queryFn: () => adminService.getMemberships({ page, pageSize: PAGE_SIZE }),
    staleTime: 1000 * 30,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ membershipId, status }) =>
      adminService.updateMembershipStatus(membershipId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'memberships'] })
      addToast({ message: 'Estado de membresía actualizado', type: 'success' })
    },
    onError: (err) => {
      addToast({ message: err.message ?? 'Error al actualizar membresía', type: 'error' })
    },
  })

  const memberships = data?.data  ?? []
  const total       = data?.count ?? 0
  const totalPages  = Math.ceil(total / PAGE_SIZE)

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
        Error al cargar membresías.
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <CreditCard size={24} className="text-brand-gold" />
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Membresías</h1>
          <p className="text-content-secondary text-sm">{total} registros en total</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-content-muted text-left">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Inicio</th>
                <th className="px-4 py-3 font-medium">Vence</th>
                <th className="px-4 py-3 font-medium">Pagado</th>
                <th className="px-4 py-3 font-medium">Notas</th>
                <th className="px-4 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {memberships.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-content-muted">
                    No hay membresías registradas.
                  </td>
                </tr>
              ) : memberships.map((m) => {
                const profile    = m.profile ?? {}
                const statusCfg  = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.active
                const StatusIcon = statusCfg.icon
                const isUpdating = updateStatusMutation.isPending &&
                  updateStatusMutation.variables?.membershipId === m.id

                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-content-primary">
                          {profile.full_name || '—'}
                        </p>
                        <p className="text-content-muted text-xs mt-0.5">{profile.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={planBadgeVariant[m.plan] ?? 'gray'}>
                        {PLAN_LABELS[m.plan] ?? m.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon size={13} className={
                          m.status === 'active'    ? 'text-state-success' :
                          m.status === 'cancelled' ? 'text-state-error'   : 'text-content-muted'
                        } />
                        <span className={
                          m.status === 'active'    ? 'text-state-success' :
                          m.status === 'cancelled' ? 'text-state-error'   : 'text-content-muted'
                        }>
                          {statusCfg.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {formatDate(m.starts_at)}
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {m.ends_at ? formatDate(m.ends_at) : '—'}
                    </td>
                    <td className="px-4 py-3 text-content-secondary font-medium">
                      {m.price_paid != null
                        ? `$${Number(m.price_paid).toLocaleString('es-MX')} MXN`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-content-muted max-w-[140px]">
                      <p className="truncate" title={m.notes ?? ''}>
                        {m.notes || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        disabled={isUpdating}
                        value={m.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            membershipId: m.id,
                            status: e.target.value,
                          })
                        }
                        className="bg-brand-black-card border border-white/10 text-content-secondary text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-gold/50 disabled:opacity-50 cursor-pointer"
                      >
                        <option value="active">Activa</option>
                        <option value="cancelled">Cancelada</option>
                        <option value="expired">Expirada</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
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

export default AdminMemberships
