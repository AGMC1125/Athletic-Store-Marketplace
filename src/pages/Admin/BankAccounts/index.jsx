import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Landmark, ChevronLeft, ChevronRight, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { adminService } from '../../../services/adminService'
import { Spinner } from '../../../components/ui'
import { formatDate } from '../../../utils/formatters'
import { ROUTES } from '../../../constants'

const PAGE_SIZE = 20

function AdminBankAccounts() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'bank-accounts', page],
    queryFn: () => adminService.getBankAccounts({ page, pageSize: PAGE_SIZE }),
    staleTime: 1000 * 30,
  })

  const accounts   = data?.data  ?? []
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
        Error al cargar las cuentas bancarias.
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Landmark size={24} className="text-brand-gold" />
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Cuentas Bancarias</h1>
          <p className="text-content-secondary text-sm">
            {total} cuenta{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-content-muted text-left">
                <th className="px-4 py-3 font-medium">Tienda</th>
                <th className="px-4 py-3 font-medium">Propietario</th>
                <th className="px-4 py-3 font-medium">Banco</th>
                <th className="px-4 py-3 font-medium">Titular de la cuenta</th>
                <th className="px-4 py-3 font-medium">CLABE</th>
                <th className="px-4 py-3 font-medium">Registrada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-content-muted">
                    No hay cuentas bancarias registradas.
                  </td>
                </tr>
              ) : accounts.map((acc) => {
                const store = acc.store ?? {}
                const owner = store.owner ?? {}

                return (
                  <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {store.is_active
                          ? <CheckCircle size={13} className="text-state-success flex-shrink-0" />
                          : <XCircle    size={13} className="text-state-error   flex-shrink-0" />
                        }
                        <div>
                          <p className="font-medium text-content-primary">{store.name ?? '—'}</p>
                          {store.slug && (
                            <a
                              href={ROUTES.STORE.replace(':slug', store.slug)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-content-muted hover:text-brand-gold flex items-center gap-1 mt-0.5"
                            >
                              /tienda/{store.slug}
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-content-secondary">{owner.full_name || '—'}</p>
                        <p className="text-content-muted text-xs mt-0.5">{owner.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-content-secondary font-medium">
                      {acc.bank_name}
                    </td>
                    <td className="px-4 py-3 text-content-secondary">
                      {acc.holder_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-content-primary tracking-wider bg-white/5 px-2 py-1 rounded text-xs">
                        {acc.clabe}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {formatDate(acc.created_at)}
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

export default AdminBankAccounts
