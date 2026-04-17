import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

/**
 * Modal de confirmación reutilizable.
 *
 * Props:
 *  - isOpen        : boolean
 *  - onClose       : () => void
 *  - onConfirm     : () => void
 *  - title         : string
 *  - description   : string | ReactNode
 *  - confirmLabel  : string  (default: "Confirmar")
 *  - cancelLabel   : string  (default: "Cancelar")
 *  - variant       : 'danger' | 'warning' | 'info' | 'success'  (default: 'danger')
 *  - isLoading     : boolean
 */
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title        = 'Confirmar acción',
  description  = '¿Estás seguro de que deseas continuar?',
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  variant      = 'danger',
  isLoading    = false,
}) {
  const icons = {
    danger:  AlertTriangle,
    warning: AlertTriangle,
    info:    Info,
    success: CheckCircle,
  }

  const iconColors = {
    danger:  'text-state-error',
    warning: 'text-state-warning',
    info:    'text-brand-gold',
    success: 'text-state-success',
  }

  const buttonVariants = {
    danger:  'danger',
    warning: 'primary',
    info:    'primary',
    success: 'primary',
  }

  const Icon      = icons[variant]      ?? AlertTriangle
  const iconColor = iconColors[variant] ?? 'text-state-error'
  const btnVar    = buttonVariants[variant] ?? 'danger'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <Icon size={20} className={`${iconColor} flex-shrink-0 mt-0.5`} />
          <p className="text-sm text-content-secondary">{description}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={btnVar} isLoading={isLoading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal
